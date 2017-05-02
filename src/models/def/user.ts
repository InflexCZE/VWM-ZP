import * as X from '.'
import * as Rating from './rating'
import * as Rank from './rank'

export interface Attributes extends X.Attributes {
  name?: string
  password?: string

  ratings?: Rating.Instance[]
  ranks?: Rank.Instance[]
}

export interface Instance extends X.Instance<Attributes>, Attributes {}
export interface Model extends X.Model<Instance, Attributes> {}
