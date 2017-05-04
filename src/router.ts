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

router.get('/userdetail', async function (ctx, next)
{
  const q : any = ctx.query;
  const userId : number = +q.userId;
  const usersAmount : number = +q.sampleusers || 10;
  const moviesAmount : number = +q.moviecount || 10;

  const user = await User.findById(userId);

const res : any = await sequelize.query(
  `SELECT r."movieId", m.name, rx."otherUserId", rx.rank, r.value, rx.rank * r.value AS product FROM "Ratings" r
JOIN "Movies" m ON m.id = r."movieId"
JOIN (
  SELECT rx."otherUserId", rx.rank FROM "Ranks" rx
  WHERE rx."userId" = :userId
  ORDER BY rx.rank DESC
  LIMIT :usersAmount
) rx ON r."userId" = rx."otherUserId"
WHERE NOT EXISTS (
  SELECT 1 FROM "Ratings" ri
  WHERE ri."userId" = :userId
    AND ri."movieId" = r."movieId"
)
ORDER BY r.value * rx.rank DESC
LIMIT :moviesAmount`,
{ type: sequelize.QueryTypes.SELECT, replacements: { userId, usersAmount, moviesAmount } });

  ctx.state =
  {
    User: user,
    Movies: res,
    MovieCount: moviesAmount,
    UsersAmount: usersAmount,
  };

  await ctx.render('userdetail');
})

router.get('/movie', async function (ctx, next) {
  const id = ctx.query.id;
  const movie = await Movie.findById(id);
  const ratings = await Rating.findAll({where: {movieId: id}, limit: 20, order: [['value', 'desc']], include: [{model: User, as: 'user'}]});

  ctx.state =
  {
    MovieName: movie.name,
    Ratings: ratings.map(x => ({User: x.user, Value: x.value}))
  };
  await ctx.render('movie')
})

router.get('/', async function (ctx, next) {
  await ctx.render('homepage')
})

export default router
