const express = require('express');
const router = express.Router();
const c = require('./sales.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

router.get('/', perm('sales.read'), c.getSales);
router.get('/payments', perm('sales.read'), c.getSalePayments);
router.get('/payments/customer/:customer_id/outstanding', perm('sales.read'), c.getOutstandingSalesByCustomer);
router.get('/payments/:id', perm('sales.read'), c.getSalePaymentById);
router.put('/payments/:id', perm('sales.create'), c.updateSalePayment);
router.delete('/payments/:id', perm('sales.create'), c.deleteSalePayment);
router.get('/:id/print', perm('sales.read'), c.getSalePrintData);
router.get('/:id/payments', perm('sales.read'), c.getSalePaymentsBySaleId);
router.get('/:id', perm('sales.read'), c.getSaleById);
router.post('/', perm('sales.create'), c.createSale);
router.put('/:id', perm('sales.create'), c.updateSale);
router.post('/:id/approve', perm('sales.create'), c.approveSale);
router.post('/:id/cancel', perm('sales.create'), c.cancelSale);
router.post('/payments', perm('sales.create'), c.createSalePayment);
router.post('/payments/:id/approve', perm('sales.create'), c.approveSalePayment);
router.post('/payments/:id/cancel', perm('sales.create'), c.cancelSalePayment);

module.exports = router;
