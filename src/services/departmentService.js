const db = require('../db');

async function createDepartment(comp_code, { department_name, description, status = 'active' }) {
  if (!comp_code?.trim()) {
    throw { status: 400, message: 'comp_code is required' };
  }
  if (!department_name?.trim()) {
    throw { status: 400, message: 'department_name is required' };
  }

  const data = {
    department_name: department_name.trim(),
    description: description?.trim() || null,
    status
  };

  const result = await db.tInsert('departments', data, comp_code.trim().toUpperCase(), '*');
  return result.rows[0];
}

async function getAllDepartments(comp_code) {
  const q = `
    SELECT department_id, department_name, description, status, created_at, updated_at, comp_code
    FROM departments
    ORDER BY department_name ASC
  `;
  const result = await db.tQuery(q, [], comp_code);
  return result.rows;
}

async function getDepartmentById(comp_code, id) {
  const q = `SELECT department_id, department_name, description, status, created_at, updated_at, comp_code
             FROM departments WHERE department_id = $1`;
  const result = await db.tQuery(q, [id], comp_code);
  return result.rows[0] || null;
}

async function updateDepartment(comp_code, id, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.department_name !== undefined) {
    fields.push(`department_name = $${idx++}`);
    values.push(updates.department_name.trim());
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description?.trim() || null);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }

  if (fields.length === 0) throw { status: 400, message: 'No fields to update' };

  values.push(id);
  const q = `
    UPDATE departments 
    SET ${fields.join(', ')}, updated_at = now()
    WHERE department_id = $${idx}
    RETURNING department_id, department_name, description, status, created_at, updated_at, comp_code
  `;

  const result = await db.tQuery(q, values, comp_code);
  return result.rowCount === 0 ? null : result.rows[0];
}

async function updateDepartmentStatus(comp_code, id, status) {
  if (!['active', 'inactive'].includes(status)) {
    throw { status: 400, message: 'Invalid status' };
  }
  const q = `UPDATE departments SET status = $1, updated_at = now()
             WHERE department_id = $2
             RETURNING department_id, department_name, description, status, created_at, updated_at, comp_code`;
  const result = await db.tQuery(q, [status, id], comp_code);
  return result.rows[0] || null;
}

async function deleteDepartment(comp_code, id) {
  const q = `DELETE FROM departments WHERE department_id = $1`;
  const result = await db.tQuery(q, [id], comp_code);
  return result.rowCount > 0;
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment
};