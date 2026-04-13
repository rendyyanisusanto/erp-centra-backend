const express = require('express');
const router = express.Router();
const c = require('./production-plans.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

router.get('/', perm('production-plan.read'), c.getProductionPlans);
router.get('/approved-details/options', perm('production-plan.read'), c.getApprovedPlanDetailOptions);
router.get('/:id', perm('production-plan.read'), c.getProductionPlanById);
router.post('/', perm('production-plan.create'), c.createProductionPlan);
router.put('/:id', perm('production-plan.create'), c.updateProductionPlan);
router.delete('/:id', perm('production-plan.create'), c.deleteProductionPlan);
router.post('/:id/approve', perm('production-plan.approve'), c.approveProductionPlan);
router.post('/:id/cancel', perm('production-plan.approve'), c.cancelProductionPlan);

module.exports = router;
