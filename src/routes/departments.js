const express = require('express');
const router = express.Router();
const controller = require('../controllers/departmentController');
const requirePermission = require('../middleware/permission');
const authenticate = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department management
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: List all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department_id:
 *                     type: string
 *                   department_name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   updated_at:
 *                     type: string
 */
router.get(
  '/', 
  authenticate, 
  requirePermission(['departments:get']), 
  controller.getAll
);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get a department by ID
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department object
 *       404:
 *         description: Department not found
 */
router.get(
  '/:id', 
  authenticate, 
  requirePermission(['departments:get:id']), 
  controller.getById
);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department_name
 *             properties:
 *               department_name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Department created
 */
router.post(
  '/',
  authenticate,
  requirePermission(['departments:create', 'accounts:create:own-dept']),
  controller.create
);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update a department by ID
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated department
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(['departments:update']),
  controller.update
);

/**
 * @swagger
 * /departments/{id}/status:
 *   patch:
 *     summary: Update department status (active/inactive)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Updated status
 */
router.patch(
  '/:id/status', 
  authenticate, 
  requirePermission(['departments:patch:status']), 
  controller.updateStatus
);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Delete a department by ID
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       204:
 *         description: Department deleted
 */
router.delete(
  '/:id', 
  authenticate, 
  requirePermission(['departments:delete']), 
  controller.remove
);

module.exports = router;
