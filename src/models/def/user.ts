import * as Sequelize from 'sequelize'

export interface Attributes {
  name?: string
  password?: string
}

export interface Instance extends Sequelize.Instance<Attributes>, Attributes {}
export interface Model extends Sequelize.Model<Instance, Attributes> {}
