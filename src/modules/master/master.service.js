const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    Role, Permission, RolePermission, User,
    Unit, Product, RawMaterial, ItemUnitConversion, Supplier, Customer, Salesman, Position, Employee,
    ChartOfAccount, StockMovement, Sale,
} = require('../../models');
const { ITEM_TYPES, normalizeItemType } = require('../../utils/unit-conversion');

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 15);
    return { offset: (p - 1) * l, limit: l };
};

const searchWhere = (search, fields) => {
    if (!search) return {};
    return { [Op.or]: fields.map(f => ({ [f]: { [Op.like]: `%${search}%` } })) };
};

const parseBoolean = (value) => ['true', '1', 1, true].includes(value);
const EMPLOYEE_GENDERS = ['MALE', 'FEMALE'];
const EMPLOYEE_STATUSES = ['ACTIVE', 'INACTIVE'];

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
const validateItemConversions = ({ conversions, base_unit_id }) => {
    const baseUnitId = Number(base_unit_id);
    if (!Number.isInteger(baseUnitId) || baseUnitId <= 0) {
        throw { status: 400, message: 'base_unit_id is required.' };
    }
    if (!Array.isArray(conversions) || conversions.length < 1) {
        throw { status: 400, message: 'At least one unit conversion is required.' };
    }
    const seen = new Set();
    let baseCount = 0;
    const rows = conversions.map((c) => {
        const unitId = Number(c.unit_id);
        const conversionQty = Number(c.conversion_qty);
        const isBase = ['true', '1', 1, true].includes(c.is_base) || unitId === baseUnitId;
        if (!Number.isInteger(unitId) || unitId <= 0) throw { status: 400, message: 'conversion unit_id is invalid.' };
        if (!Number.isFinite(conversionQty) || conversionQty <= 0) throw { status: 400, message: 'conversion_qty must be greater than 0.' };
        if (seen.has(unitId)) throw { status: 400, message: 'Duplicate unit conversion in same item.' };
        seen.add(unitId);
        if (isBase) baseCount += 1;
        return { unit_id: unitId, conversion_qty: conversionQty, is_base: isBase };
    });
    if (!rows.some((r) => r.unit_id === baseUnitId)) rows.push({ unit_id: baseUnitId, conversion_qty: 1, is_base: true });
    if (baseCount > 1) throw { status: 400, message: 'is_base must be exactly one unit.' };
    rows.forEach((r) => {
        if (r.unit_id === baseUnitId) {
            r.is_base = true;
            r.conversion_qty = 1;
        } else if (r.is_base) {
            r.is_base = false;
        }
    });
    return rows;
};

const syncItemConversions = async ({ item_type, item_id, conversions, transaction }) => {
    await ItemUnitConversion.destroy({ where: { item_type, item_id }, transaction });
    await ItemUnitConversion.bulkCreate(
        conversions.map((c) => ({ item_type, item_id, unit_id: c.unit_id, conversion_qty: c.conversion_qty, is_base: c.is_base })),
        { transaction }
    );
};

const getProducts = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['name']);
    const { count, rows } = await Product.findAndCountAll({ where, offset, limit: l, include: [{ model: Unit, as: 'unit' }] });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createProduct = async ({ name, base_unit_id, unit_id, stock, min_stock, conversions }) => {
    if (!name) throw { status: 400, message: 'Product name is required.' };
    const resolvedBaseUnitId = base_unit_id || unit_id;
    const normalizedConversions = validateItemConversions({ conversions: conversions || [{ unit_id: resolvedBaseUnitId, conversion_qty: 1, is_base: true }], base_unit_id: resolvedBaseUnitId });
    const t = await sequelize.transaction();
    try {
        const product = await Product.create({ name, base_unit_id: resolvedBaseUnitId, stock: stock || 0, min_stock: min_stock || 0 }, { transaction: t });
        await syncItemConversions({ item_type: ITEM_TYPES.PRODUCT, item_id: product.id, conversions: normalizedConversions, transaction: t });
        await t.commit();
        return product;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const updateProduct = async (id, { name, base_unit_id, unit_id, min_stock, conversions }) => {
    const product = await Product.findByPk(id);
    if (!product) throw { status: 404, message: 'Product not found.' };
    if (name) product.name = name;
    const resolvedBaseUnitId = base_unit_id !== undefined ? base_unit_id : unit_id;
    if (resolvedBaseUnitId !== undefined) product.base_unit_id = resolvedBaseUnitId;
    if (min_stock !== undefined) product.min_stock = min_stock;
    const t = await sequelize.transaction();
    try {
        await product.save({ transaction: t });
        if (conversions !== undefined || resolvedBaseUnitId !== undefined) {
            const normalizedConversions = validateItemConversions({
                conversions: conversions || [{ unit_id: product.base_unit_id, conversion_qty: 1, is_base: true }],
                base_unit_id: resolvedBaseUnitId !== undefined ? resolvedBaseUnitId : product.base_unit_id,
            });
            await syncItemConversions({ item_type: ITEM_TYPES.PRODUCT, item_id: product.id, conversions: normalizedConversions, transaction: t });
        }
        await t.commit();
    } catch (err) {
        await t.rollback();
        throw err;
    }
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

const createRawMaterial = async ({ name, base_unit_id, unit_id, stock, min_stock, conversions }) => {
    if (!name) throw { status: 400, message: 'Raw material name is required.' };
    const resolvedBaseUnitId = base_unit_id || unit_id;
    const normalizedConversions = validateItemConversions({ conversions: conversions || [{ unit_id: resolvedBaseUnitId, conversion_qty: 1, is_base: true }], base_unit_id: resolvedBaseUnitId });
    const t = await sequelize.transaction();
    let rm;
    try {
        rm = await RawMaterial.create({ name, base_unit_id: resolvedBaseUnitId, stock: stock || 0, min_stock: min_stock || 0 }, { transaction: t });
        await syncItemConversions({ item_type: ITEM_TYPES.RAW_MATERIAL, item_id: rm.id, conversions: normalizedConversions, transaction: t });

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
            }, { transaction: t });
        }
        await t.commit();
    } catch (err) {
        await t.rollback();
        throw err;
    }
    return rm;
};

const updateRawMaterial = async (id, { name, base_unit_id, unit_id, min_stock, conversions }) => {
    const rm = await RawMaterial.findByPk(id);
    if (!rm) throw { status: 404, message: 'Raw material not found.' };
    if (name) rm.name = name;
    const resolvedBaseUnitId = base_unit_id !== undefined ? base_unit_id : unit_id;
    if (resolvedBaseUnitId !== undefined) rm.base_unit_id = resolvedBaseUnitId;
    if (min_stock !== undefined) rm.min_stock = min_stock;
    const t = await sequelize.transaction();
    try {
        await rm.save({ transaction: t });
        if (conversions !== undefined || resolvedBaseUnitId !== undefined) {
            const normalizedConversions = validateItemConversions({
                conversions: conversions || [{ unit_id: rm.base_unit_id, conversion_qty: 1, is_base: true }],
                base_unit_id: resolvedBaseUnitId !== undefined ? resolvedBaseUnitId : rm.base_unit_id,
            });
            await syncItemConversions({ item_type: ITEM_TYPES.RAW_MATERIAL, item_id: rm.id, conversions: normalizedConversions, transaction: t });
        }
        await t.commit();
    } catch (err) {
        await t.rollback();
        throw err;
    }
    return rm;
};

const getItemUnitConversions = async ({ item_type, item_id }) => {
    const normalizedType = normalizeItemType(item_type);
    if (!Object.values(ITEM_TYPES).includes(normalizedType)) throw { status: 400, message: 'item_type is invalid.' };
    if (!Number(item_id)) throw { status: 400, message: 'item_id is required.' };
    return ItemUnitConversion.findAll({
        where: { item_type: normalizedType, item_id: Number(item_id) },
        include: [{ model: Unit, as: 'unit' }],
        order: [['is_base', 'DESC'], ['id', 'ASC']],
    });
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

// ====== SALESMEN ======
const getSalesmen = async ({ page, limit, search, is_active }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['code', 'name', 'phone']);
    if (is_active !== undefined && is_active !== '') {
        where.is_active = parseBoolean(is_active);
    }
    const { count, rows } = await Salesman.findAndCountAll({
        where,
        offset,
        limit: l,
        order: [['name', 'ASC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createSalesman = async ({ code, name, phone, address, is_active }) => {
    if (!code || !name) throw { status: 400, message: 'Salesman code and name are required.' };
    const exists = await Salesman.findOne({ where: { code } });
    if (exists) throw { status: 409, message: 'Salesman code already exists.' };
    return await Salesman.create({
        code,
        name,
        phone,
        address,
        is_active: is_active === undefined ? true : parseBoolean(is_active),
    });
};

const updateSalesman = async (id, data) => {
    const salesman = await Salesman.findByPk(id);
    if (!salesman) throw { status: 404, message: 'Salesman not found.' };

    if (data.code && data.code !== salesman.code) {
        const exists = await Salesman.findOne({ where: { code: data.code } });
        if (exists) throw { status: 409, message: 'Salesman code already exists.' };
    }

    if (data.is_active !== undefined) {
        data.is_active = parseBoolean(data.is_active);
    }
    Object.assign(salesman, data);
    await salesman.save();
    return salesman;
};

const deleteSalesman = async (id) => {
    const salesman = await Salesman.findByPk(id);
    if (!salesman) throw { status: 404, message: 'Salesman not found.' };

    const usedInSales = await Sale.findOne({ where: { salesman_id: id }, attributes: ['id'] });
    if (usedInSales) {
        throw { status: 400, message: 'Salesman cannot be deleted because it is already used in sales transactions.' };
    }

    await salesman.destroy();
};

// ====== POSITIONS ======
const getPositionOptions = async ({ search, limit }) => {
    const l = Math.min(500, parseInt(limit) || 200);
    const where = searchWhere(search, ['code', 'name']);
    return await Position.findAll({
        where,
        attributes: ['id', 'code', 'name'],
        order: [['name', 'ASC']],
        limit: l,
    });
};

const getPositions = async ({ page, limit, search }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = searchWhere(search, ['code', 'name']);
    const { count, rows } = await Position.findAndCountAll({
        where,
        offset,
        limit: l,
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getPositionById = async (id) => {
    const position = await Position.findByPk(id);
    if (!position) throw { status: 404, message: 'Position not found.' };
    return position;
};

const createPosition = async ({ code, name, description }) => {
    const normalizedCode = String(code || '').trim();
    const normalizedName = String(name || '').trim();

    if (!normalizedCode) throw { status: 400, message: 'Position code is required.' };
    if (!normalizedName) throw { status: 400, message: 'Position name is required.' };

    const exists = await Position.findOne({ where: { code: normalizedCode } });
    if (exists) throw { status: 409, message: 'Position code already exists.' };

    return await Position.create({
        code: normalizedCode,
        name: normalizedName,
        description: description ? String(description).trim() : null,
    });
};

const updatePosition = async (id, data) => {
    const position = await Position.findByPk(id);
    if (!position) throw { status: 404, message: 'Position not found.' };

    if (data.code !== undefined) {
        const normalizedCode = String(data.code || '').trim();
        if (!normalizedCode) throw { status: 400, message: 'Position code is required.' };
        if (normalizedCode !== position.code) {
            const exists = await Position.findOne({ where: { code: normalizedCode } });
            if (exists) throw { status: 409, message: 'Position code already exists.' };
        }
        position.code = normalizedCode;
    }

    if (data.name !== undefined) {
        const normalizedName = String(data.name || '').trim();
        if (!normalizedName) throw { status: 400, message: 'Position name is required.' };
        position.name = normalizedName;
    }

    if (data.description !== undefined) {
        position.description = data.description ? String(data.description).trim() : null;
    }

    await position.save();
    return position;
};

const deletePosition = async (id) => {
    const position = await Position.findByPk(id);
    if (!position) throw { status: 404, message: 'Position not found.' };

    const usedByEmployee = await Employee.findOne({ where: { position_id: id }, attributes: ['id'] });
    if (usedByEmployee) {
        throw { status: 400, message: 'Position cannot be deleted because it is already used by employees.' };
    }

    await position.destroy();
};

// ====== EMPLOYEES ======
const normalizeEmployeeStatus = (value) => String(value || '').trim().toUpperCase();
const normalizeEmployeeGender = (value) => String(value || '').trim().toUpperCase();

const sanitizeOptionalText = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const normalized = String(value).trim();
    return normalized || null;
};

const sanitizeBasicSalary = (value, { required = false } = {}) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') {
        if (required) throw { status: 400, message: 'Basic salary is invalid.' };
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw { status: 400, message: 'Basic salary must be a number greater than or equal to 0.' };
    }
    return parsed;
};

const sanitizePositionId = (value, { required = false } = {}) => {
    if (value === undefined) {
        if (required) throw { status: 400, message: 'Position is required.' };
        return undefined;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) throw { status: 400, message: 'Position is required.' };
    return parsed;
};

const sanitizeStatus = (value, { required = false } = {}) => {
    if (value === undefined) {
        if (required) throw { status: 400, message: 'Employee status is required.' };
        return undefined;
    }
    const normalized = normalizeEmployeeStatus(value);
    if (!EMPLOYEE_STATUSES.includes(normalized)) {
        throw { status: 400, message: 'Employee status must be ACTIVE or INACTIVE.' };
    }
    return normalized;
};

const sanitizeGender = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const normalized = normalizeEmployeeGender(value);
    if (!EMPLOYEE_GENDERS.includes(normalized)) {
        throw { status: 400, message: 'Gender must be MALE or FEMALE.' };
    }
    return normalized;
};

const sanitizeEmployeePayload = (data, { isUpdate = false } = {}) => {
    const payload = {};

    if (!isUpdate || data.employee_code !== undefined) {
        const employeeCode = String(data.employee_code || '').trim();
        if (!employeeCode) throw { status: 400, message: 'Employee code is required.' };
        payload.employee_code = employeeCode;
    }

    if (!isUpdate || data.name !== undefined) {
        const name = String(data.name || '').trim();
        if (!name) throw { status: 400, message: 'Employee name is required.' };
        payload.name = name;
    }

    const positionId = sanitizePositionId(data.position_id, { required: !isUpdate });
    if (positionId !== undefined) payload.position_id = positionId;

    const status = sanitizeStatus(data.status, { required: !isUpdate });
    if (status !== undefined) payload.status = status;

    const gender = sanitizeGender(data.gender);
    if (gender !== undefined) payload.gender = gender;

    const phone = sanitizeOptionalText(data.phone);
    if (phone !== undefined) payload.phone = phone;

    const address = sanitizeOptionalText(data.address);
    if (address !== undefined) payload.address = address;

    const basicSalary = sanitizeBasicSalary(data.basic_salary);
    if (basicSalary !== undefined) payload.basic_salary = basicSalary;

    return payload;
};

const ensurePositionExists = async (positionId) => {
    const position = await Position.findByPk(positionId, { attributes: ['id'] });
    if (!position) throw { status: 400, message: 'Position not found. Please choose a valid position.' };
};

const mapEmployeeRow = (row) => {
    const employee = row.toJSON();
    return {
        ...employee,
        position_name: employee.position?.name || null,
    };
};

const getEmployees = async ({ page, limit, search, position_id, status }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};

    if (search) {
        where[Op.or] = [
            { employee_code: { [Op.like]: `%${search}%` } },
            { name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
        ];
    }

    if (position_id !== undefined && position_id !== '') {
        const parsedPositionId = Number(position_id);
        if (!Number.isInteger(parsedPositionId) || parsedPositionId <= 0) throw { status: 400, message: 'Invalid position filter.' };
        where.position_id = parsedPositionId;
    }

    if (status !== undefined && status !== '') {
        const normalizedStatus = normalizeEmployeeStatus(status);
        if (!EMPLOYEE_STATUSES.includes(normalizedStatus)) throw { status: 400, message: 'Invalid status filter.' };
        where.status = normalizedStatus;
    }

    const { count, rows } = await Employee.findAndCountAll({
        where,
        offset,
        limit: l,
        include: [{ model: Position, as: 'position', attributes: ['id', 'name'] }],
        order: [['id', 'DESC']],
    });

    return { total: count, page: parseInt(page) || 1, data: rows.map(mapEmployeeRow) };
};

const getEmployeeById = async (id) => {
    const employee = await Employee.findByPk(id, {
        include: [{ model: Position, as: 'position', attributes: ['id', 'name'] }],
    });
    if (!employee) throw { status: 404, message: 'Employee not found.' };
    return mapEmployeeRow(employee);
};

const createEmployee = async (data) => {
    const payload = sanitizeEmployeePayload(data, { isUpdate: false });

    const exists = await Employee.findOne({ where: { employee_code: payload.employee_code }, attributes: ['id'] });
    if (exists) throw { status: 409, message: 'Employee code already exists.' };

    await ensurePositionExists(payload.position_id);
    return await Employee.create(payload);
};

const updateEmployee = async (id, data) => {
    const employee = await Employee.findByPk(id);
    if (!employee) throw { status: 404, message: 'Employee not found.' };

    const payload = sanitizeEmployeePayload(data, { isUpdate: true });

    if (payload.employee_code && payload.employee_code !== employee.employee_code) {
        const exists = await Employee.findOne({ where: { employee_code: payload.employee_code }, attributes: ['id'] });
        if (exists) throw { status: 409, message: 'Employee code already exists.' };
    }

    if (payload.position_id !== undefined) {
        await ensurePositionExists(payload.position_id);
    }

    Object.assign(employee, payload);
    await employee.save();
    return employee;
};

const deleteEmployee = async (id) => {
    const employee = await Employee.findByPk(id);
    if (!employee) throw { status: 404, message: 'Employee not found.' };
    await employee.destroy();
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
    getItemUnitConversions,
    getProducts, createProduct, updateProduct, deleteProduct,
    getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial,
    getSuppliers, createSupplier, updateSupplier, deleteSupplier,
    getCustomers, createCustomer, updateCustomer, deleteCustomer,
    getSalesmen, createSalesman, updateSalesman, deleteSalesman,
    getPositionOptions, getPositions, getPositionById, createPosition, updatePosition, deletePosition,
    getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
    getCOA, createCOA, updateCOA, deleteCOA,
};
