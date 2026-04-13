const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    PurchaseRequest, PurchaseRequestDetail,
    Purchase, PurchaseDetail, PurchasePayment,
    GoodsReceipt, GoodsReceiptDetail,
    RawMaterial, Product, Unit, Supplier, User, ChartOfAccount,
    Journal, JournalDetail, StockMovement,
} = require('../../models');

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 15);
    return { offset: (p - 1) * l, limit: l };
};

const generateNumber = (prefix, id) => `${prefix}-${String(id).padStart(6, '0')}`;

// ====== PURCHASE REQUEST ======
const getPurchaseRequests = async ({ page, limit, search, status }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (search) where.request_number = { [Op.like]: `%${search}%` };
    if (status) where.status = status;
    const { count, rows } = await PurchaseRequest.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: PurchaseRequestDetail, as: 'details', include: [{ model: RawMaterial, as: 'rawMaterial' }] },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getPurchaseRequestById = async (id) => {
    const pr = await PurchaseRequest.findByPk(id, {
        include: [
            { model: PurchaseRequestDetail, as: 'details', include: [{ model: RawMaterial, as: 'rawMaterial' }] },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
    });
    if (!pr) throw { status: 404, message: 'Purchase request not found.' };
    return pr;
};

const createPurchaseRequest = async ({ date, description, details }, createdBy) => {
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };
    const pr = await PurchaseRequest.create({
        request_number: 'PR-TEMP',
        date,
        description,
        status: 'DRAFT',
        created_by: createdBy,
    });
    pr.request_number = generateNumber('PR', pr.id);
    await pr.save();
    await PurchaseRequestDetail.bulkCreate(details.map(d => ({ ...d, purchase_request_id: pr.id })));
    return getPurchaseRequestById(pr.id);
};

const updatePurchaseRequestStatus = async (id, status) => {
    const pr = await PurchaseRequest.findByPk(id);
    if (!pr) throw { status: 404, message: 'Purchase request not found.' };
    pr.status = status;
    await pr.save();
    return pr;
};

// ====== PURCHASE ORDER ======
const getPurchases = async ({ page, limit, search, status, date_from, date_to }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (search) where['$supplier.name$'] = { [Op.like]: `%${search}%` };
    if (status) where.status = status;
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    const { count, rows } = await Purchase.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: Supplier, as: 'supplier' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getPurchaseById = async (id) => {
    const purchase = await Purchase.findByPk(id, {
        include: [
            { model: Supplier, as: 'supplier' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            {
                model: PurchaseDetail, as: 'details',
                include: [
                    { model: RawMaterial, as: 'rawMaterial', include: [{ model: Unit, as: 'unit' }] },
                    { model: Product, as: 'product', include: [{ model: Unit, as: 'unit' }] }
                ]
            },
            { model: PurchasePayment, as: 'payments', include: [{ model: ChartOfAccount, as: 'account' }] },
            { model: GoodsReceipt, as: 'receipts', include: [{ model: GoodsReceiptDetail, as: 'details' }] },
        ],
    });
    if (!purchase) throw { status: 404, message: 'Purchase order not found.' };

    const receipts = purchase.receipts || [];
    if (purchase.details) {
        purchase.details.forEach(d => {
            let received = 0;
            receipts.forEach(gr => {
                if (gr.details) {
                    gr.details.forEach(grd => {
                        const grItemId = grd.raw_material_id || grd.item_id;
                        if (grItemId === d.item_id) {
                            received += Number(grd.qty_received || 0);
                        }
                    });
                }
            });
            d.dataValues.qty_received = received;
        });
    }

    return purchase;
};

const createPurchase = async ({ supplier_id, date, description, purchase_request_id, details }, createdBy) => {
    if (!supplier_id) throw { status: 400, message: 'Supplier is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };

    const total_amount = details.reduce((sum, d) => sum + (Number(d.qty) * Number(d.price)), 0);
    details = details.map(d => ({ ...d, subtotal: Number(d.qty) * Number(d.price) }));

    const purchase = await Purchase.create({
        supplier_id, date, description, purchase_request_id: purchase_request_id || null,
        total_amount, status: 'OPEN', created_by: createdBy,
    });
    await PurchaseDetail.bulkCreate(details.map(d => ({ ...d, purchase_id: purchase.id })));
    return getPurchaseById(purchase.id);
};

// ====== GOODS RECEIPT ======
const getGoodsReceipts = async ({ page, limit, search, date_from, date_to }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (search) {
        where[Op.or] = [
            { receipt_number: { [Op.like]: `%${search}%` } },
            { '$purchase.id$': { [Op.like]: `%${search.replace(/PO #?/i, '')}%` } },
            { '$purchase.supplier.name$': { [Op.like]: `%${search}%` } }
        ];
    }
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    const { count, rows } = await GoodsReceipt.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: Purchase, as: 'purchase', include: [{ model: Supplier, as: 'supplier' }] },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getGoodsReceiptById = async (id) => {
    const gr = await GoodsReceipt.findByPk(id, {
        include: [
            { model: Purchase, as: 'purchase', include: [{ model: Supplier, as: 'supplier' }] },
            { model: GoodsReceiptDetail, as: 'details', include: [{ model: RawMaterial, as: 'rawMaterial' }] },
        ],
    });
    if (!gr) throw { status: 404, message: 'Goods receipt not found.' };
    return gr;
};

const createGoodsReceipt = async ({ purchase_id, date, license_plate, details }, createdBy) => {
    if (!purchase_id) throw { status: 400, message: 'Purchase order is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };

    const purchase = await Purchase.findByPk(purchase_id);
    if (!purchase) throw { status: 404, message: 'Purchase order not found.' };

    const total_amount = details.reduce((sum, d) => sum + (Number(d.qty_received) * Number(d.price)), 0);
    const detailsWithSubtotal = details.map(d => ({ ...d, subtotal: Number(d.qty_received) * Number(d.price) }));

    const t = await sequelize.transaction();
    try {
        // Create receipt
        const gr = await GoodsReceipt.create({
            receipt_number: 'GR-TEMP', purchase_id, date, license_plate, total_amount, created_by: createdBy,
        }, { transaction: t });
        gr.receipt_number = generateNumber('GR', gr.id);
        await gr.save({ transaction: t });
        await GoodsReceiptDetail.bulkCreate(detailsWithSubtotal.map(d => ({ ...d, goods_receipt_id: gr.id })), { transaction: t });

        // Increase stock for each raw material
        for (const d of detailsWithSubtotal) {
            await RawMaterial.increment('stock', { by: d.qty_received, where: { id: d.raw_material_id }, transaction: t });
        }

        // Record stock movements
        const movementRows = detailsWithSubtotal.map(d => ({
            item_type: 'RAW_MATERIAL',
            item_id: d.raw_material_id,
            transaction_date: date,
            reference_type: 'PURCHASE',
            reference_id: gr.id,
            qty_in: d.qty_received,
            qty_out: 0,
            note: `Goods Receipt ${gr.receipt_number}`,
        }));
        await StockMovement.bulkCreate(movementRows, { transaction: t });

        // Post journal entry: Debit Inventory/Asset, Credit Payable
        // Accounts: 1300 = Inventory/Persediaan, 2100 = Hutang Usaha
        const inventoryAccount = await ChartOfAccount.findOne({ where: { code: '1300' } });
        const payableAccount = await ChartOfAccount.findOne({ where: { code: '2100' } });

        if (inventoryAccount && payableAccount) {
            const journal = await Journal.create({
                date, description: `Goods Receipt - ${gr.receipt_number}`,
                reference_id: gr.id, reference_type: 'goods_receipt', created_by: createdBy,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: inventoryAccount.id, debit: total_amount, credit: 0 },
                { journal_id: journal.id, account_id: payableAccount.id, debit: 0, credit: total_amount },
            ], { transaction: t });
        }

        await t.commit();
        return getGoodsReceiptById(gr.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

// ====== PURCHASE PAYMENT ======
const getPurchasePayments = async ({ page, limit, purchase_id }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (purchase_id) where.purchase_id = purchase_id;
    const { count, rows } = await PurchasePayment.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: Purchase, as: 'purchase', include: [{ model: Supplier, as: 'supplier' }] },
            { model: ChartOfAccount, as: 'account' },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createPurchasePayment = async ({ purchase_id, date, amount, account_id }, createdBy) => {
    if (!purchase_id || !amount || !account_id) throw { status: 400, message: 'Purchase, amount, and account are required.' };

    const purchase = await Purchase.findByPk(purchase_id, { include: [{ model: PurchasePayment, as: 'payments' }] });
    if (!purchase) throw { status: 404, message: 'Purchase not found.' };

    const totalPaid = purchase.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(purchase.total_amount) - totalPaid;
    if (Number(amount) > remaining) throw { status: 400, message: `Payment exceeds remaining balance (${remaining}).` };

    const t = await sequelize.transaction();
    try {
        const payment = await PurchasePayment.create({ purchase_id, date, amount, account_id }, { transaction: t });

        // Update purchase status
        const newTotal = totalPaid + Number(amount);
        purchase.status = newTotal >= Number(purchase.total_amount) ? 'PAID' : 'PARTIAL';
        await purchase.save({ transaction: t });

        // Journal: Debit Payable, Credit Cash/Bank
        const payableAccount = await ChartOfAccount.findOne({ where: { code: '2100' } });
        if (payableAccount) {
            const journal = await Journal.create({
                date, description: `Purchase Payment - PO#${purchase_id}`,
                reference_id: payment.id, reference_type: 'purchase_payment', created_by: createdBy,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: payableAccount.id, debit: amount, credit: 0 },
                { journal_id: journal.id, account_id: account_id, debit: 0, credit: amount },
            ], { transaction: t });
        }

        await t.commit();
        return payment;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

module.exports = {
    getPurchaseRequests, getPurchaseRequestById, createPurchaseRequest, updatePurchaseRequestStatus,
    getPurchases, getPurchaseById, createPurchase,
    getGoodsReceipts, getGoodsReceiptById, createGoodsReceipt,
    getPurchasePayments, createPurchasePayment,
};
