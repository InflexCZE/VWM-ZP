import * as X from '.'
import * as User from './user'

export interface Attributes extends X.Attributes {
  rank?: number

  user?: User.Instance
  otherUser?: User.Instance
}

export interface Instance extends X.Instance<Attributes>, Attributes {}
export interface Model extends X.Model<Instance, Attributes> {}
