'use strict';

const { sequelize } = require('../Models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Animals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {type: Sequelize.STRING,allowNull: false},
      species: {type: Sequelize.STRING,allowNull: false},
      breed: {type: Sequelize.STRING},
      age: {  type: Sequelize.INTEGER},
      sex: {type: Sequelize.ENUM('male', 'female')},
      color: {type: Sequelize.STRING},
      identificationMark: {type: Sequelize.STRING},
      ownerId: {
        type: Sequelize.INTEGER,allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      region: {type: Sequelize.STRING},
      zone: {type: Sequelize.STRING},
      wereda: {type: Sequelize.STRING},
      tabie: {type: Sequelize.STRING},
      lastImmunizationDate: { type: sequelize.DATE, allowNull: true },
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
    await queryInterface.dropTable('Animals');
  },
};
