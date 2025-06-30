// const User = require('../Models/userModel');
// const bcrypt = require('bcrypt');
// const { sendEmail } = require('./email');
// const catchAsync = require('./catchAsync');
// const AppError = require('./appError');

// const createDefaultAdminUser = catchAsync(async () => {
//     const existingAdmin = await User.findOne({ role: 'SuperAdmin' });
//     if(existingAdmin){
//       return null
//     }
//     const defaultImageURL = `${process.env.BBASE_URL}/uploads/default.png`;
//     //const hashedPassword = await bcrypt.hash('super1234', 12);
//       const defaultAdmin = await User.create({
//         referralCode: 'super0001',
//         password: "super1234",//hashedPassword, Static password for the initial login
//         fullName:"Super Admin",
//         role: 'SuperAdmin',
//         phoneNumber:"+251943662611",    
//         email: 'kalayuredae2@gmail.com',
//         referredBy:"super0001",
//         changePassword:true,
//         profileImage: defaultImageURL
//       });
      
//       // console.log('Default Admin User Created:', defaultAdmin.userCode);
//       const subject = 'Welcome to the system';
//       const message = `A default admin user has been created for you.\nreferralCode: admin\nPassword: admin1234\nPlease change your password after your first login.`;
//       await sendEmail({ email: defaultAdmin.email, subject, message });
//       return defaultAdmin;
// });

// const changePasswordFlag = catchAsync(async (user, passwordChanger) => {
//   let changePassword = false;

//   if (!user || typeof user !== 'object') {
//     return next(new AppError("User Object is missing or invalid",400))
//   }
//   const { isFirstLogin, _id, passwordChangedBy } = user;

//   if (!passwordChanger) {
//     if (isFirstLogin) {
//       changePassword = true; 
//     }
//     return changePassword;
//   }
//   const { role } = passwordChanger;

//   if (!role) {
//     return next(new AppError("Password Changer is missing the role field",400))
//   }

//   if (passwordChangedBy && !_id.equals(passwordChangedBy) && (role === 'Admin' || role === 'SuperAdmin')) {
//     changePassword = true; // Password changed by Admin or SuperAdmin
//   }
//   return changePassword;
// });

// const normalizePhoneNumber = (phone) => {
//   if (!phone) {
//     return next(new AppError("Phone number is required",400))
//   }

//   const digitsOnly = phone.replace(/\D/g, '');// Remove all non-digit characters

//   // Ensure the phone number starts with "251" and has a total of 12 digits
//   if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
//     return `+${digitsOnly}`; // Format as +251XXXXXXXXX
//   }

//   // If the phone number starts with "0" (local format), convert it to +251 format
//   if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
//     return `+251${digitsOnly.slice(1)}`; // Convert "0XXXXXXXXX" to "+251XXXXXXXXX"
//   }
  
//   throw new Error('Invalid phone number format. Must be in +251XXXXXXXXX or 0XXXXXXXXX format.');

// };


// module.exports = {createDefaultAdminUser,changePasswordFlag,normalizePhoneNumber};
