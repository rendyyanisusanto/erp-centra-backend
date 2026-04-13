const express = require('express');
const router = express.Router();
const c = require('./sales.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

router.get('/', perm('sales.read'), c.getSales);
router.get('/payments', perm('sales.read'), c.getSalePayments);
router.get('/:id', perm('sales.read'), c.getSaleById);
router.post('/', perm('sales.create'), c.createSale);
router.post('/payments', perm('sales.create'), c.createSalePayment);

module.exports = router;
