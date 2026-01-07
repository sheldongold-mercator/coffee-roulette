const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    microsoft_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether department is enrolled in Coffee Roulette'
    },
    enrollment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Date when department was enabled'
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['is_active'] },
      { fields: ['name'] }
    ]
  });

  Department.associate = (models) => {
    Department.hasMany(models.User, {
      foreignKey: 'department_id',
      as: 'users'
    });
  };

  return Department;
};
