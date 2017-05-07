import * as KoaRouter from 'koa-router'
import { sequelize } from './models'

const router = new KoaRouter()

import authController from './controllers/auth'
authController(router)

import moviesController from './controllers/movies'
moviesController(router)

import usersController from './controllers/users'
usersController(router)

import dataController, { getRecommendations } from './controllers/data'
dataController(router)

import adminController from './controllers/admin'
adminController(router)

router.get('/', async function (ctx, next) {
  ctx.state.recommendations = ctx.user ? await getRecommendations(ctx.user.id) : null

  await ctx.render('homepage')
})

export default router
