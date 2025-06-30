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

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll();
  res.status(200).json({
    length:users.length,
    Message: "User Fetched Successfully",
    users
  });
});
