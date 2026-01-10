const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationTemplate = sequelize.define('NotificationTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    template_type: {
      type: DataTypes.ENUM('welcome', 'pairing_notification', 'meeting_reminder', 'feedback_request'),
      allowNull: false,
      comment: 'Type of notification template'
    },
    channel: {
      type: DataTypes.ENUM('email', 'teams'),
      allowNull: false,
      comment: 'Communication channel: email or Microsoft Teams'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Human-readable template name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of when this template is used'
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email subject line (null for Teams)'
    },
    html_content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'HTML email body (null for Teams)'
    },
    text_content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Plain text email body (null for Teams)'
    },
    json_content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Adaptive Card JSON (null for email)'
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of variable definitions: [{name, description, example, required}]'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether to use DB version or fall back to file default'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User ID of admin who last updated this'
    }
  }, {
    tableName: 'notification_templates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['template_type', 'channel'],
        name: 'unique_template_type_channel'
      },
      { fields: ['is_active'] }
    ]
  });

  NotificationTemplate.associate = (models) => {
    NotificationTemplate.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedByUser'
    });
  };

  return NotificationTemplate;
};
