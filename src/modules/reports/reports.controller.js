const reportsService = require('./reports.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.getProfitLoss = handler(req => reportsService.getProfitLoss(req.query));
exports.getPayableReport = handler(req => reportsService.getPayableReport(req.query));
exports.getReceivableReport = handler(req => reportsService.getReceivableReport(req.query));
exports.getGeneralLedger = handler(req => reportsService.getGeneralLedger(req.query));
exports.getRawMaterialStockCard = handler(req => reportsService.getRawMaterialStockCard(req.query));
