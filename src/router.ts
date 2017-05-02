import * as KoaRouter from 'koa-router'
import { sequelize, User, Rating, Movie } from './models'
import * as Pearson from './services/pearson'

const router = new KoaRouter()

router.get('/detail', async function (ctx, next) {
  const id1 = ctx.query.id1
  const id2 = ctx.query.id2

  const user1 = await User.findById(id1, {
    include: [
      {
        model: Rating, as: 'ratings',
        include: [
          { model: Movie, as: 'movie' }
        ]
      }
    ]
  })

  const user2 = await User.findById(id2, {
    include: [
      {
        model: Rating, as: 'ratings',
        include: [
          { model: Movie, as: 'movie' }
        ]
      }
    ]
  })

  const X = user1.ratings
  const Y = user2.ratings

  let candidates = Pearson.MakeRatingsDeduplication(X, Y)
  const data = Pearson.MakeChartData(X, Y)
  const index = Pearson.ComputeCorrelationCoefficient(X, Y)

  if (index > 0)
    candidates = candidates.filter(x => x.value > 3);
  else
    candidates = candidates.filter(x => x.value < 3);



  ctx.state = {
    userName1: user1.name,
    userName2: user2.name,
    index,
    data,
    candidates
  }

  await ctx.render('detail')
});

router.get('/', async function (ctx, next) {
  await ctx.render('homepage')
})

export default router
