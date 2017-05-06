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

  const ratings = await Rating.findAll({
    include: [
      {
        model: User, as: 'user',
        attributes: ['id', 'name']
      }
    ],
    where: {
      movieId: movie.id
    },
    order: [['updatedAt', 'DESC']],
    limit: 20
  })

  const average = +(await Rating.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('value')), 'avg']],
    where: {
      movieId: movie.id
    }
  })).get('avg')

  let userRating
  if (ctx.user) {
    userRating = await Rating.findOne({
      where: {
        userId: ctx.user.id,
        movieId: movie.id
      }
    })
  }

  Object.assign(ctx.state, {
    movie,
    average,
    ratings,
    userRating
  })

  await ctx.render('movies/detail')
})

router.post('/rate/:id', isUser, async function (ctx) {
  const id = +ctx.params.id
  if (!id) return

  const movie = await Movie.findById(id)
  if (!movie) return

  const value = parseInt(ctx.request.body.value, 10) || 0
  if (value < 0 || value > 5) return

  const [rating, created] = await Rating.findOrCreate({
    where: {
      userId: ctx.user.id,
      movieId: movie.id
    },
    defaults: {
      value
    }
  })

  if (!created) {
    await rating.update({ value })
  }

  ctx.redirect(`/movies/detail/${movie.id}`)
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/movies', router.routes())
}
