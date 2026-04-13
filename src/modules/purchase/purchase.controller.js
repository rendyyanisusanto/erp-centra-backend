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

// Purchase Order
exports.getPurchases = handler(req => purchaseService.getPurchases(req.query));
exports.getPurchaseById = handler(req => purchaseService.getPurchaseById(req.params.id));
exports.createPurchase = handler(req => purchaseService.createPurchase(req.body, req.user.id));

// Goods Receipt
exports.getGoodsReceipts = handler(req => purchaseService.getGoodsReceipts(req.query));
exports.getGoodsReceiptById = handler(req => purchaseService.getGoodsReceiptById(req.params.id));
exports.createGoodsReceipt = handler(req => purchaseService.createGoodsReceipt(req.body, req.user.id));

// Purchase Payment
exports.getPurchasePayments = handler(req => purchaseService.getPurchasePayments(req.query));
exports.createPurchasePayment = handler(req => purchaseService.createPurchasePayment(req.body, req.user.id));
