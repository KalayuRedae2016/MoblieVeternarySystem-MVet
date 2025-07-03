// // models/user.js
// const { Model } = require('sequelize');
// const userSchema = require('../Utils/userSchema');
// const crypto = require('crypto');

// module.exports = (sequelize, DataTypes) => {
//   class User extends Model {
//     createPasswordResetOTP() {
//       const resetOTP = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
//       this.passwordResetOTP = resetOTP;
//       this.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
//       return resetOTP;
//     }
//     generateRandomPassword() {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     const length=8
//     const randompassword=Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
//       return randompassword;
//     }
//   }

//   User.init(userSchema(DataTypes), {
//     sequelize,
//     modelName: 'User',
//   });

//   return User;
// };


// // userSchema.methods.createPasswordResetToken = function () {
// //   const resetToken = crypto.randomBytes(32).toString('hex');
// //   this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
// //   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
// //   return resetToken;
// // };
