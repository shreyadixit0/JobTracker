import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

// Import routes
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import integrationRoutes from './routes/integrations.js';
import healthRoutes from './routes/health.js';

// Import middleware
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/requestLogger.js';

// Import configuration
import { redisConfig } from './config/redis.js';
import { swaggerOptions } from './docs/swagger.js';

// Import job scheduler
import './jobs/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Swagger setup
const specs = swaggerJSDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Request logging with unique IDs
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms [:date[clf]] - :req[x-request-id]'));
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/applications', applicationRoutes);
app.use('/integrations', integrationRoutes);
app.use('/health', healthRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Job Tracker API running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/docs`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});

export default app;