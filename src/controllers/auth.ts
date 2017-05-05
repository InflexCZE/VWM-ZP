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
  await ctx.render('auth/login')
})

router.post('/login', isGuest, async function (ctx) {
  const { name, password } = <{ name: string; password: string }>ctx.request.body

  if (!name || !password) {
    return ctx.redirect('/auth/login?error=missing-credentials')
  }

  const user = await User.findOne({
    where: <any>sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      name.toLowerCase()
    )
  })

  if (!user) {
    return ctx.redirect('/auth/login?error=no-such-user')
  }

  if (await Bcrypt.compare(password, user.password)) {
    ctx.session.userId = user.id
    ctx.redirect('/')
  }
  else {
    ctx.redirect('/auth/login?error=wrong-password')
  }
})

router.get('/logout', isUser, async function (ctx) {
  delete ctx.session.userId
  ctx.redirect('/')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/auth', router.routes())
}
