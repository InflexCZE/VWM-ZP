import config from './config'
import * as Koa from 'koa'
import * as KoaLogger from 'koa-logger'
import * as KoaSession from 'koa-session-minimal'
import FileStore from './file-store'
import * as KoaEjs from 'koa-ejs'
import * as KoaBodyParser from 'koa-bodyparser'
import * as KoaStatic from 'koa-static'
import * as path from 'path'
import { sequelize, User } from './models'
import { Instance as UserInstance } from './models/def/user'
import * as querystring from 'querystring'

const app = new Koa()

app.use(KoaBodyParser())
app.use(KoaLogger())
app.use(KoaSession({
  store: config.isDevelopment ? new FileStore() : null
}))
app.use(KoaStatic(path.join(__dirname, '../assets')))

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
    user: ctx.user,
    admin: false,
    cond(keys: { [key: string]: boolean }) {
      let res = ''
      for (const key in keys) {
        if (keys[key]) {
          res += ` ${key}`
        }
      }

      return res
    },
    qs(data: { [key: string]: any }) {
      return querystring.stringify(data)
    },
    template(name: string) {
      return path.join(__dirname, '../views/templates', `${name}.html`)
    },
    formatDate(date: Date) {
      const two = (x: number) => x < 10 ? `0${x}` : `${x}`

      return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()} v ${date.getHours()}:${two(date.getMinutes())}:${two(date.getSeconds())}`
    }
  }

  await next()
})

import router from './router'
app.use(router.routes())

const { port, host } = config
const server = app.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`)
})

const terminate = () => {
  server.close()
  console.log('Server terminated')
}

process.on('SIGINT', terminate)
process.on('SIGTERM', terminate)
