const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');
const purchaseController = require('../purchase/purchase.controller');
const salesController = require('../sales/sales.controller');

router.use(authenticate);

// Purchase payments aliases
router.get('/purchase-payments', perm('purchase-payment.read'), purchaseController.getPurchasePayments);
router.get('/purchase-payments/:id', perm('purchase-payment.read'), purchaseController.getPurchasePaymentById);
router.post('/purchase-payments', perm('purchase-payment.create'), purchaseController.createPurchasePayment);
router.put('/purchase-payments/:id', perm('purchase-payment.create'), purchaseController.updatePurchasePayment);
router.delete('/purchase-payments/:id', perm('purchase-payment.create'), purchaseController.deletePurchasePayment);
router.post('/purchase-payments/:id/approve', perm('purchase-payment.create'), purchaseController.approvePurchasePayment);
router.post('/purchase-payments/:id/cancel', perm('purchase-payment.create'), purchaseController.cancelPurchasePayment);
router.get('/purchase-payments/supplier/:supplier_id/outstanding', perm('purchase-payment.read'), purchaseController.getOutstandingPurchasesBySupplier);
router.get('/purchases/outstanding', perm('purchase-payment.read'), purchaseController.getOutstandingPurchasesBySupplier);

// Sale payments aliases
router.get('/sale-payments', perm('sales.read'), salesController.getSalePayments);
router.get('/sale-payments/:id', perm('sales.read'), salesController.getSalePaymentById);
router.post('/sale-payments', perm('sales.create'), salesController.createSalePayment);
router.put('/sale-payments/:id', perm('sales.create'), salesController.updateSalePayment);
router.delete('/sale-payments/:id', perm('sales.create'), salesController.deleteSalePayment);
router.post('/sale-payments/:id/approve', perm('sales.create'), salesController.approveSalePayment);
router.post('/sale-payments/:id/cancel', perm('sales.create'), salesController.cancelSalePayment);
router.get('/sale-payments/customer/:customer_id/outstanding', perm('sales.read'), salesController.getOutstandingSalesByCustomer);
router.get('/sales/outstanding', perm('sales.read'), salesController.getOutstandingSalesByCustomer);

module.exports = router;
