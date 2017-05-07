export = function (sequelize: any, DataTypes: any) {
  const Model = sequelize.define('Rank', {
    userId: DataTypes.INTEGER,
    otherUserId: DataTypes.INTEGER,
    rank: DataTypes.DOUBLE
  }, {
    classMethods: {
      associate: function (models: any) {
        Model.belongsTo(models.User, { as: 'user', foreignKey: 'userId' })
        Model.belongsTo(models.User, { as: 'otherUser', foreignKey: 'otherUserId' })
      }
    },

    indexes: [
      {
        unique: true,
        fields: ['userId', 'otherUserId']
      }
    ]
  })

  return Model
}
