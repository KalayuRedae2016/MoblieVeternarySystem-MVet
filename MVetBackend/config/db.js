const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a new instance of Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development', // Enable logging only in development
  pool: {
    max: 5, // Maximum number of connection in pool
    min: 0, // Minimum number of connection in pool
    acquire: 30000, // Maximum time (ms) that pool will try to get connection before throwing error
    idle: 10000, // Maximum time (ms) that a connection can be idle before being released
  },
});

// Test connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected via Sequelize.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
    process.exit(1); // Exit the process on failure
  }
};

module.exports = { sequelize, connectDB };