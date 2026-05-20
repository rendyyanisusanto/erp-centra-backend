const express = require('express');
const router = express.Router();
const c = require('./purchase.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

// Purchase Requests
router.get('/requests', perm('purchase.read'), c.getPurchaseRequests);
router.get('/requests/:id', perm('purchase.read'), c.getPurchaseRequestById);
router.post('/requests', perm('purchase.create'), c.createPurchaseRequest);
router.patch('/requests/:id/status', perm('purchase.approve'), c.updatePurchaseRequestStatus);
router.post('/requests/:id/convert-to-purchase', perm('purchase.create'), c.convertPurchaseRequestToPurchase);

// Purchase Orders
router.get('/', perm('purchase.read'), c.getPurchases);
router.get('/:id', perm('purchase.read'), c.getPurchaseById);
router.post('/', perm('purchase.create'), c.createPurchase);
router.put('/:id', perm('purchase.create'), c.updatePurchase);
router.delete('/:id', perm('purchase.create'), c.deletePurchase);
router.post('/:id/approve', perm('purchase.approve'), c.approvePurchase);
router.post('/:id/cancel', perm('purchase.approve'), c.cancelPurchase);

// Goods Receipts
router.get('/goods-receipts/list', perm('goods-receipt.read'), c.getGoodsReceipts);
router.get('/goods-receipts/:id', perm('goods-receipt.read'), c.getGoodsReceiptById);
router.post('/goods-receipts', perm('goods-receipt.create'), c.createGoodsReceipt);
router.put('/goods-receipts/:id', perm('goods-receipt.create'), c.updateGoodsReceipt);
router.delete('/goods-receipts/:id', perm('goods-receipt.create'), c.deleteGoodsReceipt);
router.post('/goods-receipts/:id/approve', perm('goods-receipt.create'), c.approveGoodsReceipt);
router.post('/goods-receipts/:id/cancel', perm('goods-receipt.create'), c.cancelGoodsReceipt);

// Purchase Payments
router.get('/payments/list', perm('purchase-payment.read'), c.getPurchasePayments);
router.post('/payments', perm('purchase-payment.create'), c.createPurchasePayment);
router.get('/payments/supplier/:supplier_id/outstanding', perm('purchase-payment.read'), c.getOutstandingPurchasesBySupplier);
router.get('/payments/:id', perm('purchase-payment.read'), c.getPurchasePaymentById);
router.put('/payments/:id', perm('purchase-payment.create'), c.updatePurchasePayment);
router.delete('/payments/:id', perm('purchase-payment.create'), c.deletePurchasePayment);
router.post('/payments/:id/approve', perm('purchase-payment.create'), c.approvePurchasePayment);
router.post('/payments/:id/cancel', perm('purchase-payment.create'), c.cancelPurchasePayment);

module.exports = router;
