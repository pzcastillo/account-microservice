// src/repo/accountRepo.js
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Looks up only the comp_code of an account by its ID.
 * Used mainly for authorization checks (SUPER_ADMIN cross-company access).
 *
 * @param {string} accountId
 * @returns {Promise<string | null>} comp_code or null if not found
 */
async function getAccountCompanyCode(accountId) {
  const result = await db.rawQuery(
    'SELECT comp_code FROM accounts WHERE id = $1',
    [accountId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0].comp_code;
}

/**
 * Placeholder – more methods will be added here later when moving logic
 * from accountService (create, list, get by id, update, disable, delete…)
 */

// async function createAccount(comp_code, data) { ... }
// async function findAccounts(comp_code, filters) { ... }
// async function findAccountById(comp_code, id) { ... }
// async function updateAccount(comp_code, id, data) { ... }
// etc.

async function accountExistsByEmpId(emp_id, comp_code, excludeId = null) {
    return db.empIdExists(emp_id, comp_code, excludeId);
}

async function roleExists(role_id) {
    const r = await db.query('SELECT 1 FROM roles WHERE id = $1', [role_id]);
    return r.rowCount > 0;
}

async function userTypeExists(user_type_id) {
    const r = await db.query('SELECT 1 FROM user_types WHERE id = $1', [user_type_id]);
    return r.rowCount > 0;
}

async function departmentBelongsToCompany(department_id, comp_code) {
    if (!department_id) return true;

    const r = await db.tQuery(
        'SELECT 1 FROM departments WHERE department_id = $1',
        [department_id],          // ← your params only
        comp_code                 // ← third argument
    );
    return r.rowCount > 0;
}

async function insertAccount(comp_code, accountData) {
    // Do NOT add comp_code to data here
    return db.tInsert(
        'accounts',
        accountData,          // original data without comp_code
        comp_code,            // ← third argument
        'id, emp_id, fullname, username, email, department_id, user_type_id, role_id, status, created_at, updated_at, comp_code'
    );
}

async function findAccountById(comp_code, id, fields = [
    'id', 'emp_id', 'fullname', 'username', 'email',
    'department_id', 'user_type_id', 'role_id', 'status',
    'created_at', 'updated_at', 'comp_code'
]) {
    const fieldList = fields.join(', ');
    const q = `SELECT ${fieldList} FROM accounts WHERE id = $1`;

    const r = await db.tQuery(q, [id], comp_code);   // ← third arg
    return r.rows[0] || null;
}

async function findAccountByEmpId(comp_code, emp_id) {
    return db.getAccountByEmpId(emp_id, comp_code);
}

async function updateAccountFields(comp_code, id, setClauses, values) {
    if (setClauses.length === 0) return null;

    const q = `
        UPDATE accounts
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length + 1}
        RETURNING id, emp_id, fullname, username, email, department_id,
                  user_type_id, role_id, status, created_at, updated_at, comp_code
    `;
    values.push(id);

    const r = await db.tQuery(q, values, comp_code);   // ← third arg
    return r.rows[0] || null;
}

async function listAccounts(comp_code, {
    limit = 20,
    offset = 0,
    department_id = null,
    user_type_id = null,
    status = null,
    search = ''
} = {}) {
    const where = [];
    const params = [];
    let idx = 1;

    if (department_id) { where.push(`department_id = $${idx++}`); params.push(department_id); }
    if (user_type_id)   { where.push(`user_type_id = $${idx++}`); params.push(user_type_id);   }
    if (status)         { where.push(`status = $${idx++}`);       params.push(status);         }
    if (search) {
        where.push(`(fullname ILIKE $${idx} OR username ILIKE $${idx} OR email ILIKE $${idx} OR emp_id ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const q = `
        SELECT id, emp_id, fullname, username, email, department_id,
               user_type_id, role_id, status, created_at, updated_at, comp_code
        FROM accounts
        ${whereSQL}
        ORDER BY created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);

    const r = await db.tQuery(q, params, comp_code);
    return r.rows;
}

async function disableAccount(comp_code, id) {
    const q = `
        UPDATE accounts
        SET status = 'disabled', updated_at = NOW()
        WHERE id = $1
        RETURNING id, status, updated_at, comp_code
    `;
    const r = await db.tQuery(q, [id], comp_code);
    return r.rows[0] || null;
}

async function deleteAccount(comp_code, id) {
    const q = `
        DELETE FROM accounts
        WHERE id = $1
        RETURNING id, emp_id, fullname, comp_code
    `;
    const r = await db.tQuery(q, [id], comp_code);
    return r.rowCount > 0 ? r.rows[0] : null;
}

module.exports = {
    getAccountCompanyCode,
    accountExistsByEmpId,
    roleExists,
    userTypeExists,
    departmentBelongsToCompany,
    insertAccount,
    findAccountById,
    findAccountByEmpId,
    updateAccountFields,
    listAccounts,
    disableAccount,
    deleteAccount
};