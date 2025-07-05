const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

require('dotenv').config();
const { User, Animal, MedicalVisits } = require("../Models");

exports.formatUser = (userInstance) => {
  if (!userInstance) return null;
  
  const { password, passwordResetOTP, passwordResetOTPExpires, ...safeUser } = userInstance.toJSON();
  
  return safeUser;
}

exports.generateAnimalCode = async () => {
  const prefix = 'mvet';

  const lastAnimal = await Animal.findOne({
    where: { identificationMark: { [Op.like]: `${prefix}%` } },
    order: [['createdAt', 'DESC']],
    attributes: ['identificationMark']
  });

  let nextNumber = 1;

  if (lastAnimal && lastAnimal.identificationMark) {
    const lastCode = parseInt(lastAnimal.identificationMark.replace(prefix, ''));
    if (!isNaN(lastCode)) {
      nextNumber = lastCode + 1;
    }
  }

  const code = prefix + String(nextNumber).padStart(4, '0'); // e.g., mvet0001
  return code;
}

exports.generateUniqueApiKey = () => {
  return crypto.randomBytes(32).toString('hex'); // 64 hex characters
}
