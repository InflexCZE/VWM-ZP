export = function (sequelize: any, DataTypes: any) {
  const Model = sequelize.define('Movie', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models: any) {
      }
    }
  })

  return Model
}
