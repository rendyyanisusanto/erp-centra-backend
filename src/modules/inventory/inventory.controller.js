const inventoryService = require('./inventory.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.getAdjustments = handler(req => inventoryService.getAdjustments(req.query));
exports.getAdjustmentById = handler(req => inventoryService.getAdjustmentById(req.params.id));
exports.createAdjustment = handler(req => inventoryService.createAdjustment(req.body, req.user.id));
exports.deleteAdjustment = handler(req => inventoryService.deleteAdjustment(req.params.id));
exports.getStockMovements = handler(req => inventoryService.getStockMovements(req.query));
