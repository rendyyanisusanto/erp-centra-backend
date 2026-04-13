const express = require('express');
const router = express.Router();
const c = require('./material-issues.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

router.get('/', perm('material-issue.read'), c.getMaterialIssues);
router.get('/:id', perm('material-issue.read'), c.getMaterialIssueById);
router.post('/', perm('material-issue.create'), c.createMaterialIssue);
router.put('/:id', perm('material-issue.create'), c.updateMaterialIssue);
router.delete('/:id', perm('material-issue.create'), c.deleteMaterialIssue);
router.post('/:id/approve', perm('material-issue.approve'), c.approveMaterialIssue);
router.post('/:id/cancel', perm('material-issue.approve'), c.cancelMaterialIssue);

module.exports = router;
