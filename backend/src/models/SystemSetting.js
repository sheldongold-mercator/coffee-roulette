const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string',
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of what this setting does'
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
    tableName: 'system_settings',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['setting_key'] }
    ]
  });

  SystemSetting.associate = (models) => {
    SystemSetting.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedByUser'
    });
  };

  // Helper method to get typed value
  SystemSetting.prototype.getValue = function() {
    if (!this.setting_value) return null;

    switch (this.data_type) {
      case 'number':
        return parseFloat(this.setting_value);
      case 'boolean':
        return this.setting_value === 'true';
      case 'json':
        try {
          return JSON.parse(this.setting_value);
        } catch (e) {
          return null;
        }
      default:
        return this.setting_value;
    }
  };

  // Helper method to set typed value
  SystemSetting.prototype.setValue = function(value) {
    if (value === null || value === undefined) {
      this.setting_value = null;
      return;
    }

    switch (this.data_type) {
      case 'json':
        this.setting_value = JSON.stringify(value);
        break;
      default:
        this.setting_value = String(value);
    }
  };

  return SystemSetting;
};
