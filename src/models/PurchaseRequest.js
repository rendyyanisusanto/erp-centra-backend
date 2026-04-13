const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseRequest = sequelize.define('purchase_requests', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    request_number: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' }, // DRAFT, APPROVED, REJECTED
    created_by: { type: DataTypes.INTEGER },
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
