const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('permissions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    module: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Permission;
