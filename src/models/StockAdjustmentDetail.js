const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAdjustmentDetail = sequelize.define('stock_adjustment_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    stock_adjustment_id: { type: DataTypes.INTEGER, allowNull: false },
    item_type: { type: DataTypes.STRING, allowNull: false }, // RAW or PRODUCT
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    qty_system: { type: DataTypes.DECIMAL(15, 2) },
    qty_real: { type: DataTypes.DECIMAL(15, 2) },
    difference: { type: DataTypes.DECIMAL(15, 2) },
}, { timestamps: false });

module.exports = StockAdjustmentDetail;
