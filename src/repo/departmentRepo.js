// src/repo/departmentRepo.js
const db = require('../db');

/**
 * Looks up only the comp_code of a department by ID.
 * Used for SUPER_ADMIN cross-company authorization in controllers.
 *
 * @param {string} departmentId
 * @returns {Promise<string | null>}
 */
async function getDepartmentCompanyCode(departmentId) {
  const result = await db.rawQuery(
    'SELECT comp_code FROM departments WHERE department_id = $1',
    [departmentId]
  );
  return result.rowCount > 0 ? result.rows[0].comp_code : null;
}

/**
 * Inserts a new department.
 */
async function createDepartment(comp_code, data) {
  return db.tInsert(
    'departments',
    data,
    comp_code,
    'department_id, department_name, description, status, created_at, updated_at, comp_code'
  ).then(r => r.rows[0]);
}

/**
 * Returns all departments in the company, ordered by name.
 */
async function getAllDepartments(comp_code) {
  const q = `
    SELECT department_id, department_name, description, status, created_at, updated_at, comp_code
    FROM departments
    ORDER BY department_name ASC
  `;
  const result = await db.tQuery(q, [], comp_code);
  return result.rows;
}

/**
 * Returns a single department by ID (or null).
 */
async function getDepartmentById(comp_code, departmentId) {
  const q = `
    SELECT department_id, department_name, description, status, created_at, updated_at, comp_code
    FROM departments
    WHERE department_id = $1
  `;
  const result = await db.tQuery(q, [departmentId], comp_code);
  return result.rows[0] || null;
}

/**
 * Updates selected fields of a department.
 * Returns updated row or null if not found.
 */
async function updateDepartment(comp_code, departmentId, updates) {
  const allowed = ['department_name', 'description', 'status'];

  const sets = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (!allowed.includes(key)) continue;

    let cleanedValue = value;
    if (key === 'department_name') cleanedValue = value?.trim();
    if (key === 'description')      cleanedValue = value?.trim() ?? null;

    sets.push(`${key} = $${idx++}`);
    values.push(cleanedValue);
  }

  if (sets.length === 0) {
    return getDepartmentById(comp_code, departmentId);
  }

  values.push(departmentId);

  const q = `
    UPDATE departments
    SET ${sets.join(', ')}, updated_at = NOW()
    WHERE department_id = $${idx}
    RETURNING department_id, department_name, description, status, created_at, updated_at, comp_code
  `;

  const result = await db.tQuery(q, values, comp_code);
  return result.rows[0] || null;
}

/**
 * Specialized method to change only status.
 */
async function updateDepartmentStatus(comp_code, departmentId, status) {
  const q = `
    UPDATE departments
    SET status = $1, updated_at = NOW()
    WHERE department_id = $2
    RETURNING department_id, department_name, description, status, created_at, updated_at, comp_code
  `;
  const result = await db.tQuery(q, [status, departmentId], comp_code);
  return result.rows[0] || null;
}

/**
 * Deletes a department.
 * Returns true if deleted, false if not found.
 */
async function deleteDepartment(comp_code, departmentId) {
  const q = `
    DELETE FROM departments
    WHERE department_id = $1
  `;
  const result = await db.tQuery(q, [departmentId], comp_code);
  return result.rowCount > 0;
}

module.exports = {
  getDepartmentCompanyCode,
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
};