export = function (sequelize: any, DataTypes: any) {
  const Model = sequelize.define('Rating', {
    userId: DataTypes.INTEGER,
    movieId: DataTypes.INTEGER,
    value: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function (models: any) {
        Model.belongsTo(models.User, { as: 'user', foreignKey: 'userId' })
        Model.belongsTo(models.Movie, { as: 'movie', foreignKey: 'movieId' })
      }
    }
  })

  return Model
}
