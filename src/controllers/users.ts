import * as KoaRouter from 'koa-router'
import { sequelize, User, Movie, Rating } from '../models'
import { isUser } from './auth'

const router = new KoaRouter()

const onPage = 20

router.get('/', async function (ctx) {
  const page = +ctx.query.page || 1

  const count = await User.count()

  const users = await User.findAll({
    attributes: ['id', 'name'],
    order: [['name', 'ASC']],
    offset: (page - 1) * onPage,
    limit: onPage
  })

  Object.assign(ctx.state, {
    users,
    path: '/users',
    pages: Math.ceil(count / onPage),
    page,
    search: ''
  })

  await ctx.render('users/list')
})

router.get('/detail/:id', async function (ctx) {
  const id = +ctx.params.id
  if (!id) return ctx.redirect('/users')

  const user = await User.findById(id, {
    attributes: ['id', 'name', 'createdAt', 'updatedAt']
  })
  if (!user) return ctx.redirect('/users')

  const page = +ctx.query.page || 1

  const count = await Rating.count({
    where: {
      userId: user.id
    }
  })

  const ratings = await Rating.findAll({
    include: [
      {
        model: Movie, as: 'movie',
        attributes: ['id', 'name', 'updatedAt']
      }
    ],
    where: {
      userId: user.id
    },
    order: [['updatedAt', 'DESC']],
    offset: (page - 1) * onPage,
    limit: onPage
  })

  Object.assign(ctx.state, {
    selectedUser: user,
    ratings,
    count,
    path: `/users/detail/${user.id}`,
    pages: Math.ceil(count / onPage),
    page,
    search: ''
  })

  await ctx.render('users/detail')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/users', router.routes())
}
