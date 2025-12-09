const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function login({ usernameOrEmail, password, comp_code }) {
  if (!usernameOrEmail || !password || !comp_code) {
    throw { status: 400, message: 'Missing credentials or company code' };
  }

  const normalizedCompCode = comp_code.trim().toUpperCase();

  const q = `
    SELECT 
      a.id, a.emp_id, a.fullname, a.username, a.email,
      a.password_hash, a.department_id, a.role_id, a.user_type_id,
      a.status, a.comp_code,
      r.role_name
    FROM accounts a
    LEFT JOIN roles r ON a.role_id = r.id
    WHERE (a.username = $1 OR a.email = $1)
      AND a.comp_code = $2
      AND a.status = 'active'
  `;

  const result = await db.tQuery(q, [usernameOrEmail], normalizedCompCode);

  if (result.rowCount === 0) {
    throw { status: 401, message: 'Invalid credentials or company' };
  }

  const user = result.rows[0];

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const token = jwt.sign(
    {
      sub: user.id,
      emp_id: user.emp_id,
      comp_code: user.comp_code,
      role_name: (user.role_name || 'EMPLOYEE').toUpperCase(),
      fullname: user.fullname
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn || '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      emp_id: user.emp_id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      department_id: user.department_id,
      role_name: (user.role_name || 'EMPLOYEE').toUpperCase(),
      comp_code: user.comp_code
    }
  };
}

module.exports = { login };