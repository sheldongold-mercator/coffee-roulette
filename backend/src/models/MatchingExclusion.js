const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchingExclusion = sequelize.define('MatchingExclusion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'First user in the exclusion pair'
    },
    user2_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Second user in the exclusion pair'
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason for the exclusion (e.g., manager/direct report, conflict, user request)'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin user who created this exclusion'
    }
  }, {
    tableName: 'matching_exclusions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user1_id', 'user2_id'],
        name: 'unique_exclusion_pair'
      },
      { fields: ['user1_id'] },
      { fields: ['user2_id'] }
    ]
  });

  MatchingExclusion.associate = (models) => {
    MatchingExclusion.belongsTo(models.User, {
      foreignKey: 'user1_id',
      as: 'user1'
    });
    MatchingExclusion.belongsTo(models.User, {
      foreignKey: 'user2_id',
      as: 'user2'
    });
    MatchingExclusion.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdByUser'
    });
  };

  return MatchingExclusion;
};
