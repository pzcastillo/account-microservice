const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const router = express.Router();
const controller = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');

router.post(
  '/login',
  [
    body('usernameOrEmail').notEmpty().withMessage('usernameOrEmail is required'),
    body('password').notEmpty().withMessage('password is required'),
    validate
  ],
  controller.login
);

module.exports = router;