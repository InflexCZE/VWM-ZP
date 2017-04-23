import { sequelize, User, Rating, Movie } from './models'
import { Instance as UserInstance } from './models/def/user'
import { Instance as RatingInstance } from './models/def/rating'

export interface DataSet
{
    label: string
    hoverColor:string
    backgroundColor:string
    data: {x:number, y:number, r:number}[]
}

export function MakeRatingsDeduplication(xRatings : RatingInstance[], yRatings : RatingInstance[])
{
    xRatings.sort((a, b) => a.movieId - b.movieId);
    yRatings.sort((a, b) => a.movieId - b.movieId);

    const toRemoveX : number[] = [];
    const toRemoveY : number[] = [];

    let i = 0, j = 0;
    while(i < xRatings.length && j < yRatings.length)
    {
        let xRate = xRatings[i];
        let yRate = yRatings[j];

        let xMovie = xRate.movieId;
        let yMovie = yRate.movieId;

        if(xMovie == yMovie)
        {
            i++;
            j++;
        }
        else if(xMovie < yMovie)
            toRemoveX.push(i++);
        else
            toRemoveY.push(j++);
    }

    while(i < xRatings.length)
        toRemoveX.push(i++);

    while(j < yRatings.length)
        toRemoveY.push(j++);

    console.log(`${xRatings.length}-${toRemoveX.length}=${xRatings.length-toRemoveX.length}`);
    console.log(`${yRatings.length}-${toRemoveY.length}=${yRatings.length-toRemoveY.length}`);

    for(let i = toRemoveX.length - 1; i >= 0; i--)
        xRatings.splice(toRemoveX[i], 1);

    for(let i = toRemoveY.length - 1; i >= 0; i--)
        yRatings.splice(toRemoveY[i], 1);

    Assert(() => xRatings.length == yRatings.length);
}

export function ComputeCorrelationCoefficient(xRatings : RatingInstance[], yRatings : RatingInstance[])
{
    const ratingsX = xRatings.map(x => x.value);
    const ratingsY = yRatings.map(x => x.value);

    // xRatings.sort((a, b) => b.movieId - a.movieId);
    // yRatings.sort((a, b) => b.movieId - a.movieId);

    // let xIndex = 0, yIndex = 0;
    // const ratingsX : number[] = [];
    // const ratingsY : number[] = [];

    // let i = 0, j = 0;
    // while(i < xRatings.length && j < yRatings.length)
    // {
    //     let xRate = xRatings[i];
    //     let yRate = yRatings[j];

    //     let xMovie = xRate.movieId;
    //     let yMovie = yRate.movieId;

    //     if(xMovie == yMovie)
    //     {
    //         i++;
    //         j++;
    //         ratingsX.push(xRate.value);
    //         ratingsY.push(yRate.value);
    //     }
    //     else if(xMovie < yMovie)
    //         i++;
    //     else
    //         j++;
    // }

    Assert(() => ratingsX.length == ratingsY.length);

    if(ratingsX.length == 0)
        return -1;

    const sampleMeanX = SampleMean(ratingsX);
    const sampleMeanY = SampleMean(ratingsY);
    const ssdX = SampleStandardDeviation(ratingsX, sampleMeanX);
    const ssdY = SampleStandardDeviation(ratingsY, sampleMeanY);

    let sum = 0;
    for(let i = 0; i < ratingsX.length; i++)
    {
        let xPart = (ratingsX[i] - sampleMeanX) / ssdX;
        let yPart = (ratingsY[i] - sampleMeanY) / ssdY;
        sum += xPart * yPart;
    }

    return sum / (ratingsX.length - 1);
}

export function MakeChartData(xRatings : RatingInstance[], yRatings : RatingInstance[]) : DataSet[]
{
    var result = new Array<DataSet>(xRatings.length);

    for(let i = 0; i < xRatings.length; i++)
    {
        const x = xRatings[i];
        const y = yRatings[i];

        result[i] = 
        {
            label: x.movie.name,
            data: [ {x: x.value, y: y.value, r: 15} ],
            hoverColor: '#0066FF',
            backgroundColor: '#0066FF'
        };
    }

    return result;
}

function SampleStandardDeviation(ratings : number[], sampleMean : number)
{
    let sum = 0;
    for(let x of ratings)
    {
        let diff = x - sampleMean;
        sum += diff * diff;
    }

    return Math.sqrt(sum / (ratings.length - 1));
}

function SampleMean(ratings : number[])
{
    let sum = 0;
    for(var x of ratings)
        sum += x;

    return sum / ratings.length;
}

function Assert(fn: () => boolean)
{
  if (fn() === false)
    throw new Error(fn.toString());
  
}