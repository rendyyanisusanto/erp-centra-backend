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
exports.getStockOpnameReport = handler(req => reportsService.getStockOpnameReport(req.query));
exports.getPurchaseOrderRecap = handler(req => reportsService.getPurchaseOrderRecap(req.query));
exports.getSupplierPayableStatement = handler(req => reportsService.getSupplierPayableStatement(req.query));
exports.getFinishedGoodsStockOpnameReport = handler(req => reportsService.getFinishedGoodsStockOpnameReport(req.query));
exports.getFinishedGoodsMonthlyStock = handler(req => reportsService.getFinishedGoodsMonthlyStock(req.query));
exports.getMaterialIssueMonthlyReport = handler(req => reportsService.getMaterialIssueMonthlyReport(req.query));
exports.getMaterialIssuePrintById = handler(req => reportsService.getMaterialIssuePrintById(req.params.id));
exports.getProductionReport = handler(req => reportsService.getProductionReport(req.query));
