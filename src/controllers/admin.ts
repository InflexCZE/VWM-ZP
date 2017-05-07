import * as KoaRouter from 'koa-router'
import * as KoaAuth from 'koa-basic-auth'
import { sequelize, User, Movie, Rating, Rank } from '../models'
import config from '../config'

const router = new KoaRouter()

if (config.admin.name && config.admin.pass) {
  router.use(async function (ctx, next) {
    try {
      await next()
    }
    catch (err) {
      if (err.status === 401) {
        ctx.status = 401
        ctx.set('WWW-Authenticate', 'Basic')
        ctx.body = 'Unauthorized!'
      }
      else {
        throw err
      }
    }
  })

  router.use(KoaAuth(config.admin))
}

router.use(async function (ctx, next) {
  ctx.state.admin = true
  await next()
})

router.get('/', async function (ctx) {
  await ctx.render('homepage')
})

router.get('/movies', async function (ctx) {
  await ctx.render('admin/movies')
})

router.post('/movies/create', async function (ctx) {
  const { name } = <{ name: string }>ctx.request.body

  if (name) {
    await Movie.create({
      name
    })
  }

  ctx.redirect('/admin/movies')
})

router.post('/movies/delete', async function (ctx) {
  const id = +ctx.request.body.id

  if (id) {
    while (true) {
      await Rating.destroy({
        where: {
          movieId: id
        }
      })

      try {
        await Movie.destroy({
          where: { id }
        })

        break
      }
      catch (err) {}
    }
  }

  ctx.redirect('/admin/movies')
})

router.get('/users', async function (ctx) {
  await ctx.render('admin/users')
})

router.post('/users/delete', async function (ctx) {
  const id = +ctx.request.body.id

  if (id) {
    while (true) {
      await Rating.destroy({
        where: {
          userId: id
        }
      })
      await Rank.destroy({
        where: {
          userId: id
        }
      })
      await Rank.destroy({
        where: {
          otherUserId: id
        }
      })

      try {
        await User.destroy({
          where: { id }
        })

        break
      }
      catch (err) {}
    }
  }

  ctx.redirect('/admin/users')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/admin', router.routes())
}