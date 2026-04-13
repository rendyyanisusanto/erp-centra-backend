const service = require('./production-realizations.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

exports.getProductionRealizations = handler(req => service.getProductionRealizations(req.query));
exports.getProductionRealizationById = handler(req => service.getProductionRealizationById(req.params.id));
exports.updateProductionRealization = handler(req => service.updateProductionRealization(req.params.id, req.body));
