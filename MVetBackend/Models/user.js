'use strict';
const {  Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    createPasswordResetOTP() {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.passwordResetOTP = otp;
    this.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    return otp;
  }
  generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length=8
    const randomPassword=Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return randomPassword;
    }
    static associate(models) {
      // define association here
    }
  }
  User.init({
    name: {type:DataTypes.STRING,allowNull:false},
    phoneNumber:{type:DataTypes.STRING,allowNull:false,unique:true},
    email: {type:DataTypes.STRING,validate:{isEmail:true}},
    password: DataTypes.STRING,
    role: {type: DataTypes.ENUM('user', 'doctor', 'admin'),allowNull: false},
    profileImage:{type:DataTypes.STRING},
    address:DataTypes.STRING,
    licenseNumber:DataTypes.STRING,
    education:{type:DataTypes.ENUM("Diploma","Degree","Master","PHD")},
    specialization:DataTypes.STRING,
    isActive: {type: DataTypes.BOOLEAN,defaultValue: true},
    passwordResetOTP:DataTypes.STRING,
    passwordResetOTPExpires:DataTypes.DATE,
    changePassword:{type:DataTypes.BOOLEAN,defaultValue:true}
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users', // optional: explicitly set the table name
    timestamps: true, // true by default; includes createdAt/updatedAt
  });
  return User;
};