const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    microsoft_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Job title/role'
    },
    seniority_level: {
      type: DataTypes.ENUM('junior', 'mid', 'senior', 'lead', 'executive'),
      defaultValue: 'mid',
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether user account is active'
    },
    is_opted_in: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether user opted into Coffee Roulette'
    },
    opt_out_token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
      unique: true,
      comment: 'Token for one-click opt-out from emails'
    },
    welcome_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When welcome email was sent to user'
    },
    opted_in_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user opted into Coffee Roulette'
    },
    opted_out_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user opted out of Coffee Roulette'
    },
    last_synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time user data was synced from Microsoft'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['microsoft_id'] },
      { fields: ['email'] },
      { fields: ['department_id'] },
      { fields: ['is_opted_in'] },
      { fields: ['is_active'] },
      { fields: ['opt_out_token'] }
    ]
  });

  User.associate = (models) => {
    User.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });

    User.hasMany(models.MeetingFeedback, {
      foreignKey: 'user_id',
      as: 'feedback'
    });

    User.hasOne(models.AdminUser, {
      foreignKey: 'user_id',
      as: 'adminRole'
    });

    User.hasMany(models.AuditLog, {
      foreignKey: 'user_id',
      as: 'auditLogs'
    });
  };

  return User;
};
