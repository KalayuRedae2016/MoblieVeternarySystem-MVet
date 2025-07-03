const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../Models');
const { Op } = require('sequelize');
const User = db.User;

const catchAsync = require("../Utils/catchAsync")
const AppError = require("../Utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/formatDate")

const {processFileData,createMulterMiddleware, processUploadFiles} = require('../Utils/fileController');

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
  console.log("Requested User Role:", req.user.role);

  const { isActive } = req.query;
  let userQuery = {};

  if (req.user.role === "admin") {
    userQuery.role = "admin";
  } else if (req.user.role === "doctor") {
    userQuery.role = "doctor";
  } else {
    return next(new AppError("No Access/Authorized", 403));
  }

 if (typeof isActive !== 'undefined') {
  if (isActive === 'true' || isActive === true || isActive === 1 || isActive === '1') {
    userQuery.isActive = true;
  } else {
  userQuery.isActive = false;
  }
}

  console.log("UserQuery",userQuery)
 const users = await User.findAll({ where: userQuery });

  if (!users || users.length === 0) {
    return next(new AppError('No users found', 404));
  }

  // Initialize counters
  let activeUsers = 0,
      deactiveUsers = 0,
      activeDoctors = 0,
      deactiveDoctors = 0,
      adminUsers = 0;

  const formattedUsers = users.map(user => {
    if (user.isActive && user.role === "user") activeUsers++;
    if (!user.isActive && user.role === "user") deactiveUsers++;
    if (user.isActive && user.role === "doctor") activeDoctors++;
    if (!user.isActive && user.role === "doctor") deactiveDoctors++;
    if (user.role === "admin") adminUsers++;

    return {
      ...user.toJSON(),
      formattedCreatedAt: user.createdAt ? formatDate(user.createdAt) : null,
      formattedUpdatedAt: user.updatedAt ? formatDate(user.updatedAt) : null,
    };
  });

  res.status(200).json({
    status: 1,
    totalUsers: users.length,
    activeUsers,
    deactiveUsers,
    activeDoctors,
    deactiveDoctors,
    adminUsers,
    users: formattedUsers
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
  
  // const { imageData, attachmentsData } = await processFileData(user,"user");

  res.status(200).json({
    status: 1,
    message: `Profile fetched successfully!`,
    data: {
      ...user.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
    // imageData,
    // attachmentsData
  });
});


exports.updateUserProfile = catchAsync(async (req, res,next) => {
    const userId = req.params.id;
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return next(new AppError("User is not Found",400))
    }
    const originalUserData = JSON.parse(JSON.stringify(existingUser));

    let updateData ={... req.body};
    
    const {profileImage,attachments}=await processUploadFiles(req.files,req.body,existingUser)
  
    existingUser.set({
      ...req.body,
      profileImage: profileImage || existingUser.profileImage,
      attachments,
    });
    await existingUser.save();
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
  const { imageData, attachmentsData } = await processFileData(updatedUser,"user");
  
  const formattedCreatedAt = updatedUser.createdAt ? formatDate(updatedUser.createdAt) : null;
  const formattedUpdatedAt = updatedUser.updatedAt ? formatDate(updatedUser.updatedAt) : null;
  
  await logAction({
    model: 'users',
    action: 'Update',
    actor: req.user && req.user.id ? req.user.id : 'system',
    description: 'User Profie Updated',
    data: { userId: updatedUser.id,BeforeUpdate:originalUserData,updatedData:existingUser},
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
    severity: 'info',
    sessionId: req.session?.id || 'generated-session-id',
  });

    res.status(200).json({
      status: 1,
      message: `${updatedUser.fullName} updated successfully`,
      updatedUser: {
        ...updatedUser._doc,
        formattedCreatedAt,
        formattedUpdatedAt
      },
      imageData,
      attachmentsData, // Add the attachments data in the response
    });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id)
  if (!deletedUser) {
    return next(new AppError("user entry not found", 404))
  }

  await logAction({
    model: 'users',
    action: 'Delete',
    actor: req.user && req.user.id ? req.user.id : 'system',
    description: 'User Profie Deleted',
    data: { userId: deletedUser.id,deletedUser},
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
    severity: 'info',
    sessionId: req.session?.id || 'generated-session-id',
  });

  res.status(200).json({
    status: 'success',
    //data: null,
    message: `User Deleted`
  });
});
exports.deleteUsers = catchAsync(async (req, res, next) => {
  const deletedUsers= await User.deleteMany({});  // Deletes all documents
  if (deletedUsers.deletedCount === 0) {
    return next(new AppError("No User entries found to delete", 404));
  }
  res.status(200).json({
    status: 'success',
    message: `${deletedUsers.deletedCount} Users Deleted`
  });
});

exports.sendEmailMessages = catchAsync(async (req, res, next) => {
  const { emailList, subject, message } = req.body;

  // Ensure subject and message are provided
  if (!subject && !message) {
    return next(new AppError('Subject and message are required', 400));
  }

  // Validate emailList is an array if provided
  if (emailList && !Array.isArray(emailList)) {
    return next(new AppError('emailList must be an array', 400));
  }

  let users;
  if (emailList && emailList.length > 0) {
    // Validate and filter emails in emailList
    const validEmails = emailList.filter(email => validator.isEmail(email));
    if (validEmails.length === 0) {
      return next(new AppError('No valid email addresses found in the provided list', 400));
    }
    users = await User.find({ email: { $in: validEmails } }, { email: 1, fullName: 1 }).sort({ createdAt: 1 });
  } else {
    // Fetch all users with valid emails
    users = await User.find({ email: { $ne: null } }, { email: 1, fullName: 1 }).sort({ createdAt: 1 });
  }

  // Handle case where no users are found
  if (!users || users.length === 0) {
    return next(new AppError('No users found with valid email addresses', 404));
  }

  // Prepare email sending promises
  const emailPromises = users.map(user => {
    const emailSubject = subject || 'Welcome to Our Platform, Bana Mole Marketing Group!';
    const emailMessage = message
      ? `Dear ${user.fullName},\n\n${message}`
      : `Hi ${user.fullName},\n\nWelcome to Our Platform! We're excited to have you on board.\n\nPlease use the following link to access our platform:\n- Login Link: ${
          process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://banapvs.com'
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



