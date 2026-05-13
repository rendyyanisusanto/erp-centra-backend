const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAdjustment = sequelize.define('stock_adjustments', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_type: { type: DataTypes.STRING, allowNull: true }, // null when using detail rows
    item_id: { type: DataTypes.INTEGER, allowNull: true },
    qty_system: { type: DataTypes.DECIMAL(15, 2) },
    qty_real: { type: DataTypes.DECIMAL(15, 2) },
    difference: { type: DataTypes.DECIMAL(15, 2) },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' },
    created_by: { type: DataTypes.INTEGER },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: false });

module.exports = StockAdjustment;
