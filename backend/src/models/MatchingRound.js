const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchingRound = sequelize.define('MatchingRound', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Optional name for the round, e.g., "January 2026"'
    },
    scheduled_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date when matching is scheduled to run'
    },
    executed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Actual timestamp when matching algorithm ran'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'failed'),
      defaultValue: 'scheduled',
      allowNull: false
    },
    total_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of users included in this round'
    },
    total_pairings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of pairings created'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error details if status is failed'
    },
    source: {
      type: DataTypes.ENUM('scheduled', 'manual'),
      defaultValue: 'scheduled',
      allowNull: false,
      comment: 'Whether round was triggered automatically or manually'
    },
    filters_applied: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object of filters applied for manual rounds'
    },
    ignored_recent_history: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether recent pairing history was ignored'
    },
    triggered_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin user who triggered manual round'
    }
  }, {
    tableName: 'matching_rounds',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['scheduled_date'] },
      { fields: ['status'] }
    ]
  });

  MatchingRound.associate = (models) => {
    MatchingRound.hasMany(models.Pairing, {
      foreignKey: 'matching_round_id',
      as: 'pairings'
    });
    MatchingRound.belongsTo(models.User, {
      foreignKey: 'triggered_by_user_id',
      as: 'triggeredByUser'
    });
  };

  return MatchingRound;
};
