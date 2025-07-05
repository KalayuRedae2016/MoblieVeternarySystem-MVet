'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedicalVisit extends Model {
    static associate(models) {
      // Each MedicalVisit belongs to one Animal
      MedicalVisit.belongsTo(models.Animal, { foreignKey: 'animalId', as: 'animal' });

      // Each MedicalVisit is conducted by one physician (User)
      MedicalVisit.belongsTo(models.User, { foreignKey: 'physicianId', as: 'physician' });
    }
  }

  MedicalVisit.init({
    animalId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Animals', key: 'id' }, 
      onDelete: 'CASCADE' 
    },
    physicianId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Users', key: 'id' }, 
      onDelete: 'CASCADE' 
    },
    visitDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },

    ownerComplaint: { type: DataTypes.STRING, allowNull: true },
    symptoms: { type: DataTypes.TEXT, allowNull: true },
    tentativeDiagnosis: { type: DataTypes.TEXT, allowNull: true },
    labResults: { type: DataTypes.JSON, allowNull: true },

    confirmatoryDiagnosis: { type: DataTypes.TEXT, allowNull: true },
    treatmentPlan: { type: DataTypes.TEXT, allowNull: true },
    medications: { type: DataTypes.JSON, allowNull: true },

    immunizationGiven: { type: DataTypes.STRING, allowNull: true },
    immunizationDate: { type: DataTypes.DATE, allowNull: true },

    recommendation: { type: DataTypes.TEXT, allowNull: true },
    prevention: { type: DataTypes.TEXT, allowNull: true },
    prognosis: { type: DataTypes.TEXT, allowNull: true },
    outcome: { type: DataTypes.STRING, allowNull: true },

    images: { type: DataTypes.JSON, allowNull: true }
  }, {
    sequelize,
    modelName: 'MedicalVisit',
    tableName: 'MedicalVisits',
    timestamps: true
  });

  return MedicalVisit;
};
