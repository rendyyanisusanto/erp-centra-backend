const { ItemUnitConversion, Unit } = require('../models');

const ITEM_TYPES = {
    RAW_MATERIAL: 'RAW_MATERIAL',
    PRODUCT: 'PRODUCT',
};

const normalizeItemType = (itemType) => {
    const t = String(itemType || '').toUpperCase();
    if (t === 'RAW' || t === 'RAW_MATERIAL' || t === 'RAW-MATERIAL') return ITEM_TYPES.RAW_MATERIAL;
    if (t === 'PRODUCT') return ITEM_TYPES.PRODUCT;
    return t;
};

const getItemConversions = async (item_type, item_id, transaction) => {
    const normalized = normalizeItemType(item_type);
    return ItemUnitConversion.findAll({
        where: { item_type: normalized, item_id: Number(item_id) },
        include: [{ model: Unit, as: 'unit', attributes: ['id', 'name'] }],
        order: [['is_base', 'DESC'], ['id', 'ASC']],
        transaction,
    });
};

const resolveConversion = async ({ item_type, item_id, unit_id, qty }, transaction) => {
    const normalized = normalizeItemType(item_type);
    const numericQty = Number(qty);
    if (!Number.isFinite(numericQty) || numericQty <= 0) throw { status: 400, message: 'qty must be greater than 0.' };

    const conversions = await getItemConversions(normalized, item_id, transaction);
    if (!conversions.length) throw { status: 400, message: `No unit conversion configured for ${normalized} #${item_id}.` };

    const selected = unit_id
        ? conversions.find((c) => Number(c.unit_id) === Number(unit_id))
        : conversions.find((c) => Number(c.is_base) === 1) || conversions[0];

    if (!selected) throw { status: 400, message: `unit_id is not valid for ${normalized} #${item_id}.` };

    const conversion_qty = Number(selected.conversion_qty || 0);
    if (!Number.isFinite(conversion_qty) || conversion_qty <= 0) {
        throw { status: 400, message: 'conversion_qty is invalid in master conversion.' };
    }

    return {
        unit_id: Number(selected.unit_id),
        conversion_qty,
        base_qty: numericQty * conversion_qty,
        conversion: selected,
    };
};

module.exports = { ITEM_TYPES, normalizeItemType, getItemConversions, resolveConversion };
