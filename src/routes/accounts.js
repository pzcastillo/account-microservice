const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const controller = require('../controllers/accountController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const requirePermission = require('../middleware/permission');

/**
 * @swagger
 * tags:
 *   - name: Accounts
 *     description: Employee account management (supports UUID and emp_id)
 */

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new employee account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emp_id
 *               - fullname
 *               - username
 *               - email
 *               - password
 *             properties:
 *               emp_id:
 *                 type: string
 *                 example: EMP042
 *                 description: Human-readable employee ID
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               department_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Optional department assignment (null = no department)
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               user_type_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Account created successfully
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  requirePermission(['accounts:create', 'accounts:create:own-dept']),
  [
    body('emp_id')
      .notEmpty().withMessage('emp_id is required')
      .isLength({ min: 3, max: 50 })
      .matches(/^[A-Z0-9\-_]+$/i).withMessage('emp_id: only letters, numbers, hyphen, underscore'),
    body('fullname').notEmpty(),
    body('username').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    
    body('department_id')
      .optional({ nullable: true })
      .isUUID(4)
      .withMessage('department_id must be a valid UUID (or null)'),
    
    body('role_id').optional().isUUID(4),
    body('user_type_id').optional().isUUID(4),
    validate
  ],
  controller.createAccount
);

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: List all accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by fullname, username, email, or emp_id
 *     responses:
 *       200:
 *         description: List of accounts
 */
router.get(
  '/',
  authenticate,
  requirePermission(['accounts:read', 'accounts:read_own', 'accounts:read:own-dept']),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('search').optional().trim(),
    validate
  ],
  controller.listAccounts
);

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200: { description: Account found }
 *       403: { description: Forbidden }
 *       404: { description: Account not found }
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(['accounts:read', 'accounts:read_own', 'accounts:read:own-dept']),
  [param('id').isUUID(4).withMessage('Invalid UUID'), validate],
  controller.getAccount
);

/**
 * @swagger
 * /accounts/emp/{empId}:
 *   get:
 *     summary: Get account by employee ID (emp_id)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empId
 *         required: true
 *         schema:
 *           type: string
 *         example: EMP042
 *     responses:
 *       200: { description: Account found }
 *       403: { description: Forbidden }
 *       404: { description: Account not found }
 */
router.get(
  '/emp/:empId',
  authenticate,
  requirePermission(['accounts:read', 'accounts:read_own', 'accounts:read:own-dept']),
  [param('empId').notEmpty().isLength({ min: 3, max: 50 }).matches(/^[A-Z0-9\-_]+$/i), validate],
  controller.getAccount
);

/**
 * @swagger
 * /accounts/{id}:
 *   put:
 *     summary: Update account by UUID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emp_id: { type: string }
 *               fullname: { type: string }
 *               username: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *               department_id: { type: string, format: uuid, nullable: true }
 *               role_id: { type: string, format: uuid }
 *               user_type_id: { type: string, format: uuid }
 *               status: { type: string, enum: [active, disabled] }
 *     responses:
 *       200: { description: Account updated }
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(['accounts:update', 'accounts:update_own', 'accounts:update:own-dept']),
  [
    param('id').isUUID(4),
    body('emp_id').optional().isLength({ min: 3, max: 50 }).matches(/^[A-Z0-9\-_]+$/i),
    body('fullname').optional().notEmpty(),
    body('username').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('password').optional().isLength({ min: 8 }),
    
    // Allow null on update
    body('department_id')
      .optional({ nullable: true })
      .isUUID(4)
      .withMessage('department_id must be a valid UUID (or null allowed)'),
    
    body('role_id').optional().isUUID(4),
    body('user_type_id').optional().isUUID(4),
    body('status').optional().isIn(['active', 'disabled']),
    validate
  ],
  controller.updateAccount
);

/**
 * @swagger
 * /accounts/emp/{empId}:
 *   put:
 *     summary: Update account by emp_id
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emp_id: { type: string }
 *               fullname: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               department_id: { type: string, format: uuid }
 *               role_id: { type: string, format: uuid }
 *               status: { type: string, enum: [active, disabled] }
 *     responses:
 *       200: { description: Account updated }
 */
router.put(
  '/emp/:empId',
  authenticate,
  requirePermission(['accounts:update', 'accounts:update_own', 'accounts:update:own-dept']),
  [
    param('empId').notEmpty().isLength({ min: 3, max: 50 }).matches(/^[A-Z0-9\-_]+$/i),
    body('emp_id').optional().isLength({ min: 3, max: 50 }).matches(/^[A-Z0-9\-_]+$/i),
    validate
  ],
  controller.updateAccount
);

/**
 * @swagger
 * /accounts/{id}/disable:
 *   patch:
 *     summary: Disable account by UUID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Account disabled }
 *       403: { description: Forbidden }
 *       404: { description: Account not found }
 */
router.patch(
  '/:id/disable',
  authenticate,
  requirePermission(['accounts:disable', 'accounts:disable:own-dept']),
  [param('id').isUUID(4), validate],
  controller.disableAccount
);

/**
 * @swagger
 * /accounts/emp/{empId}/disable:
 *   patch:
 *     summary: Disable account by emp_id
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Account disabled }
 *       403: { description: Forbidden }
 *       404: { description: Account not found }
 */
router.patch(
  '/emp/:empId/disable',
  authenticate,
  requirePermission(['accounts:disable', 'accounts:disable:own-dept']),
  [param('empId').notEmpty().matches(/^[A-Z0-9\-_]+$/i), validate],
  controller.disableAccount
);

/**
 * @swagger
 * /accounts/{id}:
 *   delete:
 *     summary: Permanently delete account by UUID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Account deleted }
 *       403: { description: Forbidden }
 *       404: { description: Account not found }
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(['accounts:delete']),
  [param('id').isUUID(4), validate],
  controller.deleteAccount
);

/**
 * @swagger
 * /accounts/emp/{empId}:
 *   delete:
 *     summary: Permanently delete account by emp_id
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Account deleted }
 *       403: { description: Forbidden }
 *       404: { description: Account not found }
 */
router.delete(
  '/emp/:empId',
  authenticate,
  requirePermission(['accounts:delete']),
  [param('empId').notEmpty().matches(/^[A-Z0-9\-_]+$/i), validate],
  controller.deleteAccount
);

module.exports = router;