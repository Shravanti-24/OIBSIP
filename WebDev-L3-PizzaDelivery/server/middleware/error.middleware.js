import { ApiError } from '../utils/ApiError.js';
import { isProduction } from '../config/env.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : err.statusCode || 500;

  if (!isApiError && statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction ? 'Internal server error' : err.message,
    ...(err.details ? { details: err.details } : {}),
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
