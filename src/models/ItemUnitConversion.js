const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemUnitConversion = sequelize.define('item_unit_conversions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_type: { type: DataTypes.STRING, allowNull: false },
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    unit_id: { type: DataTypes.INTEGER, allowNull: false },
    conversion_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    is_base: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = ItemUnitConversion;
