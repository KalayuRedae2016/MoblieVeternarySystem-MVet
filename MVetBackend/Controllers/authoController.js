const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../Models');
const User = db.User;

const catchAsync=require("../Utils/catchAsync")
const AppError=require("../Utils/appError")

// Signup controller
exports.signup = catchAsync(async (req, res,next) => {
    const { name, email, password, role } = req.body;
    //insert phoneNumber
    if (!name || !email || !password || !role) {
        return next(new AppError("All Fields are required",404))
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
    return(next(new AppError("Email already in use",404)))
    }

    const hashedPassword = await bcrypt.hash(password, 12);// Hash password

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });


    // Return success response
    res.status(201).json({
      message: 'User registered successfully.',
      data:newUser,
    });
});

