import { sequelize, User, Rating, Movie, Rank } from '../models'
import { Instance as UserInstance } from '../models/def/user'
import { Instance as RatingInstance } from '../models/def/rating'
import { Instance as RangInstance } from '../models/def/rank'
import * as Pearson from "./pearson"

export async function UpdateIndex()
{
    const users = (await User.findAll({attributes: ['id']})).map(x => x.id);
    for (const x of users)
    {
      UpdateIndexFor(x, users);
    }
}

interface ValuePair {
  value: number
  otherValue: number
}

async function GetCommonRatings(userId : number, otherUserId: number)
{
  const ret : ValuePair[] = await sequelize.query(`
    SELECT r1.value AS value, r2.value AS "otherValue" FROM "Ratings" r1
    JOIN "Ratings" r2 ON r2."movieId" = r1."movieId"
    WHERE r1."userId" = :userId AND r2."userId" = :otherUserId
  `, { type: sequelize.QueryTypes.SELECT, replacements: { userId, otherUserId } });

  return ret;
}

async function UpdateIndexFor(targetUser : number, users : number[])
{
  for (const otherUser of users)
  {
      if(otherUser === targetUser)
        continue;

      if(targetUser > otherUser)
        continue;

      const ratings = await GetCommonRatings(otherUser, targetUser);
      const rank = Pearson.ComputeCorrelationCoefficientFromRatings(ratings.map(x => x.value), ratings.map(x => x.otherValue));

      async function Update(userId : number, otherUserId : number, rank : number)
      {
        const [instance, created] = await Rank.findOrCreate({where: {userId, otherUserId}, defaults:{ rank }});
        if(created === false)
        {
          instance.update({rank});
        }
      }

      Update(targetUser, otherUser, rank);
      Update(otherUser, targetUser, rank);
  }
}


