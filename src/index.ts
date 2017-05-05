import config from './config'
import * as Koa from 'koa'
import * as KoaLogger from 'koa-logger'
import * as KoaSession from 'koa-session-minimal'
import * as KoaEjs from 'koa-ejs'
import * as KoaBodyParser from 'koa-bodyparser'
import * as path from 'path'
import { sequelize, User } from './models'
import { Instance as UserInstance } from './models/def/user'

const app = new Koa()

app.use(KoaBodyParser())
app.use(KoaLogger())
app.use(KoaSession())

KoaEjs(app, {
  root: path.join(__dirname, '../views'),
  layout: 'index',
  viewExt: 'html',
  cache: false,
  debug: config.isDevelopment
})

declare module 'koa' {
  interface Context {
    user?: UserInstance
  }
}

app.use(async function (ctx, next) {
  if (ctx.session.userId) {
    ctx.user = await User.findById(ctx.session.userId)
  }

  ctx.state = {
    user: ctx.user
  }

  await next()
})

import router from './router'
app.use(router.routes())

const { port, host } = config
const server = app.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`)
})

process.on('SIGINT', () => {
  server.close()
  console.log('Server terminated')
})
