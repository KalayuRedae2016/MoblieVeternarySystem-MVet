'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Animal extends Model {

    static associate(models) {
      // Each Animal belongs to an owner (User)
      Animal.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });

      // Each Animal can have many medical visits
      Animal.hasMany(models.MedicalVisit, { foreignKey: 'animalId', as: 'visits' });
    }
  }

  Animal.init({
    name: { type: DataTypes.STRING, allowNull: false },
    species: { type: DataTypes.STRING, allowNull: false },       // e.g., Cow, Dog
    breed: { type: DataTypes.STRING, allowNull: true },
    age: { type: DataTypes.INTEGER, allowNull: true },
    sex: { type: DataTypes.ENUM('male', 'female'), allowNull: true },
    color: { type: DataTypes.STRING, allowNull: true },

    identificationMark: { type: DataTypes.STRING, allowNull: true }, // e.g., Tag number
    ownerId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Users', key: 'id' }, 
      onDelete: 'CASCADE' 
    },

    // Location Info
    region: { type: DataTypes.STRING, allowNull: true },
    zone: { type: DataTypes.STRING, allowNull: true },
    wereda: { type: DataTypes.STRING, allowNull: true },
    tabie: { type: DataTypes.STRING, allowNull: true },

    lastImmunizationDate: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Animal',
    tableName: 'Animals',
    timestamps: true
  });

  return Animal;
};
