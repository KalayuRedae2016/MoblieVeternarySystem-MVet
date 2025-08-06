const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const db = require('../Models');
const { Op, where } = require('sequelize');
const User = db.User;

const catchAsync = require("../Utils/catchAsync")
const AppError = require("../Utils/appError")
require('dotenv').config();


const { sendEmail, sendWelcomeEmail } = require('../Utils/email');
const { formatDate } = require("../Utils/formatDate")
// const {logAction}=require("../Utils/logUtils")
const { deleteFile, createMulterMiddleware, processUploadFilesToSave } = require('../Utils/fileController');
const user = require("../Models/user");

const signInToken = (user) => {
  const payload = { id: user.id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

//attachements=documents and images
const attachments = createMulterMiddleware(
  'uploads/documents', // Destination folder
  'doc', // Prefix for filenames
  ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'] // Allowed types
);

exports.uploadFilesMiddleware = attachments.fields([
  { name: 'profileImage', maxCount: 1 },// Single file for profileImage
  { name: 'images', maxCount: 10 }, // upto to 10 images
  { name: 'documents', maxCount: 10 }, // Up to 10 files for documents
]);

// exports.uploadFilesMiddleware = attachments.fields([
//   { name: 'profileImage', maxCount: 1 },
//   { name: 'images', maxCount: 10 },
//   { name: 'labReports', maxCount: 5 },
//   { name: 'xRays', maxCount: 5 },
//   { name: 'prescriptions', maxCount: 5 },
//   { name: 'medicalVideos', maxCount: 3 }
// ]);

// Signup controller
exports.signup = catchAsync(async (req, res, next) => {
  console.log("registration request", req.body)
  console.log("profileImages", req.files)
  const { name, phoneNumber, role, password, email, address, licenseNumber, education, specialization } = req.body;
  if (!name || !phoneNumber || !role) {
    return next(new AppError("missing required Fields(name,phone or role)", 404))
  }
  if (role=== "doctor") {
    if (!licenseNumber || !education || !specialization) {
      return next(new AppError("Missing requred filds for Physician or Admin"))
    }
  }

  let { profileImage} = await processUploadFilesToSave(req, req.files, req.body)
  if(!profileImage){
  profileImage=`${req.protocol}://${req.get('host')}/uploads/default.png`;// full URL to default image
  }
  try {
  const existingUser = await User.findOne({ where: { phoneNumber } });
  if (existingUser) {
    if (req.files) deleteFile(req.files.path);
    return (next(new AppError("PhoneNumber already in use", 404)))
  }
  // your existing code continues here
} catch (error) {
  console.error("Sequelize DB query error:", error);
  return next(new AppError("Internal Server Error", 500));
}

let newPassword = req.body.password;
if (!newPassword) {
  newPassword = "mvet1234" || User.generateRandomPassword();
}
const hashedPassword = await bcrypt.hash(newPassword, 12);// Hash password
 
  const newUser = await User.create({
    name,
    phoneNumber,
    role,
    address,
    email,
    licenseNumber: role !== "user" ? licenseNumber : null,
    education: role !== "user" ? education : null,
    specialization: role !== "user" ? specialization : null,
    password: hashedPassword,
    profileImage: profileImage,
    // isActive:true
  });
   
  //await logAction
  await sendWelcomeEmail(newUser, newPassword)

  const userResponse = { ...newUser.toJSON() };
  delete userResponse.password;

  // Return success response
  res.status(200).json({
    message: 'User registered successfully.',
    data: userResponse,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { phoneNumber, password } = req.body;
  console.log("Request body:", req.body);

  // Input validation
  if (!phoneNumber) return next(new AppError("Please provide valid phone number", 404));
  if (!password) return next(new AppError("Please provide valid password", 404));

  // Find user by email
  const user = await User.findOne({ where: { phoneNumber } });

  if (!user) {
    return next(new AppError("Invalid credentials. Please try again or reset your password", 401));
  }

  // Compare password
  const correct = await bcrypt.compare(password, user.password);

  if (!correct) return next(new AppError("Invalid or incorrect password", 404));

  const token = signInToken(user);
  //console.log("LoggedInUser",user)
  res.status(200).json({
    status: 1,
    token,
    user,
    changePassword: user.changePassword,
    message: user.changePassword
      ? 'Login successful, but you must change your password.'
      : 'Login successful.',
  });
});

exports.authenticationJwt = catchAsync(async (req, _, next) => {
  let token;
  if (req.headers.authorization &&req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Unauthorized: No token provided', 401));
  }
  console.log("tokenn",token)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decode",decoded)
  } catch (err) {
    console.error('❌ Invalid or expired JWT:', err.message);
    return next(new AppError('Session expired or invalid token', 401));
  }

  const user = await User.findByPk(decoded.id);
  if (!user) {
    console.warn('⚠️ User not found for ID:', decoded.id);
    return next(new AppError('The user belonging to this token no longer exists', 404));
  }

  req.user = user;
  next();
});

exports.requiredRole = (...allowedRoles) => {
  console.log("allowedRoles", allowedRoles)
  return async (req, res, next) => {
    const userRole = req.user?.role;
    console.log("Logged-in role:", userRole);

    if (!allowedRoles.includes(userRole)) {
      return next(new AppError('Access Denied', 403));
    }

    next();
  };
};
exports.forgetPassword = catchAsync(async (req, res, next) => {
  console.log("requested body", req.body)
  const { email } = req.body
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('There is no User with the email', 404));
  }
  // console.log(user)

  const resetOTPCode = user.createPasswordResetOTP()
  await user.save();
  console.log("resetOtpCode", resetOTPCode)

  try {
    const email = user.email;
    const subject = 'Password Reset Verification Code';
    const message = `Your OTP code for password reset is: ${resetOTPCode}.\nIt will expire in 10 minutes.\nIf you didn't request this, please ignore the message.`;
    console.log(email, subject, message)

    await sendEmail({ email, subject, message });
    res.status(200).json({
      status: 1,
      passwordResetOTP: resetOTPCode,
      message: 'Reset token Sent to Email Succeffully',
    });
  } catch (err) {
    //console.log(err);
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save();

    return next(
      new AppError('There was an error sending the email. Try again later!'), 500);
  }
});
exports.verifyOTP = catchAsync(async (req, res, next) => {
  console.log("Incoming body:", req.body);

  const { email, passwordResetOTP } = req.body;
  if (!email || !passwordResetOTP) {
    return next(new AppError('Email and OTP code are required.', 400));
  }

  const user = await User.findOne({
    where: { email, passwordResetOTP, passwordResetOTPExpires: { [Op.gt]: new Date() } }
  });

  console.log("user", user)
  if (!user) {
    return next(new AppError('Invalid or expired OTP code.', 404));
  }

  user.passwordResetOTP = null;
  user.passwordResetOTPExpires = null;
  await user.save();

  res.status(200).json({
    status: 1,
    message: 'OTP Verified successfully. Proceed to reset password.'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log("Incoming body:", req.body);
  const { email, newPassword } = req.body

  const user = await User.findOne({ where: { email: email } });
  if (!user) {
    return next(new AppError('User is not found.', 404));
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedNewPassword;
  await user.save();

  const token = signInToken(user);
console.log("userrr", user)
  res.status(200).json({
    status: 1,
    user: user,
    userId: user.id,
    role: user.role,
    token: token,
    message: "Password Reseted Succeffully",
  })
});

exports.resetPasswordByAdmin = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findByPk(userId);
  console.log("reseted user", user);

  if (!user) {
    return next(new AppError('User is not found', 404));
  }

  // Generate a new password and update the user
  const randomPassword = user.generateRandomPassword();
  user.password = await bcrypt.hash(randomPassword, 12);
  console.log("password", randomPassword)
  user.changePassword = true;
  await user.save();

  // If the user has no email, send response and return
  if (!user.email) {
    return res.status(200).json({
      status: 1,
      userId: user.id,
      role: user.role,
      resetedPassword: randomPassword,
      message: 'Password reset successfully. The password will be provided by the admin. Please contact support.',
      changePassword: user.changePassword,
    });
  }

  try {
    // Send email to user
    const subject = 'Your Password Has Been Reset';
    const email = user.email;
    const loginLink = process.env.NODE_ENV === "development" ? "http://localhost:8085" : "https://api.gkmvet.com";
    const message = `Hi ${user.name},

        Your password has been reset by an administrator. Here are your new login credentials:

      - phoneNumber: ${user.phoneNumber}
      - Email: ${user.email}
      - Temporary Password: ${randomPassword}

      Please log in and change your password immediately.

      -Login Link: ${loginLink}

      If you did not request this change, please contact our support team.

      Best regards,
      Mobile Veternary Services Group Team`;

    await sendEmail({ email, subject, message });

    // Return response after email is sent
    return res.status(200).json({
      status: 1,
      userId: user.id,
      role: user.role,
      resetedPassword: randomPassword,
      message: 'Password reset successfully. Check your email for details.',
      changePassword: user.changePassword,
    });

  } catch (error) {
    console.log(error);
    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log("requested body", req.body)
  // console.log("requestUsers", req.user)
  const userId = req.user.id
  const { currentPassword, newPassword } = req.body;

  // Validate if currentPassword and newPassword are provided
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new passwords' });
  }

  const user = await User.findByPk(userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Check if the provided current password matches the stored password
  const correct = await bcrypt.compare(currentPassword, user.password);
  if (!correct) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedNewPassword
  user.changePassword = false
  await user.save();

  // await logAction({
  //   model: 'users',
  //   action: 'Update',
  //   actor: req.user && req.user.id ? req.user.id : 'system',
  //   description: 'User Password Updated',
  //   data: { userId: user.id,orginalData:user.password,updatedData:req.body},
  //   ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
  //   severity: 'info',
  //   sessionId: req.session?.id || 'generated-session-id',
  // });

  res.status(200).json({
    status: 1,
    message: 'Password updated successfully'
  });

});

exports.getMe = catchAsync(async (req, res, next) => {
  console.log("requestUser", req.user.dataValues)
  const userId = req.user.id;
  const user = await User.findByPk(userId);

  if (!user) return next(new AppError("No user found", 404));

  const formattedCreatedAt = user.createdAt ? formatDate(user.createdAt) : null;
  const formattedUpdatedAt = user.updatedAt ? formatDate(user.updatedAt) : null;

  res.status(200).json({
    status: 1,
    message: "Your Profile fetched successfully",
    data: {
      ...user.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  console.log("Requesting User:", req.user.dataValues);
  console.log("Incoming Body:", req.body);

  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('No fields to update provided.', 400));
  }

  const unallowedFields = ['id', 'createdAt', 'updatedAt', 'password', 'role', 'isActive','education', 'specialization', 'licenseNumber'];
  for (const field of unallowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      return next(new AppError(`You cannot update the "${field}" field.`, 400));
    }
  }

  const allowedFields = ['name', 'phoneNumber', 'email', 'address', 'profileImage'];
  const filteredBody = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      filteredBody[field] = req.body[field];
    }
  });

  if (req.files && req.files.profileImage) {
    const { profileImage } = await processUploadFilesToSave(req, req.files, req.body);
    filteredBody.profileImage = profileImage;
  }

  await User.update(filteredBody, {
    where: { id: userId }
  });

  const updatedUser = await User.findByPk(userId);
  if (!updatedUser) {
    return next(new AppError('User not found after update.', 404));
  }

  res.status(200).json({
    status: 1,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});
