const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Determine environment
const env = process.env.NODE_ENV || 'development';

// Load environment variables from corresponding .env file
const envFilePath = path.resolve(__dirname, `../.env.${env}`);
dotenv.config({ path: envFilePath });

console.log(`📦 Loading environment variables from ${envFilePath}`);
console.log('DB_USER:', process.env.DB_USER || '❌ Missing');
console.log('DB_PASS:', process.env.DB_PASS ? '✔ Loaded' : '❌ Missing');
console.log('DB_NAME:', process.env.DB_NAME || '❌ Missing');
console.log('DB_HOST:', process.env.DB_HOST || '❌ Missing');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: env === 'development',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected via Sequelize.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
