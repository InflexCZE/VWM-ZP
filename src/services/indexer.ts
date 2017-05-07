import { sequelize, User, Rating, Movie, Rank } from '../models'
import { Instance as UserInstance } from '../models/def/user'
import { Instance as RatingInstance } from '../models/def/rating'
import { Instance as RangInstance } from '../models/def/rank'
import * as Pearson from "./pearson"

export function TriggerIndexUpdate(MIN_COMMON_RATINGS = 0, BATCH_SIZE = 50)
{
  return ExecuteForEachUser(BATCH_SIZE, user => UpdateIndexFor(user, MIN_COMMON_RATINGS, BATCH_SIZE));
}

async function GetCommonRatings(userId : number, otherUserId: number)
{
  interface ValuePair
  {
    value: number
    otherValue: number
  }

  const ret : ValuePair[] = await sequelize.query(`
    SELECT r1.value AS value, r2.value AS "otherValue" FROM "Ratings" r1
    JOIN "Ratings" r2 ON r2."movieId" = r1."movieId"
    WHERE r1."userId" = :userId AND r2."userId" = :otherUserId
  `, { type: sequelize.QueryTypes.SELECT, replacements: { userId, otherUserId } });

  return {
    userRatings: ret.map(x => x.value),
    otherRatings: ret.map(x => x.otherValue)
  }
}

async function UpdateDbIndex(userId : number, otherUserId : number, rank : number)
{
  await Rank.upsert({ userId, otherUserId, rank });
}

function UpdateIndexFor(targetUser:number, MIN_COMMON_RATINGS:number, BATCH_SIZE:number)
{
  return ExecuteForEachUser(BATCH_SIZE, async function(otherUser)
  {
      const {userRatings, otherRatings} = await GetCommonRatings(otherUser, targetUser);
      //Wut? ^ Why {} instead of []??? ^

      let rank = 0;
      if(userRatings.length >= MIN_COMMON_RATINGS)
      {
        rank = Pearson.ComputeCorrelationCoefficientFromRatings(userRatings, otherRatings);
      }

      await Promise.all
      ([
        UpdateDbIndex(targetUser, otherUser, rank),
        UpdateDbIndex(otherUser, targetUser, rank)
      ]);
  }, {id: {gt: targetUser}});
}

//No async generator :(
async function ExecuteForEachUser(BATCH_SIZE:number, action:(userBatch:number) => Promise<void>, filter?:any) //filter?:WhereOptions)
{
  let batchOffset = 0;
  while(true)
  {
    const currentBatch = await User.findAll
    (
      {
        where: filter, //Note: Not sure if optional parameter works like that
        limit: BATCH_SIZE,
        offset: batchOffset,

        order: [['id']],
        attributes: ['id']
      }
    );

    batchOffset += BATCH_SIZE;

    if(currentBatch.length == 0)
      break;

    await Promise.all(currentBatch.map(x => action(x.id)));
  }
}
