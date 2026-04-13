const express = require('express');
const router = express.Router();
const c = require('./finance.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

// Cash Transactions
router.get('/cash', perm('journal.read'), c.getCashTransactions);
router.post('/cash', perm('journal.create'), c.createCashTransaction);

// Journal
router.get('/journals', perm('journal.read'), c.getJournals);
router.get('/journals/:id', perm('journal.read'), c.getJournalById);
router.post('/journals', perm('journal.create'), c.createManualJournal);

module.exports = router;
