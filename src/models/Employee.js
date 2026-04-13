const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('employees', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    position_id: { type: DataTypes.INTEGER, allowNull: false },
    basic_salary: { type: DataTypes.DECIMAL(15, 2) },
    status: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Employee;
