export const errorHandler = (err, req, res, next) => {
  // Log error with request ID
  console.error(`[${req.id}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = {
      code: 'VALIDATION_ERROR',
      message: err.message,
    };
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse.error = {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    };
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse.error = {
      code: 'FORBIDDEN',
      message: 'Access denied',
    };
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorResponse.error = {
      code: 'NOT_FOUND',
      message: err.message || 'Resource not found',
    };
  } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorResponse.error = {
      code: 'SERVICE_UNAVAILABLE',
      message: 'External service unavailable',
    };
  }

  // Include request ID in response for debugging
  if (process.env.NODE_ENV === 'development') {
    errorResponse.requestId = req.id;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Custom error classes
export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}