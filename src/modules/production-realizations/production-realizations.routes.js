const express = require('express');
const router = express.Router();
const c = require('./production-realizations.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

router.get('/', perm('production-realization.read'), c.getProductionRealizations);
router.get('/:id', perm('production-realization.read'), c.getProductionRealizationById);
router.put('/:id', perm('production-realization.update'), c.updateProductionRealization);

module.exports = router;
