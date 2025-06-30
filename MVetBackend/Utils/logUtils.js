// const Log=require('../Models/logModel')
// const AppError = require('./appError')
// const catchAsync = require('./catchAsync')

// exports.logAction = catchAsync(async ({ model, action, actor, description = 'No description provided', data = {}, ipAddress = null, severity = 'info', sessionId = null }) => {
//     console.log('Logging Action:');
//     console.log('Model:', model);
//     console.log('Action:', action);
//     console.log('Actor:', actor);
//     console.log('Description:', description);
//     console.log('Data:', data);
//     console.log('IPAddress:', ipAddress);
//     console.log('Severity:', severity);
//     console.log('Session ID:', sessionId);
  
//     if (!model || !action || !actor) {
//       throw new AppError('Model, action, and actor are required for logging.', 400);
//     }
  
//     const log = new Log({
//       model,
//       action,
//       actor,
//       description,
//       // affectedData: JSON.stringify(data),
//       affectedData: typeof data === 'string' ? JSON.parse(data) : JSON.stringify(data),
//       ipAddress,
//       severity,
//       sessionId,
//     });
  
//     await log.save();
//     console.log(`[${severity.toUpperCase()}] ${model} - ${action}: Log saved.`);
//   });
  
// exports.logError = async (error, req) => {
//     try {
//       const log = new Log({
//         model: 'error',
//         action: 'error',
//         actor: req.user?.id || 'system',
//         description: error.message,
//         affectedData: JSON.stringify({
//           stack: error.stack,
//           method: req.method,
//           route: req.originalUrl,
//           headers: req.headers,
//           body: req.body,
//         }),
//         ipAddress: req.ip,
//         severity: 'error',
//       });
  
//       await log.save();
//       console.error(`[ERROR] ${error.message} - ${req.originalUrl}`);
//     } catch (err) {
//       console.error(`Failed to log error: ${err.message}`);
//     }
//   };
  