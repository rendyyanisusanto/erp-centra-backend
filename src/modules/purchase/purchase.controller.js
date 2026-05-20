const purchaseService = require('./purchase.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req, res);
        if (!res.headersSent) res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

// Purchase Request
exports.getPurchaseRequests = handler(req => purchaseService.getPurchaseRequests(req.query));
exports.getPurchaseRequestById = handler(req => purchaseService.getPurchaseRequestById(req.params.id));
exports.createPurchaseRequest = handler(req => purchaseService.createPurchaseRequest(req.body, req.user.id));
exports.updatePurchaseRequestStatus = handler(req => purchaseService.updatePurchaseRequestStatus(req.params.id, req.body.status));
exports.convertPurchaseRequestToPurchase = handler(req => purchaseService.convertPurchaseRequestToPurchase(req.params.id, req.body, req.user.id));

// Purchase Order
exports.getPurchases = handler(req => purchaseService.getPurchases(req.query));
exports.getPurchaseById = handler(req => purchaseService.getPurchaseById(req.params.id));
exports.createPurchase = handler(req => purchaseService.createPurchase(req.body, req.user.id));
exports.updatePurchase = handler(req => purchaseService.updatePurchase(req.params.id, req.body));
exports.deletePurchase = handler(req => purchaseService.deletePurchase(req.params.id));
exports.approvePurchase = handler(req => purchaseService.approvePurchase(req.params.id, req.user.id));
exports.cancelPurchase = handler(req => purchaseService.cancelPurchase(req.params.id, req.user.id, req.body?.cancel_reason));

// Goods Receipt
exports.getGoodsReceipts = handler(req => purchaseService.getGoodsReceipts(req.query));
exports.getGoodsReceiptById = handler(req => purchaseService.getGoodsReceiptById(req.params.id));
exports.createGoodsReceipt = handler(req => purchaseService.createGoodsReceipt(req.body, req.user.id));
exports.updateGoodsReceipt = handler(req => purchaseService.updateGoodsReceipt(req.params.id, req.body));
exports.deleteGoodsReceipt = handler(req => purchaseService.deleteGoodsReceipt(req.params.id));
exports.approveGoodsReceipt = handler(req => purchaseService.approveGoodsReceipt(req.params.id, req.user.id));
exports.cancelGoodsReceipt = handler(req => purchaseService.cancelGoodsReceipt(req.params.id, req.user.id, req.body?.cancel_reason));

// Purchase Payment
exports.getPurchasePayments = handler(req => purchaseService.getPurchasePayments(req.query));
exports.getPurchasePaymentById = handler(req => purchaseService.getPurchasePaymentById(req.params.id));
exports.createPurchasePayment = handler(req => purchaseService.createPurchasePayment(req.body, req.user.id));
exports.updatePurchasePayment = handler(req => purchaseService.updatePurchasePayment(req.params.id, req.body, req.user.id));
exports.deletePurchasePayment = handler(req => purchaseService.deletePurchasePayment(req.params.id));
exports.getOutstandingPurchasesBySupplier = handler(req => purchaseService.getOutstandingPurchasesBySupplier(req.params.supplier_id || req.query.supplier_id));
exports.approvePurchasePayment = handler(req => purchaseService.approvePurchasePayment(req.params.id, req.user.id));
exports.cancelPurchasePayment = handler(req => purchaseService.cancelPurchasePayment(req.params.id, req.user.id, req.body?.cancel_reason));
