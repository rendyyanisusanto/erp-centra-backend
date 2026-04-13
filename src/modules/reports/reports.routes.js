const express = require('express');
const router = express.Router();
const c = require('./reports.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

router.get('/profit-loss', perm('report.profit-loss'), c.getProfitLoss);
router.get('/payables', perm('report.payables'), c.getPayableReport);
router.get('/receivables', perm('report.receivables'), c.getReceivableReport);
router.get('/ledger', perm('report.ledger'), c.getGeneralLedger);
router.get('/raw-material-stock-card', perm('report.raw-material-stock-card'), c.getRawMaterialStockCard);
router.get('/stock-opname', perm('report.stock-opname'), c.getStockOpnameReport);
router.get('/purchase-order-recap', perm('report.purchase-order-recap'), c.getPurchaseOrderRecap);
router.get('/supplier-payable-statement', perm('report.supplier-payable-statement'), c.getSupplierPayableStatement);
router.get('/stock-opname-product', perm('report.stock-opname-product'), c.getFinishedGoodsStockOpnameReport);
router.get('/fg-monthly-stock', perm('report.fg-monthly-stock'), c.getFinishedGoodsMonthlyStock);
router.get('/material-issues/monthly', perm('report.material-issues'), c.getMaterialIssueMonthlyReport);
router.get('/material-issues/:id/print', perm('report.material-issues'), c.getMaterialIssuePrintById);
router.get('/production', perm('report.production'), c.getProductionReport);

module.exports = router;
