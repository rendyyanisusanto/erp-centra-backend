const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    Sale, SaleDetail, SalePayment, SalePaymentDetail,
    Product, Unit, Customer, User, ChartOfAccount, Salesman,
    Journal, JournalDetail,
} = require('../../models');
const { resolveConversion } = require('../../utils/unit-conversion');

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 15);
    return { offset: (p - 1) * l, limit: l };
};

const normalizeOptionalId = (value) => {
    if (value === undefined || value === null) return null;
    if (value === '' || value === 'null' || value === 'undefined') return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
};
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const DOC_STATUS = { DRAFT: 'DRAFT', APPROVED: 'APPROVED', CANCELLED: 'CANCELLED' };
const normalizeSaleDetails = async (details, transaction) => Promise.all(details.map(async (d) => {
    const conversion = await resolveConversion({
        item_type: 'PRODUCT',
        item_id: d.product_id,
        unit_id: d.unit_id,
        qty: d.qty,
    }, transaction);
    return {
        product_id: d.product_id,
        qty: Number(d.qty),
        unit_id: conversion.unit_id,
        conversion_qty: conversion.conversion_qty,
        base_qty: conversion.base_qty,
        price: Number(d.price || 0),
        subtotal: Number(d.qty) * Number(d.price || 0),
    };
}));

const getSales = async ({ page, limit, search, status, date_from, date_to }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (status) where.status = status;
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    if (search) {
        where[Op.or] = [
            { description: { [Op.like]: `%${search}%` } },
            { '$customer.name$': { [Op.like]: `%${search}%` } },
            { '$salesman.name$': { [Op.like]: `%${search}%` } },
        ];
    }
    const { count, rows } = await Sale.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: Customer, as: 'customer' },
            { model: Salesman, as: 'salesman' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
        subQuery: false,
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getSaleById = async (id) => {
    const sale = await Sale.findByPk(id, {
        include: [
            { model: Customer, as: 'customer' },
            { model: Salesman, as: 'salesman' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: SaleDetail, as: 'details', include: [{ model: Unit, as: 'unit' }, { model: Product, as: 'product', include: [{ model: Unit, as: 'unit' }] }] },
            {
                model: SalePaymentDetail,
                as: 'paymentDetails',
                include: [{ model: SalePayment, as: 'payment', include: [{ model: ChartOfAccount, as: 'account' }] }],
            },
        ],
    });
    if (!sale) throw { status: 404, message: 'Sale not found.' };
    const total_paid = (sale.paymentDetails || [])
        .filter(d => d.payment?.status === DOC_STATUS.APPROVED)
        .reduce((sum, d) => sum + Number(d.amount_paid || 0), 0);
    sale.dataValues.total_paid = total_paid;
    sale.dataValues.remaining_amount = Math.max(Number(sale.total_amount) - total_paid, 0);
    sale.dataValues.payments = (sale.paymentDetails || []).map(d => ({
        ...(d.payment?.dataValues || {}),
        amount: d.amount_paid,
        sale_id: d.sale_id,
    }));
    return sale;
};

const getSalePrintData = async (id) => {
    const sale = await Sale.findByPk(id, {
        include: [
            { model: Customer, as: 'customer' },
            { model: Salesman, as: 'salesman' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: SaleDetail, as: 'details', include: [{ model: Unit, as: 'unit' }, { model: Product, as: 'product', include: [{ model: Unit, as: 'unit' }] }] },
        ],
        order: [[{ model: SaleDetail, as: 'details' }, 'id', 'ASC']],
    });
    if (!sale) throw { status: 404, message: 'Sale not found.' };
    return sale;
};

const createSale = async ({ customer_id, date, description, salesman_id, details }, createdBy) => {
    if (!customer_id) throw { status: 400, message: 'Customer is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };

    const normalizedSalesmanId = normalizeOptionalId(salesman_id);

    const t = await sequelize.transaction();
    try {
        const detailsWithSubtotal = await normalizeSaleDetails(details, t);
        const total_amount = detailsWithSubtotal.reduce((sum, d) => sum + Number(d.subtotal), 0);

        // Validate stock
        for (const d of detailsWithSubtotal) {
            const product = await Product.findByPk(d.product_id, { transaction: t });
            if (!product) throw { status: 404, message: `Product ID ${d.product_id} not found.` };
            if (Number(product.stock) < Number(d.base_qty)) throw { status: 400, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` };
        }

        // Resolve optional salesman: keep selected ID if valid, otherwise reject.
        let resolvedSalesmanId = normalizedSalesmanId;
        if (resolvedSalesmanId !== null) {
            const salesman = await Salesman.findByPk(resolvedSalesmanId, { transaction: t });
            if (!salesman) throw { status: 400, message: 'Invalid salesman_id. Please choose a valid salesman or leave it empty.' };
        }

        const salePayload = {
            customer_id,
            date,
            description,
            salesman_id: resolvedSalesmanId,
            total_amount,
            status: DOC_STATUS.DRAFT,
            payment_status: 'UNPAID',
            created_by: createdBy,
        };

        const sale = await Sale.create(salePayload, { transaction: t });
        await SaleDetail.bulkCreate(detailsWithSubtotal.map(d => ({ ...d, sale_id: sale.id })), { transaction: t });

        await t.commit();
        return getSaleById(sale.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const updateSale = async (id, { customer_id, date, description, salesman_id, details }) => {
    const sale = await Sale.findByPk(id);
    if (!sale) throw { status: 404, message: 'Sale not found.' };
    if (sale.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya penjualan DRAFT yang dapat diedit.' };
    if (!customer_id) throw { status: 400, message: 'Customer is required.' };
    if (!details || !details.length) throw { status: 400, message: 'At least one item is required.' };

    const normalizedSalesmanId = normalizeOptionalId(salesman_id);
    const t = await sequelize.transaction();
    try {
        const detailsWithSubtotal = await normalizeSaleDetails(details, t);
        const total_amount = detailsWithSubtotal.reduce((sum, d) => sum + Number(d.subtotal), 0);
        if (normalizedSalesmanId !== null) {
            const salesman = await Salesman.findByPk(normalizedSalesmanId, { transaction: t });
            if (!salesman) throw { status: 400, message: 'Invalid salesman_id. Please choose a valid salesman or leave it empty.' };
        }

        await sale.update({
            customer_id,
            date,
            description,
            salesman_id: normalizedSalesmanId,
            total_amount,
        }, { transaction: t });

        await SaleDetail.destroy({ where: { sale_id: id }, transaction: t });
        await SaleDetail.bulkCreate(detailsWithSubtotal.map(d => ({ ...d, sale_id: id })), { transaction: t });

        await t.commit();
        return getSaleById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const createSalePayment = async ({ sale_id, date, amount, account_id }, createdBy) => {
    return createSalePaymentMulti({ customer_id: null, date, total_amount: amount, account_id, details: [{ sale_id, amount_paid: amount }] }, createdBy, true);
};

const recalculateSaleStatus = async (saleId, transaction) => {
    const sale = await Sale.findByPk(saleId, { transaction });
    if (!sale) return null;
    const rows = await SalePaymentDetail.findAll({
        where: { sale_id: saleId },
        attributes: ['amount_paid'],
        include: [{ model: SalePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
        transaction
    });
    const totalPaid = rows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
    let status = 'UNPAID';
    if (totalPaid > 0 && totalPaid < Number(sale.total_amount)) status = 'PARTIAL';
    if (totalPaid >= Number(sale.total_amount)) status = 'PAID';
    sale.payment_status = status;
    await sale.save({ transaction });
    return { totalPaid };
};

const getSalePayments = async ({ page, limit, customer_id }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (customer_id) where.customer_id = customer_id;
    const { count, rows } = await SalePayment.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: Customer, as: 'customer' },
            { model: ChartOfAccount, as: 'account' },
            { model: SalePaymentDetail, as: 'details', include: [{ model: Sale, as: 'sale', include: [{ model: Customer, as: 'customer' }, { model: Salesman, as: 'salesman' }] }] },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getSalePaymentById = async (id) => {
    const item = await SalePayment.findByPk(id, {
        include: [
            { model: Customer, as: 'customer' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: ChartOfAccount, as: 'account' },
            { model: SalePaymentDetail, as: 'details', include: [{ model: Sale, as: 'sale', include: [{ model: Customer, as: 'customer' }, { model: Salesman, as: 'salesman' }] }] },
        ],
        order: [[{ model: SalePaymentDetail, as: 'details' }, 'id', 'ASC']],
    });
    if (!item) throw { status: 404, message: 'Sale payment not found.' };
    return item;
};

const getOutstandingSalesByCustomer = async (customer_id) => {
    if (!customer_id) throw { status: 400, message: 'customer_id is required.' };
    const sales = await Sale.findAll({ where: { customer_id, status: DOC_STATUS.APPROVED }, order: [['date', 'ASC'], ['id', 'ASC']] });
    const rows = [];
    for (const s of sales) {
        const paidRows = await SalePaymentDetail.findAll({
            where: { sale_id: s.id },
            attributes: ['amount_paid'],
            include: [{ model: SalePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
        });
        const total_paid = paidRows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
        const remaining_amount = Math.max(Number(s.total_amount) - total_paid, 0);
        let status = 'UNPAID';
        if (total_paid > 0 && remaining_amount > 0) status = 'PARTIAL';
        if (remaining_amount <= 0) status = 'PAID';
        if (remaining_amount > 0) {
            rows.push({
                sale_id: s.id,
                sale_number: `SO-${String(s.id).padStart(6, '0')}`,
                date: s.date,
                total_amount: Number(s.total_amount || 0),
                total_paid,
                remaining_amount,
                status,
            });
        }
    }
    return rows;
};

const validateSalePaymentPayload = ({ customer_id, date, account_id, total_amount, details }) => {
    if (!customer_id) throw { status: 400, message: 'customer_id wajib diisi.' };
    if (!date) throw { status: 400, message: 'date wajib diisi.' };
    if (!account_id) throw { status: 400, message: 'account_id wajib diisi.' };
    if (!(Number(total_amount) > 0)) throw { status: 400, message: 'total_amount wajib lebih besar dari 0.' };
    if (!Array.isArray(details) || details.length === 0) throw { status: 400, message: 'details minimal 1 baris.' };
    const ids = details.map(d => Number(d.sale_id));
    if (new Set(ids).size !== ids.length) throw { status: 400, message: 'sale_id duplikat dalam 1 pembayaran tidak diperbolehkan.' };
};

const createSalePaymentMulti = async ({ customer_id, date, total_amount, account_id, note, details }, createdBy, compat = false) => {
    if (!compat) validateSalePaymentPayload({ customer_id, date, account_id, total_amount, details });
    if (compat && !customer_id) {
        const sale = await Sale.findByPk(details[0].sale_id);
        if (!sale) throw { status: 404, message: 'Sale not found.' };
        customer_id = sale.customer_id;
    }

    const t = await sequelize.transaction();
    try {
        const payment = await SalePayment.create({
            payment_number: 'SP-TEMP',
            customer_id,
            date,
            total_amount,
            account_id,
            note: note || null,
            status: DOC_STATUS.DRAFT,
            created_by: createdBy,
        }, { transaction: t });
        payment.payment_number = `SP-${String(payment.id).padStart(6, '0')}`;
        await payment.save({ transaction: t });

        let sumDetail = 0;
        const detailRows = [];
        for (const d of details) {
            const saleId = Number(d.sale_id);
            const amountPaid = round2(d.amount_paid);
            if (!saleId) throw { status: 400, message: 'sale_id tidak valid.' };
            if (!(amountPaid > 0)) throw { status: 400, message: 'amount_paid harus lebih besar dari 0.' };
            const sale = await Sale.findByPk(saleId, { transaction: t });
            if (!sale) throw { status: 400, message: `Sale ${saleId} tidak ditemukan.` };
            if (Number(sale.customer_id) !== Number(customer_id)) throw { status: 400, message: `Sale ${saleId} bukan milik customer terpilih.` };
            const paidRows = await SalePaymentDetail.findAll({
                where: { sale_id: saleId },
                attributes: ['amount_paid'],
                include: [{ model: SalePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
                transaction: t
            });
            const totalPaidBefore = paidRows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
            const remaining = round2(Number(sale.total_amount) - totalPaidBefore);
            if (amountPaid > remaining) throw { status: 400, message: `Jumlah bayar sale ${saleId} melebihi sisa piutang (${remaining}).` };
            sumDetail = round2(sumDetail + amountPaid);
            detailRows.push({ sale_payment_id: payment.id, sale_id: saleId, amount_paid: amountPaid });
        }
        if (round2(sumDetail) !== round2(total_amount)) throw { status: 400, message: 'SUM(details.amount_paid) harus sama dengan total_amount.' };
        await SalePaymentDetail.bulkCreate(detailRows, { transaction: t });
        await t.commit();
        return getSalePaymentById(payment.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const getSalePaymentsBySaleId = async (saleId) => {
    const sale = await Sale.findByPk(saleId, {
        include: [
            { model: Customer, as: 'customer' },
            { model: Salesman, as: 'salesman' },
            { model: SalePaymentDetail, as: 'paymentDetails', include: [{ model: SalePayment, as: 'payment', include: [{ model: ChartOfAccount, as: 'account' }] }] },
        ],
    });
    if (!sale) throw { status: 404, message: 'Sale not found.' };
    const payments = (sale.paymentDetails || []).map(d => d.payment).filter(Boolean);
    const total_paid = (sale.paymentDetails || [])
        .filter(d => d.payment?.status === DOC_STATUS.APPROVED)
        .reduce((sum, d) => sum + Number(d.amount_paid || 0), 0);
    const total_amount = Number(sale.total_amount || 0);
    const remaining_amount = Math.max(total_amount - total_paid, 0);

    return {
        sale,
        sale_payments: payments,
        allocations: sale.paymentDetails || [],
        total_paid,
        remaining_amount,
    };
};

const updateSalePayment = async (id, payload, userId) => {
    const existing = await SalePayment.findByPk(id, { include: [{ model: SalePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Sale payment not found.' };
    if (existing.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya pembayaran DRAFT yang bisa diubah.' };
    validateSalePaymentPayload(payload);
    const t = await sequelize.transaction();
    try {
        const touchedSaleIds = existing.details.map(d => d.sale_id);
        await SalePaymentDetail.destroy({ where: { sale_payment_id: id }, transaction: t });
        await existing.update({
            customer_id: payload.customer_id,
            date: payload.date,
            total_amount: payload.total_amount,
            account_id: payload.account_id,
            note: payload.note || null,
            created_by: userId,
        }, { transaction: t });
        let sumDetail = 0;
        const newRows = [];
        for (const d of payload.details) {
            const sale = await Sale.findByPk(d.sale_id, { transaction: t });
            if (!sale) throw { status: 400, message: `Sale ${d.sale_id} tidak ditemukan.` };
            if (Number(sale.customer_id) !== Number(payload.customer_id)) throw { status: 400, message: `Sale ${d.sale_id} bukan milik customer terpilih.` };
            const amountPaid = round2(d.amount_paid);
            if (!(amountPaid > 0)) throw { status: 400, message: 'amount_paid harus lebih besar dari 0.' };
            const paidRows = await SalePaymentDetail.findAll({
                where: { sale_id: d.sale_id },
                attributes: ['amount_paid'],
                include: [{ model: SalePayment, as: 'payment', where: { status: DOC_STATUS.APPROVED }, attributes: [] }],
                transaction: t
            });
            const totalPaidBefore = paidRows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
            const remaining = round2(Number(sale.total_amount) - totalPaidBefore);
            if (amountPaid > remaining) throw { status: 400, message: `Jumlah bayar sale ${d.sale_id} melebihi sisa piutang (${remaining}).` };
            sumDetail = round2(sumDetail + amountPaid);
            newRows.push({ sale_payment_id: id, sale_id: d.sale_id, amount_paid: amountPaid });
        }
        if (round2(sumDetail) !== round2(payload.total_amount)) throw { status: 400, message: 'SUM(details.amount_paid) harus sama dengan total_amount.' };
        await SalePaymentDetail.bulkCreate(newRows, { transaction: t });
        await t.commit();
        return getSalePaymentById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const deleteSalePayment = async (id) => {
    const existing = await SalePayment.findByPk(id, { include: [{ model: SalePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Sale payment not found.' };
    if (existing.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya pembayaran DRAFT yang bisa dihapus.' };
    const t = await sequelize.transaction();
    try {
        await SalePaymentDetail.destroy({ where: { sale_payment_id: id }, transaction: t });
        await existing.destroy({ transaction: t });
        await t.commit();
        return { id, deleted: true };
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approveSalePayment = async (id, userId) => {
    const existing = await SalePayment.findByPk(id, { include: [{ model: SalePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Sale payment not found.' };
    if (existing.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya pembayaran DRAFT yang bisa disetujui.' };
    const t = await sequelize.transaction();
    try {
        existing.status = DOC_STATUS.APPROVED;
        existing.approved_by = userId;
        existing.approved_at = new Date();
        await existing.save({ transaction: t });

        const receivableAccount = await ChartOfAccount.findOne({ where: { code: '1200' } });
        if (receivableAccount) {
            const journal = await Journal.create({
                date: existing.date, description: `Sale Payment - ${existing.payment_number}`,
                reference_id: existing.id, reference_type: 'sale_payment', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: existing.account_id, debit: existing.total_amount, credit: 0 },
                { journal_id: journal.id, account_id: receivableAccount.id, debit: 0, credit: existing.total_amount },
            ], { transaction: t });
        }

        for (const d of existing.details) await recalculateSaleStatus(d.sale_id, t);
        await t.commit();
        return getSalePaymentById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const cancelSalePayment = async (id, userId, cancelReason) => {
    const existing = await SalePayment.findByPk(id, { include: [{ model: SalePaymentDetail, as: 'details' }] });
    if (!existing) throw { status: 404, message: 'Sale payment not found.' };
    if (existing.status !== DOC_STATUS.APPROVED) throw { status: 400, message: 'Hanya pembayaran APPROVED yang bisa dibatalkan.' };
    const t = await sequelize.transaction();
    try {
        existing.status = DOC_STATUS.CANCELLED;
        existing.cancelled_by = userId;
        existing.cancelled_at = new Date();
        existing.cancel_reason = cancelReason || null;
        await existing.save({ transaction: t });

        const receivableAccount = await ChartOfAccount.findOne({ where: { code: '1200' } });
        if (receivableAccount) {
            const journal = await Journal.create({
                date: new Date(), description: `Reversal Sale Payment - ${existing.payment_number}`,
                reference_id: existing.id, reference_type: 'sale_payment_cancel', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: existing.account_id, debit: 0, credit: existing.total_amount },
                { journal_id: journal.id, account_id: receivableAccount.id, debit: existing.total_amount, credit: 0 },
            ], { transaction: t });
        }
        for (const d of existing.details) await recalculateSaleStatus(d.sale_id, t);
        await t.commit();
        return getSalePaymentById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approveSale = async (id, userId) => {
    const sale = await Sale.findByPk(id, { include: [{ model: SaleDetail, as: 'details' }] });
    if (!sale) throw { status: 404, message: 'Sale not found.' };
    if (sale.status !== DOC_STATUS.DRAFT) throw { status: 400, message: 'Hanya penjualan DRAFT yang bisa disetujui.' };
    const t = await sequelize.transaction();
    try {
        for (const d of sale.details) {
            const product = await Product.findByPk(d.product_id, { transaction: t });
            if (!product) throw { status: 404, message: `Product ID ${d.product_id} not found.` };
            if (Number(product.stock) < Number(d.base_qty)) throw { status: 400, message: `Stok ${product.name} tidak cukup.` };
        }
        for (const d of sale.details) {
            await Product.decrement('stock', { by: Number(d.base_qty || 0), where: { id: d.product_id }, transaction: t });
        }
        const receivableAccount = await ChartOfAccount.findOne({ where: { code: '1200' } });
        const revenueAccount = await ChartOfAccount.findOne({ where: { code: '4100' } });
        if (receivableAccount && revenueAccount) {
            const journal = await Journal.create({
                date: sale.date, description: `Sale - SO#${sale.id}`,
                reference_id: sale.id, reference_type: 'sale', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: receivableAccount.id, debit: sale.total_amount, credit: 0 },
                { journal_id: journal.id, account_id: revenueAccount.id, debit: 0, credit: sale.total_amount },
            ], { transaction: t });
        }
        sale.status = DOC_STATUS.APPROVED;
        sale.approved_by = userId;
        sale.approved_at = new Date();
        sale.payment_status = 'UNPAID';
        await sale.save({ transaction: t });
        await t.commit();
        return getSaleById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const cancelSale = async (id, userId, cancelReason) => {
    const sale = await Sale.findByPk(id, { include: [{ model: SaleDetail, as: 'details' }] });
    if (!sale) throw { status: 404, message: 'Sale not found.' };
    if (sale.status !== DOC_STATUS.APPROVED) throw { status: 400, message: 'Hanya penjualan APPROVED yang bisa dibatalkan.' };
    const t = await sequelize.transaction();
    try {
        for (const d of sale.details) {
            await Product.increment('stock', { by: Number(d.base_qty || 0), where: { id: d.product_id }, transaction: t });
        }
        const receivableAccount = await ChartOfAccount.findOne({ where: { code: '1200' } });
        const revenueAccount = await ChartOfAccount.findOne({ where: { code: '4100' } });
        if (receivableAccount && revenueAccount) {
            const journal = await Journal.create({
                date: new Date(), description: `Reversal Sale - SO#${sale.id}`,
                reference_id: sale.id, reference_type: 'sale_cancel', created_by: userId,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: receivableAccount.id, debit: 0, credit: sale.total_amount },
                { journal_id: journal.id, account_id: revenueAccount.id, debit: sale.total_amount, credit: 0 },
            ], { transaction: t });
        }
        sale.status = DOC_STATUS.CANCELLED;
        sale.cancelled_by = userId;
        sale.cancelled_at = new Date();
        sale.cancel_reason = cancelReason || null;
        await sale.save({ transaction: t });
        await t.commit();
        return getSaleById(id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

module.exports = {
    getSales,
    getSaleById,
    getSalePrintData,
    createSale,
    updateSale,
    createSalePayment,
    createSalePaymentMulti,
    getSalePayments,
    getSalePaymentById,
    getSalePaymentsBySaleId,
    updateSalePayment,
    deleteSalePayment,
    getOutstandingSalesByCustomer,
    approveSalePayment,
    cancelSalePayment,
    approveSale,
    cancelSale,
};
