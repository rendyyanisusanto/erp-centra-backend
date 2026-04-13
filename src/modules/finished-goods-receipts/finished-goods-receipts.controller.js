const service = require('./finished-goods-receipts.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

exports.getFinishedGoodsReceipts = handler(req => service.getFinishedGoodsReceipts(req.query));
exports.getSourceOptions = handler(req => service.getSourceOptions(req.query));
exports.getFinishedGoodsReceiptById = handler(req => service.getFinishedGoodsReceiptById(req.params.id));
exports.createFinishedGoodsReceipt = handler(req => service.createFinishedGoodsReceipt(req.body, req.user.id));
exports.updateFinishedGoodsReceipt = handler(req => service.updateFinishedGoodsReceipt(req.params.id, req.body));
exports.deleteFinishedGoodsReceipt = handler(req => service.deleteFinishedGoodsReceipt(req.params.id));
exports.approveFinishedGoodsReceipt = handler(req => service.approveFinishedGoodsReceipt(req.params.id, req.user.id));
exports.cancelFinishedGoodsReceipt = handler(req => service.cancelFinishedGoodsReceipt(req.params.id));
