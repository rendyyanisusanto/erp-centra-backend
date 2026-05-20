const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RawMaterial = sequelize.define('raw_materials', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    base_unit_id: { type: DataTypes.INTEGER },
    stock: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    min_stock: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = RawMaterial;
