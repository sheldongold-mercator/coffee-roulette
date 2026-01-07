const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IcebreakerTopic = sequelize.define('IcebreakerTopic', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    topic: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'e.g., work, hobbies, fun, career'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this topic is in rotation'
    }
  }, {
    tableName: 'icebreaker_topics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['category'] }
    ]
  });

  IcebreakerTopic.associate = (models) => {
    IcebreakerTopic.belongsToMany(models.Pairing, {
      through: models.PairingIcebreaker,
      foreignKey: 'icebreaker_id',
      otherKey: 'pairing_id',
      as: 'pairings'
    });
  };

  return IcebreakerTopic;
};
