import * as fs from 'fs'
import * as path from 'path'
import * as Sequelize from 'sequelize'

import * as User from './def/user'
import * as Movie from './def/movie'
import * as Rating from './def/rating'

const db: {
  [key: string]: any
  Sequelize?: Sequelize.SequelizeStatic
  sequelize?: Sequelize.Sequelize

  User?: User.Model
  Movie?: Movie.Model
  Rating?: Rating.Model
} = {}

const basename: string = path.basename(module.filename)
const env: string = process.env.NODE_ENV || 'development'
const config = require('../../db/config.json')[env]

let sequelize: Sequelize.Sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config)
}
else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
}

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach((file) => {
    const model: any = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.Sequelize = Sequelize
db.sequelize = sequelize

export = db
