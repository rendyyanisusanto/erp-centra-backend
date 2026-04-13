const salesService = require('./sales.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.getSales = handler(req => salesService.getSales(req.query));
exports.getSaleById = handler(req => salesService.getSaleById(req.params.id));
exports.getSalePrintData = handler(req => salesService.getSalePrintData(req.params.id));
exports.getSalePaymentsBySaleId = handler(req => salesService.getSalePaymentsBySaleId(req.params.id));
exports.createSale = handler(req => salesService.createSale(req.body, req.user.id));
exports.getSalePayments = handler(req => salesService.getSalePayments(req.query));
exports.createSalePayment = handler(req => salesService.createSalePayment(req.body, req.user.id));
