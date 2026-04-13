const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Unit = sequelize.define('units', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: false });

module.exports = Unit;
