import * as KoaRouter from 'koa-router'
import * as KoaAuth from 'koa-basic-auth'
import { sequelize, User, Movie, Rating, Rank } from '../models'
import * as Parameter from '../services/parameter'
import * as Indexer from '../services/indexer'
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

router.get('/parameters', async function (ctx) {
  Object.assign(ctx.state, {
    minCommonRatings: await Parameter.get('minCommonRatings', 1),
    usersCount: await Parameter.get('usersCount', 10),
    minRank: await Parameter.get('minRank', 0.5),
    moviesCount: await Parameter.get('moviesCount', 10)
  })

  await ctx.render('admin/parameters')
})

router.post('/parameters', async function (ctx) {
  const names = ['minCommonRatings', 'usersCount', 'minRank', 'moviesCount']

  for (const name of names) {
    const value = +ctx.request.body[name]
    if (value) {
      await Parameter.set(name, value)
    }
  }

  ctx.redirect('/admin/parameters')
})

router.get('/indexer', async function (ctx) {
  await ctx.render('admin/indexer')
})

router.post('/indexer', async function (ctx) {
  await Indexer.TriggerIndexUpdate(await Parameter.get('minCommonRatings'))
  ctx.redirect('/admin/indexer')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/admin', router.routes())
}
