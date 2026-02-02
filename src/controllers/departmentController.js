const deptService = require('../services/departmentService');
const db = require('../db');
const { getDepartmentCompanyCode } = require('../repo/departmentRepo');

async function create(req, res, next) {
  try {
    const { role_name, comp_code: userCompCode } = req.user;

    // 1. Authorization check
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role_name)) {
      return res.status(403).json({
        error: 'Forbidden - only SuperAdmin or Admin can create departments'
      });
    }

    let targetCompCode;

    if (role_name === 'SUPER_ADMIN') {
      // SUPER_ADMIN MUST provide comp_code in body
      if (!req.body.comp_code?.trim()) {
        return res.status(400).json({
          error: 'comp_code is required in request body when creating as SUPER_ADMIN'
        });
      }
      targetCompCode = req.body.comp_code.trim().toUpperCase();
    } else {
      // ADMIN → forced to use their own company (ignore any comp_code in body)
      targetCompCode = userCompCode;
      // Optional: clean up the body so service doesn't see it
      delete req.body.comp_code;
    }

    const dept = await deptService.createDepartment(targetCompCode, req.body);
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
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Forbidden - only SuperAdmin or Admin can update departments' });
    }

    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const foundCompCode = await getDepartmentCompanyCode(id);
      if (!foundCompCode) return res.status(404).json({ error: 'Department not found' });
      comp_code = foundCompCode;
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
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Forbidden - only SuperAdmin or Admin can change department status' });
    }

    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const foundCompCode = await getDepartmentCompanyCode(id);
      if (!foundCompCode) return res.status(404).json({ error: 'Department not found' });
      comp_code = foundCompCode;
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
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Forbidden - only SuperAdmin or Admin can delete departments' });
    }

    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const foundCompCode = await getDepartmentCompanyCode(id);
      if (!foundCompCode) return res.status(404).json({ error: 'Department not found' });
      comp_code = foundCompCode;
    }

    const deleted = await deptService.deleteDepartment(comp_code, id);
    if (!deleted) return res.status(404).json({ error: 'Department not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, getById, update, updateStatus, remove };