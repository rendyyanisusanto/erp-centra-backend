const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
    CashTransaction, Journal, JournalDetail, ChartOfAccount, User,
} = require('../../models');

const paginate = (page, limit) => {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 15);
    return { offset: (p - 1) * l, limit: l };
};

// ====== CASH TRANSACTIONS ======
const getCashTransactions = async ({ page, limit, type, date_from, date_to }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (type) where.type = type;
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    const { count, rows } = await CashTransaction.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: ChartOfAccount, as: 'debitAccount' },
            { model: ChartOfAccount, as: 'creditAccount' },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const createCashTransaction = async ({ date, type, description, amount, account_debit_id, account_credit_id }, createdBy) => {
    if (!date || !type || !amount || !account_debit_id || !account_credit_id) {
        throw { status: 400, message: 'Date, type, amount, debit and credit accounts are required.' };
    }

    const t = await sequelize.transaction();
    try {
        const cash = await CashTransaction.create({
            date, type, description, amount, account_debit_id, account_credit_id, created_by: createdBy,
        }, { transaction: t });

        // Post journal
        const journal = await Journal.create({
            date, description: description || `Cash ${type} Transaction`,
            reference_id: cash.id, reference_type: 'cash_transaction', created_by: createdBy,
        }, { transaction: t });
        await JournalDetail.bulkCreate([
            { journal_id: journal.id, account_id: account_debit_id, debit: amount, credit: 0 },
            { journal_id: journal.id, account_id: account_credit_id, debit: 0, credit: amount },
        ], { transaction: t });

        await t.commit();
        return cash;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

// ====== MANUAL JOURNAL ======
const getJournals = async ({ page, limit, date_from, date_to }) => {
    const { offset, limit: l } = paginate(page, limit);
    const where = {};
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    const { count, rows } = await Journal.findAndCountAll({
        where, offset, limit: l,
        include: [
            { model: JournalDetail, as: 'details', include: [{ model: ChartOfAccount, as: 'account' }] },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
        order: [['id', 'DESC']],
    });
    return { total: count, page: parseInt(page) || 1, data: rows };
};

const getJournalById = async (id) => {
    const j = await Journal.findByPk(id, {
        include: [
            { model: JournalDetail, as: 'details', include: [{ model: ChartOfAccount, as: 'account' }] },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
        ],
    });
    if (!j) throw { status: 404, message: 'Journal not found.' };
    return j;
};

const createManualJournal = async ({ date, description, details }, createdBy) => {
    if (!details || !details.length) throw { status: 400, message: 'Journal details are required.' };

    const totalDebit = details.reduce((sum, d) => sum + Number(d.debit || 0), 0);
    const totalCredit = details.reduce((sum, d) => sum + Number(d.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw { status: 400, message: `Journal not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}.` };
    }

    const t = await sequelize.transaction();
    try {
        const journal = await Journal.create({
            date, description, reference_type: 'manual', created_by: createdBy,
        }, { transaction: t });
        await JournalDetail.bulkCreate(details.map(d => ({ ...d, journal_id: journal.id })), { transaction: t });
        await t.commit();
        return getJournalById(journal.id);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

module.exports = { getCashTransactions, createCashTransaction, getJournals, getJournalById, createManualJournal };
