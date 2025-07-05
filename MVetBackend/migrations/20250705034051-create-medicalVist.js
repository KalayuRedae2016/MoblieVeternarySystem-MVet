'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MedicalVisits', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      animalId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Animals', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      physicianId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      visitDate: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      
      ownerComplaint: { type: Sequelize.STRING, allowNull: true },
      symptoms: { type: Sequelize.TEXT, allowNull: true },
      tentativeDiagnosis: { type: Sequelize.TEXT, allowNull: true },
      labResults: { type: Sequelize.JSON, allowNull: true },

      confirmatoryDiagnosis: { type: Sequelize.TEXT, allowNull: true },
      treatmentPlan: { type: Sequelize.TEXT, allowNull: true },
      medications: { type: Sequelize.JSON, allowNull: true },

      immunizationGiven: { type: Sequelize.STRING, allowNull: true },
      immunizationDate: { type: Sequelize.DATE, allowNull: true },

      recommendation: { type: Sequelize.TEXT, allowNull: true },
      prevention: { type: Sequelize.TEXT, allowNull: true },
      prognosis: { type: Sequelize.TEXT, allowNull: true },
      outcome: { type: Sequelize.STRING, allowNull: true },

      images: { type: Sequelize.JSON, allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MedicalVisits');
  }
};
