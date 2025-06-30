const AppError = require("../Utils/appError");
// const { logError } = require('../Utils/logUtils');
const { ValidationError, UniqueConstraintError, DatabaseError } = require('sequelize');

// Sequelize-specific handlers
const handleSequelizeValidationError = (err) => {
  const messages = err.errors.map(e => e.message);
  const message = `Validation error: ${messages.join('. ')}`;
  return new AppError(message, 400);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors[0]?.path || 'field';
  const value = err.errors[0]?.value || '';
  const message = `Duplicate field value: ${value}. Please use another ${field}!`;
  return new AppError(message, 400);
};

const handleSequelizeDatabaseError = (err) => {
  const message = `Database error: ${err.message}`;
  return new AppError(message, 500);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err, req, res) => {
  console.error('Error:', {
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    errorType: err.errorType,
    stack: err.stack
  });

  return res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    errorType: err.errorType,
    stack: err.stack
  });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  return res.status(500).json({
    status: 0,
    statusCode: 500,
    message: 'Something went wrong. Please try again later.',
    errorType: 'Unknown error'
  });
};

// Global error handler middleware
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // logError(err, req);adjust after you create log model

  err.statusCode = err.statusCode || 500;
  err.status = err.status ?? 0;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message };

    // Sequelize errors
    if (err instanceof ValidationError) {
      error = handleSequelizeValidationError(err);
      error.isOperational = true;
    } else if (err instanceof UniqueConstraintError) {
      error = handleSequelizeUniqueConstraintError(err);
      error.isOperational = true;
    } else if (err instanceof DatabaseError) {
      error = handleSequelizeDatabaseError(err);
      error.isOperational = true;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
      error.isOperational = true;
    }

    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
      error.isOperational = true;
    }

    sendErrorProd(error, req, res);
  }
};
