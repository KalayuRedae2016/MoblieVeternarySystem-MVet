// const Log = require('../Models/logModel');
// const AppError = require('./appError');
// const catchAsync = require('./catchAsync');

// // Log user/system actions
// exports.logAction = catchAsync(async ({
//   model,
//   action,
//   actor,
//   description = 'No description provided',
//   data = {},
//   ipAddress = null,
//   severity = 'info',
//   sessionId = null
// }) => {
//   console.log('Logging Action:', { model, action, actor, description, data, ipAddress, severity, sessionId });

//   if (!model || !action || !actor) {
//     throw new AppError('Model, action, and actor are required for logging.', 400);
//   }

//   const affectedData = typeof data === 'string' ? data : JSON.stringify(data);

//   await Log.create({
//     model,
//     action,
//     actor,
//     description,
//     affectedData,
//     ipAddress,
//     severity,
//     sessionId,
//   });

//   console.log(`[${severity.toUpperCase()}] ${model} - ${action}: Log saved.`);
// });

// // Log errors from requests
// exports.logError = catchAsync(async (error, req) => {
//     const affectedData = JSON.stringify({
//       stack: error.stack,
//       method: req.method,
//       route: req.originalUrl,
//       headers: req.headers,
//       body: req.body,
//     });

//     await Log.create({
//       model: 'error',
//       action: 'error',
//       actor: req.user?.id || 'system',
//       description: error.message,
//       affectedData,
//       ipAddress: req.ip,
//       severity: 'error',
//     });
// console.error(`[ERROR] ${error.message} - ${req.originalUrl}`);
// });
