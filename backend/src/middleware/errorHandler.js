const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body
    }
  }, 'Request error');

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  const errorResponse = {
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details 
      })
    }
  };

  res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
