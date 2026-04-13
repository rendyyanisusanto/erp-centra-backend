const { Op, literal } = require('sequelize');
const sequelize = require('../../config/database');
const {
    Journal, JournalDetail, ChartOfAccount, RawMaterial,
    Sale, SalePayment, Purchase, PurchasePayment, Customer, Supplier,
} = require('../../models');

// ====== PROFIT & LOSS ======
const getProfitLoss = async ({ date_from, date_to }) => {
    if (!date_from || !date_to) throw { status: 400, message: 'date_from and date_to are required.' };

    // Revenue: credit side of revenue accounts (type = REVENUE)
    const revenue = await JournalDetail.findAll({
        include: [
            { model: ChartOfAccount, as: 'account', where: { type: 'REVENUE' } },
            { model: Journal, as: 'journal', where: { date: { [Op.between]: [date_from, date_to] } } },
        ],
    });
    const totalRevenue = revenue.reduce((sum, d) => sum + Number(d.credit || 0), 0);

    // Expenses: debit side of expense accounts (type = EXPENSE)
    const expenses = await JournalDetail.findAll({
        include: [
            { model: ChartOfAccount, as: 'account', where: { type: 'EXPENSE' } },
            { model: Journal, as: 'journal', where: { date: { [Op.between]: [date_from, date_to] } } },
        ],
    });
    const totalExpenses = expenses.reduce((sum, d) => sum + Number(d.debit || 0), 0);

    return {
        period: { from: date_from, to: date_to },
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
    };
};

// ====== PAYABLES REPORT ======
const getPayableReport = async ({ date_from, date_to }) => {
    const where = {};
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };

    const purchases = await Purchase.findAll({
        where: { ...where, status: { [Op.in]: ['OPEN', 'PARTIAL'] } },
        include: [
            { model: Supplier, as: 'supplier' },
            { model: PurchasePayment, as: 'payments' },
        ],
        order: [['date', 'ASC']],
    });

    return purchases.map(p => {
        const totalPaid = p.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
        return {
            id: p.id,
            date: p.date,
            supplier: p.supplier?.name,
            total_amount: p.total_amount,
            total_paid: totalPaid,
            remaining: Number(p.total_amount) - totalPaid,
            status: p.status,
        };
    });
};

// ====== RECEIVABLES REPORT ======
const getReceivableReport = async ({ date_from, date_to }) => {
    const where = {};
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };

    const sales = await Sale.findAll({
        where: { ...where, status: { [Op.in]: ['UNPAID', 'PARTIAL'] } },
        include: [
            { model: Customer, as: 'customer' },
            { model: SalePayment, as: 'payments' },
        ],
        order: [['date', 'ASC']],
    });

    return sales.map(s => {
        const totalPaid = s.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
        return {
            id: s.id,
            date: s.date,
            customer: s.customer?.name,
            total_amount: s.total_amount,
            total_paid: totalPaid,
            remaining: Number(s.total_amount) - totalPaid,
            status: s.status,
        };
    });
};

// ====== GENERAL LEDGER ======
const getGeneralLedger = async ({ account_id, date_from, date_to }) => {
    if (!account_id) throw { status: 400, message: 'account_id is required.' };
    const account = await ChartOfAccount.findByPk(account_id);
    if (!account) throw { status: 404, message: 'Account not found.' };

    const where = { account_id };
    const dateWhere = {};
    if (date_from && date_to) dateWhere.date = { [Op.between]: [date_from, date_to] };

    const details = await JournalDetail.findAll({
        where,
        include: [{ model: Journal, as: 'journal', where: dateWhere }],
        order: [[{ model: Journal, as: 'journal' }, 'date', 'ASC']],
    });

    let runningBalance = 0;
    const ledger = details.map(d => {
        runningBalance += Number(d.debit || 0) - Number(d.credit || 0);
        return {
            date: d.journal?.date,
            description: d.journal?.description,
            debit: d.debit,
            credit: d.credit,
            balance: runningBalance,
        };
    });

    return { account, ledger };
};

// ====== RAW MATERIAL STOCK CARD ======
const getRawMaterialStockCard = async ({ raw_material_id, date_from, date_to }) => {
    const { StockMovement, Unit } = require('../../models');

    let materials = [];
    if (raw_material_id) {
        const material = await RawMaterial.findByPk(raw_material_id, { include: [{ model: Unit, as: 'unit' }] });
        if (!material) throw { status: 404, message: 'Raw material not found.' };
        materials.push(material);
    } else {
        materials = await RawMaterial.findAll({ include: [{ model: Unit, as: 'unit' }], order: [['name', 'ASC']] });
    }

    const results = [];

    for (const material of materials) {
        // 1. Calculate opening stock via database aggregation (before start_date)
        let opening_stock = 0;
        if (date_from) {
            const openingResult = await StockMovement.findOne({
                where: {
                    item_type: 'RAW_MATERIAL',
                    item_id: material.id,
                    transaction_date: { [Op.lt]: date_from },
                },
                attributes: [
                    [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('qty_in')), 0), 'total_in'],
                    [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('qty_out')), 0), 'total_out'],
                ],
                raw: true,
            });
            if (openingResult) {
                opening_stock = Number(openingResult.total_in || 0) - Number(openingResult.total_out || 0);
            }
        }

        // 2. Fetch movements in period from stock_movements
        const movementWhere = {
            item_type: 'RAW_MATERIAL',
            item_id: material.id,
        };
        if (date_from && date_to) {
            movementWhere.transaction_date = { [Op.between]: [date_from, `${date_to} 23:59:59`] };
        } else if (date_from) {
            movementWhere.transaction_date = { [Op.gte]: date_from };
        } else if (date_to) {
            movementWhere.transaction_date = { [Op.lte]: `${date_to} 23:59:59` };
        }

        const movements = await StockMovement.findAll({
            where: movementWhere,
            order: [['transaction_date', 'ASC'], ['id', 'ASC']],
            raw: true,
        });

        // 3. Compute running balance
        let currentBalance = opening_stock;
        const computedMovements = movements.map(m => {
            const rowOpening = currentBalance;
            const qtyIn = Number(m.qty_in || 0);
            const qtyOut = Number(m.qty_out || 0);
            currentBalance = rowOpening + qtyIn - qtyOut;
            return {
                date: m.transaction_date ? new Date(m.transaction_date).toISOString().split('T')[0] : '-',
                reference: m.note || '-',
                type: m.reference_type || '-',
                reference_type: m.reference_type,
                reference_id: m.reference_id,
                stock_in: qtyIn,
                stock_out: qtyOut,
                opening_stock: rowOpening,
                ending_stock: currentBalance,
            };
        });

        results.push({
            material: {
                id: material.id,
                name: material.name,
                unit: material.unit ? material.unit.name : '-',
            },
            period: { from: date_from, to: date_to },
            opening_stock,
            movements: computedMovements,
            ending_stock: currentBalance,
        });
    }

    return results;
};

module.exports = { getProfitLoss, getPayableReport, getReceivableReport, getGeneralLedger, getRawMaterialStockCard };
