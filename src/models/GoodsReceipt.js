const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GoodsReceipt = sequelize.define('goods_receipts', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    receipt_number: { type: DataTypes.STRING, allowNull: false },
    license_plate: { type: DataTypes.STRING },
    purchase_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' },
    created_by: { type: DataTypes.INTEGER },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

const GoodsReceiptDetail = sequelize.define('goods_receipt_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    goods_receipt_id: { type: DataTypes.INTEGER, allowNull: false },
    raw_material_id: { type: DataTypes.INTEGER, allowNull: false },
    qty_received: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
}, { timestamps: false });

module.exports = { GoodsReceipt, GoodsReceiptDetail };
