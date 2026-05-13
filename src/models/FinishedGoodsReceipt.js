const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinishedGoodsReceipt = sequelize.define('finished_goods_receipts', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    receipt_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    date: { type: DataTypes.DATE, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'DRAFT' },
    description: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    approved_by: { type: DataTypes.INTEGER },
    approved_at: { type: DataTypes.DATE },
    cancelled_by: { type: DataTypes.INTEGER },
    cancelled_at: { type: DataTypes.DATE },
    cancel_reason: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

const FinishedGoodsReceiptDetail = sequelize.define('finished_goods_receipt_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    finished_goods_receipt_id: { type: DataTypes.INTEGER, allowNull: false },
    production_plan_detail_id: { type: DataTypes.INTEGER },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    qty_received: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    note: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = { FinishedGoodsReceipt, FinishedGoodsReceiptDetail };
