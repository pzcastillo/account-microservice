const db = require('../db');
const bcrypt = require('bcrypt');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const repo = require('../repo/accountRepo');

async function createAccount(comp_code, {
    emp_id,
    fullname,
    username,
    email,
    password,
    department_id = null,
    user_type_id = null,
    role_id = null,
    status = 'active'
}) {
    if (!emp_id)    throw { status: 400, message: 'emp_id is required' };
    if (!password)  throw { status: 400, message: 'Password is required' };

    // 1. emp_id unique per company
    if (await repo.accountExistsByEmpId(emp_id, comp_code)) {
        throw { status: 409, message: `Employee ID '${emp_id}' already exists` };
    }

    // 2. Validate global entities
    if (role_id && !(await repo.roleExists(role_id))) {
        throw { status: 400, message: 'Role not found' };
    }
    if (user_type_id && !(await repo.userTypeExists(user_type_id))) {
        throw { status: 400, message: 'User type not found' };
    }

    // 3. Department must belong to company
    if (!(await repo.departmentBelongsToCompany(department_id, comp_code))) {
        throw { status: 400, message: 'Department does not exist in the selected company' };
    }

    const hash = await bcrypt.hash(password, config.bcryptSaltRounds);

    const data = {
        id: uuidv4(),
        emp_id,
        fullname,
        username,
        email,
        password_hash: hash,
        department_id,
        user_type_id,
        role_id,
        status
    };

    

    // In accountService.js - createAccount (near the end)
try {
  const result = await repo.insertAccount(comp_code, data);
  console.log('[createAccount] Insert result:', result.rows[0]); // success log
  return result.rows[0];
} catch (err) {
  console.error('[createAccount → insert] DB error:', {
    message: err.message,
    code: err.code,           // e.g. 23505 = unique violation
    detail: err.detail,
    stack: err.stack
  });
  throw err;
}
}

async function updateAccount(comp_code, id, fields = {}) {
    const allowed = ['fullname', 'username', 'email', 'department_id', 'user_type_id', 'role_id', 'status', 'password', 'emp_id'];

    const sets = [];
    const values = [];
    let idx = 1;

    // emp_id uniqueness (exclude current record)
    if (fields.emp_id !== undefined) {
        if (await repo.accountExistsByEmpId(fields.emp_id, comp_code, id)) {
            throw { status: 409, message: `Employee ID '${fields.emp_id}' is already taken` };
        }
    }

    // Department validation
    if (fields.department_id !== undefined) {
        if (fields.department_id !== null &&
            !(await repo.departmentBelongsToCompany(fields.department_id, comp_code))) {
            throw { status: 400, message: 'Department does not exist in this company' };
        }
    }

    for (const key of Object.keys(fields)) {
        if (!allowed.includes(key)) continue;

        if (key === 'password') {
            const hash = await bcrypt.hash(fields.password, config.bcryptSaltRounds);
            sets.push(`password_hash = $${idx++}`);
            values.push(hash);
        } else {
            sets.push(`${key} = $${idx++}`);
            values.push(fields[key]);
        }
    }

    if (sets.length === 0) {
        return repo.findAccountById(comp_code, id);
    }

    return repo.updateAccountFields(comp_code, id, sets, values);
}

async function getAccountById(comp_code, id) {
    return repo.findAccountById(comp_code, id);
}

async function getAccountByEmpId(comp_code, emp_id) {
    return repo.findAccountByEmpId(comp_code, emp_id);
}

async function listAccounts(comp_code, options = {}) {
    return repo.listAccounts(comp_code, options);
}

async function disableAccount(comp_code, id) {
    return repo.disableAccount(comp_code, id);
}

async function deleteAccount(comp_code, id) {
    return repo.deleteAccount(comp_code, id);
}

module.exports = {
  createAccount,
  getAccountById,
  getAccountByEmpId,
  listAccounts,
  updateAccount,
  disableAccount,
  deleteAccount
};