const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

async function authenticate(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = auth.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwt.secret);

    const userId = payload.sub;
    const tokenCompCode = payload.comp_code;

    if (!userId || !tokenCompCode) {
      return res.status(401).json({ error: 'Invalid token - missing user or company' });
    }

    const q = `
      SELECT 
        a.id, a.emp_id, a.fullname, a.username, a.email,
        a.department_id, a.status, a.role_id, a.user_type_id, a.comp_code,
        ut.type_name AS user_type_name,
        r.role_name AS role_name
      FROM accounts a
      LEFT JOIN user_types ut ON a.user_type_id = ut.id
      LEFT JOIN roles r ON a.role_id = r.id
      WHERE a.id = $1
        AND a.comp_code = $2
        AND a.status = 'active'
    `;

    const result = await db.tQuery(q, [userId], tokenCompCode);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid token - user not found, disabled, or company mismatch' });
    }

    const user = result.rows[0];

    user.role_name = (user.role_name || 'EMPLOYEE').toUpperCase();
    user.user_type_name = (user.user_type_name || '').toUpperCase();

    // Attach to request
    req.user = {
      id: user.id,
      emp_id: user.emp_id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      department_id: user.department_id,
      role_id: user.role_id,
      user_type_id: user.user_type_id,
      role_name: user.role_name,
      user_type_name: user.user_type_name,
      comp_code: user.comp_code,
      status: user.status
    };

    req.tenant = { comp_code: user.comp_code };   // for departments & accounts need this
    req.user.comp_code = user.comp_code;          // req.user.comp_code

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = authenticate;