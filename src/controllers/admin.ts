import * as KoaRouter from 'koa-router'
import * as KoaAuth from 'koa-basic-auth'
import { sequelize, User, Movie, Rating } from '../models'
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

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/admin', router.routes())
}
