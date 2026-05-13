const express = require('express');
const router = express.Router();
const c = require('./inventory.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

// Stock Adjustments
router.get('/adjustments', perm('stock-adjustment.read'), c.getAdjustments);
router.get('/adjustments/:id', perm('stock-adjustment.read'), c.getAdjustmentById);
router.post('/adjustments', perm('stock-adjustment.create'), c.createAdjustment);
router.post('/adjustments/:id/approve', perm('stock-adjustment.create'), c.approveAdjustment);
router.post('/adjustments/:id/cancel', perm('stock-adjustment.create'), c.cancelAdjustment);
router.delete('/adjustments/:id', perm('stock-adjustment.create'), c.deleteAdjustment);

// Stock Movements
router.get('/stock-movements', perm('stock-movement.read'), c.getStockMovements);

module.exports = router;
