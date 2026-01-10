require('dotenv').config();
const { sequelize } = require('./src/config/database');
const models = require('./src/models');

async function initDatabase() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Connection successful!');

    console.log('Syncing database models...');
    await models.syncDatabase({ alter: true });
    console.log('Database initialized successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDatabase();
