import config from './config'
import * as Koa from 'koa'
import * as KoaLogger from 'koa-logger'
import * as KoaSession from 'koa-session-minimal'
import * as KoaEjs from 'koa-ejs'
import * as path from 'path'
import { sequelize } from './models'

const app = new Koa()

app.use(KoaLogger())
app.use(KoaSession())

KoaEjs(app, {
  root: path.join(__dirname, '../views'),
  layout: 'index',
  viewExt: 'html',
  cache: false,
  debug: config.isDevelopment
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
