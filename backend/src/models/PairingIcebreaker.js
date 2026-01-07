const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PairingIcebreaker = sequelize.define('PairingIcebreaker', {
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
    icebreaker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'icebreaker_topics',
        key: 'id'
      }
    }
  }, {
    tableName: 'pairing_icebreakers',
    timestamps: false,
    indexes: [
      {
        fields: ['pairing_id', 'icebreaker_id'],
        unique: true,
        name: 'unique_pairing_icebreaker'
      },
      { fields: ['pairing_id'] }
    ]
  });

  // No associations needed - this is a join table handled by belongsToMany

  return PairingIcebreaker;
};
