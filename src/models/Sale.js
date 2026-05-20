const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('sales', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' }, // DRAFT, APPROVED, CANCELLED
    payment_status: { type: DataTypes.STRING, defaultValue: 'UNPAID' }, // UNPAID, PARTIAL, PAID
    description: { type: DataTypes.STRING },
    salesman_id: { type: DataTypes.INTEGER, allowNull: true },
    created_by: { type: DataTypes.INTEGER },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: false });

const SaleDetail = sequelize.define('sale_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sale_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    unit_id: { type: DataTypes.INTEGER },
    conversion_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 1 },
    base_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
}, { timestamps: false });

const SalePayment = sequelize.define('sale_payments', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    payment_number: { type: DataTypes.STRING },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    account_id: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: false });

const SalePaymentDetail = sequelize.define('sale_payment_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sale_payment_id: { type: DataTypes.INTEGER, allowNull: false },
    sale_id: { type: DataTypes.INTEGER, allowNull: false },
    amount_paid: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
}, { timestamps: false });

module.exports = { Sale, SaleDetail, SalePayment, SalePaymentDetail };
