export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`[${req.id}] ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.id}] Response: ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// Sanitize sensitive data from logs
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};