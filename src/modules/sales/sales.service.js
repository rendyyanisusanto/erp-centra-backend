const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    Sale, SaleDetail, SalePayment,
    Product, Customer, User, ChartOfAccount, Salesman,
    Journal, JournalDetail,
} = require('../../models');

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
            { model: SaleDetail, as: 'details', include: [{ model: Product, as: 'product' }] },
            { model: SalePayment, as: 'payments', include: [{ model: ChartOfAccount, as: 'account' }] },
        ],
    });
    if (!sale) throw { status: 404, message: 'Sale not found.' };
    return sale;
};

const getSalePrintData = async (id) => {
    const sale = await Sale.findByPk(id, {
        include: [
            { model: Customer, as: 'customer' },
            { model: Salesman, as: 'salesman' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: SaleDetail, as: 'details', include: [{ model: Product, as: 'product' }] },
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
        const total_amount = details.reduce((sum, d) => sum + (Number(d.qty) * Number(d.price)), 0);
        const detailsWithSubtotal = details.map(d => ({ ...d, subtotal: Number(d.qty) * Number(d.price) }));

        // Validate stock
        for (const d of detailsWithSubtotal) {
            const product = await Product.findByPk(d.product_id, { transaction: t });
            if (!product) throw { status: 404, message: `Product ID ${d.product_id} not found.` };
            if (Number(product.stock) < Number(d.qty)) throw { status: 400, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` };
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
            status: 'UNPAID',
            created_by: createdBy,
        };

        const sale = await Sale.create(salePayload, { transaction: t });
        await SaleDetail.bulkCreate(detailsWithSubtotal.map(d => ({ ...d, sale_id: sale.id })), { transaction: t });

        // Reduce stock
        for (const d of detailsWithSubtotal) {
            await Product.decrement('stock', { by: d.qty, where: { id: d.product_id }, transaction: t });
        }

        // Post journal: Debit Receivable, Credit Revenue
        const receivableAccount = await ChartOfAccount.findOne({ where: { code: '1200' } }); // Piutang
        const revenueAccount = await ChartOfAccount.findOne({ where: { code: '4100' } });    // Pendapatan
        if (receivableAccount && revenueAccount) {
            const journal = await Journal.create({
                date, description: `Sale - SO#${sale.id}`,
                reference_id: sale.id, reference_type: 'sale', created_by: createdBy,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: receivableAccount.id, debit: total_amount, credit: 0 },
                { journal_id: journal.id, account_id: revenueAccount.id, debit: 0, credit: total_amount },
            ], { transaction: t });
        }

        await t.commit();
        return getSaleById(sale.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const createSalePayment = async ({ sale_id, date, amount, account_id }, createdBy) => {
    if (!sale_id || !amount || !account_id) throw { status: 400, message: 'Sale, amount, and account are required.' };

    const sale = await Sale.findByPk(sale_id, { include: [{ model: SalePayment, as: 'payments' }] });
    if (!sale) throw { status: 404, message: 'Sale not found.' };

    const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(sale.total_amount) - totalPaid;
    if (Number(amount) > remaining) throw { status: 400, message: `Payment exceeds remaining balance (${remaining}).` };

    const t = await sequelize.transaction();
    try {
        const payment = await SalePayment.create({ sale_id, date, amount, account_id }, { transaction: t });

        // Update status
        const newTotal = totalPaid + Number(amount);
        sale.status = newTotal >= Number(sale.total_amount) ? 'PAID' : 'PARTIAL';
        await sale.save({ transaction: t });

        // Journal: Debit Cash/Bank, Credit Receivable
        const receivableAccount = await ChartOfAccount.findOne({ where: { code: '1200' } });
        if (receivableAccount) {
            const journal = await Journal.create({
                date, description: `Sale Payment - SO#${sale_id}`,
                reference_id: payment.id, reference_type: 'sale_payment', created_by: createdBy,
            }, { transaction: t });
            await JournalDetail.bulkCreate([
                { journal_id: journal.id, account_id: account_id, debit: amount, credit: 0 },
                { journal_id: journal.id, account_id: receivableAccount.id, debit: 0, credit: amount },
            ], { transaction: t });
        }

        await t.commit();
        return payment;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const getSalePayments = async ({ page, limit, sale_id }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (sale_id) where.sale_id = sale_id;
    const { count, rows } = await SalePayment.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: Sale, as: 'sale', include: [{ model: Customer, as: 'customer' }, { model: Salesman, as: 'salesman' }] },
            { model: ChartOfAccount, as: 'account' },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getSalePaymentsBySaleId = async (saleId) => {
    const sale = await Sale.findByPk(saleId, {
        include: [
            { model: Customer, as: 'customer' },
            { model: Salesman, as: 'salesman' },
            { model: SalePayment, as: 'payments', include: [{ model: ChartOfAccount, as: 'account' }] },
        ],
        order: [[{ model: SalePayment, as: 'payments' }, 'date', 'ASC'], [{ model: SalePayment, as: 'payments' }, 'id', 'ASC']],
    });
    if (!sale) throw { status: 404, message: 'Sale not found.' };

    const total_paid = sale.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const total_amount = Number(sale.total_amount || 0);
    const remaining_amount = Math.max(total_amount - total_paid, 0);

    return {
        sale,
        sale_payments: sale.payments,
        total_paid,
        remaining_amount,
    };
};

module.exports = {
    getSales,
    getSaleById,
    getSalePrintData,
    createSale,
    createSalePayment,
    getSalePayments,
    getSalePaymentsBySaleId,
};
