const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Pairing = sequelize.define('Pairing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    matching_round_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'matching_rounds',
        key: 'id'
      }
    },
    user1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    user2_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'pending=just matched, confirmed=meeting scheduled, completed=meeting happened, cancelled=cancelled'
    },
    meeting_scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the meeting is scheduled for'
    },
    meeting_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When users confirmed meeting happened'
    },
    outlook_event_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Microsoft Graph Calendar Event ID'
    }
  }, {
    tableName: 'pairings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user1_id', 'user2_id'] },
      { fields: ['matching_round_id'] },
      { fields: ['status'] },
      { fields: ['meeting_scheduled_at'] }
    ],
    validate: {
      usersAreDifferent() {
        if (this.user1_id === this.user2_id) {
          throw new Error('user1_id and user2_id must be different');
        }
      }
    }
  });

  Pairing.associate = (models) => {
    Pairing.belongsTo(models.MatchingRound, {
      foreignKey: 'matching_round_id',
      as: 'matchingRound'
    });

    Pairing.belongsTo(models.User, {
      foreignKey: 'user1_id',
      as: 'user1'
    });

    Pairing.belongsTo(models.User, {
      foreignKey: 'user2_id',
      as: 'user2'
    });

    Pairing.hasMany(models.MeetingFeedback, {
      foreignKey: 'pairing_id',
      as: 'feedback'
    });

    Pairing.belongsToMany(models.IcebreakerTopic, {
      through: models.PairingIcebreaker,
      foreignKey: 'pairing_id',
      otherKey: 'icebreaker_id',
      as: 'icebreakers'
    });

    Pairing.hasMany(models.NotificationQueue, {
      foreignKey: 'pairing_id',
      as: 'notifications'
    });
  };

  return Pairing;
};
