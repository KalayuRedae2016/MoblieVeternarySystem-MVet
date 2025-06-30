const bcrypt = require('bcrypt');
const sharp = require('sharp');
const User = require('./../Models/userModel');
const Log = require('./../Models/logModel');
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const xlsx = require('xlsx'); 
const mongoose=require("mongoose")

const { sendEmail } = require('../utils/email');
const {logAction}=require("../utils/logUtils")
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { formatDate } = require("../utils/formatDate")
const {validateExistence}=require("../utils/validateExistence")
const {normalizePhoneNumber}=require("../utils/userUtils")
const { isUserCompliant } = require('../utils/checkCompliance');

const defaultVariables = require('../config/defaultVariables');
const {processFileData,createMulterMiddleware, processUploadFiles,deleteFile} = require('../utils/fileController');
const { param } = require('../routes/userRouter');

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
   console.log("requsted User",req.user.role)

  const { isActive } = req.query;
  let userQuery = {};
  if(req.user.role==="SuperAdmin"){
    userQuery.role={$in:["SuperAdmin","Admin","Broker","Buyer","Seller","Guest"]}
  }else if(req.user.role==="Admin"){
    userQuery.role={$in:["Admin","Broker","Buyer","Seller","Guest"]}
  }else if(req.user.role==="Broker"){
    userQuery.role={$in:["Buyer","Seller","Guest"]}
    userQuery.referredBy=req.user._id
  }else{
    userQuery._id=req.user._id
  }
 
  if (typeof isActive !== 'undefined') {
  userQuery.isActive = isActive === 'true'; // supports ?isActive=true or false
}

  const users = await User.find(userQuery).lean();
  if (!users) {
    return next(new AppError('No users found', 404));
  }

  let activeUsers,deactiveUsers,blockedUsers,adminUsers,brokerUsers,buyerUsers,SellerUsers,GuestUsers=0

  // Format createdAt and updatedAt for each user
  const formattedUsers = users.map(user => {
    if (user.isActive && user.role ===!"SuperAdmin"|| user.role ===!"Admin") activeUsers++;
    if (!user.isActive) deactiveUsers++;
    if (!user.isBlocked) blockedUsers++;
    if (["SuperAdmin", "Admin"].includes(user.role)) adminUsers++;
    if(user.role ==="Broker") brokerUsers++;
    if(user.role ==="Buyer") buyerUsers++;
    if(user.role ==="Seller") SellerUsers++;
    if(user.role ==="Broker") brokerUsers++;
    if(user.role ==="Guest") GuestUsers++;
    
    return {
      ...user,
      formattedCreatedAt: user.createdAt ? formatDate(user.createdAt) : null,
      formattedUpdatedAt: user.updatedAt ? formatDate(user.updatedAt) : null,
    };
  });

  res.status(200).json({
    status: 1,
    totalUsers: users.length,
    activeUsers,
    deactiveUsers,
    blockedUsers,
    buyerUsers,
    SellerUsers,
    GuestUsers,
    users: formattedUsers
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  console.log("herre")
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const {completionRate,nonCompletionRate,filledFields,missingFields} = user.getProfileCompletionRate();

  // const { imageData, attachmentsData } = await processFileData(user,"user");
  
  const formattedCreatedAt = user.createdAt ? formatDate(user.createdAt) : null;
  const formattedUpdatedAt = user.updatedAt ? formatDate(user.updatedAt) : null;

  res.status(200).json({
    status: 1,
    message: completionRate < 100 ? `Please complete your profile:>${missingFields}` : 'Profile completed!',
    data: {
      ...user._doc,
      pofileCompletionRate: `${completionRate}%`,
      notProfileCompletionRate: `${nonCompletionRate}%`,
      filledFields,
      missingFields,
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



