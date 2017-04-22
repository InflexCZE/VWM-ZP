import * as X from '.'

export interface Attributes extends X.Attributes {
  id?: number
  name?: string
  password?: string
}

export interface Instance extends X.Instance<Attributes>, Attributes {}
export interface Model extends X.Model<Instance, Attributes> {}
