class AppError extends Error {
  constructor(message, statusCode, option = null) {
    super(message);

    this.statusCode = statusCode;
    // this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.status = 0; // Always 0 for all errors
    this.errorType = `${statusCode}`.startsWith('4') ? 'failed-Client Error' : 'error-Server Error';
    this.option = option;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
