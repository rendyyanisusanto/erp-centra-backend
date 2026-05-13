const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    PurchaseRequest, PurchaseRequestDetail,
    Purchase, PurchaseDetail, PurchasePayment, PurchasePaymentDetail,
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
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const DOC_STATUS = { DRAFT: 'DRAFT', APPROVED: 'APPROVED', CANCELLED: 'CANCELLED' };
const PAYMENT_STATUS = { UNPAID: 'UNPAID', PARTIAL: 'PARTIAL', PAID: 'PAID' };
const PAYABLE_PURCHASE_STATUSES = [DOC_STATUS.APPROVED, 'OPEN']; // legacy OPEN compatibility

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
            {
                model: PurchasePaymentDetail,
                as: 'paymentDetails',
                include: [{ model: PurchasePayment, as: 'payment', include: [{ model: ChartOfAccount, as: 'account' }] }],
            },
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

    const total_paid = (purchase.paymentDetails || [])
        .filter(d => d.payment?.status === DOC_STATUS.APPROVED)
        .reduce((sum, d) => sum + Number(d.amount_paid || 0), 0);
    purchase.dataValues.total_paid = total_paid;
    purchase.dataValues.remaining_amount = Math.max(Number(purchase.total_amount) - total_paid, 0);
    purchase.dataValues.payments = (purchase.paymentDetails || []).map(d => ({
        ...(d.payment?.dataValues || {}),
        amount: d.amount_paid,
        purchase_id: d.purchase_id,
    }));
    return purchase;
};

const createPurchase = async ({ supplier_id, date, description, purchase_request_id, details }, createdBy) => {
    if (!supplier_id) throw { status: 400, message: 'Supplier is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };

    const total_amount = details.reduce((sum, d) => sum + (Number(d.qty) * Number(d.price)), 0);
    details = details.map(d => ({ ...d, subtotal: Number(d.qty) * Number(d.price) }));

    const purchase = await Purchase.create({
        supplier_id, date, description, purchase_request_id: purchase_request_id || null,
        total_amount, status: DOC_STATUS.DRAFT, payment_status: PAYMENT_STATUS.UNPAID, created_by: createdBy,
    });
    await PurchaseDetail.bulkCreate(details.map(d => ({ ...d, purchase_id: purchase.id })));
    return getPurchaseById(purchase.id);
};

const updatePurchase = async (id, { supplier_id, date, description, purchase_request_id, details }) => {
    const purchase = await Purchase.findByPk(id);
    if (!purchase) throw { status: 404, message: 'Purchase order not found.' };
    if (purchase.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya purchase DRAFT yang dapat diedit.' };
    if (!supplier_id) throw { status: 400, message: 'Supplier is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };

    const total_amount = details.reduce((sum, d) => sum + (Number(d.qty) * Number(d.price)), 0);
    const normalizedDetails = details.map(d => ({ ...d, subtotal: Number(d.qty) * Number(d.price) }));

    const t = await sequelize.transaction();
    try {
        await purchase.update({
            supplier_id,
            date,
            description,
            purchase_request_id: purchase_request_id || null,
            total_amount,
        }, { transaction: t });

        await PurchaseDetail.destroy({ where: { purchase_id: id }, transaction: t });
        await PurchaseDetail.bulkCreate(normalizedDetails.map(d => ({ ...d, purchase_id: id })), { transaction: t });

        await t.commit();
        return getPurchaseById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approvePurchase = async (id, userId) => {
    const purchase = await Purchase.findByPk(id);
    if (!purchase) throw { status: 404, message: 'Purchase order not found.' };
    if (purchase.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya purchase DRAFT yang bisa disetujui.' };
    purchase.status = DOC_STATUS.APPROVED;
    purchase.approved_by = userId;
    purchase.approved_at = new Date();
    await purchase.save();
    return getPurchaseById(id);
};

const cancelPurchase = async (id, userId, cancelReason) => {
    const purchase = await Purchase.findByPk(id);
    if (!purchase) throw { status: 404, message: 'Purchase order not found.' };
    if (purchase.status !== DOC_STATUS.APPROVED) throw { status: 400, message: 'Hanya purchase APPROVED yang bisa dibatalkan.' };
    const approvedPayments = await PurchasePaymentDetail.count({
        where: { purchase_id: id },
        include: [{ model: PurchasePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
    });
    if (approvedPayments > 0) throw { status: 400, message: 'Purchase tidak bisa dibatalkan karena sudah memiliki pembayaran APPROVED.' };
    purchase.status = DOC_STATUS.CANCELLED;
    purchase.cancelled_by = userId;
    purchase.cancelled_at = new Date();
    purchase.cancel_reason = cancelReason || null;
    await purchase.save();
    return getPurchaseById(id);
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
            { model: User, as: 'creator', attributes: ['id', 'name'] },
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
    if (purchase.status !== DOC_STATUS.APPROVED) throw { status: 400, message: 'Penerimaan barang hanya bisa dibuat dari purchase yang sudah disetujui (APPROVED).' };

    const total_amount = details.reduce((sum, d) => sum + (Number(d.qty_received) * Number(d.price)), 0);
    const detailsWithSubtotal = details.map(d => ({ ...d, subtotal: Number(d.qty_received) * Number(d.price) }));

    const t = await sequelize.transaction();
    try {
        const gr = await GoodsReceipt.create({
            receipt_number: 'GR-TEMP',
            purchase_id,
            date,
            license_plate,
            total_amount,
            status: DOC_STATUS.DRAFT,
            created_by: createdBy,
        }, { transaction: t });
        gr.receipt_number = generateNumber('GR', gr.id);
        await gr.save({ transaction: t });
        await GoodsReceiptDetail.bulkCreate(detailsWithSubtotal.map(d => ({ ...d, goods_receipt_id: gr.id })), { transaction: t });

        await t.commit();
        return getGoodsReceiptById(gr.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const updateGoodsReceipt = async (id, { purchase_id, date, license_plate, details }) => {
    const gr = await GoodsReceipt.findByPk(id);
    if (!gr) throw { status: 404, message: 'Goods receipt not found.' };
    if (gr.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya penerimaan DRAFT yang bisa diubah.' };
    if (!purchase_id) throw { status: 400, message: 'Purchase order is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };

    const purchase = await Purchase.findByPk(purchase_id);
    if (!purchase) throw { status: 404, message: 'Purchase order not found.' };
    if (purchase.status !== DOC_STATUS.APPROVED) throw { status: 400, message: 'Penerimaan barang hanya bisa dibuat dari purchase yang sudah disetujui (APPROVED).' };

    const total_amount = details.reduce((sum, d) => sum + (Number(d.qty_received) * Number(d.price)), 0);
    const detailsWithSubtotal = details.map(d => ({ ...d, subtotal: Number(d.qty_received) * Number(d.price) }));

    const t = await sequelize.transaction();
    try {
        await gr.update({ purchase_id, date, license_plate, total_amount }, { transaction: t });
        await GoodsReceiptDetail.destroy({ where: { goods_receipt_id: id }, transaction: t });
        await GoodsReceiptDetail.bulkCreate(detailsWithSubtotal.map(d => ({ ...d, goods_receipt_id: id })), { transaction: t });
        await t.commit();
        return getGoodsReceiptById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const deleteGoodsReceipt = async (id) => {
    const gr = await GoodsReceipt.findByPk(id);
    if (!gr) throw { status: 404, message: 'Goods receipt not found.' };
    if (gr.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya penerimaan DRAFT yang bisa dihapus.' };
    const t = await sequelize.transaction();
    try {
        await GoodsReceiptDetail.destroy({ where: { goods_receipt_id: id }, transaction: t });
        await gr.destroy({ transaction: t });
        await t.commit();
        return { message: 'Penerimaan barang berhasil dihapus.' };
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approveGoodsReceipt = async (id, userId) => {
    const gr = await GoodsReceipt.findByPk(id, { include: [{ model: GoodsReceiptDetail, as: 'details' }] });
    if (!gr) throw { status: 404, message: 'Goods receipt not found.' };
    if (gr.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya penerimaan DRAFT yang bisa disetujui.' };
    if (!gr.details?.length) throw { status: 400, message: 'Detail penerimaan barang wajib diisi.' };

    const t = await sequelize.transaction();
    try {
        for (const d of gr.details) {
            await RawMaterial.increment('stock', { by: d.qty_received, where: { id: d.raw_material_id }, transaction: t });
        }

        await StockMovement.bulkCreate(gr.details.map(d => ({
            item_type: 'RAW_MATERIAL',
            item_id: d.raw_material_id,
            transaction_date: gr.date,
            reference_type: 'PURCHASE',
            reference_id: gr.id,
            qty_in: d.qty_received,
            qty_out: 0,
            note: `Goods Receipt ${gr.receipt_number}`,
        })), { transaction: t });

        const inventoryAccount = await ChartOfAccount.findOne({ where: { code: '1300' } });
        const payableAccount = await ChartOfAccount.findOne({ where: { code: '2100' } });
        if (inventoryAccount && payableAccount) {
            const journal = await Journal.create({
                date: gr.date, description: `Goods Receipt - ${gr.receipt_number}`,
                reference_id: gr.id, reference_type: 'goods_receipt', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: inventoryAccount.id, debit: gr.total_amount, credit: 0 },
                { journal_id: journal.id, account_id: payableAccount.id, debit: 0, credit: gr.total_amount },
            ], { transaction: t });
        }

        gr.status = DOC_STATUS.APPROVED;
        gr.approved_by = userId;
        gr.approved_at = new Date();
        await gr.save({ transaction: t });
        await t.commit();
        return getGoodsReceiptById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const cancelGoodsReceipt = async (id, userId, cancelReason) => {
    const gr = await GoodsReceipt.findByPk(id, { include: [{ model: GoodsReceiptDetail, as: 'details' }] });
    if (!gr) throw { status: 404, message: 'Goods receipt not found.' };
    if (gr.status !== DOC_STATUS.APPROVED) throw { status: 400, message: 'Hanya penerimaan APPROVED yang bisa dibatalkan.' };

    const t = await sequelize.transaction();
    try {
        for (const d of gr.details || []) {
            const rm = await RawMaterial.findByPk(d.raw_material_id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!rm) throw { status: 400, message: `Raw material ${d.raw_material_id} tidak ditemukan.` };
            if (Number(rm.stock || 0) < Number(d.qty_received || 0)) throw { status: 400, message: `Stok ${rm.name} tidak cukup untuk reversal cancel.` };
            rm.stock = Number(rm.stock || 0) - Number(d.qty_received || 0);
            await rm.save({ transaction: t });
        }

        await StockMovement.bulkCreate((gr.details || []).map(d => ({
            item_type: 'RAW_MATERIAL',
            item_id: d.raw_material_id,
            transaction_date: new Date(),
            reference_type: 'PURCHASE_CANCEL',
            reference_id: gr.id,
            qty_in: 0,
            qty_out: d.qty_received,
            note: `Reversal Goods Receipt ${gr.receipt_number}`,
        })), { transaction: t });

        const inventoryAccount = await ChartOfAccount.findOne({ where: { code: '1300' } });
        const payableAccount = await ChartOfAccount.findOne({ where: { code: '2100' } });
        if (inventoryAccount && payableAccount) {
            const journal = await Journal.create({
                date: new Date(), description: `Reversal Goods Receipt - ${gr.receipt_number}`,
                reference_id: gr.id, reference_type: 'goods_receipt_cancel', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: inventoryAccount.id, debit: 0, credit: gr.total_amount },
                { journal_id: journal.id, account_id: payableAccount.id, debit: gr.total_amount, credit: 0 },
            ], { transaction: t });
        }

        gr.status = DOC_STATUS.CANCELLED;
        gr.cancelled_by = userId;
        gr.cancelled_at = new Date();
        gr.cancel_reason = cancelReason || null;
        await gr.save({ transaction: t });
        await t.commit();
        return getGoodsReceiptById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

// ====== PURCHASE PAYMENT ======
const recalculatePurchaseStatus = async (purchaseId, transaction) => {
    const purchase = await Purchase.findByPk(purchaseId, { transaction });
    if (!purchase) return null;
    const detailRows = await PurchasePaymentDetail.findAll({
        where: { purchase_id: purchaseId },
        attributes: ['amount_paid'],
        include: [{ model: PurchasePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
        transaction,
    });
    const totalPaid = detailRows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
    let status = PAYMENT_STATUS.UNPAID;
    if (totalPaid > 0 && totalPaid < Number(purchase.total_amount)) status = PAYMENT_STATUS.PARTIAL;
    if (totalPaid >= Number(purchase.total_amount)) status = PAYMENT_STATUS.PAID;
    purchase.payment_status = status;
    await purchase.save({ transaction });
    return { purchase, totalPaid, remaining: Math.max(Number(purchase.total_amount) - totalPaid, 0) };
};

const getPurchasePayments = async ({ page, limit, supplier_id }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (supplier_id) where.supplier_id = supplier_id;
    const { count, rows } = await PurchasePayment.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: Supplier, as: 'supplier' },
            { model: ChartOfAccount, as: 'account' },
            {
                model: PurchasePaymentDetail,
                as: 'details',
                include: [{ model: Purchase, as: 'purchase', include: [{ model: Supplier, as: 'supplier' }] }],
            },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getPurchasePaymentById = async (id) => {
    const item = await PurchasePayment.findByPk(id, {
        include: [
            { model: Supplier, as: 'supplier' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: ChartOfAccount, as: 'account' },
            {
                model: PurchasePaymentDetail,
                as: 'details',
                include: [{ model: Purchase, as: 'purchase', include: [{ model: Supplier, as: 'supplier' }] }],
            },
        ],
        order: [[{ model: PurchasePaymentDetail, as: 'details' }, 'id', 'ASC']],
    });
    if (!item) throw { status: 404, message: 'Purchase payment not found.' };
    return item;
};

const getOutstandingPurchasesBySupplier = async (supplier_id) => {
    if (!supplier_id) throw { status: 400, message: 'supplier_id is required.' };
    const purchases = await Purchase.findAll({
        where: { supplier_id, status: { [Op.in]: PAYABLE_PURCHASE_STATUSES } },
        order: [['date', 'ASC'], ['id', 'ASC']],
    });
    const rows = [];
    for (const p of purchases) {
        const paidRows = await PurchasePaymentDetail.findAll({
            where: { purchase_id: p.id },
            attributes: ['amount_paid'],
            include: [{ model: PurchasePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
        });
        const total_paid = paidRows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
        const remaining_amount = Math.max(Number(p.total_amount) - total_paid, 0);
        let status = PAYMENT_STATUS.UNPAID;
        if (total_paid > 0 && remaining_amount > 0) status = PAYMENT_STATUS.PARTIAL;
        if (remaining_amount <= 0) status = PAYMENT_STATUS.PAID;
        if (remaining_amount > 0) {
            rows.push({
                purchase_id: p.id,
                purchase_number: `PO-${String(p.id).padStart(6, '0')}`,
                date: p.date,
                total_amount: Number(p.total_amount || 0),
                total_paid,
                remaining_amount,
                status,
            });
        }
    }
    return rows;
};

const validatePurchasePaymentPayload = async ({ supplier_id, date, account_id, total_amount, details }) => {
    if (!supplier_id) throw { status: 400, message: 'supplier_id wajib diisi.' };
    if (!date) throw { status: 400, message: 'date wajib diisi.' };
    if (!account_id) throw { status: 400, message: 'account_id wajib diisi.' };
    if (!(Number(total_amount) > 0)) throw { status: 400, message: 'total_amount wajib lebih besar dari 0.' };
    if (!Array.isArray(details) || details.length === 0) throw { status: 400, message: 'details minimal 1 baris.' };
    const ids = details.map(d => Number(d.purchase_id));
    if (new Set(ids).size !== ids.length) throw { status: 400, message: 'purchase_id duplikat dalam 1 pembayaran tidak diperbolehkan.' };
};

const createPurchasePayment = async ({ supplier_id, date, total_amount, account_id, note, details }, createdBy) => {
    await validatePurchasePaymentPayload({ supplier_id, date, account_id, total_amount, details });

    const t = await sequelize.transaction();
    try {
        const payment = await PurchasePayment.create({
            payment_number: 'PP-TEMP',
            supplier_id,
            date,
            total_amount,
            account_id,
            note: note || null,
            status: DOC_STATUS.DRAFT,
            created_by: createdBy,
        }, { transaction: t });
        payment.payment_number = generateNumber('PP', payment.id);
        await payment.save({ transaction: t });

        let sumDetail = 0;
        const detailRows = [];
        for (const d of details) {
            const purchaseId = Number(d.purchase_id);
            const amountPaid = round2(d.amount_paid);
            if (!purchaseId) throw { status: 400, message: 'purchase_id tidak valid.' };
            if (!(amountPaid > 0)) throw { status: 400, message: 'amount_paid harus lebih besar dari 0.' };
            const purchase = await Purchase.findByPk(purchaseId, { transaction: t });
            if (!purchase) throw { status: 400, message: `Purchase ${purchaseId} tidak ditemukan.` };
            if (Number(purchase.supplier_id) !== Number(supplier_id)) throw { status: 400, message: `Purchase ${purchaseId} bukan milik supplier terpilih.` };

            const paidRows = await PurchasePaymentDetail.findAll({
                where: { purchase_id: purchaseId },
                attributes: ['amount_paid'],
                include: [{ model: PurchasePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
                transaction: t
            });
            const totalPaidBefore = paidRows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
            const remaining = round2(Number(purchase.total_amount) - totalPaidBefore);
            if (amountPaid > remaining) throw { status: 400, message: `Jumlah bayar purchase ${purchaseId} melebihi sisa hutang (${remaining}).` };
            sumDetail = round2(sumDetail + amountPaid);
            detailRows.push({ purchase_payment_id: payment.id, purchase_id: purchaseId, amount_paid: amountPaid });
        }
        if (round2(sumDetail) !== round2(total_amount)) throw { status: 400, message: 'SUM(details.amount_paid) harus sama dengan total_amount.' };
        await PurchasePaymentDetail.bulkCreate(detailRows, { transaction: t });

        await t.commit();
        return getPurchasePaymentById(payment.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const updatePurchasePayment = async (id, payload, userId) => {
    const existing = await PurchasePayment.findByPk(id, { include: [{ model: PurchasePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Purchase payment not found.' };
    if (existing.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya pembayaran DRAFT yang bisa diubah.' };
    await validatePurchasePaymentPayload(payload);
    const t = await sequelize.transaction();
    try {
        const touchedPurchaseIds = existing.details.map(d => d.purchase_id);
        await PurchasePaymentDetail.destroy({ where: { purchase_payment_id: id }, transaction: t });
        await existing.update({
            supplier_id: payload.supplier_id,
            date: payload.date,
            total_amount: payload.total_amount,
            account_id: payload.account_id,
            note: payload.note || null,
            created_by: userId,
        }, { transaction: t });
        let sumDetail = 0;
        const newRows = [];
        for (const d of payload.details) {
            const purchase = await Purchase.findByPk(d.purchase_id, { transaction: t });
            if (!purchase) throw { status: 400, message: `Purchase ${d.purchase_id} tidak ditemukan.` };
            if (Number(purchase.supplier_id) !== Number(payload.supplier_id)) throw { status: 400, message: `Purchase ${d.purchase_id} bukan milik supplier terpilih.` };
            const amountPaid = round2(d.amount_paid);
            if (!(amountPaid > 0)) throw { status: 400, message: 'amount_paid harus lebih besar dari 0.' };
            const paidRows = await PurchasePaymentDetail.findAll({
                where: { purchase_id: d.purchase_id },
                attributes: ['amount_paid'],
                include: [{ model: PurchasePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
                transaction: t,
            });
            const totalPaidBefore = paidRows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
            const remaining = round2(Number(purchase.total_amount) - totalPaidBefore);
            if (amountPaid > remaining) throw { status: 400, message: `Jumlah bayar purchase ${d.purchase_id} melebihi sisa hutang (${remaining}).` };
            sumDetail = round2(sumDetail + amountPaid);
            newRows.push({ purchase_payment_id: id, purchase_id: d.purchase_id, amount_paid: amountPaid });
        }
        if (round2(sumDetail) !== round2(payload.total_amount)) throw { status: 400, message: 'SUM(details.amount_paid) harus sama dengan total_amount.' };
        await PurchasePaymentDetail.bulkCreate(newRows, { transaction: t });
        await t.commit();
        return getPurchasePaymentById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const deletePurchasePayment = async (id) => {
    const existing = await PurchasePayment.findByPk(id, { include: [{ model: PurchasePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Purchase payment not found.' };
    if (existing.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya pembayaran DRAFT yang bisa dihapus.' };
    const t = await sequelize.transaction();
    try {
        await PurchasePaymentDetail.destroy({ where: { purchase_payment_id: id }, transaction: t });
        await existing.destroy({ transaction: t });
        await t.commit();
        return { id, deleted: true };
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approvePurchasePayment = async (id, userId) => {
    const existing = await PurchasePayment.findByPk(id, { include: [{ model: PurchasePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Purchase payment not found.' };
    if (existing.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya pembayaran DRAFT yang bisa disetujui.' };
    const t = await sequelize.transaction();
    try {
        for (const d of existing.details) {
            const purchase = await Purchase.findByPk(d.purchase_id, { transaction: t });
            if (!purchase) throw { status: 400, message: `Purchase ${d.purchase_id} tidak ditemukan.` };
            if (!PAYABLE_PURCHASE_STATUSES.includes(purchase.status)) {
                throw { status: 400, message: `Purchase ${d.purchase_id} belum APPROVED.` };
            }
        }
        existing.status = DOC_STATUS.APPROVED;
        existing.approved_by = userId;
        existing.approved_at = new Date();
        await existing.save({ transaction: t });

        const payableAccount = await ChartOfAccount.findOne({ where: { code: '2100' } });
        if (payableAccount) {
            const journal = await Journal.create({
                date: existing.date, description: `Purchase Payment - ${existing.payment_number}`,
                reference_id: existing.id, reference_type: 'purchase_payment', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: payableAccount.id, debit: existing.total_amount, credit: 0 },
                { journal_id: journal.id, account_id: existing.account_id, debit: 0, credit: existing.total_amount },
            ], { transaction: t });
        }

        for (const d of existing.details) await recalculatePurchaseStatus(d.purchase_id, t);
        await t.commit();
        return getPurchasePaymentById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const cancelPurchasePayment = async (id, userId, cancelReason) => {
    const existing = await PurchasePayment.findByPk(id, { include: [{ model: PurchasePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Purchase payment not found.' };
    if (existing.status !== DOC_STATUS.APPROVED) throw { status: 400, message: 'Hanya pembayaran APPROVED yang bisa dibatalkan.' };
    const t = await sequelize.transaction();
    try {
        existing.status = DOC_STATUS.CANCELLED;
        existing.cancelled_by = userId;
        existing.cancelled_at = new Date();
        existing.cancel_reason = cancelReason || null;
        await existing.save({ transaction: t });

        const payableAccount = await ChartOfAccount.findOne({ where: { code: '2100' } });
        if (payableAccount) {
            const journal = await Journal.create({
                date: new Date(), description: `Reversal Purchase Payment - ${existing.payment_number}`,
                reference_id: existing.id, reference_type: 'purchase_payment_cancel', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: payableAccount.id, debit: 0, credit: existing.total_amount },
                { journal_id: journal.id, account_id: existing.account_id, debit: existing.total_amount, credit: 0 },
            ], { transaction: t });
        }
        for (const d of existing.details) await recalculatePurchaseStatus(d.purchase_id, t);
        await t.commit();
        return getPurchasePaymentById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

module.exports = {
    getPurchaseRequests, getPurchaseRequestById, createPurchaseRequest, updatePurchaseRequestStatus,
    getPurchases, getPurchaseById, createPurchase, updatePurchase, approvePurchase, cancelPurchase,
    getGoodsReceipts, getGoodsReceiptById, createGoodsReceipt, updateGoodsReceipt, deleteGoodsReceipt, approveGoodsReceipt, cancelGoodsReceipt,
    getPurchasePayments, getPurchasePaymentById, createPurchasePayment, updatePurchasePayment, deletePurchasePayment,
    getOutstandingPurchasesBySupplier,
    approvePurchasePayment, cancelPurchasePayment,
};
