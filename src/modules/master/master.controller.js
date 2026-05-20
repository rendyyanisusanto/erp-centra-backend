const masterService = require('./master.service');

const handler = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req, res);
        if (!res.headersSent) res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

// ROLES
exports.getRoles = handler(req => masterService.getRoles(req.query));
exports.createRole = handler(req => masterService.createRole(req.body));
exports.updateRole = handler(req => masterService.updateRole(req.params.id, req.body));
exports.deleteRole = handler(req => masterService.deleteRole(req.params.id));

// PERMISSIONS
exports.getPermissions = handler(req => masterService.getPermissions());
exports.createPermission = handler(req => masterService.createPermission(req.body));

// USERS
exports.getUsers = handler(req => masterService.getUsers(req.query));
exports.createUser = handler(req => masterService.createUser(req.body));
exports.updateUser = handler(req => masterService.updateUser(req.params.id, req.body));
exports.deleteUser = handler(req => masterService.deleteUser(req.params.id));

// UNITS
exports.getUnits = handler(req => masterService.getUnits(req.query));
exports.getItemUnitConversions = handler(req => masterService.getItemUnitConversions(req.query));
exports.createUnit = handler(req => masterService.createUnit(req.body));
exports.updateUnit = handler(req => masterService.updateUnit(req.params.id, req.body));
exports.deleteUnit = handler(req => masterService.deleteUnit(req.params.id));

// PRODUCTS
exports.getProducts = handler(req => masterService.getProducts(req.query));
exports.createProduct = handler(req => masterService.createProduct(req.body));
exports.updateProduct = handler(req => masterService.updateProduct(req.params.id, req.body));
exports.deleteProduct = handler(req => masterService.deleteProduct(req.params.id));

// RAW MATERIALS
exports.getRawMaterials = handler(req => masterService.getRawMaterials(req.query));
exports.createRawMaterial = handler(req => masterService.createRawMaterial(req.body));
exports.updateRawMaterial = handler(req => masterService.updateRawMaterial(req.params.id, req.body));
exports.deleteRawMaterial = handler(req => masterService.deleteRawMaterial(req.params.id));

// SUPPLIERS
exports.getSuppliers = handler(req => masterService.getSuppliers(req.query));
exports.createSupplier = handler(req => masterService.createSupplier(req.body));
exports.updateSupplier = handler(req => masterService.updateSupplier(req.params.id, req.body));
exports.deleteSupplier = handler(req => masterService.deleteSupplier(req.params.id));

// CUSTOMERS
exports.getCustomers = handler(req => masterService.getCustomers(req.query));
exports.createCustomer = handler(req => masterService.createCustomer(req.body));
exports.updateCustomer = handler(req => masterService.updateCustomer(req.params.id, req.body));
exports.deleteCustomer = handler(req => masterService.deleteCustomer(req.params.id));

// SALESMEN
exports.getSalesmen = handler(req => masterService.getSalesmen(req.query));
exports.createSalesman = handler(req => masterService.createSalesman(req.body));
exports.updateSalesman = handler(req => masterService.updateSalesman(req.params.id, req.body));
exports.deleteSalesman = handler(req => masterService.deleteSalesman(req.params.id));

// POSITIONS
exports.getPositionOptions = handler(req => masterService.getPositionOptions(req.query));
exports.getPositions = handler(req => masterService.getPositions(req.query));
exports.getPositionById = handler(req => masterService.getPositionById(req.params.id));
exports.createPosition = handler(req => masterService.createPosition(req.body));
exports.updatePosition = handler(req => masterService.updatePosition(req.params.id, req.body));
exports.deletePosition = handler(req => masterService.deletePosition(req.params.id));

// EMPLOYEES
exports.getEmployees = handler(req => masterService.getEmployees(req.query));
exports.getEmployeeById = handler(req => masterService.getEmployeeById(req.params.id));
exports.createEmployee = handler(req => masterService.createEmployee(req.body));
exports.updateEmployee = handler(req => masterService.updateEmployee(req.params.id, req.body));
exports.deleteEmployee = handler(req => masterService.deleteEmployee(req.params.id));

// COA
exports.getCOA = handler(req => masterService.getCOA(req.query));
exports.createCOA = handler(req => masterService.createCOA(req.body));
exports.updateCOA = handler(req => masterService.updateCOA(req.params.id, req.body));
exports.deleteCOA = handler(req => masterService.deleteCOA(req.params.id));
