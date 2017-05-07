import * as KoaRouter from 'koa-router'
import { sequelize, User, Rating, Movie } from '../models'
import * as Pearson from '../services/pearson'
import * as Indexer from '../services/indexer'
import * as Parameter from '../services/parameter'
import { isUser } from './auth'

interface Recommendation {
  id: number
  name: string

  otherUserId: number
  otherUserName: string

  rank: number
  rating: number
  weight: number
}

export async function getRecommendations(userId: number) {
  const usersCount = await Parameter.get('usersCount')
  const minRank = await Parameter.get('minRank')
  const moviesCount = await Parameter.get('moviesCount')

  const res: Recommendation[] = await sequelize.query(`
    SELECT x.*, xu.name AS "otherUserName" FROM (
      SELECT r."movieId" as id, m.name, rx."otherUserId", rx.rank, r.value AS rating, rx.rank * r.value AS weight,
        ROW_NUMBER() OVER (PARTITION BY r."movieId", m.name ORDER BY rx.rank * r.value DESC) AS rn
      FROM "Ratings" r
      JOIN "Movies" m ON m.id = r."movieId"
      JOIN (
        SELECT rx."otherUserId", rx.rank FROM "Ranks" rx
        WHERE rx."userId" = :userId AND rx.rank >= :minRank
        ORDER BY rx.rank DESC
        LIMIT :usersCount
      ) rx ON r."userId" = rx."otherUserId"
      WHERE NOT EXISTS (
        SELECT 1 FROM "Ratings" ri
        WHERE ri."userId" = :userId
          AND ri."movieId" = r."movieId"
      )
      ORDER BY weight DESC
    ) x
    JOIN "Users" xu ON xu.id = x."otherUserId"
    WHERE x.rn = 1
    ORDER BY x.weight DESC
    LIMIT :moviesCount
  `, { type: sequelize.QueryTypes.SELECT, replacements: { userId, usersCount, minRank, moviesCount } })

  return res
}

const router = new KoaRouter()

router.get('/compare/:id', isUser, async function (ctx, next) {
  const id = +ctx.params.id

  const otherUser = await User.findById(id, {
    include: [
      {
        model: Rating, as: 'ratings',
        include: [
          {
            model: Movie, as: 'movie'
          }
        ]
      }
    ]
  })

  const X: typeof ctx.user.ratings = await (<any>ctx.user).getRatings({
    include: [
      {
        model: Movie, as: 'movie'
      }
    ]
  })

  const Y = otherUser.ratings

  let candidates = Pearson.MakeRatingsDeduplication(X, Y).filter(x => x.value > 3).sort((a, b) => b.value - a.value)
  const data = Pearson.MakeChartData(X, Y)
  const index = Pearson.ComputeCorrelationCoefficient(X, Y)

  Object.assign(ctx.state, {
    otherUser,
    index,
    data,
    candidates
  })

  await ctx.render('data/compare')
})

router.get('/movie', async function (ctx, next) {
  const id = ctx.query.id;
  const movie = await Movie.findById(id);
  const ratings = await Rating.findAll({where: {movieId: id}, limit: 20, order: [['value', 'desc']], include: [{model: User, as: 'user'}]});

  const Count = function(value:number)
  {
    return ratings.reduce((acc, val) => val.value == value ? acc + 1 : acc, 0);
  };

  Object.assign(ctx.state, {
    MovieName: movie.name,
    Ratings: ratings.map(x => ({User: x.user, Value: x.value})),
    ChartData: [Count(1), Count(2), Count(3), Count(4), Count(5)]
  });

  await ctx.render('movie')
})

export default function (mainRouter: KoaRouter) {
  mainRouter.use('/data', router.routes())
}

router.get('/users', async function (ctx, next)
{
  Object.assign(ctx.state,
  {
    Users: await User.findAll()
  });

  await ctx.render('users')
});

router.get('/movies', async function (ctx, next)
{
  Object.assign(ctx.state,
  {
    Movies: await Movie.findAll()
  });

  await ctx.render('movies')
});
