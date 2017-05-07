export = function (sequelize: any, DataTypes: any) {
  const Model = sequelize.define('Parameter', {
    name: DataTypes.STRING,
    value: DataTypes.DOUBLE
  }, {
    classMethods: {
      associate: function (models: any) {
      }
    }
  })

  return Model
}
