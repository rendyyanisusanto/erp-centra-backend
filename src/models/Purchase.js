const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('purchases', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    supplier_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    purchase_request_id: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.STRING, defaultValue: 'OPEN' }, // OPEN, PARTIAL, PAID
    description: { type: DataTypes.STRING },
    created_by: { type: DataTypes.INTEGER },
}, { timestamps: false });

const PurchaseDetail = sequelize.define('purchase_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchase_id: { type: DataTypes.INTEGER, allowNull: false },
    item_type: { type: DataTypes.STRING, allowNull: false }, // raw_material or product
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
}, { timestamps: false });

const PurchasePayment = sequelize.define('purchase_payments', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchase_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    account_id: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: false });

module.exports = { Purchase, PurchaseDetail, PurchasePayment };
