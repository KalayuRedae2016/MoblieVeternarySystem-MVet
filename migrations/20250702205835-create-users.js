'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      email: Sequelize.STRING,
      password: Sequelize.STRING,
      role: {
        type: Sequelize.ENUM('user', 'doctor', 'admin'),
        allowNull: false,
      },
      profileImage: Sequelize.STRING,
      address: Sequelize.STRING,
      licenseNumber: Sequelize.STRING,
      education: Sequelize.ENUM('Diploma', 'Degree', 'Master', 'PHD'),
      specialization: Sequelize.STRING,
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      passwordResetOTP: Sequelize.STRING,
      passwordResetOTPExpires: Sequelize.DATE,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  },
};
