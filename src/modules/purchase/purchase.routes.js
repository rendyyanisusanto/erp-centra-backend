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

// Purchase Orders
router.get('/', perm('purchase.read'), c.getPurchases);
router.get('/:id', perm('purchase.read'), c.getPurchaseById);
router.post('/', perm('purchase.create'), c.createPurchase);

// Goods Receipts
router.get('/goods-receipts/list', perm('goods-receipt.read'), c.getGoodsReceipts);
router.get('/goods-receipts/:id', perm('goods-receipt.read'), c.getGoodsReceiptById);
router.post('/goods-receipts', perm('goods-receipt.create'), c.createGoodsReceipt);

// Purchase Payments
router.get('/payments/list', perm('purchase-payment.read'), c.getPurchasePayments);
router.post('/payments', perm('purchase-payment.create'), c.createPurchasePayment);

module.exports = router;
