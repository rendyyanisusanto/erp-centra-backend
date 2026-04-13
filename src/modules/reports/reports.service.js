const { Op, literal } = require('sequelize');
const sequelize = require('../../config/database');
const {
    Journal, JournalDetail, ChartOfAccount, RawMaterial,
    Sale, SalePayment, Purchase, PurchasePayment, Customer, Supplier,
    MaterialIssue, MaterialIssueDetail, Employee, Position, Unit, User,
    ProductionPlanDetail, Product,
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

// ====== STOCK OPNAME REPORT ======
const getStockOpnameReport = async ({ month, year, stock_adjustment_id }) => {
    const { StockAdjustment, StockAdjustmentDetail, Unit } = require('../../models');

    const where = {};
    if (month && year) {
        where.date = {
            [Op.between]: [
                new Date(year, month - 1, 1).toISOString().split('T')[0],
                new Date(year, month, 0).toISOString().split('T')[0]
            ]
        };
    }
    if (stock_adjustment_id) {
        where.id = stock_adjustment_id;
    }

    const adjustments = await StockAdjustment.findAll({
        where,
        include: [
            {
                model: StockAdjustmentDetail,
                as: 'details',
                where: { item_type: 'RAW' },
                include: [{
                    model: RawMaterial,
                    as: 'rawMaterial',
                    include: [{ model: Unit, as: 'unit' }]
                }]
            }
        ],
        order: [['date', 'ASC'], [{ model: StockAdjustmentDetail, as: 'details' }, 'id', 'ASC']]
    });

    const results = [];
    for (const adj of adjustments) {
        for (const detail of adj.details) {
            results.push({
                stock_adjustment_id: adj.id,
                date: adj.date,
                material: {
                    id: detail.rawMaterial?.id,
                    name: detail.rawMaterial?.name,
                    unit: detail.rawMaterial?.unit?.name || '-',
                },
                qty_system: detail.qty_system,
                qty_real: detail.qty_real,
                difference: detail.difference,
            });
        }
    }

    return results;
};

// ====== PURCHASE ORDER RECAP REPORT ======
const getPurchaseOrderRecap = async ({ date_from, date_to, supplier_id }) => {
    const { GoodsReceipt, GoodsReceiptDetail, Purchase, Supplier, RawMaterial } = require('../../models');

    const where = {};
    if (date_from && date_to) {
        where.date = { [Op.between]: [date_from, date_to] };
    } else if (date_from) {
        where.date = { [Op.gte]: date_from };
    } else if (date_to) {
        where.date = { [Op.lte]: date_to };
    }

    const purchaseWhere = {};
    if (supplier_id) {
        purchaseWhere.supplier_id = supplier_id;
    }

    const receipts = await GoodsReceipt.findAll({
        where,
        include: [
            {
                model: GoodsReceiptDetail,
                as: 'details',
                include: [{ model: RawMaterial, as: 'rawMaterial' }]
            },
            {
                model: Purchase,
                as: 'purchase',
                where: purchaseWhere,
                include: [{ model: Supplier, as: 'supplier' }]
            }
        ],
        order: [['date', 'ASC'], ['id', 'ASC']]
    });

    const transactions = [];
    const summaryMap = {};
    let grand_total = 0;

    for (const receipt of receipts) {
        for (const detail of receipt.details) {
            const materialName = detail.rawMaterial?.name || 'Unknown';
            const supplierName = receipt.purchase?.supplier?.name || 'Unknown';

            const subtotal = Number(detail.subtotal || 0);
            const qty = Number(detail.qty_received || 0);
            const price = Number(detail.price || 0);

            grand_total += subtotal;

            transactions.push({
                date: receipt.date,
                material_name: materialName,
                qty: qty,
                supplier_name: supplierName,
                vehicle_number: receipt.license_plate || '-', // using license_plate from GoodsReceipt
                subtotal: subtotal
            });

            if (!summaryMap[materialName]) {
                summaryMap[materialName] = {
                    material_name: materialName,
                    total_qty: 0,
                    unit_price: price, // assuming constant price per selected period
                    total_amount: 0
                };
            }
            summaryMap[materialName].total_qty += qty;
            summaryMap[materialName].total_amount += subtotal;
            summaryMap[materialName].unit_price = price; // last price
        }
    }

    const summaries = Object.values(summaryMap);

    return {
        transactions,
        summaries,
        grand_total
    };
};

// ====== SUPPLIER PAYABLE STATEMENT ======
const getSupplierPayableStatement = async ({ date_from, date_to, supplier_id }) => {
    if (!supplier_id) throw { status: 400, message: 'supplier_id is required.' };
    const { Purchase, PurchaseDetail, PurchasePayment, RawMaterial, Product, Supplier } = require('../../models');

    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) throw { status: 404, message: 'Supplier not found.' };

    // 1. Calculate Previous Balance (Tagihan Lalu)
    // All unpaid/partially paid purchases before `date_from`
    let previous_balance = 0;
    if (date_from) {
        const pastPurchases = await Purchase.findAll({
            where: {
                supplier_id,
                date: { [Op.lt]: date_from },
                status: { [Op.in]: ['OPEN', 'PARTIAL'] }
            },
            include: [{ model: PurchasePayment, as: 'payments' }]
        });
        pastPurchases.forEach(p => {
            const paid = p.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
            previous_balance += (Number(p.total_amount) - paid);
        });
    } else {
        // If no date_from is explicitly defined, we assume previous balance is 0 as we get from beginning of time
        previous_balance = 0;
    }

    // 2. Fetch purchases and their details within the date range
    const purchaseWhere = { supplier_id };
    const paymentWhere = { purchase_id: [] }; // will extract purchase IDs

    if (date_from && date_to) {
        purchaseWhere.date = { [Op.between]: [date_from, date_to] };
    } else if (date_from) {
        purchaseWhere.date = { [Op.gte]: date_from };
    } else if (date_to) {
        purchaseWhere.date = { [Op.lte]: date_to };
    }

    const purchases = await Purchase.findAll({
        where: purchaseWhere,
        include: [
            {
                model: PurchaseDetail,
                as: 'details',
                include: [
                    { model: RawMaterial, as: 'rawMaterial' },
                    { model: Product, as: 'product' }
                ]
            }
        ],
        order: [['date', 'ASC'], ['id', 'ASC']]
    });

    // We also need payments made to this supplier in this date range.
    // Payments are linked to purchases. We can find all purchases for the supplier (regardless of when bought), 
    // but filter payments by the date range.
    const allSupplierPurchases = await Purchase.findAll({
        where: { supplier_id },
        attributes: ['id']
    });
    const supplierPurchaseIds = allSupplierPurchases.map(p => p.id);

    const paymentDateWhere = {};
    if (date_from && date_to) {
        paymentDateWhere.date = { [Op.between]: [date_from, date_to] };
    } else if (date_from) {
        paymentDateWhere.date = { [Op.gte]: date_from };
    } else if (date_to) {
        paymentDateWhere.date = { [Op.lte]: date_to };
    }

    const payments = await PurchasePayment.findAll({
        where: {
            purchase_id: { [Op.in]: supplierPurchaseIds },
            ...paymentDateWhere
        },
        order: [['date', 'ASC'], ['id', 'ASC']]
    });

    // Formatting results
    const transactions = [];
    let purchase_total = 0;
    let total_payments = 0;

    purchases.forEach(p => {
        p.details.forEach(d => {
            let itemName = 'Unknown';
            if (d.item_type === 'raw_material') itemName = d.rawMaterial?.name;
            else if (d.item_type === 'product') itemName = d.product?.name;

            const subtotal = Number(d.subtotal);
            purchase_total += subtotal;

            transactions.push({
                type: 'PURCHASE',
                date: p.date,
                name: itemName,
                qty: Number(d.qty),
                price: Number(d.price),
                subtotal: subtotal,
                note: p.description || ''
            });
        });
    });

    const payment_transactions = payments.map(pay => {
        const amt = Number(pay.amount);
        total_payments += amt;
        return {
            type: 'PAYMENT',
            date: pay.date,
            note: `PEMBAYARAN TF ${pay.date}`,
            amount: amt
        };
    });

    const total_payable = previous_balance + purchase_total;
    const remaining_balance = total_payable - total_payments;

    return {
        supplier: { id: supplier.id, name: supplier.name, address: supplier.address, phone: supplier.phone },
        period: { from: date_from, to: date_to },
        previous_balance,
        transactions,
        payment_transactions,
        purchase_total,
        total_payments,
        total_payable,
        remaining_balance
    };
};

// ====== FINISHED GOODS STOCK OPNAME REPORT ======
const getFinishedGoodsStockOpnameReport = async ({ month, year, stock_adjustment_id }) => {
    const { StockAdjustment, StockAdjustmentDetail, Product, Unit } = require('../../models');

    const where = {};
    if (month && year) {
        where.date = {
            [Op.between]: [
                new Date(year, month - 1, 1).toISOString().split('T')[0],
                new Date(year, month, 0).toISOString().split('T')[0]
            ]
        };
    }
    if (stock_adjustment_id) {
        where.id = stock_adjustment_id;
    }

    const adjustments = await StockAdjustment.findAll({
        where,
        include: [
            {
                model: StockAdjustmentDetail,
                as: 'details',
                where: { item_type: 'PRODUCT' },
                include: [{
                    model: Product,
                    as: 'product',
                    include: [{ model: Unit, as: 'unit' }]
                }]
            }
        ],
        order: [['date', 'ASC'], [{ model: StockAdjustmentDetail, as: 'details' }, 'id', 'ASC']]
    });

    const results = [];
    for (const adj of adjustments) {
        for (const detail of adj.details) {
            results.push({
                stock_adjustment_id: adj.id,
                date: adj.date,
                product: {
                    id: detail.product?.id,
                    name: detail.product?.name,
                    unit: detail.product?.unit?.name || '-',
                },
                qty_system: detail.qty_system,
                qty_real: detail.qty_real,
                difference: detail.difference,
            });
        }
    }

    return results;
};

// ====== FINISHED GOODS MONTHLY STOCK REPORT ======
const getFinishedGoodsMonthlyStock = async ({ product_id, month, year }) => {
    const { StockMovement, Product, Unit } = require('../../models');

    if (!product_id) throw { status: 400, message: 'product_id is required.' };
    if (!month || !year) throw { status: 400, message: 'month and year are required.' };

    const product = await Product.findByPk(product_id, { include: [{ model: Unit, as: 'unit' }] });
    if (!product) throw { status: 404, message: 'Product not found.' };

    const monthInt = parseInt(month);
    const yearInt = parseInt(year);
    const startDate = new Date(yearInt, monthInt - 1, 1).toISOString().split('T')[0];
    const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
    const endDate = new Date(yearInt, monthInt - 1, daysInMonth).toISOString().split('T')[0];

    // 1. Calculate opening stock
    // Since products may not have OPENING_BALANCE stock movements (unlike raw materials),
    // we derive opening stock from current product stock minus all movements from month start onward.
    // opening_stock = current_stock - net_movements_from_month_start_to_now
    const movementsFromStartResult = await StockMovement.findOne({
        where: {
            item_type: 'PRODUCT',
            item_id: product_id,
            transaction_date: { [Op.gte]: startDate },
        },
        attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('qty_in')), 0), 'total_in'],
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('qty_out')), 0), 'total_out'],
        ],
        raw: true,
    });
    const netMovementsFromStart = movementsFromStartResult
        ? Number(movementsFromStartResult.total_in || 0) - Number(movementsFromStartResult.total_out || 0)
        : 0;
    const openingStock = Number(product.stock || 0) - netMovementsFromStart;

    // 2. Fetch all movements within the month
    const movements = await StockMovement.findAll({
        where: {
            item_type: 'PRODUCT',
            item_id: product_id,
            transaction_date: { [Op.between]: [startDate, `${endDate} 23:59:59`] },
        },
        order: [['transaction_date', 'ASC'], ['id', 'ASC']],
        raw: true,
    });

    // 3. Group movements by day
    const dayMap = {};
    for (const m of movements) {
        const dateStr = new Date(m.transaction_date).toISOString().split('T')[0];
        const day = new Date(dateStr).getDate();
        if (!dayMap[day]) {
            dayMap[day] = { masuk: 0, keluar: 0, deviasi: 0 };
        }
        if (m.reference_type === 'ADJUSTMENT') {
            // Deviasi = net adjustment (qty_in - qty_out)
            dayMap[day].deviasi += Number(m.qty_in || 0) - Number(m.qty_out || 0);
        } else {
            // Non-adjustment: masuk = qty_in, keluar = qty_out
            dayMap[day].masuk += Number(m.qty_in || 0);
            dayMap[day].keluar += Number(m.qty_out || 0);
        }
    }

    // 4. Build daily rows with running balance
    const rows = [];
    let currentStock = openingStock;
    for (let d = 1; d <= daysInMonth; d++) {
        const dayData = dayMap[d] || { masuk: 0, keluar: 0, deviasi: 0 };
        const persediaan = currentStock;
        const sisa = persediaan + dayData.masuk - dayData.keluar + dayData.deviasi;
        const hasData = dayData.masuk !== 0 || dayData.keluar !== 0 || dayData.deviasi !== 0;

        rows.push({
            day: d,
            date: `${yearInt}-${String(monthInt).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            persediaan,
            masuk: dayData.masuk,
            keluar: dayData.keluar,
            deviasi: dayData.deviasi,
            sisa,
            has_data: hasData,
        });
        currentStock = sisa;
    }

    return {
        product: {
            id: product.id,
            name: product.name,
            unit: product.unit ? product.unit.name : '-',
        },
        period: { month: monthInt, year: yearInt },
        opening_stock: openingStock,
        rows,
        final_stock: currentStock,
    };
};

// ====== MATERIAL ISSUE MONTHLY REPORT ======
const getMaterialIssueMonthlyReport = async ({ month, year }) => {
    const m = Number(month);
    const y = Number(year);
    if (!Number.isInteger(m) || m < 1 || m > 12) throw { status: 400, message: 'month is required (1-12).' };
    if (!Number.isInteger(y) || y < 1900 || y > 9999) throw { status: 400, message: 'year is required.' };

    const start = new Date(y, m - 1, 1, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59);

    const issues = await MaterialIssue.findAll({
        where: {
            status: 'APPROVED',
            date: { [Op.between]: [start, end] },
        },
        include: [
            {
                model: Employee,
                as: 'recipientEmployee',
                attributes: ['id', 'name'],
                include: [{ model: Position, as: 'position', attributes: ['id', 'name'] }],
            },
            {
                model: MaterialIssueDetail,
                as: 'details',
                include: [
                    { model: RawMaterial, as: 'rawMaterial', attributes: ['id', 'name'] },
                    { model: Unit, as: 'unit', attributes: ['id', 'name'] },
                ],
            },
        ],
        order: [['date', 'ASC'], ['id', 'ASC'], [{ model: MaterialIssueDetail, as: 'details' }, 'id', 'ASC']],
    });

    const rows = [];
    for (const issue of issues) {
        const issueDate = issue.date ? new Date(issue.date).toISOString().split('T')[0] : '-';
        for (const detail of issue.details || []) {
            rows.push({
                material_issue_id: issue.id,
                issue_number: issue.issue_number,
                date: issueDate,
                raw_material_name: detail.rawMaterial?.name || '-',
                qty: detail.qty,
                unit_name: detail.unit?.name || '-',
                recipient_name: issue.recipientEmployee?.name || '-',
                position_name: issue.recipientEmployee?.position?.name || '-',
                note: detail.note || issue.description || '-',
            });
        }
    }

    return {
        month: m,
        year: y,
        total_documents: issues.length,
        total_rows: rows.length,
        rows,
    };
};

// ====== MATERIAL ISSUE PRINT BY ID ======
const getMaterialIssuePrintById = async (id) => {
    const issue = await MaterialIssue.findByPk(id, {
        include: [
            {
                model: Employee,
                as: 'recipientEmployee',
                attributes: ['id', 'name'],
                include: [{ model: Position, as: 'position', attributes: ['id', 'name'] }],
            },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'approver', attributes: ['id', 'name'] },
            {
                model: MaterialIssueDetail,
                as: 'details',
                include: [
                    { model: RawMaterial, as: 'rawMaterial', attributes: ['id', 'name'] },
                    { model: Unit, as: 'unit', attributes: ['id', 'name'] },
                ],
            },
        ],
        order: [[{ model: MaterialIssueDetail, as: 'details' }, 'id', 'ASC']],
    });

    if (!issue) throw { status: 404, message: 'Material issue not found.' };
    if (issue.status !== 'APPROVED') {
        throw { status: 400, message: 'Only APPROVED material issue can be printed as official report.' };
    }

    return issue;
};

// ====== PRODUCTION REPORT ======
const getProductionReport = async ({ start_date, end_date }) => {
    if (!start_date || !end_date) {
        throw { status: 400, message: 'start_date and end_date are required.' };
    }

    const rows = await ProductionPlanDetail.findAll({
        where: {
            production_date: { [Op.between]: [start_date, end_date] },
            realized_qty: { [Op.gt]: 0 },
        },
        include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
        ],
        attributes: {
            include: [[literal(`COALESCE((
                SELECT sd.price
                FROM sale_details sd
                INNER JOIN sales s ON s.id = sd.sale_id
                WHERE sd.product_id = production_plan_details.product_id
                ORDER BY s.date DESC, sd.id DESC
                LIMIT 1
            ), 0)`), 'q_price']],
        },
        order: [['production_date', 'ASC'], ['id', 'ASC']],
    });

    const dayNames = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const result = rows.map((r) => {
        const d = new Date(`${r.production_date}T00:00:00`);
        const tonase = Number(r.realized_qty || 0);
        const q = Number(r.get('q_price') || 0);
        const total = tonase * q;
        return {
            production_date: r.production_date,
            day_name: Number.isNaN(d.getTime()) ? '-' : dayNames[d.getDay()],
            product_id: r.product_id,
            product_name: r.product?.name || '-',
            tonase,
            q_price: q,
            total,
        };
    });

    return {
        period: { start_date, end_date },
        rows: result,
        total_tonase: result.reduce((sum, item) => sum + Number(item.tonase || 0), 0),
        total_amount: result.reduce((sum, item) => sum + Number(item.total || 0), 0),
    };
};

module.exports = {
    getProfitLoss,
    getPayableReport,
    getReceivableReport,
    getGeneralLedger,
    getRawMaterialStockCard,
    getStockOpnameReport,
    getPurchaseOrderRecap,
    getSupplierPayableStatement,
    getFinishedGoodsStockOpnameReport,
    getFinishedGoodsMonthlyStock,
    getMaterialIssueMonthlyReport,
    getMaterialIssuePrintById,
    getProductionReport,
};
