const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const router = express.Router();
const controller = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - usernameOrEmail
 *         - password
 *       properties:
 *         usernameOrEmail:
 *           type: string
 *           example: johndoe or john.doe@example.com
 *           description: Can be either username or email
 *         password:
 *           type: string
 *           format: password
 *           example: P@ssw0rd123
 *           minLength: 6
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Invalid credentials
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get JWT token
 *     tags: [Auth]
 *     description: Authenticates a user with username/email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post(
  '/login',
  [
    body('usernameOrEmail')
      .notEmpty()
      .withMessage('usernameOrEmail is required')
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('password is required')
      .isLength({ min: 6 })
      .withMessage('password must be at least 6 characters long'),
    validate,
  ],
  controller.login
);

module.exports = router;