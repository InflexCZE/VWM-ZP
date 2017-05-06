import * as KoaRouter from 'koa-router'
import { sequelize, User } from '../models'
import * as Bcrypt from 'bcryptjs'

export async function isUser(ctx: KoaRouter.IRouterContext, next: () => Promise<any>) {
  if (!ctx.user) {
    return ctx.redirect('/auth/login')
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
    missingCredentials: error === 'missing-credentials',
    noSuchUser: error === 'no-such-user',
    wrongPassword: error === 'wrong-password'
  })

  await ctx.render('auth/login')
})

router.post('/login', isGuest, async function (ctx) {
  const { name, password } = <{ name: string; password: string }>ctx.request.body

  const error = (type: string) => `/auth/login?name=${encodeURIComponent(name || '')}&error=${type}`

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

router.get('/register', isGuest, async function (ctx) {
  const { name, error } = <{ name: string; error: string }>ctx.query

  Object.assign(ctx.state, {
    name: name || '',
    missingName: error === 'missing-name',
    wrongName: error === 'wrong-name',
    nameAlreadyUsed: error === 'name-already-used',
    missingPassword: error === 'missing-password',
    passwordsDoNotMatch: error === 'passwords-do-not-match'
  })

  await ctx.render('auth/register')
})

router.post('/register', isGuest, async function (ctx) {
  const { name, password, passwordAgain } = <{ name: string; password: string; passwordAgain: string }>ctx.request.body

  const error = (type: string) => `/auth/register?name=${encodeURIComponent(name || '')}&error=${type}`

  if (!name) {
    return ctx.redirect(error('missing-name'))
  }
  if (!/^[a-zA-Z0-9\._]+$/.test(name)) {
    return ctx.redirect(error('wrong-name'))
  }
  if (!password) {
    return ctx.redirect(error('missing-password'))
  }
  if (password !== passwordAgain) {
    return ctx.redirect(error('passwords-do-not-match'))
  }

  try {
    const user = await User.create({
      name,
      password: await Bcrypt.hash(password, 9)
    })

    ctx.session.userId = user.id
    ctx.redirect('/')
  }
  catch (err) {
    ctx.redirect(error('name-already-used'))
  }
})

router.get('/change-password', isUser, async function (ctx) {
  const { error } = <{ error: string }>ctx.query

  Object.assign(ctx.state, {
    wrongOldPassword: error === 'wrong-old-password',
    missingPassword: error === 'missing-password',
    passwordsDoNotMatch: error === 'passwords-do-not-match'
  })

  await ctx.render('auth/change-password')
})

router.post('/change-password', isUser, async function (ctx) {
  const { oldPassword, password, passwordAgain } = <{ oldPassword: string; password: string; passwordAgain: string }>ctx.request.body

  const error = (type: string) => `/auth/change-password?error=${type}`

  if (!oldPassword || !(await Bcrypt.compare(oldPassword, ctx.user.password))) {
    return ctx.redirect(error('wrong-old-password'))
  }
  if (!password) {
    return ctx.redirect(error('missing-password'))
  }
  if (password !== passwordAgain) {
    return ctx.redirect(error('passwords-do-not-match'))
  }

  await ctx.user.update({
    password: await Bcrypt.hash(password, 9)
  })

  ctx.redirect('/auth/change-password')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/auth', router.routes())
}
