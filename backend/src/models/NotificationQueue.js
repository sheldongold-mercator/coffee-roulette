const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationQueue = sequelize.define('NotificationQueue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pairing_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pairings',
        key: 'id'
      },
      comment: 'Related pairing, if applicable'
    },
    recipient_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notification_type: {
      type: DataTypes.ENUM('welcome', 'pairing', 'reminder', 'feedback_request', 'admin_alert'),
      allowNull: false
    },
    channel: {
      type: DataTypes.ENUM('email', 'teams', 'both'),
      defaultValue: 'both',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    scheduled_for: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to send this notification'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was actually sent'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error details if sending failed'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of times we tried to send'
    }
  }, {
    tableName: 'notification_queue',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['status', 'scheduled_for'] },
      { fields: ['recipient_user_id'] }
    ]
  });

  NotificationQueue.associate = (models) => {
    NotificationQueue.belongsTo(models.Pairing, {
      foreignKey: 'pairing_id',
      as: 'pairing'
    });

    NotificationQueue.belongsTo(models.User, {
      foreignKey: 'recipient_user_id',
      as: 'recipient'
    });
  };

  return NotificationQueue;
};
