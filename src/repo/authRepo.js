// src/repo/authRepo.js
const db = require('../db');

/**
 * Finds an active user by username/email + company code
 * @param {string} identifier - username or email
 * @param {string} comp_code - company code (will be normalized inside)
 * @returns {Promise<Object|null>} user row or null
 */
async function findActiveUserByCredentials(identifier, comp_code) {
  const normalizedCompCode = comp_code.trim().toUpperCase();

  const query = `
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

  const result = await db.tQuery(query, [identifier], normalizedCompCode);

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

module.exports = {
  findActiveUserByCredentials,
};