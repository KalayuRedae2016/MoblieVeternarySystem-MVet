const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { Animal, User, MedicalVisit } = require('../Models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const logger = require('../Utils/logger');
 
const catchAsync = require("../Utils/catchAsync")
const AppError = require("../Utils/appError")
require('dotenv').config();
const { formatDate } = require("../Utils/formatDate")

const {createMulterMiddleware,processUploadFilesToSave} = require('../Utils/fileController');

// Configure multer for user file uploads
const userFileUpload = createMulterMiddleware(
  'uploads/importedUsers/', // Destination folder
  'User', // Prefix for filenames
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] // Allowed file types
);

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware for handling single file upload
exports.uploadUserFile = userFileUpload.single('file');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  console.log("🧠 getAllUsers controller running");
  console.log("req.query", req.query);
  console.log("req.user", req.user.role);

  const { isActive } = req.query;
  const where = {};

  if (req.user.role === "admin") {
    // Admins can see all users
  } else if (req.user.role === "doctor") {
    where.role = "user";
  } else if (req.user.role === "user") {
    return next(new AppError("Access denied: Users can only view their own profile", 403));
  }

  if (req.user.role === "admin" && typeof isActive !== "undefined") {
    where.isActive = isActive === "true";
  }

  const users = await User.findAll({
    where,
    raw: true,
  });

  if (!users.length) return next(new AppError("No users found", 404));

  const processedUsers = users.map(user => ({
    ...user,
    isActive:Boolean(user.isActive),
    changePassword: Boolean(user.changePassword),
  }));

  // Grouping stats
  const stats = {
    adminUsers: [],
    activePhysians: [],
    nonActivePhysians: [],
    owners: [],
  };

  for (const u of processedUsers) {
    if (u.role === "admin") stats.adminUsers.push(u);
    if (u.role === "doctor") {
      u.isActive ? stats.activePhysians.push(u) : stats.nonActivePhysians.push(u);
    }
    if (u.role === "user" && u.isActive) stats.owners.push(u);
  }

  res.status(200).json({
    status: 1,
    totalUsers: processedUsers.length,
    adminCount: stats.adminUsers.length,
    activePhysiansCount: stats.activePhysians.length,
    nonActivePhysiansCount: stats.nonActivePhysians.length,
    ownersCount: stats.owners.length,
    ...stats,
  });
});


exports.getUser = catchAsync(async (req, res, next) => {
  let userId = req.user.id; // default: self-access

  // Admins can access any user
  if (req.user.role === "admin") {
    userId = req.params.userId;
  }

  // Doctors can access- their own data, users' (patients') data,not other doctors/admins
  if (req.user.role === "doctor") {
    const targetUserId = req.params.userId;
    if (targetUserId && targetUserId !== req.user.id) {
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser) {
        return next(new AppError('User not found', 404));
      }

      // Doctors can only view users (patients), not other doctors or admins
      if (targetUser.role !== "user") {
        return next(new AppError("Access denied: You can only view user (patient) profiles.", 403));
      }

      userId = targetUserId;
    }
  }

  // Normal users can only view their own data (already set above)
  const user = await User.findByPk(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const formattedCreatedAt = user.createdAt ? formatDate(user.createdAt) : null;
  const formattedUpdatedAt = user.updatedAt ? formatDate(user.updatedAt) : null;
  
  res.status(200).json({
    status: 1,
    message: `Profile fetched successfully!`,
    data: {
      ...user.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
  });
});

exports.updateUserProfile = catchAsync(async (req, res, next) => {
  logger.info(`Request body from mobile y:\n${JSON.stringify(req.body, null, 2)}`);
  logger.info(`Request query from mobile y:\n${JSON.stringify(req.params, null, 2)}`);
  
  const targetUserId = req.params.userId;

  // Role-based access control
  if (req.user.role === 'user' && req.user.id !== targetUserId) {
    return next(new AppError("Access denied: You can only update your own profile", 403));
  }

  if (req.user.role === 'doctor') {
    if (req.user.id !== targetUserId) {
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser || targetUser.role !== 'user') {
        return next(new AppError("Access denied: Doctors can only update their own or user (patient) profiles", 403));
      }
    }
  }

  const existingUser = await User.findByPk(targetUserId);
  if (!existingUser) {
    return next(new AppError("User not found", 404));
  }

  const originalUserData = JSON.parse(JSON.stringify(existingUser));
  
  let {profileImage}= await processUploadFilesToSave(req,req.files, req.body, existingUser)
  if(!profileImage){
    profileImage=existingUser.profileImage
  }
  // Process uploads
  
  // Merge update fields
  const updateData = {
    ...req.body,
    profileImage
  };

  // Update user
  await existingUser.update(updateData);

  // Fetch latest version
  const updatedUser = await User.findByPk(targetUserId);

  // Format timestamps
  const formattedCreatedAt = updatedUser.createdAt ? formatDate(updatedUser.createdAt) : null;
  const formattedUpdatedAt = updatedUser.updatedAt ? formatDate(updatedUser.updatedAt) : null;

  // // Log update
  // await logAction({
  //   model: 'users',
  //   action: 'Update',
  //   actor: req.user?.id || 'system',
  //   description: 'User profile updated',
  //   data: {
  //     userId: updatedUser.id,
  //     beforeUpdate: originalUserData,
  //     updatedData: updateData,
  //   },
  //   ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
  //   severity: 'info',
  //   sessionId: req.session?.id || 'generated-session-id',
  // });

  res.status(200).json({
    status: 1,
    message: `${updatedUser.name} updated successfully`,
    updatedUser: {
      ...updatedUser.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt,
    },
   
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = parseInt(req.params.userId, 10); // ensure it's an integer

  const deletedCount = await User.destroy({ where: { id: userId } });

  if (deletedCount === 0) {
    return next(new AppError("User entry not found", 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

exports.deleteUsers = catchAsync(async (req, res, next) => {
  const deletedCount = await User.destroy({
    where: {}, // No condition = delete all rows
  });

  if (deletedCount === 0) {
    return next(new AppError("No user entries found to delete", 404));
  }

  //🧹 Delete profile image from disk
  //🧹 log action
  res.status(200).json({
    status: 'success',
    message: `${deletedCount} users deleted`,
  });
});

exports.activateDeactivateUser = catchAsync(async (req, res, next) => {
  
  logger.info(`Request body from mobile y:\n${JSON.stringify(req.body, null, 2)}`);
  logger.info(`Request query from mobile y:\n${JSON.stringify(req.params, null, 2)}`);

  const userId = parseInt(req.params.userId, 10);
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return next(new AppError("isActive must be a boolean", 400));
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Update user's active status
  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      userId: user.id,
      isActive: user.isActive,
    },
  });
})
exports.sendEmailMessages = catchAsync(async (req, res, next) => {
  const { emailList, subject, message } = req.body;

  if (!subject && !message) {
    return next(new AppError('Subject and message are required', 400));
  }

  if (emailList && !Array.isArray(emailList)) {
    return next(new AppError('emailList must be an array', 400));
  }

  let users;

  if (emailList && emailList.length > 0) {
    const validEmails = emailList.filter(email => validator.isEmail(email));
    if (validEmails.length === 0) {
      return next(new AppError('No valid email addresses found in the provided list', 400));
    }

    users = await User.findAll({
      where: {email: {[Op.in]: validEmails}},
      attributes: ['email', 'name'],
      order: [['createdAt', 'ASC']]
    });
  } else {
    users = await User.findAll({
      where: {email: {[Op.ne]: null}},
      attributes: ['email', 'name'],
      order: [['createdAt', 'ASC']]
    });
  }

  if (!users || users.length === 0) {
    return next(new AppError('No users found with valid email addresses', 404));
  }

  const emailPromises = users.map(user => {
    const emailSubject = subject || 'Welcome to Our Platform, Grand Technology System!';
    const emailMessage = message
      ? `Dear ${user.name},\n\n${message}`
      : `Hi ${user.name},\n\nWelcome to Our Platform! We're excited to have you on board.\n\nPlease use the following link to access our platform:\n- Login Link: ${
          process.env.NODE_ENV === 'development' ? 'http://localhost:8085' : 'https://mvet.com'
        }\n\nIf you have any questions or need assistance, feel free to contact our support team.\n\nBest regards,\nThe Bana Marketing Group Team`;

    return sendEmail({ email: user.email, subject: emailSubject, message: emailMessage });
  });

  try {
    await Promise.all(emailPromises);
    res.status(200).json({
      status: 1,
      message: 'Emails sent successfully to users with valid emails.',
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return next(new AppError('Failed to send one or more emails', 500));
  }
});


