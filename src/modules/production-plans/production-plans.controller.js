const service = require('./production-plans.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

exports.getProductionPlans = handler(req => service.getProductionPlans(req.query));
exports.getApprovedPlanDetailOptions = handler(req => service.getApprovedPlanDetailOptions(req.query));
exports.getProductionPlanById = handler(req => service.getProductionPlanById(req.params.id));
exports.createProductionPlan = handler(req => service.createProductionPlan(req.body, req.user.id));
exports.updateProductionPlan = handler(req => service.updateProductionPlan(req.params.id, req.body));
exports.deleteProductionPlan = handler(req => service.deleteProductionPlan(req.params.id));
exports.approveProductionPlan = handler(req => service.approveProductionPlan(req.params.id, req.user.id));
exports.cancelProductionPlan = handler(req => service.cancelProductionPlan(req.params.id));
