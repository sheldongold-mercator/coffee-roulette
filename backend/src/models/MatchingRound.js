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
  };

  return MatchingRound;
};
