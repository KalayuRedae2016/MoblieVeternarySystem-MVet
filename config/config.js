const path = require('path');
const dotenv = require('dotenv');

// Determine environment
const env = process.env.NODE_ENV || 'development';

// Load corresponding .env file
const envPath = path.resolve(__dirname, `../.env.${env}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️ Could not load .env file at ${envPath}`);
} else {
  console.log(`✅ Loaded environment variables from ${envPath}`);
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
  },
};
