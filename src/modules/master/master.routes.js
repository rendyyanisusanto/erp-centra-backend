const express = require('express');
const router = express.Router();
const c = require('./master.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

// Roles
router.get('/roles', perm('master.read'), c.getRoles);
router.post('/roles', perm('master.create'), c.createRole);
router.put('/roles/:id', perm('master.create'), c.updateRole);
router.delete('/roles/:id', perm('master.create'), c.deleteRole);

// Permissions
router.get('/permissions', perm('master.read'), c.getPermissions);
router.post('/permissions', perm('master.create'), c.createPermission);

// Users
router.get('/users', perm('master.read'), c.getUsers);
router.post('/users', perm('master.create'), c.createUser);
router.put('/users/:id', perm('master.create'), c.updateUser);
router.delete('/users/:id', perm('master.create'), c.deleteUser);

// Units
router.get('/units', c.getUnits); // all users can list units
router.post('/units', perm('master.create'), c.createUnit);
router.put('/units/:id', perm('master.create'), c.updateUnit);
router.delete('/units/:id', perm('master.create'), c.deleteUnit);

// Products
router.get('/products', c.getProducts);
router.post('/products', perm('master.create'), c.createProduct);
router.put('/products/:id', perm('master.create'), c.updateProduct);
router.delete('/products/:id', perm('master.create'), c.deleteProduct);

// Raw Materials
router.get('/raw-materials', c.getRawMaterials);
router.post('/raw-materials', perm('master.create'), c.createRawMaterial);
router.put('/raw-materials/:id', perm('master.create'), c.updateRawMaterial);
router.delete('/raw-materials/:id', perm('master.create'), c.deleteRawMaterial);

// Suppliers
router.get('/suppliers', c.getSuppliers);
router.post('/suppliers', perm('master.create'), c.createSupplier);
router.put('/suppliers/:id', perm('master.create'), c.updateSupplier);
router.delete('/suppliers/:id', perm('master.create'), c.deleteSupplier);

// Customers
router.get('/customers', c.getCustomers);
router.post('/customers', perm('master.create'), c.createCustomer);
router.put('/customers/:id', perm('master.create'), c.updateCustomer);
router.delete('/customers/:id', perm('master.create'), c.deleteCustomer);

// Chart of Accounts
router.get('/coa', c.getCOA);
router.post('/coa', perm('master.create'), c.createCOA);
router.put('/coa/:id', perm('master.create'), c.updateCOA);
router.delete('/coa/:id', perm('master.create'), c.deleteCOA);

module.exports = router;
