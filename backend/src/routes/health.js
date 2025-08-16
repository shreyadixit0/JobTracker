import express from 'express';
import { supabase } from '../config/supabase.js';
import redis from '../config/redis.js';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     uptime:
 *                       type: number
 *                     services:
 *                       type: object
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      }
    }
  };

  try {
    // Check Supabase connection
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    healthCheck.services.database = dbError ? 'unhealthy' : 'healthy';

    // Check Redis connection
    const redisStatus = await redis.ping();
    healthCheck.services.redis = redisStatus === 'PONG' ? 'healthy' : 'unhealthy';

    // Determine overall health
    const allServicesHealthy = Object.values(healthCheck.services).every(
      service => typeof service === 'object' || service === 'healthy'
    );

    if (!allServicesHealthy) {
      healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: healthCheck.status === 'healthy',
      data: healthCheck
    });

  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.error = error.message;

    res.status(503).json({
      success: false,
      data: healthCheck
    });
  }
});

export default router;