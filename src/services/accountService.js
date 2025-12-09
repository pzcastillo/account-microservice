const db = require('../db');
const bcrypt = require('bcrypt');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

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
  if (!emp_id) throw { status: 400, message: 'emp_id is required' };
  if (!password) throw { status: 400, message: 'Password is required' };

  // 1. emp_id unique per company
  const exists = await db.empIdExists(emp_id, comp_code);
  if (exists) throw { status: 409, message: `Employee ID '${emp_id}' already exists` };

  // 2. Validate role and user type exists in GLOBAL tables (roles & user_types)
  if (role_id) {
    const roleCheck = await db.query('SELECT id FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rowCount === 0) throw { status: 400, message: 'Role not found' };
  }
  if (user_type_id) {
    const userTypeCheck = await db.query('SELECT id FROM user_types WHERE id = $1', [user_type_id]);
    if (userTypeCheck.rowCount === 0) throw { status: 400, message: 'User type not found' };
  }

  // 3. Department must belong to the target company
  if (department_id) {
    const deptCheck = await db.tQuery(
      'SELECT department_id FROM departments WHERE department_id = $1 AND comp_code = $2',
      [department_id],
      comp_code
    );

    if (deptCheck.rowCount === 0) {
      throw {
        status: 400,
        message: 'Department does not exist in the selected company'
      };
    }
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

  const result = await db.tInsert(
    'accounts',
    data,
    comp_code,
    'id, emp_id, fullname, username, email, department_id, user_type_id, role_id, status, created_at, updated_at, comp_code'
  );

  return result.rows[0];
}

async function updateAccount(comp_code, id, fields = {}) {
  const allowed = ['fullname', 'username', 'email', 'department_id', 'user_type_id', 'role_id', 'status', 'password', 'emp_id'];
  const sets = [];
  const values = [];
  let idx = 1;

  // emp_id change uniqueness check (exclude current record)
  if (fields.emp_id !== undefined) {
    const exists = await db.empIdExists(fields.emp_id, comp_code, id);
    if (exists) throw { status: 409, message: `Employee ID '${fields.emp_id}' is already taken` };
  }

  // Department cross-tenant validation
  if (fields.department_id !== undefined) {
    if (fields.department_id === null) {
    } else {
      const deptCheck = await db.tQuery(
        'SELECT department_id FROM departments WHERE department_id = $1 AND comp_code = $2',
        [fields.department_id],
        comp_code
      );
      if (deptCheck.rowCount === 0) {
        throw {
          status: 400,
          message: 'Department does not exist in this company'
        };
      }
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
    return getAccountById(comp_code, id);
  }

  values.push(id);
  const q = `
    UPDATE accounts
    SET ${sets.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING id, emp_id, fullname, username, email, department_id, user_type_id, role_id, status, created_at, updated_at, comp_code
  `;

  const result = await db.tQuery(q, values, comp_code);
  return result.rows[0] || null;
}

async function getAccountById(comp_code, id) {
  const q = `
    SELECT id, emp_id, fullname, username, email, department_id, 
           user_type_id, role_id, status, created_at, updated_at, comp_code
    FROM accounts WHERE id = $1
  `;
  const r = await db.tQuery(q, [id], comp_code);
  return r.rows[0] || null;
}

async function getAccountByEmpId(comp_code, emp_id) {
  return await db.getAccountByEmpId(emp_id, comp_code);
}

async function listAccounts(comp_code, { limit = 20, offset = 0, department_id, user_type_id, status, search = '' } = {}) {
  const where = [];
  const params = [];
  let idx = 1;

  if (department_id) { where.push(`department_id = $${idx++}`); params.push(department_id); }
  if (user_type_id) { where.push(`user_type_id = $${idx++}`); params.push(user_type_id); }
  if (status) { where.push(`status = $${idx++}`); params.push(status); }
  if (search) {
    where.push(`(fullname ILIKE $${idx} OR username ILIKE $${idx} OR email ILIKE $${idx} OR emp_id ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const q = `
    SELECT id, emp_id, fullname, username, email, department_id, user_type_id, role_id, status, created_at, updated_at, comp_code
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
  const q = `UPDATE accounts SET status = 'disabled', updated_at = now() WHERE id = $1 RETURNING id, status, updated_at, comp_code`;
  const r = await db.tQuery(q, [id], comp_code);
  return r.rows[0] || null;
}

async function deleteAccount(comp_code, id) {
  const q = `DELETE FROM accounts WHERE id = $1 AND comp_code = $2 RETURNING id, emp_id, fullname, comp_code`;
  const result = await db.tQuery(q, [id], comp_code);
  return result.rowCount > 0 ? result.rows[0] : null;
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