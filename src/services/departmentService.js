// src/services/departmentService.js
const repo = require('../repo/departmentRepo');

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
    status,
  };

  return repo.createDepartment(comp_code.trim().toUpperCase(), data);
}

async function getAllDepartments(comp_code) {
  return repo.getAllDepartments(comp_code);
}

async function getDepartmentById(comp_code, id) {
  return repo.getDepartmentById(comp_code, id);
}

async function updateDepartment(comp_code, id, updates) {
  // You can add extra business rules here in the future (e.g. prevent changing name if used, etc.)
  return repo.updateDepartment(comp_code, id, updates);
}

async function updateDepartmentStatus(comp_code, id, status) {
  if (!['active', 'inactive'].includes(status)) {
    throw { status: 400, message: 'Invalid status. Must be "active" or "inactive"' };
  }

  return repo.updateDepartmentStatus(comp_code, id, status);
}

async function deleteDepartment(comp_code, id) {
  // You can add checks here later (e.g. "cannot delete if has employees")
  return repo.deleteDepartment(comp_code, id);
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
};