import * as KoaRouter from 'koa-router'
import { sequelize, User } from '../models'
import * as Bcrypt from 'bcryptjs'

export async function isUser(ctx: KoaRouter.IRouterContext, next: () => Promise<any>) {
  if (!ctx.user) {
    return ctx.redirect('/login')
  }
  await next()
}

export async function isGuest(ctx: KoaRouter.IRouterContext, next: () => Promise<any>) {
  if (ctx.user) {
    return ctx.redirect('/')
  }
  await next()
}

const router = new KoaRouter()

router.get('/login', isGuest, async function (ctx) {
  const { name, error } = <{ name: string; error: string }>ctx.query

  Object.assign(ctx.state, {
    name: name || '',
    missingCredentials: false,
    noSuchUser: false,
    wrongPassword: false
  })

  if (error === 'missing-credentials') {
    ctx.state.missingCredentials = true
  }
  else if (error === 'no-such-user') {
    ctx.state.noSuchUser = true
  }
  else if (error === 'wrong-password') {
    ctx.state.wrongPassword = true
  }

  await ctx.render('auth/login')
})

router.post('/login', isGuest, async function (ctx) {
  const { name, password } = <{ name: string; password: string }>ctx.request.body

  const error = (type: string) => `/auth/login?name=${name || ''}&error=${type}`

  if (!name || !password) {
    return ctx.redirect(error('missing-credentials'))
  }

  const user = await User.findOne({
    where: <any>sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      name.toLowerCase()
    )
  })

  if (!user) {
    return ctx.redirect(error('no-such-user'))
  }

  if (await Bcrypt.compare(password, user.password)) {
    ctx.session.userId = user.id
    ctx.redirect('/')
  }
  else {
    ctx.redirect(error('wrong-password'))
  }
})

router.get('/logout', isUser, async function (ctx) {
  delete ctx.session.userId
  ctx.redirect('/')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/auth', router.routes())
}
