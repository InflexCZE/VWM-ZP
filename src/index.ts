import config from './config'
import * as Koa from 'koa'
import * as KoaLogger from 'koa-logger'
import * as KoaSession from 'koa-session-minimal'
import * as KoaRouter from 'koa-router'
import { sequelize, User, Rating, Movie } from './models'
import * as Pearson from "./pearson"

const app = new Koa()

app.use(KoaLogger())
app.use(KoaSession())

const router = new KoaRouter()

router.get('/Detail', async function (ctx, next) 
{
  const id1 = ctx.query.id1;
  const id2 = ctx.query.id2;

  const user1 = await User.findById(id1, 
  {
      include: 
      [
        {
          model: Rating, as: 'ratings',
          include: 
          [
            { model: Movie, as: 'movie' }
          ]
        }
      ]
    });

  const user2 = await User.findById(id2, 
  {
      include: 
      [
        {
          model: Rating, as: 'ratings',
          include: 
          [
            { model: Movie, as: 'movie' }
          ]
        }
      ]
    });

    const X = user1.ratings;
    const Y = user2.ratings;

    Pearson.MakeRatingsDeduplication(X, Y);
    const data = Pearson.MakeChartData(X, Y);
    const index = Pearson.ComputeCorrelationCoefficient(X, Y);

    ctx.body = "";
    ctx.body += `${index}\n`;
    ctx.body += JSON.stringify(data);
    
    // const myBubbleChart = new Chart(ctx,
    // {
    //     type: 'bubble',
    //     data: data,
    //     options: 
    //     {
    //         elements: 
    //         {
    //             points: 
    //             {
    //                 borderWidth: 1,
    //                 borderColor: 'rgb(0, 0, 0)'
    //             }
    //         }
    //     }
    // });
});

router.get('/', async function (ctx, next) {
  ctx.body = 'TODO \n';

  //  const user= await User.findById(666);
   
  //  User.create
  //  ({
  //   name: "hFHKDKSJFhjKSD",
  //   password: ""
  //  });

  //  User.create
  //  ({
  //     name: "fdasfsafdds2",
  //     password: ""
  //  });

  const all = await User.findAll();
  for(let x of all)
  {
      const user = await User.findById(666, {
    include: [
      {
        model: Rating, as: 'ratings',
        include: [
          { model: Movie, as: 'movie' }
        ]
      }
    ]
  });


    Rating.find({where: {userId: x.id}})
    

    ctx.body += `${x.name}\n`;
  }
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
