import { z } from 'zod';

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
    })
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    })
  }),

  // Application schemas
  createApplication: z.object({
    body: z.object({
      company: z.string().min(1, 'Company name is required'),
      position: z.string().min(1, 'Position is required'),
      status: z.enum(['SAVED', 'APPLIED', 'PENDING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).default('APPLIED'),
      portal: z.enum(['LINKEDIN', 'NAUKRI', 'INDEED', 'GLASSDOOR', 'GREENHOUSE', 'LEVER', 'WORKDAY', 'OTHER']).default('OTHER'),
      dateApplied: z.string().transform((str) => new Date(str)),
      notes: z.string().optional(),
      resumeURL: z.string().url().optional(),
      externalRef: z.string().optional(),
    })
  }),

  updateApplication: z.object({
    params: z.object({
      id: z.string().uuid('Invalid application ID'),
    }),
    body: z.object({
      company: z.string().min(1, 'Company name is required').optional(),
      position: z.string().min(1, 'Position is required').optional(),
      status: z.enum(['SAVED', 'APPLIED', 'PENDING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).optional(),
      portal: z.enum(['LINKEDIN', 'NAUKRI', 'INDEED', 'GLASSDOOR', 'GREENHOUSE', 'LEVER', 'WORKDAY', 'OTHER']).optional(),
      dateApplied: z.string().transform((str) => new Date(str)).optional(),
      notes: z.string().optional(),
      resumeURL: z.string().url().optional(),
      externalRef: z.string().optional(),
    })
  }),

  // Query schemas
  listApplications: z.object({
    query: z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      portal: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      page: z.string().transform((str) => parseInt(str) || 1).optional(),
      limit: z.string().transform((str) => Math.min(parseInt(str) || 10, 100)).optional(),
      sort: z.string().optional(),
    })
  }),

  // ID parameter schema
  idParam: z.object({
    params: z.object({
      id: z.string().uuid('Invalid ID format'),
    })
  }),
};