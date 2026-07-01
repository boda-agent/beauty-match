/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.statusCode
    ? err.message
    : 'Внутрішня помилка сервера. Спробуйте пізніше.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}

module.exports = errorHandler;
