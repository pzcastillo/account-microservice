// src/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const { findActiveUserByCredentials } = require('../repo/authRepo');

async function login({ usernameOrEmail, password, comp_code }) {
  if (!usernameOrEmail || !password || !comp_code) {
    throw { status: 400, message: 'Missing credentials or company code' };
  }

  const user = await findActiveUserByCredentials(usernameOrEmail, comp_code);

  if (!user) {
    throw { status: 401, message: 'Invalid credentials or company' };
  }

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
      fullname: user.fullname,
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
      comp_code: user.comp_code,
    },
  };
}

module.exports = { login };