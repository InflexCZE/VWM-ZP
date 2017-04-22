import * as X from '.'

export interface Attributes extends X.Attributes {
  userId?: number
  movieId?: number
  value?: number
}

export interface Instance extends X.Instance<Attributes>, Attributes {}
export interface Model extends X.Model<Instance, Attributes> {}
