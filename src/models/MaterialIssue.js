const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialIssue = sequelize.define('material_issues', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    issue_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    date: { type: DataTypes.DATE, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: false },
    recipient_employee_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'DRAFT' },
    description: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    approved_by: { type: DataTypes.INTEGER },
    approved_at: { type: DataTypes.DATE },
    cancelled_by: { type: DataTypes.INTEGER },
    cancelled_at: { type: DataTypes.DATE },
    cancel_reason: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

const MaterialIssueDetail = sequelize.define('material_issue_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    material_issue_id: { type: DataTypes.INTEGER, allowNull: false },
    raw_material_id: { type: DataTypes.INTEGER, allowNull: false },
    qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    unit_id: { type: DataTypes.INTEGER, allowNull: false },
    conversion_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 1 },
    base_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    note: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = { MaterialIssue, MaterialIssueDetail };
