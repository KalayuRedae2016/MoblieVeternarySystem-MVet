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
      email: {
        type: Sequelize.STRING,
        validate: { isEmail: true },
      },
      password: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.ENUM('user', 'doctor', 'admin'),
        allowNull: false,
      },
      profileImage: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
      },
      licenseNumber: {
        type: Sequelize.STRING,
      },
      education: {
        type: Sequelize.ENUM('Diploma', 'Degree', 'Master', 'PHD'),
      },
      specialization: {
        type: Sequelize.STRING,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      passwordResetOTP: {
        type: Sequelize.STRING,
      },
      passwordResetOTPExpires: {
        type: Sequelize.DATE,
      },
      changePassword: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop ENUM types first to avoid constraint errors in Postgres/MySQL
    await queryInterface.dropTable('Users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_education";');
  },
};
