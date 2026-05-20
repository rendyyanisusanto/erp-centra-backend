const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('purchases', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    supplier_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    purchase_request_id: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' }, // DRAFT, APPROVED, CANCELLED
    payment_status: { type: DataTypes.STRING, defaultValue: 'UNPAID' }, // UNPAID, PARTIAL, PAID
    description: { type: DataTypes.STRING },
    created_by: { type: DataTypes.INTEGER },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: false });

const PurchaseDetail = sequelize.define('purchase_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchase_id: { type: DataTypes.INTEGER, allowNull: false },
    purchase_request_detail_id: { type: DataTypes.INTEGER, allowNull: true },
    item_type: { type: DataTypes.STRING, allowNull: false }, // raw_material or product
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    unit_id: { type: DataTypes.INTEGER },
    conversion_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 1 },
    base_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
}, { timestamps: false });

const PurchasePayment = sequelize.define('purchase_payments', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    payment_number: { type: DataTypes.STRING },
    supplier_id: { type: DataTypes.INTEGER, allowNull: false },
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

const PurchasePaymentDetail = sequelize.define('purchase_payment_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchase_payment_id: { type: DataTypes.INTEGER, allowNull: false },
    purchase_id: { type: DataTypes.INTEGER, allowNull: false },
    amount_paid: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
}, { timestamps: false });

module.exports = { Purchase, PurchaseDetail, PurchasePayment, PurchasePaymentDetail };
