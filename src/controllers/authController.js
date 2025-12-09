const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { usernameOrEmail, password, comp_code } = req.body;

    if (!usernameOrEmail || !password || !comp_code?.trim()) {
      return res.status(400).json({
        error: { message: 'usernameOrEmail, password and comp_code are required' }
      });
    }

    const result = await authService.login({
      usernameOrEmail: usernameOrEmail.trim(),
      password,
      comp_code: comp_code.trim().toUpperCase()
    });

    return res.json(result);
  } catch (err) {
    // Let error handler format it (or just forward)
    next(err);
  }
}

module.exports = { login };
