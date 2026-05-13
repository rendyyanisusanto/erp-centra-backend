const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductionPlan = sequelize.define('production_plans', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plan_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
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

const ProductionPlanDetail = sequelize.define('production_plan_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    production_plan_id: { type: DataTypes.INTEGER, allowNull: false },
    production_code: { type: DataTypes.STRING, allowNull: false },
    production_date: { type: DataTypes.DATEONLY, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    planned_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    realized_qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    note: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = { ProductionPlan, ProductionPlanDetail };
