const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who performed the action'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'e.g., user.created, department.enabled, matching.triggered'
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'e.g., user, department, pairing, setting'
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the entity affected'
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Before/after values for updates'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of requester'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Browser/client user agent'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id', 'action'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['created_at'] }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return AuditLog;
};
