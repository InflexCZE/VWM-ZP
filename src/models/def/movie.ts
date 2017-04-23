import * as X from '.'
import * as Rating from './rating'

export interface Attributes extends X.Attributes {
  name?: string

  ratings?: Rating.Instance[]
}

export interface Instance extends X.Instance<Attributes>, Attributes {}
export interface Model extends X.Model<Instance, Attributes> {}
