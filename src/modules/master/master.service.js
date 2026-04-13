const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Role, Permission, RolePermission, User, Unit, Product, RawMaterial, Supplier, Customer, ChartOfAccount, StockMovement } = require('../../models');

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 15);
    return { offset: (p - 1) * l, limit: l };
};

const searchWhere = (search, fields) => {
    if (!search) return {};
    return { [Op.or]: fields.map(f => ({ [f]: { [Op.like]: `%${search}%` } })) };
};

// ====== ROLES ======
const getRoles = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name']);
    const { count, rows } = await Role.findAndCountAll({ where, offset, limit: l, include: [{ model: Permission, as: 'permissions' }] });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createRole = async ({ name }) => {
    if (!name) throw { status: 400, message: 'Role name is required.' };
    return await Role.create({ name });
};

const updateRole = async (id, { name, permissionIds }) => {
    const role = await Role.findByPk(id);
    if (!role) throw { status: 404, message: 'Role not found.' };
    if (name) role.name = name;
    await role.save();
    if (permissionIds !== undefined) {
        await RolePermission.destroy({ where: { role_id: id } });
        if (permissionIds.length > 0) {
            const rows = permissionIds.map(pid => ({ role_id: id, permission_id: pid }));
            await RolePermission.bulkCreate(rows);
        }
    }
    return role;
};

const deleteRole = async (id) => {
    const role = await Role.findByPk(id);
    if (!role) throw { status: 404, message: 'Role not found.' };
    await role.destroy();
};

// ====== PERMISSIONS ======
const getPermissions = async () => {
    return await Permission.findAll({ order: [['module', 'ASC'], ['name', 'ASC']] });
};

const createPermission = async ({ name, module: mod }) => {
    if (!name || !mod) throw { status: 400, message: 'Name and module are required.' };
    return await Permission.create({ name, module: mod });
};

// ====== USERS ======
const getUsers = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name', 'email']);
    const { count, rows } = await User.findAndCountAll({
        where,
        offset,
        limit: l,
        include: [{ model: Role, as: 'role' }],
        attributes: { exclude: ['password'] },
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createUser = async ({ name, email, password, role_id }) => {
    if (!name || !email || !password) throw { status: 400, message: 'Name, email and password are required.' };
    const exists = await User.findOne({ where: { email } });
    if (exists) throw { status: 409, message: 'Email already in use.' };
    const hashed = await bcrypt.hash(password, 12);
    return await User.create({ name, email, password: hashed, role_id });
};

const updateUser = async (id, { name, email, password, role_id, is_active }) => {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: 'User not found.' };
    if (name) user.name = name;
    if (email) user.email = email;
    if (role_id !== undefined) user.role_id = role_id;
    if (is_active !== undefined) user.is_active = is_active;
    if (password) user.password = await bcrypt.hash(password, 12);
    await user.save();
    return user;
};

const deleteUser = async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: 'User not found.' };
    await user.destroy();
};

// ====== UNITS ======
const getUnits = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name']);
    const { count, rows } = await Unit.findAndCountAll({ where, offset, limit: l });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createUnit = async ({ name }) => {
    if (!name) throw { status: 400, message: 'Unit name is required.' };
    return await Unit.create({ name });
};

const updateUnit = async (id, { name }) => {
    const unit = await Unit.findByPk(id);
    if (!unit) throw { status: 404, message: 'Unit not found.' };
    unit.name = name;
    await unit.save();
    return unit;
};

const deleteUnit = async (id) => {
    const unit = await Unit.findByPk(id);
    if (!unit) throw { status: 404, message: 'Unit not found.' };
    await unit.destroy();
};

// ====== PRODUCTS ======
const getProducts = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name']);
    const { count, rows } = await Product.findAndCountAll({ where, offset, limit: l, include: [{ model: Unit, as: 'unit' }] });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createProduct = async ({ name, unit_id, stock, min_stock }) => {
    if (!name) throw { status: 400, message: 'Product name is required.' };
    return await Product.create({ name, unit_id, stock: stock || 0, min_stock: min_stock || 0 });
};

const updateProduct = async (id, { name, unit_id, min_stock }) => {
    const product = await Product.findByPk(id);
    if (!product) throw { status: 404, message: 'Product not found.' };
    if (name) product.name = name;
    if (unit_id !== undefined) product.unit_id = unit_id;
    if (min_stock !== undefined) product.min_stock = min_stock;
    await product.save();
    return product;
};

const deleteProduct = async (id) => {
    const product = await Product.findByPk(id);
    if (!product) throw { status: 404, message: 'Product not found.' };
    await product.destroy();
};

// ====== RAW MATERIALS ======
const getRawMaterials = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name']);
    const { count, rows } = await RawMaterial.findAndCountAll({ where, offset, limit: l, include: [{ model: Unit, as: 'unit' }] });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createRawMaterial = async ({ name, unit_id, stock, min_stock }) => {
    if (!name) throw { status: 400, message: 'Raw material name is required.' };
    const rm = await RawMaterial.create({ name, unit_id, stock: stock || 0, min_stock: min_stock || 0 });

    // Record OPENING_BALANCE stock movement if initial stock > 0
    if (Number(stock) > 0) {
        await StockMovement.create({
            item_type: 'RAW_MATERIAL',
            item_id: rm.id,
            transaction_date: new Date(),
            reference_type: 'OPENING_BALANCE',
            reference_id: rm.id,
            qty_in: Number(stock),
            qty_out: 0,
            note: `Opening balance for ${name}`,
        });
    }

    return rm;
};

const updateRawMaterial = async (id, { name, unit_id, min_stock }) => {
    const rm = await RawMaterial.findByPk(id);
    if (!rm) throw { status: 404, message: 'Raw material not found.' };
    if (name) rm.name = name;
    if (unit_id !== undefined) rm.unit_id = unit_id;
    if (min_stock !== undefined) rm.min_stock = min_stock;
    await rm.save();
    return rm;
};

const deleteRawMaterial = async (id) => {
    const rm = await RawMaterial.findByPk(id);
    if (!rm) throw { status: 404, message: 'Raw material not found.' };
    await rm.destroy();
};

// ====== SUPPLIERS ======
const getSuppliers = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name', 'phone']);
    const { count, rows } = await Supplier.findAndCountAll({ where, offset, limit: l });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createSupplier = async ({ name, phone, address }) => {
    if (!name) throw { status: 400, message: 'Supplier name is required.' };
    return await Supplier.create({ name, phone, address });
};

const updateSupplier = async (id, data) => {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) throw { status: 404, message: 'Supplier not found.' };
    Object.assign(supplier, data);
    await supplier.save();
    return supplier;
};

const deleteSupplier = async (id) => {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) throw { status: 404, message: 'Supplier not found.' };
    await supplier.destroy();
};

// ====== CUSTOMERS ======
const getCustomers = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name', 'phone']);
    const { count, rows } = await Customer.findAndCountAll({ where, offset, limit: l });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createCustomer = async ({ name, phone, address }) => {
    if (!name) throw { status: 400, message: 'Customer name is required.' };
    return await Customer.create({ name, phone, address });
};

const updateCustomer = async (id, data) => {
    const customer = await Customer.findByPk(id);
    if (!customer) throw { status: 404, message: 'Customer not found.' };
    Object.assign(customer, data);
    await customer.save();
    return customer;
};

const deleteCustomer = async (id) => {
    const customer = await Customer.findByPk(id);
    if (!customer) throw { status: 404, message: 'Customer not found.' };
    await customer.destroy();
};

// ====== CHART OF ACCOUNTS ======
const getCOA = async ({ page, limit, search, type }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (type) where.type = type;
    const { count, rows } = await ChartOfAccount.findAndCountAll({ where, offset, limit: l, order: [['code', 'ASC']] });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createCOA = async ({ code, name, type }) => {
    if (!code || !name || !type) throw { status: 400, message: 'Code, name and type are required.' };
    return await ChartOfAccount.create({ code, name, type });
};

const updateCOA = async (id, { code, name, type }) => {
    const coa = await ChartOfAccount.findByPk(id);
    if (!coa) throw { status: 404, message: 'Account not found.' };
    if (code) coa.code = code;
    if (name) coa.name = name;
    if (type) coa.type = type;
    await coa.save();
    return coa;
};

const deleteCOA = async (id) => {
    const coa = await ChartOfAccount.findByPk(id);
    if (!coa) throw { status: 404, message: 'Account not found.' };
    await coa.destroy();
};

module.exports = {
    getRoles, createRole, updateRole, deleteRole,
    getPermissions, createPermission,
    getUsers, createUser, updateUser, deleteUser,
    getUnits, createUnit, updateUnit, deleteUnit,
    getProducts, createProduct, updateProduct, deleteProduct,
    getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial,
    getSuppliers, createSupplier, updateSupplier, deleteSupplier,
    getCustomers, createCustomer, updateCustomer, deleteCustomer,
    getCOA, createCOA, updateCOA, deleteCOA,
};
