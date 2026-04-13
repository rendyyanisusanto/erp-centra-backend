const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    StockAdjustment, StockAdjustmentDetail, RawMaterial, Product, User, StockMovement,
} = require('../../models');

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 15);
    return { offset: (p - 1) * l, limit: l };
};

const resolveItemName = async (item_type, item_id) => {
    if (item_type === 'RAW') {
        const rm = await RawMaterial.findByPk(item_id, { attributes: ['id', 'name'] });
        return rm ? rm.name : `Raw Material #${item_id}`;
    }
    if (item_type === 'PRODUCT') {
        const p = await Product.findByPk(item_id, { attributes: ['id', 'name'] });
        return p ? p.name : `Product #${item_id}`;
    }
    return `Unknown #${item_id}`;
};

// ====== LIST ======
const getAdjustments = async ({ page, limit, date_from, date_to }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    const { count, rows } = await StockAdjustment.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: StockAdjustmentDetail, as: 'details' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

// ====== DETAIL ======
const getAdjustmentById = async (id) => {
    const adj = await StockAdjustment.findByPk(id, {
        include: [
            { model: StockAdjustmentDetail, as: 'details' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
    });
    if (!adj) throw { status: 404, message: 'Stock adjustment not found.' };

    // Enrich detail rows with item names
    const plain = adj.toJSON();
    plain.details = await Promise.all(plain.details.map(async (d) => ({
        ...d,
        item_name: await resolveItemName(d.item_type, d.item_id),
    })));
    return plain;
};

// ====== CREATE ======
const createAdjustment = async ({ date, details }, createdBy) => {
    if (!date) throw { status: 400, message: 'Date is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one detail row is required.' };

    const t = await sequelize.transaction();
    try {
        // Header (item_type/item_id at header level unused — multi-item via details)
        const adj = await StockAdjustment.create({
            date,
            item_type: null,
            item_id: null,
            qty_system: null,
            qty_real: null,
            difference: null,
            created_by: createdBy,
        }, { transaction: t });

        // Build & bulk-create detail rows
        const detailRows = details.map(d => ({
            stock_adjustment_id: adj.id,
            item_type: d.item_type,
            item_id: d.item_id,
            qty_system: Number(d.qty_system || 0),
            qty_real: Number(d.qty_real || 0),
            difference: Number(d.qty_real || 0) - Number(d.qty_system || 0),
        }));
        await StockAdjustmentDetail.bulkCreate(detailRows, { transaction: t });

        // Update stock for each item
        for (const d of detailRows) {
            if (d.item_type === 'RAW') {
                await RawMaterial.update({ stock: d.qty_real }, { where: { id: d.item_id }, transaction: t });
            } else if (d.item_type === 'PRODUCT') {
                await Product.update({ stock: d.qty_real }, { where: { id: d.item_id }, transaction: t });
            }
        }

        // Record stock movements (only for RAW_MATERIAL items)
        const movementRows = detailRows
            .filter(d => d.difference !== 0)
            .map(d => ({
                item_type: d.item_type === 'RAW' ? 'RAW_MATERIAL' : 'PRODUCT',
                item_id: d.item_id,
                transaction_date: date,
                reference_type: 'ADJUSTMENT',
                reference_id: adj.id,
                qty_in: d.difference > 0 ? d.difference : 0,
                qty_out: d.difference < 0 ? Math.abs(d.difference) : 0,
                note: `Stock Adjustment #${adj.id}`,
            }));
        if (movementRows.length) {
            await StockMovement.bulkCreate(movementRows, { transaction: t });
        }

        await t.commit();
        return getAdjustmentById(adj.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

// ====== DELETE ======
const deleteAdjustment = async (id) => {
    const adj = await StockAdjustment.findByPk(id);
    if (!adj) throw { status: 404, message: 'Stock adjustment not found.' };
    await StockAdjustmentDetail.destroy({ where: { stock_adjustment_id: id } });
    await adj.destroy();
    return { message: 'Deleted successfully.' };
};

// ====== STOCK MOVEMENTS ======
const getStockMovements = async ({ page, limit, search, item_type, reference_type, date_from, date_to }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (item_type) where.item_type = item_type;
    if (reference_type) where.reference_type = reference_type;
    if (date_from && date_to) where.transaction_date = { [Op.between]: [date_from, `${date_to} 23:59:59`] };
    else if (date_from) where.transaction_date = { [Op.gte]: date_from };
    else if (date_to) where.transaction_date = { [Op.lte]: `${date_to} 23:59:59` };

    const { count, rows } = await StockMovement.findAndCountAll({
        where,
        offset,
        limit: l,
        order: [['id', 'DESC']],
    });

    // Enrich with item names
    const data = await Promise.all(rows.map(async (row) => {
        const plain = row.toJSON();
        plain.item_name = await resolveItemName(
            plain.item_type === 'RAW_MATERIAL' ? 'RAW' : plain.item_type,
            plain.item_id
        );
        return plain;
    }));

    // Apply search filter on item_name (post-query since it's polymorphic)
    let filtered = data;
    if (search) {
        const s = search.toLowerCase();
        filtered = data.filter(d =>
            (d.item_name && d.item_name.toLowerCase().includes(s)) ||
            (d.note && d.note.toLowerCase().includes(s)) ||
            (d.reference_type && d.reference_type.toLowerCase().includes(s))
        );
    }

    return { total: search ? filtered.length : count, page: parseInt(page) || 1, data: search ? filtered : data };
};

module.exports = { getAdjustments, getAdjustmentById, createAdjustment, deleteAdjustment, getStockMovements };
