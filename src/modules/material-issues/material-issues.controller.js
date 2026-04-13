const materialIssueService = require('./material-issues.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

exports.getMaterialIssues = handler(req => materialIssueService.getMaterialIssues(req.query));
exports.getMaterialIssueById = handler(req => materialIssueService.getMaterialIssueById(req.params.id));
exports.createMaterialIssue = handler(req => materialIssueService.createMaterialIssue(req.body, req.user.id));
exports.updateMaterialIssue = handler(req => materialIssueService.updateMaterialIssue(req.params.id, req.body));
exports.deleteMaterialIssue = handler(req => materialIssueService.deleteMaterialIssue(req.params.id));
exports.approveMaterialIssue = handler(req => materialIssueService.approveMaterialIssue(req.params.id, req.user.id));
exports.cancelMaterialIssue = handler(req => materialIssueService.cancelMaterialIssue(req.params.id));
