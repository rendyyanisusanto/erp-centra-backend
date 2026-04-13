const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('stock_movements', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_type: { type: DataTypes.STRING, allowNull: false }, // RAW_MATERIAL / PRODUCT
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    transaction_date: { type: DataTypes.DATE, allowNull: false },
    reference_type: { type: DataTypes.STRING, allowNull: false }, // PURCHASE, ADJUSTMENT, OPENING_BALANCE
    reference_id: { type: DataTypes.INTEGER },
    qty_in: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    qty_out: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    note: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = StockMovement;
