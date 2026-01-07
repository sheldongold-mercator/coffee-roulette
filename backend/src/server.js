require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { sequelize, testConnection } = require('./config/database');
const jobOrchestrator = require('./jobs');

// Port configuration
const PORT = process.env.PORT || 3000;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop scheduled jobs
  try {
    jobOrchestrator.stopAll();
  } catch (error) {
    logger.error('Error stopping jobs:', error);
  }

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connection
      await sequelize.close();
      logger.info('Database connection closed');

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Load and sync database models (in development only)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Loading database models...');
      const models = require('./models');
      logger.info('Database models loaded successfully');

      // Optionally sync models (creates tables if they don't exist)
      // await models.syncDatabase({ alter: false });
      // logger.info('Database models synced');
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Coffee Roulette API server started`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Server listening on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API documentation: http://localhost:${PORT}/api`);

      // Start scheduled jobs
      try {
        jobOrchestrator.startAll();
      } catch (error) {
        logger.error('Error starting scheduled jobs:', error);
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Export server for testing
    global.server = server;
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
