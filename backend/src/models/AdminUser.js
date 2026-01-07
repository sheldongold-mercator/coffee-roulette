const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminUser = sequelize.define('AdminUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'department_admin', 'viewer'),
      defaultValue: 'viewer',
      allowNull: false,
      comment: 'super_admin=full access, department_admin=limited to departments, viewer=read-only'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional granular permissions'
    }
  }, {
    tableName: 'admin_users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['user_id'],
        unique: true,
        name: 'unique_admin_user'
      },
      { fields: ['role'] }
    ]
  });

  AdminUser.associate = (models) => {
    AdminUser.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return AdminUser;
};
