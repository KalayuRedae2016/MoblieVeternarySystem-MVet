const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../Models');
const User = db.User;

const catchAsync=require("../Utils/catchAsync")
const AppError=require("../Utils/appError")
require('dotenv').config();


const { sendEmail,sendWelcomeEmail} = require('../Utils/email');
// const {logAction}=require("../Utils/logUtils")
const { deleteFile, createMulterMiddleware,processUploadFilesToSave} = require('../Utils/fileController');

const signInToken = (user) => {
 const payload = { id: user.id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
};

//attachements=documents and images
const attachments = createMulterMiddleware(
  'uploads/documents', // Destination folder
  'doc', // Prefix for filenames
  ['image/jpeg','image/jpg','image/png', 'image/gif', 'application/pdf', 'application/msword'] // Allowed types
);

exports.uploadFilesMiddleware = attachments.fields([
  { name: 'profileImage', maxCount: 1 },// Single file for profileImage
  { name: 'images', maxCount: 10 }, // upto to 10 images
  { name: 'documents', maxCount: 10 }, // Up to 10 files for documents
]);

// Signup controller
exports.signup = catchAsync(async (req, res,next) => {
    const { name, email, password, role } = req.body;
    //insert phoneNumber
    if (!name || !email || !password || !role) {
        return next(new AppError("All Fields are required",404))
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return(next(new AppError("Email already in use",404)))
    
    const hashedPassword = await bcrypt.hash(password, 12);// Hash password

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });


    // Return success response
    res.status(200).json({
      message: 'User registered successfully.',
      data:newUser,
    });
});


exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log("Request body:", req.body);

  // Input validation
  if (!email) return next(new AppError("Please provide valid phone number", 404));
  if (!password) return next(new AppError("Please provide valid password", 404));

  // Find user by email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return next(new AppError("Invalid credentials. Please try again or reset your password", 401));
  }

  // Compare password
  const correct = await bcrypt.compare(password, user.password);

  if (!correct) {
    return next(new AppError("Invalid or incorrect password", 401));
  }

  const token = signInToken(user.id); // Assuming user.id is the PK

  res.status(200).json({
    status: 1,
    token,
    user,
    // message: user.changePassword
    //   ? 'Login successful, but you must change your password.'
    //   : 'Login successful.',
    // changePassword: user.changePassword
  });
});

exports.authenticationJwt = catchAsync(async (req, _, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Unauthorized: No token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists', 404));
    }
    // Attach the user to the request object for further use in the route handler
    req.user = user;  // You can also pass only selected fields like { id: decoded.id, role: decoded.role }
    next();
  } catch (err) {
    return next(new AppError('Session expired or invalid token', 401));
  }
});

exports.requiredRole = (requiredrole) => {
  return async (req, res, next) => {
   const userRole=req.user.role
    if (userRole !== requiredrole) {
      return next(new AppError('Access Denied', 404));
    }
    next();
  };
};
exports.forgetPassword = catchAsync(async (req, res, next) => {
  console.log("requested body",req.body)
  const {email}=req.body
  const user = await User.findOne({ email});
  if (!user) {
    return next(new AppError('There is no User with the email', 404));
  }
  // console.log(user)

  const resetOTPCode=user.createPasswordResetOTP()
  user.passwordResetOTP = resetOTPCode;
  user. passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
  console.log("resetOtpCode",resetOTPCode)
  console.log("resetOtpcode users",user.passwordResetOTP)
  await user.save(); // save the update document reset token & time expiration into database
  //console.log(`Resettoemail:`, resetToken);
  try {
    const email = user.email;
    const subject = 'Password Reset Verification Code'; 
    const message = `Your OTP code for password reset is: ${resetOTPCode}.\nIt will expire in 10 minutes.\nIf you didn't request this, please ignore the message.`;
    console.log(email,subject,message)

    await sendEmail({ email, subject, message });
    res.status(200).json({
      status: 1,
      message: 'Reset token Sent to Email Succeffully',
    });
  } catch (err) {
    //console.log(err);
    user.passwordResetOTP = undefined;
    user. passwordResetOTPExpires = undefined;
    await user.save();

    return next(
      new AppError('There was an error sending the email. Try again later!'), 500);
  }
});
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, passwordResetOTPCode } = req.body;

  console.log("Incoming body:", req.body);
  console.log("Type of Email:", typeof email);
  console.log("Type of passwordResetOTPCode:", typeof passwordResetOTPCode);

  const user = await User.findOne({
    email,
    passwordResetOTP: passwordResetOTPCode,
     passwordResetOTPExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired OTP code.', 400));
  }

  user.passwordResetOTP = undefined;
  user. passwordResetOTPExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 1,
    message: 'OTP Verified successfully. Proceed to reset password.'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log("Incoming body:", req.body);  
  const {email,newPassword}=req.body
  
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User is not found.', 404));
  }
  
  user.password = newPassword;
  await user.save();

  const token = signInToken(user._id);

  res.status(200).json({
    status: 1,
    user:user,
    userId: user._id,
    role: user.role,
    token: token,
    message: "Password Reseted Succeffully",
  })
});

exports.resetPasswordByAdmin = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  console.log("reseted user", user);

  if (!user) {
    return next(new AppError('User is not found', 404));
  }

  // Generate a new password and update the user
  const password = await user.generateRandomPassword();
  // user.password = await bcrypt.hash(password, 12);
  user.password = password
  console.log("password",password)
  user.changePassword = true;
  await user.save();

  // If the user has no email, send response and return
  if (!user.email) {
    return res.status(200).json({
      status: 1,
      userId: user._id,
      role: user.role,
      resetedPassword: password,
      message: 'Password reset successfully. The password will be provided by the admin. Please contact support.',
      changePassword: user.changePassword,
    });
  }

  try {
    // Send email to user
    const subject = 'Your Password Has Been Reset';
    const email = user.email;
    const loginLink = process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://banapvs.com";
    const message = `Hi ${user.fullName},

        Your password has been reset by an administrator. Here are your new login credentials:

      - User Code: ${user.userCode}
      - Email: ${user.email}
      - Temporary Password: ${password}

      Please log in and change your password immediately.

      -Login Link: ${loginLink}

      If you did not request this change, please contact our support team.

      Best regards,
      The Bana Marketing Group Team`;

    await sendEmail({ email, subject, message });

    // Return response after email is sent
    return res.status(200).json({
      status: 1,
      userId: user._id,
      role: user.role,
      resetedPassword: password,
      message: 'Password reset successfully. Check your email for details.',
      changePassword: user.changePassword,
    });

  } catch (error) {
    console.log(error);
    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const userId= req.params.userId
  const { currentPassword, newPassword} = req.body;
  console.log("requested body",req.body)
  
  console.log("currentPassword",currentPassword)
  console.log("newPassword",newPassword)
  // Validate if currentPassword and newPassword are provided
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new passwords' });
  }
  
  const user = await User.findById(userId).select('+password');
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
  
  // const salt = await bcrypt.genSalt(10);// Hash the new password before saving it
  // const hashedNewPassword = await bcrypt.hash(newPassword, salt);
  // user.password = hashedNewPassword
  user.password = newPassword
  user.changePassword=false
  await user.save();

  await logAction({
    model: 'users',
    action: 'Update',
    actor: req.user && req.user.id ? req.user.id : 'system',
    description: 'User Password Updated',
    data: { userId: user.id,orginalData:user.password,updatedData:req.body},
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
    severity: 'info',
    sessionId: req.session?.id || 'generated-session-id',
  });

  res.status(200).json({
    status: 1,
    message: 'Password updated successfully'
  });

});

exports.getMe=catchAsync(async(req,res,next)=>{
  res.status(200).json({
    status: 1,
    message: 'Commig soon update Me'
  });
})
exports.updateMe = catchAsync(async (req, res, next) => {
  // Step 1: Fetch the user and validate existence
  console.log("requestUser",req.user)
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Step 2: Check if the user has permission to edit details
  if (!user.adminPermissions.canEditDetails) {
    return next(new AppError('Editing access is not enabled. Please contact Admin.', 403));
  }

  // Step 3: Prevent password updates through this route
  if (req.body.password) {
    return next(
      new AppError('This route is not for password updates. Please use /updateMyPassword.', 400)
    );
  }

  // Step 4: Filter allowed fields to update
  const filteredBody = filterObj(
    req.body,
    "fullName",
    'phoneNumber',
    'email',
    'gender'
  );

  // Step 5: Handle profile image upload
  if (req.files && req.files.profileImage) {
    const newProfileImage = req.files.profileImage[0].filename;

    // Delete the existing profile image from the server, if not default
    if (user.profileImage && user.profileImage !== 'default.png') {
      //const oldImagePath = path.join(__dirname, '..', 'uploads', 'profileImages', user.profileImage);
      const oldImagePath =path.join(__dirname, '..', 'uploads', 'userAttachements',user.profileImage);
      deleteFile(oldImagePath);
    }

    // Update profile image in the filtered body
    filteredBody.profileImage = newProfileImage;
  }

  // Step 6: Handle attachments update
  const updatedAttachments = req.body.attachments
    ? JSON.parse(req.body.attachments) // Parse if attachments are sent as JSON
    : [];
  const existingAttachments = user.attachments || [];

  // Determine attachments to remove (those not in the updated list)
  const removedAttachments = existingAttachments.filter(
    (attachment) => !updatedAttachments.some((updated) => updated.fileName === attachment.fileName)
  );

  // Delete removed attachments from the storage
  for (const removed of removedAttachments) {
    const filePath = path.join(__dirname, '..', 'uploads', 'userAattachments', removed.fileName);
    deleteFile(filePath);
  }

  // Prepare the final list of attachments
  let attachmentsToSave = [...updatedAttachments];

  // Add new attachments from req.files.attachments
  if (req.files && req.files.attachments && req.files.attachments.length > 0) {
    const newAttachments = req.files.attachments.map((file) => ({
      fileName: file.filename,
      fileType: file.mimetype,
      description: req.body.description || '',
      uploadDate: new Date(),
    }));

    attachmentsToSave.push(...newAttachments); // Combine existing with new attachments
  }

  // Update attachments in the filtered body
  filteredBody.attachments = attachmentsToSave;

  // Step 7: Update user details in the database
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: filteredBody },
    { new: true, runValidators: true }
  );

  // Step 8: Revoke edit permission after successful update
  
  if (!['Admin', 'SuperAdmin'].includes(user.role)) {
    user.canEditDetails = false;
  }
  await user.save();

  await logAction({
    model: 'users',
    action: 'Update',
    actor: req.user && req.user.id ? req.user.id : 'system',
    description: `${user.fullName} update his Profile`,
    data: { userId: user.id,filteredBody},
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
    severity: 'info',
    sessionId: req.session?.id || 'generated-session-id',
  });

  // Step 9: Format timestamps for the response
  const formattedCreatedAt = updatedUser.createdAt ? formatDate(updatedUser.createdAt) : null;
  const formattedUpdatedAt = updatedUser.updatedAt ? formatDate(updatedUser.updatedAt) : null;

  // Step 10: Send success response
  res.status(200).json({
    status: 1,
    message:"user Updated Sucessfully",
    updatedUser: {
      ...updatedUser._doc,
      formattedCreatedAt,
      formattedUpdatedAt,
    },
  });
});

