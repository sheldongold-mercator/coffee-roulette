const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MeetingFeedback = sequelize.define('MeetingFeedback', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pairing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pairings',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who submitted the feedback'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Star rating 1-5'
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Written feedback about the meeting'
    },
    topics_discussed: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Topics that were discussed'
    }
  }, {
    tableName: 'meeting_feedback',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['pairing_id', 'user_id'],
        unique: true,
        name: 'unique_feedback'
      },
      { fields: ['pairing_id'] },
      { fields: ['user_id'] },
      { fields: ['rating'] }
    ]
  });

  MeetingFeedback.associate = (models) => {
    MeetingFeedback.belongsTo(models.Pairing, {
      foreignKey: 'pairing_id',
      as: 'pairing'
    });

    MeetingFeedback.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return MeetingFeedback;
};
