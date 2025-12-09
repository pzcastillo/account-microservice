const deptService = require('../services/departmentService');
const db = require('../db');

async function create(req, res, next) {
  try {
    // BLOCK: Only SUPER_ADMIN or ADMIN can create departments
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Forbidden - only SuperAdmin or Admin can create departments' });
    }

    let comp_code = req.user.comp_code;

    // SUPER_ADMIN can override company
    if (req.user.role_name === 'SUPER_ADMIN' && req.body.comp_code) {
      comp_code = req.body.comp_code.trim().toUpperCase();
    }

    const dept = await deptService.createDepartment(comp_code, req.body);
    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const comp_code = req.user.role_name === 'SUPER_ADMIN' && req.query.comp_code
      ? req.query.comp_code.trim().toUpperCase()
      : req.user.comp_code;

    const depts = await deptService.getAllDepartments(comp_code);
    res.json(depts);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM departments WHERE department_id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Department not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const dept = await deptService.getDepartmentById(comp_code, id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    // BLOCK: Only SUPER_ADMIN or ADMIN can update departments
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Forbidden - only SuperAdmin or Admin can update departments' });
    }

    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM departments WHERE department_id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Department not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const dept = await deptService.updateDepartment(comp_code, id, req.body);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    // BLOCK: Only SUPER_ADMIN or ADMIN can change status
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Forbidden - only SuperAdmin or Admin can change department status' });
    }

    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM departments WHERE department_id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Department not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const dept = await deptService.updateDepartmentStatus(comp_code, id, req.body.status);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    // BLOCK: Only SUPER_ADMIN or ADMIN can delete departments
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Forbidden - only SuperAdmin or Admin can delete departments' });
    }

    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM departments WHERE department_id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Department not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const deleted = await deptService.deleteDepartment(comp_code, id);
    if (!deleted) return res.status(404).json({ error: 'Department not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, getById, update, updateStatus, remove };