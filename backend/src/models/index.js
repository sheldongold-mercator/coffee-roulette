const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import all model definitions
const models = {
  Department: require('./Department')(sequelize),
  User: require('./User')(sequelize),
  MatchingRound: require('./MatchingRound')(sequelize),
  Pairing: require('./Pairing')(sequelize),
  MeetingFeedback: require('./MeetingFeedback')(sequelize),
  IcebreakerTopic: require('./IcebreakerTopic')(sequelize),
  PairingIcebreaker: require('./PairingIcebreaker')(sequelize),
  SystemSetting: require('./SystemSetting')(sequelize),
  NotificationQueue: require('./NotificationQueue')(sequelize),
  AdminUser: require('./AdminUser')(sequelize),
  AuditLog: require('./AuditLog')(sequelize)
};

// Set up associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Add sequelize instance to models object
models.sequelize = sequelize;

// Sync models in development (creates tables if they don't exist)
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  ...models,
  syncDatabase
};
