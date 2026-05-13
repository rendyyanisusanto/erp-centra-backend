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
exports.getSalePaymentById = handler(req => salesService.getSalePaymentById(req.params.id));
exports.createSale = handler(req => salesService.createSale(req.body, req.user.id));
exports.updateSale = handler(req => salesService.updateSale(req.params.id, req.body));
exports.getSalePayments = handler(req => salesService.getSalePayments(req.query));
exports.createSalePayment = handler(req => salesService.createSalePaymentMulti(req.body, req.user.id));
exports.updateSalePayment = handler(req => salesService.updateSalePayment(req.params.id, req.body, req.user.id));
exports.deleteSalePayment = handler(req => salesService.deleteSalePayment(req.params.id));
exports.getOutstandingSalesByCustomer = handler(req => salesService.getOutstandingSalesByCustomer(req.params.customer_id || req.query.customer_id));
exports.approveSalePayment = handler(req => salesService.approveSalePayment(req.params.id, req.user.id));
exports.cancelSalePayment = handler(req => salesService.cancelSalePayment(req.params.id, req.user.id, req.body?.cancel_reason));
exports.approveSale = handler(req => salesService.approveSale(req.params.id, req.user.id));
exports.cancelSale = handler(req => salesService.cancelSale(req.params.id, req.user.id, req.body?.cancel_reason));
