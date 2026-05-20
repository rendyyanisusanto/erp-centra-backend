const express = require('express');
const router = express.Router();
const c = require('./master.controller');
const authenticate = require('../../middlewares/auth');
const perm = require('../../middlewares/permission');

router.use(authenticate);

// Roles
router.get('/roles', perm('role.read'), c.getRoles);
router.post('/roles', perm('role.create'), c.createRole);
router.put('/roles/:id', perm('role.create'), c.updateRole);
router.delete('/roles/:id', perm('role.create'), c.deleteRole);

// Permissions
router.get('/permissions', perm('role.read'), c.getPermissions);
router.post('/permissions', perm('role.create'), c.createPermission);

// Users
router.get('/users', perm('user.read'), c.getUsers);
router.post('/users', perm('user.create'), c.createUser);
router.put('/users/:id', perm('user.create'), c.updateUser);
router.delete('/users/:id', perm('user.create'), c.deleteUser);

// Units
router.get('/units', perm('unit.read'), c.getUnits);
router.get('/item-unit-conversions', perm('unit.read'), c.getItemUnitConversions);
router.post('/units', perm('unit.create'), c.createUnit);
router.put('/units/:id', perm('unit.create'), c.updateUnit);
router.delete('/units/:id', perm('unit.create'), c.deleteUnit);

// Products
router.get('/products', perm('product.read'), c.getProducts);
router.post('/products', perm('product.create'), c.createProduct);
router.put('/products/:id', perm('product.create'), c.updateProduct);
router.delete('/products/:id', perm('product.create'), c.deleteProduct);

// Raw Materials
router.get('/raw-materials', perm('raw-material.read'), c.getRawMaterials);
router.post('/raw-materials', perm('raw-material.create'), c.createRawMaterial);
router.put('/raw-materials/:id', perm('raw-material.create'), c.updateRawMaterial);
router.delete('/raw-materials/:id', perm('raw-material.create'), c.deleteRawMaterial);

// Suppliers
router.get('/suppliers', perm('supplier.read'), c.getSuppliers);
router.post('/suppliers', perm('supplier.create'), c.createSupplier);
router.put('/suppliers/:id', perm('supplier.create'), c.updateSupplier);
router.delete('/suppliers/:id', perm('supplier.create'), c.deleteSupplier);

// Customers
router.get('/customers', perm('customer.read'), c.getCustomers);
router.post('/customers', perm('customer.create'), c.createCustomer);
router.put('/customers/:id', perm('customer.create'), c.updateCustomer);
router.delete('/customers/:id', perm('customer.create'), c.deleteCustomer);

// Salesmen
router.get('/salesmen', perm('salesman.read'), c.getSalesmen);
router.post('/salesmen', perm('salesman.create'), c.createSalesman);
router.put('/salesmen/:id', perm('salesman.create'), c.updateSalesman);
router.delete('/salesmen/:id', perm('salesman.create'), c.deleteSalesman);

// Positions
router.get('/positions/options', perm('position.read'), c.getPositionOptions);
router.get('/positions', perm('position.read'), c.getPositions);
router.get('/positions/:id', perm('position.read'), c.getPositionById);
router.post('/positions', perm('position.create'), c.createPosition);
router.put('/positions/:id', perm('position.create'), c.updatePosition);
router.delete('/positions/:id', perm('position.create'), c.deletePosition);

// Employees
router.get('/employees', perm('employee.read'), c.getEmployees);
router.get('/employees/:id', perm('employee.read'), c.getEmployeeById);
router.post('/employees', perm('employee.create'), c.createEmployee);
router.put('/employees/:id', perm('employee.create'), c.updateEmployee);
router.delete('/employees/:id', perm('employee.create'), c.deleteEmployee);

// Chart of Accounts
router.get('/coa', perm('coa.read'), c.getCOA);
router.post('/coa', perm('coa.create'), c.createCOA);
router.put('/coa/:id', perm('coa.create'), c.updateCOA);
router.delete('/coa/:id', perm('coa.create'), c.deleteCOA);

module.exports = router;
