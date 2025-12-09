const db = require('../db');
const accountService = require('../services/accountService');

function requirePermission(requiredPermissions) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const comp_code = req.tenant?.comp_code || user.comp_code;

      if (!user?.role_id) {
        return res.status(401).json({ error: 'Unauthorized - missing role' });
      }

      // Fetch role permissions
      const roleResult = await db.query(
        'SELECT permissions, role_name FROM roles WHERE id = $1',
        [user.role_id]
      );

      if (roleResult.rowCount === 0) {
        return res.status(403).json({ error: 'Role not found' });
      }

      const { permissions, role_name } = roleResult.rows[0];
      req.user.role_name = role_name.toUpperCase();

      // SUPER_ADMIN bypass
      if (req.user.role_name === 'SUPER_ADMIN') return next();

      // Block non-ADMIN from managing departments
      if (req.path.startsWith('/api/departments') || req.baseUrl.includes('/departments')) {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          if (!['ADMIN'].includes(req.user.role_name)) {
            return res.status(403).json({
              error: 'Forbidden - only SuperAdmin or Admin can manage departments'
            });
          }
        }
      }

      const required = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      const hasPermission = (perm) => permissions.includes(perm);

      // Helper: get target account (only used for account routes)
      const getTargetAccount = async () => {
        if (req.params.id) {
          return await accountService.getAccountById(comp_code, req.params.id);
        }
        if (req.params.empId) {
          return await accountService.getAccountByEmpId(comp_code, req.params.empId);
        }
        return null;
      };

      for (const reqPerm of required) {
        // 1. Exact match → allow
        if (hasPermission(reqPerm)) return next();

        // 2. Own-account access (CLIENT & EMPLOYEE)
        if ((reqPerm === 'accounts:read' || reqPerm === 'accounts:update') &&
            hasPermission(reqPerm + '_own')) {

          // BLOCK LIST endpoint completely for CLIENT/EMPLOYEE
          if (req.method === 'GET' && req.path === '/api/accounts') {
            return res.status(403).json({
              error: 'Forbidden - you cannot list all accounts'
            });
          }

          // Allow single account access only if it's their own
          const target = await getTargetAccount();
          if (!target) {
            return res.status(404).json({ error: 'Account not found' });
          }
          if (target.id !== user.id) {
            return res.status(403).json({ error: 'You can only access your own account' });
          }
          return next();
        }

        // 3. Manager: own-department scoped ACCOUNTS only
        const action = reqPerm.split(':')[1];
        if (['create','read','update','disable','delete'].includes(action) &&
            hasPermission(`accounts:${action}:own-dept`)) {

          // CREATE: restrict to own department
          if (action === 'create' && req.method === 'POST') {
            if (req.body.department_id && req.body.department_id !== user.department_id) {
              return res.status(403).json({ error: 'Managers can only create in their own department' });
            }
            return next();
          }

          // LIST accounts: allow for managers (controller will filter)
          if (action === 'read' && req.method === 'GET' && !req.params.id && !req.params.empId) {
            return next();
          }

          // Single account operations: check target is in manager's dept
          const target = await getTargetAccount();
          if (!target) {
            return res.status(404).json({ error: 'Account not found' });
          }
          if (target.department_id !== user.department_id) {
            return res.status(403).json({ error: 'You can only manage accounts in your own department' });
          }
          return next();
        }

        // 4. Department permissions (only ADMIN)
        if (reqPerm.startsWith('departments:')) {
          if (hasPermission(reqPerm)) {
            return next();
          } else {
            return res.status(403).json({
              error: 'Forbidden - insufficient permission to manage departments'
            });
          }
        }
      }

      // Final fallback
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    } catch (err) {
      console.error('Permission middleware error:', err);
      next(err);
    }
  };
}

module.exports = requirePermission;