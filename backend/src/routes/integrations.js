import express from 'express';
import { IntegrationController } from '../controllers/integrations.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { integrationLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const integrationController = new IntegrationController();

// Apply rate limiting to all integration routes
router.use(integrationLimiter);

// Google OAuth routes
/**
 * @swagger
 * /integrations/google/connect:
 *   get:
 *     summary: Initiate Google OAuth connection
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth
 */
router.get('/google/connect', authenticateToken, integrationController.connectGoogle);

/**
 * @swagger
 * /integrations/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with success/error status
 */
router.get('/google/callback', integrationController.googleCallback);

/**
 * @swagger
 * /integrations/google/sync:
 *   post:
 *     summary: Manually trigger Google email sync
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync initiated successfully
 */
router.post('/google/sync', authenticateToken, integrationController.syncGoogle);

/**
 * @swagger
 * /integrations/google:
 *   delete:
 *     summary: Disconnect Google account
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google account disconnected successfully
 */
router.delete('/google', authenticateToken, integrationController.disconnectGoogle);

// Microsoft OAuth routes
/**
 * @swagger
 * /integrations/microsoft/connect:
 *   get:
 *     summary: Initiate Microsoft OAuth connection
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects to Microsoft OAuth
 */
router.get('/microsoft/connect', authenticateToken, integrationController.connectMicrosoft);

/**
 * @swagger
 * /integrations/microsoft/callback:
 *   get:
 *     summary: Microsoft OAuth callback
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with success/error status
 */
router.get('/microsoft/callback', integrationController.microsoftCallback);

/**
 * @swagger
 * /integrations/microsoft/sync:
 *   post:
 *     summary: Manually trigger Microsoft email sync
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync initiated successfully
 */
router.post('/microsoft/sync', authenticateToken, integrationController.syncMicrosoft);

/**
 * @swagger
 * /integrations/microsoft:
 *   delete:
 *     summary: Disconnect Microsoft account
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Microsoft account disconnected successfully
 */
router.delete('/microsoft', authenticateToken, integrationController.disconnectMicrosoft);

export default router;