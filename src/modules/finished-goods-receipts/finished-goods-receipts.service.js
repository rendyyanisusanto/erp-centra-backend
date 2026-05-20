const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    FinishedGoodsReceipt,
    FinishedGoodsReceiptDetail,
    ProductionPlanDetail,
    ProductionPlan,
    Product,
    Unit,
    User,
    StockMovement,
} = require('../../models');
const { resolveConversion } = require('../../utils/unit-conversion');

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

const sanitizeDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw { status: 400, message: 'Valid date is required.' };
    return d;
};

const sanitizeMonthYear = (month, year, dateObj) => {
    const m = Number(month);
    const y = Number(year);
    if (!Number.isInteger(m) || m < 1 || m > 12) throw { status: 400, message: 'Month must be between 1 and 12.' };
    if (!Number.isInteger(y) || y < 1900 || y > 9999) throw { status: 400, message: 'Year is invalid.' };

    if (m !== dateObj.getMonth() + 1 || y !== dateObj.getFullYear()) {
        throw { status: 400, message: 'Month and year must match the selected date.' };
    }

    return { month: m, year: y };
};

const validateStatusFilter = (status) => {
    if (!status) return null;
    const s = String(status).toUpperCase();
    if (!Object.values(STATUS).includes(s)) throw { status: 400, message: 'Invalid status filter.' };
    return s;
};

const generateReceiptNumber = async (month, year, transaction) => {
    const prefix = `TB-${year}${String(month).padStart(2, '0')}`;
    const latest = await FinishedGoodsReceipt.findOne({
        where: { receipt_number: { [Op.like]: `${prefix}-%` } },
        order: [['receipt_number', 'DESC']],
        transaction,
    });

    let seq = 1;
    if (latest?.receipt_number) {
        const currentSeq = Number((latest.receipt_number.split('-')[2]) || 0);
        seq = currentSeq + 1;
    }

    return `${prefix}-${String(seq).padStart(4, '0')}`;
};

const getApprovedReceivedQtyByPlanDetailId = async (productionPlanDetailId, transaction, excludeReceiptId = null) => {
    const where = { production_plan_detail_id: productionPlanDetailId };
    const receiptWhere = { status: STATUS.APPROVED };
    if (excludeReceiptId) receiptWhere.id = { [Op.ne]: Number(excludeReceiptId) };

    const row = await FinishedGoodsReceiptDetail.findOne({
        attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('qty_received')), 0), 'total_qty']],
        where,
        include: [{ model: FinishedGoodsReceipt, as: 'receipt', required: true, attributes: [], where: receiptWhere }],
        raw: true,
        transaction,
    });

    return Number(row?.total_qty || 0);
};

const validateDetailRows = async (details, transaction, options = {}) => {
    if (!Array.isArray(details) || details.length < 1) {
        throw { status: 400, message: 'At least one detail item is required.' };
    }

    const { excludeReceiptId } = options;
    const rows = [];
    const payloadQtyBySource = new Map();

    for (const d of details) {
        const productionPlanDetailId = d.production_plan_detail_id ? Number(d.production_plan_detail_id) : null;
        const productId = Number(d.product_id);
        const qtyReceived = Number(d.qty_received);

        if (!Number.isInteger(productId) || productId <= 0) {
            throw { status: 400, message: 'product_id is required and must be valid.' };
        }
        if (!Number.isFinite(qtyReceived) || qtyReceived <= 0) {
            throw { status: 400, message: 'qty_received must be greater than 0.' };
        }
        const conversion = await resolveConversion({
            item_type: 'PRODUCT',
            item_id: productId,
            unit_id: d.unit_id,
            qty: qtyReceived,
        }, transaction);

        const product = await Product.findByPk(productId, { transaction, attributes: ['id', 'name'] });
        if (!product) throw { status: 400, message: `Product with id ${productId} not found.` };

        if (productionPlanDetailId) {
            if (!Number.isInteger(productionPlanDetailId) || productionPlanDetailId <= 0) {
                throw { status: 400, message: 'production_plan_detail_id must be valid.' };
            }

            const planDetail = await ProductionPlanDetail.findByPk(productionPlanDetailId, {
                include: [{ model: ProductionPlan, as: 'plan', attributes: ['id', 'status', 'plan_number'] }],
                attributes: ['id', 'product_id', 'realized_qty', 'production_code'],
                transaction,
            });

            if (!planDetail) throw { status: 400, message: `Production plan detail with id ${productionPlanDetailId} not found.` };
            if (planDetail.plan?.status !== STATUS.APPROVED) {
                throw { status: 400, message: 'Referenced production plan detail must come from APPROVED production plan.' };
            }

            if (Number(planDetail.product_id) !== productId) {
                throw { status: 400, message: 'product_id must match product from selected production plan detail.' };
            }

            const totalApprovedReceived = await getApprovedReceivedQtyByPlanDetailId(
                productionPlanDetailId,
                transaction,
                excludeReceiptId
            );
            const remainingQty = Number(planDetail.realized_qty || 0) - totalApprovedReceived;
            const cumulativePayloadQty = Number(payloadQtyBySource.get(productionPlanDetailId) || 0) + qtyReceived;

            if (cumulativePayloadQty > remainingQty) {
                throw {
                    status: 400,
                    message: `Total qty diterima melebihi sisa realisasi untuk kode produksi ${planDetail.production_code}. Sisa: ${remainingQty}.`,
                };
            }

            payloadQtyBySource.set(productionPlanDetailId, cumulativePayloadQty);
        }

        rows.push({
            production_plan_detail_id: productionPlanDetailId,
            product_id: productId,
            qty_received: qtyReceived,
            unit_id: conversion.unit_id,
            conversion_qty: conversion.conversion_qty,
            base_qty_received: conversion.base_qty,
            note: d.note ? String(d.note).trim() : null,
        });
    }

    return rows;
};

const getFinishedGoodsReceipts = async ({ page, limit, search, status, month, year }) => {
    const { page: currentPage, limit: l, offset } = paginate(page, limit);
    const where = {};

    const statusFilter = validateStatusFilter(status);
    if (statusFilter) where.status = statusFilter;
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    if (search) {
        where[Op.or] = [
            { receipt_number: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
            { '$creator.name$': { [Op.like]: `%${search}%` } },
        ];
    }

    const { count, rows } = await FinishedGoodsReceipt.findAndCountAll({
        where,
        include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
        order: [['id', 'DESC']],
        offset,
        limit: l,
    });

    return { total: count, page: currentPage, data: rows };
};

const getFinishedGoodsReceiptById = async (id) => {
    const receipt = await FinishedGoodsReceipt.findByPk(id, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'approver', attributes: ['id', 'name'] },
            {
                model: FinishedGoodsReceiptDetail,
                as: 'details',
                include: [
                    { model: Product, as: 'product', attributes: ['id', 'name'] },
                    {
                        model: ProductionPlanDetail,
                        as: 'productionPlanDetail',
                        attributes: ['id', 'production_code', 'production_date', 'planned_qty', 'realized_qty'],
                        include: [{ model: ProductionPlan, as: 'plan', attributes: ['id', 'plan_number'] }],
                    },
                    { model: Unit, as: 'unit', attributes: ['id', 'name'] },
                ],
            },
        ],
        order: [[{ model: FinishedGoodsReceiptDetail, as: 'details' }, 'id', 'ASC']],
    });

    if (!receipt) throw { status: 404, message: 'Finished goods receipt not found.' };
    return receipt;
};

const createFinishedGoodsReceipt = async (payload, createdBy) => {
    const dateObj = sanitizeDate(payload.date);
    const { month, year } = sanitizeMonthYear(payload.month, payload.year, dateObj);

    const t = await sequelize.transaction();
    try {
        const details = await validateDetailRows(payload.details, t);
        const receiptNumber = await generateReceiptNumber(month, year, t);

        const receipt = await FinishedGoodsReceipt.create({
            receipt_number: receiptNumber,
            date: dateObj,
            month,
            year,
            status: STATUS.DRAFT,
            description: payload.description ? String(payload.description).trim() : null,
            created_by: createdBy,
            approved_by: null,
            approved_at: null,
        }, { transaction: t });

        await FinishedGoodsReceiptDetail.bulkCreate(
            details.map((d) => ({ ...d, finished_goods_receipt_id: receipt.id })),
            { transaction: t }
        );

        await t.commit();
        return getFinishedGoodsReceiptById(receipt.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const updateFinishedGoodsReceipt = async (id, payload) => {
    const receipt = await FinishedGoodsReceipt.findByPk(id);
    if (!receipt) throw { status: 404, message: 'Finished goods receipt not found.' };
    if (receipt.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT receipt can be edited.' };

    const dateObj = sanitizeDate(payload.date);
    const { month, year } = sanitizeMonthYear(payload.month, payload.year, dateObj);

    const t = await sequelize.transaction();
    try {
        const details = await validateDetailRows(payload.details, t, { excludeReceiptId: id });

        receipt.date = dateObj;
        receipt.month = month;
        receipt.year = year;
        receipt.description = payload.description ? String(payload.description).trim() : null;
        await receipt.save({ transaction: t });

        await FinishedGoodsReceiptDetail.destroy({ where: { finished_goods_receipt_id: receipt.id }, transaction: t });
        await FinishedGoodsReceiptDetail.bulkCreate(
            details.map((d) => ({ ...d, finished_goods_receipt_id: receipt.id })),
            { transaction: t }
        );

        await t.commit();
        return getFinishedGoodsReceiptById(receipt.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const deleteFinishedGoodsReceipt = async (id) => {
    const receipt = await FinishedGoodsReceipt.findByPk(id);
    if (!receipt) throw { status: 404, message: 'Finished goods receipt not found.' };
    if (receipt.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT receipt can be deleted.' };

    const t = await sequelize.transaction();
    try {
        await FinishedGoodsReceiptDetail.destroy({ where: { finished_goods_receipt_id: id }, transaction: t });
        await receipt.destroy({ transaction: t });
        await t.commit();
        return { message: 'Finished goods receipt deleted successfully.' };
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approveFinishedGoodsReceipt = async (id, approvedBy) => {
    const receipt = await FinishedGoodsReceipt.findByPk(id, {
        include: [{ model: FinishedGoodsReceiptDetail, as: 'details' }],
    });

    if (!receipt) throw { status: 404, message: 'Finished goods receipt not found.' };
    if (receipt.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT receipt can be approved.' };
    if (!receipt.details?.length) throw { status: 400, message: 'Finished goods receipt detail is required before approval.' };

    const t = await sequelize.transaction();
    try {
        const details = await validateDetailRows(receipt.details.map((d) => d.toJSON()), t, { excludeReceiptId: id });

        for (const d of details) {
            const product = await Product.findByPk(d.product_id, {
                transaction: t,
                lock: t.LOCK.UPDATE,
                attributes: ['id', 'stock'],
            });

            if (!product) throw { status: 400, message: `Product with id ${d.product_id} not found.` };

            const newStock = Number(product.stock || 0) + Number(d.base_qty_received || 0);
            product.stock = newStock;
            await product.save({ transaction: t });

            await StockMovement.create({
                item_type: 'PRODUCT',
                item_id: d.product_id,
                transaction_date: receipt.date,
                reference_type: 'FINISHED_GOODS_RECEIPT',
                reference_id: receipt.id,
                qty_in: Number(d.base_qty_received || 0),
                qty_out: 0,
                note: d.note || receipt.description || `Finished goods receipt ${receipt.receipt_number}`,
            }, { transaction: t });
        }

        receipt.status = STATUS.APPROVED;
        receipt.approved_by = approvedBy;
        receipt.approved_at = new Date();
        await receipt.save({ transaction: t });

        await t.commit();
        return getFinishedGoodsReceiptById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const cancelFinishedGoodsReceipt = async (id, cancelledBy, cancelReason) => {
    const receipt = await FinishedGoodsReceipt.findByPk(id, { include: [{ model: FinishedGoodsReceiptDetail, as: 'details' }] });
    if (!receipt) throw { status: 404, message: 'Finished goods receipt not found.' };
    if (receipt.status !== STATUS.APPROVED) throw { status: 400, message: 'Hanya receipt APPROVED yang bisa dibatalkan.' };

    const t = await sequelize.transaction();
    try {
        for (const detail of receipt.details || []) {
            const product = await Product.findByPk(detail.product_id, {
                attributes: ['id', 'name', 'stock'],
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (!product) throw { status: 400, message: `Product with id ${detail.product_id} not found.` };
            if (Number(product.stock || 0) < Number(detail.base_qty_received || 0)) {
                throw { status: 400, message: `Stok ${product.name} tidak cukup untuk reversal cancel.` };
            }
            product.stock = Number(product.stock || 0) - Number(detail.base_qty_received || 0);
            await product.save({ transaction: t });

            await StockMovement.create({
                item_type: 'PRODUCT',
                item_id: detail.product_id,
                transaction_date: new Date(),
                reference_type: 'FINISHED_GOODS_RECEIPT_CANCEL',
                reference_id: receipt.id,
                qty_in: 0,
                qty_out: Number(detail.base_qty_received || 0),
                note: `Reversal finished goods receipt ${receipt.receipt_number}`,
            }, { transaction: t });
        }
        receipt.status = STATUS.CANCELLED;
        receipt.cancelled_by = cancelledBy;
        receipt.cancelled_at = new Date();
        receipt.cancel_reason = cancelReason || null;
        await receipt.save({ transaction: t });
        await t.commit();
        return getFinishedGoodsReceiptById(receipt.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const getSourceOptions = async ({ search, month, year, product_id }) => {
    const where = {};
    if (product_id) where.product_id = Number(product_id);
    if (search) {
        where[Op.or] = [
            { production_code: { [Op.like]: `%${search}%` } },
            { '$plan.plan_number$': { [Op.like]: `%${search}%` } },
            { '$product.name$': { [Op.like]: `%${search}%` } },
        ];
    }

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
        limit: 500,
    });

    const mapped = await Promise.all(rows.map(async (row) => {
        const totalReceived = await getApprovedReceivedQtyByPlanDetailId(row.id, null);
        const realized = Number(row.realized_qty || 0);
        return {
            id: row.id,
            plan_number: row.plan.plan_number,
            production_code: row.production_code,
            production_date: row.production_date,
            product_id: row.product_id,
            product_name: row.product?.name,
            planned_qty: Number(row.planned_qty || 0),
            realized_qty: realized,
            total_received: totalReceived,
            remaining_qty: Math.max(0, realized - totalReceived),
            month: row.plan.month,
            year: row.plan.year,
        };
    }));

    return mapped;
};

module.exports = {
    getFinishedGoodsReceipts,
    getSourceOptions,
    getFinishedGoodsReceiptById,
    createFinishedGoodsReceipt,
    updateFinishedGoodsReceipt,
    deleteFinishedGoodsReceipt,
    approveFinishedGoodsReceipt,
    cancelFinishedGoodsReceipt,
};
