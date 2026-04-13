const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashTransaction = sequelize.define('cash_transactions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // IN, OUT
    description: { type: DataTypes.TEXT },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    account_debit_id: { type: DataTypes.INTEGER, allowNull: false },
    account_credit_id: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.INTEGER },
}, { timestamps: false });

module.exports = CashTransaction;
