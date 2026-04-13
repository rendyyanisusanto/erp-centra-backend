const express = require('express');
const router = express.Router();
const c = require('./reports.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);
router.use(perm('report.view'));

router.get('/profit-loss', c.getProfitLoss);
router.get('/payables', c.getPayableReport);
router.get('/receivables', c.getReceivableReport);
router.get('/ledger', c.getGeneralLedger);
router.get('/raw-material-stock-card', c.getRawMaterialStockCard);

module.exports = router;
