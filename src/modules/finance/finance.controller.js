const financeService = require('./finance.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.getCashTransactions = handler(req => financeService.getCashTransactions(req.query));
exports.createCashTransaction = handler(req => financeService.createCashTransaction(req.body, req.user.id));
exports.approveCashTransaction = handler(req => financeService.approveCashTransaction(req.params.id, req.user.id));
exports.cancelCashTransaction = handler(req => financeService.cancelCashTransaction(req.params.id, req.user.id, req.body?.cancel_reason));
exports.getJournals = handler(req => financeService.getJournals(req.query));
exports.getJournalById = handler(req => financeService.getJournalById(req.params.id));
exports.createManualJournal = handler(req => financeService.createManualJournal(req.body, req.user.id));
