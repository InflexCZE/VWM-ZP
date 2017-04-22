export = function (sequelize: any, DataTypes: any) {
  const Model = sequelize.define('User', {
    name: DataTypes.STRING,
    password: DataTypes.STRING(60)
  }, {
    classMethods: {
      associate: function (models: any) {
      }
    }
  })

  return Model
}
