const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Journal = sequelize.define('journals', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT },
    reference_id: { type: DataTypes.INTEGER },
    reference_type: { type: DataTypes.STRING },
    created_by: { type: DataTypes.INTEGER },
}, { timestamps: false });

const JournalDetail = sequelize.define('journal_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    journal_id: { type: DataTypes.INTEGER, allowNull: false },
    account_id: { type: DataTypes.INTEGER, allowNull: false },
    debit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    credit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
}, { timestamps: false });

module.exports = { Journal, JournalDetail };
