const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    MaterialIssue, MaterialIssueDetail,
    RawMaterial, Unit, User, Employee, Position,
    StockMovement,
} = require('../../models');

const STATUS = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED',
};

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, parseInt(limit, 10) || 15);
    return { offset: (p - 1) * l, limit: l, page: p };
};

const sanitizeDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw { status: 400, message: 'Valid date is required.' };
    return d;
};

const sanitizeMonthYear = (month, year, dateObj) => {
    const m = Number(month);
    const y = Number(year);

    if (!Number.isInteger(m) || m < 1 || m > 12) throw { status: 400, message: 'Month must be between 1 and 12.' };
    if (!Number.isInteger(y) || y < 1900 || y > 9999) throw { status: 400, message: 'Year is invalid.' };

    const monthFromDate = dateObj.getMonth() + 1;
    const yearFromDate = dateObj.getFullYear();
    if (m !== monthFromDate || y !== yearFromDate) {
        throw { status: 400, message: 'Month and year must match the selected date.' };
    }

    return { month: m, year: y };
};

const validateDetailsPayload = async (details, transaction) => {
    if (!Array.isArray(details) || details.length < 1) {
        throw { status: 400, message: 'At least one detail item is required.' };
    }

    const normalized = [];

    for (const row of details) {
        const rawMaterialId = Number(row.raw_material_id);
        const unitId = Number(row.unit_id);
        const qty = Number(row.qty);

        if (!Number.isInteger(rawMaterialId) || rawMaterialId <= 0) {
            throw { status: 400, message: 'raw_material_id is required and must be valid.' };
        }
        if (!Number.isInteger(unitId) || unitId <= 0) {
            throw { status: 400, message: 'unit_id is required and must be valid.' };
        }
        if (!Number.isFinite(qty) || qty <= 0) {
            throw { status: 400, message: 'qty must be greater than 0.' };
        }

        const rawMaterial = await RawMaterial.findByPk(rawMaterialId, {
            attributes: ['id', 'name', 'unit_id', 'stock'],
            transaction,
        });
        if (!rawMaterial) throw { status: 400, message: `Raw material with id ${rawMaterialId} not found.` };

        const unit = await Unit.findByPk(unitId, { attributes: ['id', 'name'], transaction });
        if (!unit) throw { status: 400, message: `Unit with id ${unitId} not found.` };

        if (rawMaterial.unit_id && Number(rawMaterial.unit_id) !== unitId) {
            throw { status: 400, message: `Unit for raw material "${rawMaterial.name}" must match its default unit.` };
        }

        normalized.push({
            raw_material_id: rawMaterialId,
            unit_id: unitId,
            qty,
            note: row.note ? String(row.note).trim() : null,
        });
    }

    return normalized;
};

const generateIssueNumber = async (dateObj, transaction) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const prefix = `BPG-${year}${month}`;

    const latest = await MaterialIssue.findOne({
        where: {
            issue_number: { [Op.like]: `${prefix}-%` },
        },
        order: [['issue_number', 'DESC']],
        transaction,
    });

    let seq = 1;
    if (latest?.issue_number) {
        const parts = latest.issue_number.split('-');
        const currentSeq = Number(parts[2] || 0);
        seq = currentSeq + 1;
    }

    return `${prefix}-${String(seq).padStart(4, '0')}`;
};

const getMaterialIssues = async ({ page, limit, search, status }) => {
    const { offset, limit: l, page: currentPage } = paginate(page, limit);
    const where = {};

    if (status) {
        const normalizedStatus = String(status).toUpperCase();
        if (!Object.values(STATUS).includes(normalizedStatus)) {
            throw { status: 400, message: 'Invalid status filter.' };
        }
        where.status = normalizedStatus;
    }

    if (search) {
        where[Op.or] = [
            { issue_number: { [Op.like]: `%${search}%` } },
            { department: { [Op.like]: `%${search}%` } },
            { '$recipientEmployee.name$': { [Op.like]: `%${search}%` } },
        ];
    }

    const { count, rows } = await MaterialIssue.findAndCountAll({
        where,
        offset,
        limit: l,
        include: [
            {
                model: Employee,
                as: 'recipientEmployee',
                attributes: ['id', 'employee_code', 'name', 'position_id'],
                include: [{ model: Position, as: 'position', attributes: ['id', 'name'] }],
            },
        ],
        order: [['id', 'DESC']],
    });

    return { total: count, page: currentPage, data: rows };
};

const getMaterialIssueById = async (id) => {
    const issue = await MaterialIssue.findByPk(id, {
        include: [
            {
                model: Employee,
                as: 'recipientEmployee',
                attributes: ['id', 'employee_code', 'name', 'position_id'],
                include: [{ model: Position, as: 'position', attributes: ['id', 'name'] }],
            },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'approver', attributes: ['id', 'name'] },
            {
                model: MaterialIssueDetail,
                as: 'details',
                include: [
                    { model: RawMaterial, as: 'rawMaterial', attributes: ['id', 'name', 'unit_id', 'stock'] },
                    { model: Unit, as: 'unit', attributes: ['id', 'name'] },
                ],
            },
        ],
        order: [[{ model: MaterialIssueDetail, as: 'details' }, 'id', 'ASC']],
    });

    if (!issue) throw { status: 404, message: 'Material issue not found.' };
    return issue;
};

const createMaterialIssue = async (payload, createdBy) => {
    const dateObj = sanitizeDate(payload.date);
    const { month, year } = sanitizeMonthYear(payload.month, payload.year, dateObj);

    if (!payload.department || !String(payload.department).trim()) {
        throw { status: 400, message: 'Department is required.' };
    }

    const recipientEmployeeId = Number(payload.recipient_employee_id);
    if (!Number.isInteger(recipientEmployeeId) || recipientEmployeeId <= 0) {
        throw { status: 400, message: 'recipient_employee_id is required and must be valid.' };
    }

    const recipientEmployee = await Employee.findByPk(recipientEmployeeId, { attributes: ['id'] });
    if (!recipientEmployee) throw { status: 400, message: 'Recipient employee not found.' };

    const t = await sequelize.transaction();
    try {
        const details = await validateDetailsPayload(payload.details, t);
        const issueNumber = await generateIssueNumber(dateObj, t);

        const issue = await MaterialIssue.create({
            issue_number: issueNumber,
            date: dateObj,
            month,
            year,
            department: String(payload.department).trim(),
            recipient_employee_id: recipientEmployeeId,
            status: STATUS.DRAFT,
            description: payload.description ? String(payload.description).trim() : null,
            created_by: createdBy,
            approved_by: null,
            approved_at: null,
        }, { transaction: t });

        await MaterialIssueDetail.bulkCreate(
            details.map((d) => ({ ...d, material_issue_id: issue.id })),
            { transaction: t }
        );

        await t.commit();
        return getMaterialIssueById(issue.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const updateMaterialIssue = async (id, payload) => {
    const issue = await MaterialIssue.findByPk(id);
    if (!issue) throw { status: 404, message: 'Material issue not found.' };
    if (issue.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT material issue can be edited.' };

    const dateObj = sanitizeDate(payload.date);
    const { month, year } = sanitizeMonthYear(payload.month, payload.year, dateObj);

    if (!payload.department || !String(payload.department).trim()) {
        throw { status: 400, message: 'Department is required.' };
    }

    const recipientEmployeeId = Number(payload.recipient_employee_id);
    if (!Number.isInteger(recipientEmployeeId) || recipientEmployeeId <= 0) {
        throw { status: 400, message: 'recipient_employee_id is required and must be valid.' };
    }

    const recipientEmployee = await Employee.findByPk(recipientEmployeeId, { attributes: ['id'] });
    if (!recipientEmployee) throw { status: 400, message: 'Recipient employee not found.' };

    const t = await sequelize.transaction();
    try {
        const details = await validateDetailsPayload(payload.details, t);

        issue.date = dateObj;
        issue.month = month;
        issue.year = year;
        issue.department = String(payload.department).trim();
        issue.recipient_employee_id = recipientEmployeeId;
        issue.description = payload.description ? String(payload.description).trim() : null;
        await issue.save({ transaction: t });

        await MaterialIssueDetail.destroy({ where: { material_issue_id: issue.id }, transaction: t });
        await MaterialIssueDetail.bulkCreate(
            details.map((d) => ({ ...d, material_issue_id: issue.id })),
            { transaction: t }
        );

        await t.commit();
        return getMaterialIssueById(issue.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const deleteMaterialIssue = async (id) => {
    const issue = await MaterialIssue.findByPk(id);
    if (!issue) throw { status: 404, message: 'Material issue not found.' };
    if (issue.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT material issue can be deleted.' };

    const t = await sequelize.transaction();
    try {
        await MaterialIssueDetail.destroy({ where: { material_issue_id: issue.id }, transaction: t });
        await issue.destroy({ transaction: t });
        await t.commit();
        return { message: 'Material issue deleted successfully.' };
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const approveMaterialIssue = async (id, approvedBy) => {
    const issue = await MaterialIssue.findByPk(id, {
        include: [{ model: MaterialIssueDetail, as: 'details' }],
    });
    if (!issue) throw { status: 404, message: 'Material issue not found.' };
    if (issue.status !== STATUS.DRAFT) throw { status: 400, message: 'Only DRAFT material issue can be approved.' };
    if (!issue.details || issue.details.length === 0) {
        throw { status: 400, message: 'Material issue detail is required before approval.' };
    }

    const t = await sequelize.transaction();
    try {
        for (const detail of issue.details) {
            const rawMaterial = await RawMaterial.findByPk(detail.raw_material_id, {
                attributes: ['id', 'name', 'stock'],
                transaction: t,
                lock: t.LOCK.UPDATE,
            });

            if (!rawMaterial) {
                throw { status: 400, message: `Raw material with id ${detail.raw_material_id} not found.` };
            }

            const currentStock = Number(rawMaterial.stock || 0);
            const qtyOut = Number(detail.qty || 0);

            if (currentStock < qtyOut) {
                throw { status: 400, message: `Insufficient stock for raw material "${rawMaterial.name}".` };
            }

            rawMaterial.stock = currentStock - qtyOut;
            await rawMaterial.save({ transaction: t });

            await StockMovement.create({
                item_type: 'RAW_MATERIAL',
                item_id: detail.raw_material_id,
                transaction_date: issue.date,
                reference_type: 'MATERIAL_ISSUE',
                reference_id: issue.id,
                qty_in: 0,
                qty_out: qtyOut,
                note: `Material issue ${issue.issue_number}`,
            }, { transaction: t });
        }

        issue.status = STATUS.APPROVED;
        issue.approved_by = approvedBy;
        issue.approved_at = new Date();
        await issue.save({ transaction: t });

        await t.commit();
        return getMaterialIssueById(issue.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const cancelMaterialIssue = async (id) => {
    const issue = await MaterialIssue.findByPk(id);
    if (!issue) throw { status: 404, message: 'Material issue not found.' };
    if (issue.status === STATUS.APPROVED) {
        throw { status: 400, message: 'Approved material issue cannot be cancelled.' };
    }
    if (issue.status === STATUS.CANCELLED) {
        throw { status: 400, message: 'Material issue is already cancelled.' };
    }

    issue.status = STATUS.CANCELLED;
    await issue.save();
    return issue;
};

module.exports = {
    getMaterialIssues,
    getMaterialIssueById,
    createMaterialIssue,
    updateMaterialIssue,
    deleteMaterialIssue,
    approveMaterialIssue,
    cancelMaterialIssue,
};
