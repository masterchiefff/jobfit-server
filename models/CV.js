const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CV = sequelize.define('CV', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Assuming your User model is named Users
            key: 'id'
        }
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, { timestamps: true });

module.exports = CV;