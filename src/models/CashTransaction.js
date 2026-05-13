const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashTransaction = sequelize.define('cash_transactions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // IN, OUT
    description: { type: DataTypes.TEXT },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' },
    account_debit_id: { type: DataTypes.INTEGER, allowNull: false },
    account_credit_id: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.INTEGER },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: false });

module.exports = CashTransaction;
