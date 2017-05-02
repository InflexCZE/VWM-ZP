export = function (sequelize: any, DataTypes: any) {
  const Model = sequelize.define('User', {
    name: DataTypes.STRING,
    password: DataTypes.STRING(60)
  }, {
    classMethods: {
      associate: function (models: any) {
        Model.hasMany(models.Rating, { as: 'ratings', foreignKey: 'userId' })
        Model.hasMany(models.Rank, { as: 'ranks', foreignKey: 'userId' })
      }
    }
  })

  return Model
}
