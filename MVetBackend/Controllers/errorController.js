const AppError = require("../Utils/appError");
const { logError } = require('../Utils/logUtils');

// Handle specific known errors
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${value}. Please use another ${field}!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err, req, res) => {
  console.log("Error",{status: err.status,
    statusCode:err.statusCode,
    message: err.message,
    errorType:err.errorType,
    stack: err.stack}
  )
  return res.status(err.statusCode).json({
    //error: err,
    status: err.status,
    statusCode:err.statusCode,
    message: err.message,
    errorType:err.errorType,
    stack: err.stack
    });
    
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    // Trusted error
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Unknown or programming error
  return res.status(500).json({
    status: 0,
    statusCode:500,
    message: 'Something went wrong. Please try again later.',
    errorType:"unknown Error"
  });
};

// Global error handler middleware
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  logError(err, req);

  err.statusCode = err.statusCode || 500;
 // err.status = err.status || 'error';alway the logic get error
  err.status = err.status ?? 0;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // if (error.name === 'CastError') error = handleCastErrorDB(error);
    // if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    // if (error.name === 'JsonWebTokenError') error = handleJWTError();
    // if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'CastError') {
  error = handleCastErrorDB(error);
  error.isOperational = true; // <-- added
}
if (error.code === 11000) {
  error = handleDuplicateFieldsDB(error);
  error.isOperational = true; // <-- added
}
if (error.name === 'ValidationError') {
  error = handleValidationErrorDB(error);
  error.isOperational = true; // <-- added
}
if (error.name === 'JsonWebTokenError') {
  error = handleJWTError();
  error.isOperational = true; // <-- added
}
if (error.name === 'TokenExpiredError') {
  error = handleJWTExpiredError();
  error.isOperational = true; // <-- added
}


    sendErrorProd(error, req, res);
  }
};
