import * as KoaRouter from 'koa-router'
import { sequelize, User, Movie, Rating } from '../models'
import { isUser } from './auth'

const router = new KoaRouter()

const onPage = 20

router.get('/', async function (ctx) {
  const page = +ctx.query.page || 1
  const search = ctx.query.search || ''

  const where: { name?: any } = {}
  if (search) where.name = { $iLike: `%${search}%` }

  const count = await Movie.count({ where })

  const movies = await Movie.findAll({
    where,
    order: [['name', 'ASC']],
    offset: (page - 1) * onPage,
    limit: onPage
  })

  Object.assign(ctx.state, {
    movies,
    pages: Math.ceil(count / onPage),
    page,
    search
  })

  await ctx.render('movies/list')
})

router.get('/detail/:id', async function (ctx) {
  const id = +ctx.params.id
  if (!id) return ctx.redirect('/movies')

  const movie = await Movie.findById(id)
  if (!movie) return ctx.redirect('/movies')

  Object.assign(ctx.state, {
    movie
  })

  await ctx.render('movies/detail')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/movies', router.routes())
}
