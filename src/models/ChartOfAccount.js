const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChartOfAccount = sequelize.define('chart_of_accounts', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
}, { timestamps: false });

module.exports = ChartOfAccount;
