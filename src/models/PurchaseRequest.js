const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseRequest = sequelize.define('purchase_requests', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    request_number: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' }, // DRAFT, APPROVED, CANCELLED
    created_by: { type: DataTypes.INTEGER },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancel_reason: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

const PurchaseRequestDetail = sequelize.define('purchase_request_details', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchase_request_id: { type: DataTypes.INTEGER, allowNull: false },
    raw_material_id: { type: DataTypes.INTEGER, allowNull: false },
    qty: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    note: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = { PurchaseRequest, PurchaseRequestDetail };
