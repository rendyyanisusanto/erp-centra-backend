const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    ProductionPlan,
    ProductionPlanDetail,
    Product,
    User,
    FinishedGoodsReceiptDetail,
    FinishedGoodsReceipt,
} = require('../../models');

const STATUS = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED',
};

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, parseInt(limit, 10) || 15);
    return { page: p, limit: l, offset: (p - 1) * l };
};

const validateMonthYear = (month, year) => {
    const m = Number(month);
    const y = Number(year);
    if (!Number.isInteger(m) || m < 1 || m > 12) throw { status: 400, message: 'Month must be between 1 and 12.' };
    if (!Number.isInteger(y) || y < 1900 || y > 9999) throw { status: 400, message: 'Year is invalid.' };
    return { month: m, year: y };
};

const validateStatusFilter = (status) => {
    if (!status) return null;
    const s = String(status).toUpperCase();
    if (!Object.values(STATUS).includes(s)) throw { status: 400, message: 'Invalid status filter.' };
    return s;
};

const validateDetails = async (details, transaction) => {
    if (!Array.isArray(details) || details.length < 1) {
        throw { status: 400, message: 'At least one detail item is required.' };
    }

    const rows = [];
    for (const d of details) {
        const productionCode = d.production_code ? String(d.production_code).trim() : '';
        const productionDate = d.production_date ? String(d.production_date).trim() : '';
        const productId = Number(d.product_id);
        const plannedQty = Number(d.planned_qty);

        if (!productionCode) throw { status: 400, message: 'production_code is required.' };
        if (!productionDate || Number.isNaN(new Date(productionDate).getTime())) throw { status: 400, message: 'production_date is required and must be valid.' };
        if (!Number.isInteger(productId) || productId <= 0) throw { status: 400, message: 'product_id is required and must be valid.' };
        if (!Number.isFinite(plannedQty) || plannedQty <= 0) throw { status: 400, message: 'planned_qty must be greater than 0.' };

        const product = await Product.findByPk(productId, { transaction, attributes: ['id'] });
        if (!product) throw { status: 400, message: `Product with id ${productId} not found.` };

        rows.push({
            production_code: productionCode,
            production_date: productionDate,
            product_id: productId,
            planned_qty: plannedQty,
            realized_qty: Number(d.realized_qty || 0) < 0 ? 0 : Number(d.realized_qty || 0),
            note: d.note ? String(d.note).trim() : null,
        });
    }

    return rows;
};

const generatePlanNumber = async (month, year, transaction) => {
    const prefix = `RP-${year}${String(month).padStart(2, '0')}`;
    const latest = await ProductionPlan.findOne({
        where: { plan_number: { [Op.like]: `${prefix}-%` } },
        order: [['plan_number', 'DESC']],
        transaction,
    });

    let seq = 1;
    if (latest?.plan_number) {
        const currentSeq = Number((latest.plan_number.split('-')[2]) || 0);
        seq = currentSeq + 1;
    }

    return `${prefix}-${String(seq).padStart(4, '0')}`;
};

const getProductionPlans = async ({ page, limit, search, status, month, year }) => {
    const { page: currentPage, limit: l, offset } = paginate(page, limit);
    const where = {};

    const statusFilter = validateStatusFilter(status);
    if (statusFilter) where.status = statusFilter;

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    if (search) {
        where[Op.or] = [
            { plan_number: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
            { '$creator.name$': { [Op.like]: `%${search}%` } },
        ];
    }

    const { count, rows } = await ProductionPlan.findAndCountAll({
        where,
        include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
        order: [['id', 'DESC']],
        offset,
        limit: l,
    });

    return { total: count, page: currentPage, data: rows };
};

const getProductionPlanById = async (id) => {
    const plan = await ProductionPlan.findByPk(id, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'approver', attributes: ['id', 'name'] },
            {
                model: ProductionPlanDetail,
                as: 'details',
                include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'unit_id'] }],
            },
        ],
        order: [[{ model: ProductionPlanDetail, as: 'details' }, 'id', 'ASC']],
    });

    if (!plan) throw { status: 404, message: 'Production plan not found.' };
    return plan;
};

const createProductionPlan = async (payload, createdBy) => {
    const { month, year } = validateMonthYear(payload.month, payload.year);

    const t = await sequelize.transaction();
    try {
        const details = await validateDetails(payload.details, t);
        const planNumber = await generatePlanNumber(month, year, t);

        const plan = await ProductionPlan.create({
            plan_number: planNumber,
            month,
            year,
            status: STATUS.DRAFT,
            description: payload.description ? String(payload.description).trim() : null,
            created_by: createdBy,
            approved_by: null,
            approved_at: null,
        }, { transaction: t });

        await ProductionPlanDetail.bulkCreate(
            details.map((d) => ({ ...d, production_plan_id: plan.id, realized_qty: 0 })),
            { transaction: t }
        );

        await t.commit();
        return getProductionPlanById(plan.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const updateProductionPlan = async (id, payload) => {
    const plan = await ProductionPlan.findByPk(id);
    if (!plan) throw { status: 404, message: 'Production plan not found.' };
    if (plan.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT production plan can be edited.' };

    const { month, year } = validateMonthYear(payload.month, payload.year);

    const t = await sequelize.transaction();
    try {
        const details = await validateDetails(payload.details, t);

        plan.month = month;
        plan.year = year;
        plan.description = payload.description ? String(payload.description).trim() : null;
        await plan.save({ transaction: t });

        await ProductionPlanDetail.destroy({ where: { production_plan_id: plan.id }, transaction: t });
        await ProductionPlanDetail.bulkCreate(
            details.map((d) => ({ ...d, production_plan_id: plan.id, realized_qty: Number(d.realized_qty || 0) })),
            { transaction: t }
        );

        await t.commit();
        return getProductionPlanById(plan.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const deleteProductionPlan = async (id) => {
    const plan = await ProductionPlan.findByPk(id);
    if (!plan) throw { status: 404, message: 'Production plan not found.' };
    if (plan.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT production plan can be deleted.' };

    const t = await sequelize.transaction();
    try {
        await ProductionPlanDetail.destroy({ where: { production_plan_id: id }, transaction: t });
        await plan.destroy({ transaction: t });
        await t.commit();
        return { message: 'Production plan deleted successfully.' };
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approveProductionPlan = async (id, approvedBy) => {
    const plan = await ProductionPlan.findByPk(id, { include: [{ model: ProductionPlanDetail, as: 'details' }] });
    if (!plan) throw { status: 404, message: 'Production plan not found.' };
    if (plan.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT production plan can be approved.' };
    if (!plan.details?.length) throw { status: 400, message: 'Production plan detail is required before approval.' };

    plan.status = STATUS.APPROVED;
    plan.approved_by = approvedBy;
    plan.approved_at = new Date();
    await plan.save();

    return getProductionPlanById(id);
};

const cancelProductionPlan = async (id) => {
    const plan = await ProductionPlan.findByPk(id);
    if (!plan) throw { status: 404, message: 'Production plan not found.' };
    if (plan.status === STATUS.APPROVED) throw { status: 400, message: 'Approved production plan cannot be cancelled.' };
    if (plan.status === STATUS.CANCELLED) throw { status: 400, message: 'Production plan is already cancelled.' };

    plan.status = STATUS.CANCELLED;
    await plan.save();
    return plan;
};

const getApprovedPlanDetailOptions = async ({ month, year, search, product_id, limit }) => {
    const where = {};
    if (search) {
        where[Op.or] = [
            { production_code: { [Op.like]: `%${search}%` } },
            { '$plan.plan_number$': { [Op.like]: `%${search}%` } },
            { '$product.name$': { [Op.like]: `%${search}%` } },
        ];
    }
    if (product_id) where.product_id = Number(product_id);

    const planWhere = { status: STATUS.APPROVED };
    if (month) planWhere.month = Number(month);
    if (year) planWhere.year = Number(year);

    const rows = await ProductionPlanDetail.findAll({
        where,
        include: [
            { model: ProductionPlan, as: 'plan', attributes: ['id', 'plan_number', 'month', 'year', 'status'], where: planWhere, required: true },
            { model: Product, as: 'product', attributes: ['id', 'name'], required: true },
        ],
        order: [['id', 'DESC']],
        limit: Math.min(500, Number(limit) || 200),
    });

    const detailIds = rows.map((r) => r.id);
    const receivedRows = detailIds.length
        ? await FinishedGoodsReceiptDetail.findAll({
            attributes: [
                'production_plan_detail_id',
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('qty_received')), 0), 'total_received'],
            ],
            where: { production_plan_detail_id: detailIds },
            include: [{ model: FinishedGoodsReceipt, as: 'receipt', attributes: [], where: { status: STATUS.APPROVED }, required: true }],
            group: ['production_plan_detail_id'],
            raw: true,
        })
        : [];

    const receivedMap = new Map(receivedRows.map((r) => [Number(r.production_plan_detail_id), Number(r.total_received || 0)]));

    return rows.map((r) => {
        const realized = Number(r.realized_qty || 0);
        const received = Number(receivedMap.get(r.id) || 0);
        return {
            id: r.id,
            plan_number: r.plan.plan_number,
            production_code: r.production_code,
            production_date: r.production_date,
            product_id: r.product_id,
            product_name: r.product?.name,
            planned_qty: Number(r.planned_qty || 0),
            realized_qty: realized,
            total_received: received,
            remaining_qty: Math.max(0, realized - received),
            month: r.plan.month,
            year: r.plan.year,
        };
    });
};

module.exports = {
    getProductionPlans,
    getApprovedPlanDetailOptions,
    getProductionPlanById,
    createProductionPlan,
    updateProductionPlan,
    deleteProductionPlan,
    approveProductionPlan,
    cancelProductionPlan,
};
