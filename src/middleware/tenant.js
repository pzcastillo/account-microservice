const jwt = require('jsonwebtoken');

function enforceTenant(req, res, next) {
  // SUPER_ADMIN bypass
  if (req.user?.role_name === 'SUPER_ADMIN') {
    req.tenant = { comp_code: null };        // null = see all companies
    return next();
  }

  // Everyone else: locked to their company
  if (!req.user?.comp_code) {
    return res.status(400).json({ message: "No company context" });
  }

  req.tenant = { comp_code: req.user.comp_code };
  next();
}

module.exports = enforceTenant;