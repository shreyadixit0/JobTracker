import express from 'express';
import { ApplicationController } from '../controllers/applications.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { generalLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const applicationController = new ApplicationController();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(generalLimiter);

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: Get user's applications with filtering and pagination
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for company or position
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SAVED, APPLIED, PENDING, INTERVIEW, OFFER, HIRED, REJECTED]
 *         description: Filter by application status
 *       - in: query
 *         name: portal
 *         schema:
 *           type: string
 *           enum: [LINKEDIN, NAUKRI, INDEED, GLASSDOOR, GREENHOUSE, LEVER, WORKDAY, OTHER]
 *         description: Filter by job portal
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 */
router.get('/', validate(schemas.listApplications), applicationController.getApplications);

/**
 * @swagger
 * /applications/stats:
 *   get:
 *     summary: Get application statistics
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', applicationController.getStats);

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Create a new application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company
 *               - position
 *               - dateApplied
 *             properties:
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [SAVED, APPLIED, PENDING, INTERVIEW, OFFER, HIRED, REJECTED]
 *                 default: APPLIED
 *               portal:
 *                 type: string
 *                 enum: [LINKEDIN, NAUKRI, INDEED, GLASSDOOR, GREENHOUSE, LEVER, WORKDAY, OTHER]
 *                 default: OTHER
 *               dateApplied:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               resumeURL:
 *                 type: string
 *                 format: uri
 *               externalRef:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application created successfully
 */
router.post('/', validate(schemas.createApplication), applicationController.createApplication);

/**
 * @swagger
 * /applications/{id}:
 *   put:
 *     summary: Update an application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [SAVED, APPLIED, PENDING, INTERVIEW, OFFER, HIRED, REJECTED]
 *               portal:
 *                 type: string
 *                 enum: [LINKEDIN, NAUKRI, INDEED, GLASSDOOR, GREENHOUSE, LEVER, WORKDAY, OTHER]
 *               dateApplied:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               resumeURL:
 *                 type: string
 *                 format: uri
 *               externalRef:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated successfully
 */
router.put('/:id', validate(schemas.updateApplication), applicationController.updateApplication);

/**
 * @swagger
 * /applications/{id}:
 *   delete:
 *     summary: Delete an application
 *     tags: [Applications]
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
 *       200:
 *         description: Application deleted successfully
 */
router.delete('/:id', validate(schemas.idParam), applicationController.deleteApplication);

/**
 * @swagger
 * /applications/upload:
 *   post:
 *     summary: Upload resume file
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload', applicationController.uploadResume);

export default router;