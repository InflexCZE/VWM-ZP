import * as X from '.'
import * as User from './user'
import * as Movie from './movie'

export interface Attributes extends X.Attributes {
  userId?: number
  movieId?: number
  value?: number

  user?: User.Instance
  movie?: Movie.Instance
}

export interface Instance extends X.Instance<Attributes>, Attributes {}
export interface Model extends X.Model<Instance, Attributes> {}
