const express = require('express');
const router = express.Router();
const c = require('./inventory.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

// Stock Adjustments
router.get('/adjustments', perm('master.read'), c.getAdjustments);
router.get('/adjustments/:id', perm('master.read'), c.getAdjustmentById);
router.post('/adjustments', perm('master.create'), c.createAdjustment);
router.delete('/adjustments/:id', perm('master.create'), c.deleteAdjustment);

// Stock Movements
router.get('/stock-movements', perm('master.read'), c.getStockMovements);

module.exports = router;
