import * as X from '.'

export interface Attributes extends X.Attributes {
  name?: string
  value?: number
}

export interface Instance extends X.Instance<Attributes>, Attributes {}
export interface Model extends X.Model<Instance, Attributes> {}
