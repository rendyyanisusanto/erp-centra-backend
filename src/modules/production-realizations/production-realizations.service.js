const { Op } = require('sequelize');
const { ProductionPlanDetail, ProductionPlan, Product } = require('../../models');

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, parseInt(limit, 10) || 15);
    return { page: p, limit: l, offset: (p - 1) * l };
};

const mapRow = (row) => {
    const plannedQty = Number(row.planned_qty || 0);
    const realizedQty = Number(row.realized_qty || 0);
    const difference = plannedQty - realizedQty;

    let realization_status = 'BELUM_DIREALISASI';
    if (realizedQty > plannedQty) realization_status = 'OVER_TARGET';
    else if (realizedQty === plannedQty && plannedQty > 0) realization_status = 'SELESAI';
    else if (realizedQty > 0 && realizedQty < plannedQty) realization_status = 'SEBAGIAN';

    return {
        id: row.id,
        production_plan_detail_id: row.id,
        production_plan_id: row.production_plan_id,
        plan_number: row.plan?.plan_number,
        production_code: row.production_code,
        production_date: row.production_date,
        product_id: row.product_id,
        product_name: row.product?.name,
        planned_qty: plannedQty,
        realized_qty: realizedQty,
        difference,
        month: row.plan?.month,
        year: row.plan?.year,
        header_status: row.plan?.status,
        note: row.note,
        realization_status,
    };
};

const getProductionRealizations = async ({ page, limit, search, month, year, product_id, status }) => {
    const { page: currentPage, limit: l, offset } = paginate(page, limit);

    const where = {};
    if (product_id) where.product_id = Number(product_id);

    if (search) {
        where[Op.or] = [
            { production_code: { [Op.like]: `%${search}%` } },
            { '$plan.plan_number$': { [Op.like]: `%${search}%` } },
            { '$product.name$': { [Op.like]: `%${search}%` } },
        ];
    }

    const planWhere = {};
    if (month) planWhere.month = Number(month);
    if (year) planWhere.year = Number(year);

    // Default hanya APPROVED
    const statusHeader = status ? String(status).toUpperCase() : 'APPROVED';
    planWhere.status = statusHeader;

    const { count, rows } = await ProductionPlanDetail.findAndCountAll({
        where,
        include: [
            {
                model: ProductionPlan,
                as: 'plan',
                required: true,
                attributes: ['id', 'plan_number', 'month', 'year', 'status'],
                where: planWhere,
            },
            { model: Product, as: 'product', required: true, attributes: ['id', 'name'] },
        ],
        order: [['id', 'DESC']],
        offset,
        limit: l,
    });

    return {
        total: count,
        page: currentPage,
        data: rows.map(mapRow),
    };
};

const getProductionRealizationById = async (id) => {
    const row = await ProductionPlanDetail.findByPk(id, {
        include: [
            { model: ProductionPlan, as: 'plan', attributes: ['id', 'plan_number', 'month', 'year', 'status'], required: true },
            { model: Product, as: 'product', attributes: ['id', 'name'], required: true },
        ],
    });

    if (!row) throw { status: 404, message: 'Production realization not found.' };
    return mapRow(row);
};

const updateProductionRealization = async (id, payload) => {
    const row = await ProductionPlanDetail.findByPk(id, {
        include: [{ model: ProductionPlan, as: 'plan', attributes: ['id', 'status'], required: true }],
    });

    if (!row) throw { status: 404, message: 'Production realization not found.' };
    if (row.plan.status !== 'APPROVED') {
        throw { status: 400, message: 'Realisasi hanya dapat diubah jika rencana produksi APPROVED.' };
    }

    const realizedQty = Number(payload.realized_qty);
    if (!Number.isFinite(realizedQty) || realizedQty < 0) {
        throw { status: 400, message: 'realized_qty must be numeric and >= 0.' };
    }

    row.realized_qty = realizedQty;
    if (payload.note !== undefined) row.note = payload.note ? String(payload.note).trim() : null;
    await row.save();

    return getProductionRealizationById(id);
};

module.exports = {
    getProductionRealizations,
    getProductionRealizationById,
    updateProductionRealization,
};
