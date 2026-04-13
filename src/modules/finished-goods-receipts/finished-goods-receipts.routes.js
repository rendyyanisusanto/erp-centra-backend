const express = require('express');
const router = express.Router();
const c = require('./finished-goods-receipts.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

router.get('/', perm('finished-goods-receipt.read'), c.getFinishedGoodsReceipts);
router.get('/source-options', perm('finished-goods-receipt.read'), c.getSourceOptions);
router.get('/:id', perm('finished-goods-receipt.read'), c.getFinishedGoodsReceiptById);
router.post('/', perm('finished-goods-receipt.create'), c.createFinishedGoodsReceipt);
router.put('/:id', perm('finished-goods-receipt.create'), c.updateFinishedGoodsReceipt);
router.delete('/:id', perm('finished-goods-receipt.create'), c.deleteFinishedGoodsReceipt);
router.post('/:id/approve', perm('finished-goods-receipt.approve'), c.approveFinishedGoodsReceipt);
router.post('/:id/cancel', perm('finished-goods-receipt.approve'), c.cancelFinishedGoodsReceipt);

module.exports = router;
