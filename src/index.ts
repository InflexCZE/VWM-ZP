import config from './config'
import * as Koa from 'koa'
import * as KoaLogger from 'koa-logger'
import * as KoaSession from 'koa-session-minimal'
import * as KoaRouter from 'koa-router'
import { sequelize } from './models'

const app = new Koa()

app.use(KoaLogger())
app.use(KoaSession())

const router = new KoaRouter()

router.get('/', async function (ctx, next) {
  ctx.body = 'TODO'
})

app.use(router.routes())

const { port, host } = config
const server = app.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`)
})

process.on('SIGINT', () => {
  server.close()
  console.log('Server terminated')
})
