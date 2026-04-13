const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./modules/auth/auth.routes');
const masterRoutes = require('./modules/master/master.routes');
const purchaseRoutes = require('./modules/purchase/purchase.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const financeRoutes = require('./modules/finance/finance.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/inventory', inventoryRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
