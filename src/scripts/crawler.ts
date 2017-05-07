import { sequelize, User, Movie, Rating, Rank } from '../models'
import * as DOM from 'jsdom'
import * as Bcrypt from 'bcryptjs'

function load(url: string): Promise<Window> {
  return new Promise((resolve, reject) => {
    DOM.env(url, (err, window) => {
      if (err) {
        reject(err)
      }
      else {
        resolve(window)
      }
    })
  })
}

namespace Csfd {
  export const Url = {
    movie: (id: number, page = 1) => `http://www.csfd.cz/film/${id}/prehled/?expandUserList=1&ratings-page=${page}`,
    user: (id: number, page = 1) => `http://www.csfd.cz/uzivatel/${id}/hodnoceni/podle-year/strana-${page}/?pof2-filter=1`,
    movies: (type: string) => `http://www.csfd.cz/zebricky/${type}-filmy/?show=complete`,
    newMovies: (page = 1) => `http://www.csfd.cz/podrobne-vyhledavani/podle-year/strana-${page}/?type%5B0%5D=0&genre%5Btype%5D=2&genre%5Binclude%5D%5B0%5D=&genre%5Bexclude%5D%5B0%5D=&origin%5Btype%5D=2&origin%5Binclude%5D%5B0%5D=&origin%5Bexclude%5D%5B0%5D=&year_from=&year_to=&rating_from=0&rating_to=100&actor=&director=&composer=&screenwriter=&author=&cinematographer=&production=&edit=&sound=&scenography=&mask=&costumes=&tag=&my_rating=0&ok=Hledat&_form_=film`,
  }

  export interface Rating {
    user?: User
    movie?: Movie
    value?: number
  }

  export interface Movie {
    id?: number
    name?: string
    ratings?: Rating[]
  }

  export interface User {
    id?: number
    name?: string
    ratings?: Rating[]
  }
}

async function loadMovie(id: number, pages = 1) {
  const movie: Csfd.Movie = {
    id,
    ratings: []
  }

  for (let page = 1; page <= pages; ++page) {
    const { document } = await load(Csfd.Url.movie(id, page))

    movie.name = document.querySelector('h1').innerHTML.trim()

    const ratings = document.querySelectorAll('#ratings li')
    for (let item of ratings) {
      const userLink = item.querySelector('a')
      const userRating = item.querySelector('.rating')

      movie.ratings.push({
        user: {
          id: +userLink.getAttribute('href').match(/^\/uzivatel\/(\d+)\-/)[1],
          name: userLink.innerHTML.trim()
        },
        value: userRating.getAttribute('src') ? +userRating.getAttribute('src').match(/\/(\d+)\.gif$/)[1] : 0
      })
    }
  }

  return movie
}

async function loadUser(id: number, pages = 1) {
  const user: Csfd.User = {
    id,
    ratings: []
  }

  for (let page = 1; page <= pages; ++page) {
    const { document } = await load(Csfd.Url.user(id, page))

    user.name = document.querySelector('.info h2').innerHTML.trim()

    const ratings = document.querySelectorAll('.ratings tbody tr')
    for (let item of ratings) {
      const movieLink = item.querySelector('a')
      const userRating = item.querySelector('.rating')

      user.ratings.push({
        movie: {
          id: +movieLink.getAttribute('href').match(/^\/film\/(\d+)\-/)[1],
          name: movieLink.innerHTML.trim()
        },
        value: userRating.getAttribute('src') ? +userRating.getAttribute('src').match(/\/(\d+)\.gif$/)[1] : 0
      })
    }
  }

  return user
}

async function loadMovies(type: string, amount: number = null) {
  const movies: Csfd.Movie[] = []

  const { document } = await load(Csfd.Url.movies(type))

  const data = document.querySelectorAll('#results tbody .film a')
  let counter = 0
  for (let item of data) {
    movies.push({
      id: +item.getAttribute('href').match(/^\/film\/(\d+)\-/)[1],
      name: item.innerHTML.trim()
    })

    if (++counter === amount) break
  }

  return movies
}

async function loadNewMovies(pages: number = 1) {
  const movies: Csfd.Movie[] = []

  for (let page = 1; page <= pages; ++page) {
    const { document } = await load(Csfd.Url.newMovies(page))

    const data = document.querySelectorAll('#films .films tbody .name a')
    for (let item of data) {
      movies.push({
        id: +item.getAttribute('href').match(/^\/film\/(\d+)\-/)[1],
        name: item.innerHTML.trim()
      })
    }
  }

  return movies
}

if (process.argv.length !== 6) {
  console.error('Usage: npm run crawler {type} {moviesCount} {moviePages} {userPages}')
  process.exit(1)
}

const crawlConfig = {
  type: process.argv[2],
  moviesCount: +process.argv[3],
  moviePages: +process.argv[4],
  userPages: +process.argv[5]
}

async function crawl() {
  await Rank.destroy({
    where: {}
  })
  await Rating.destroy({
    where: {}
  })
  await Movie.destroy({
    where: {}
  })
  await User.destroy({
    where: {}
  })

  await sequelize.query(`
    ALTER SEQUENCE "Ranks_id_seq" RESTART WITH 1;
    ALTER SEQUENCE "Ratings_id_seq" RESTART WITH 1;
    ALTER SEQUENCE "Movies_id_seq" RESTART WITH 1;
    ALTER SEQUENCE "Users_id_seq" RESTART WITH 1;
  `)

  const moviesCsfdToReal = new Map<number, number>()
  // const moviesRealToCsfd = new Map<number, number>()
  const usersCsfdToReal = new Map<number, number>()
  // const usersRealToCsfd = new Map<number, number>()

  const getMovieId = async (movie: Csfd.Movie) => {
    if (moviesCsfdToReal.has(movie.id)) {
      return moviesCsfdToReal.get(movie.id)
    }

    const dbMovie = await Movie.create({
      name: movie.name
    })

    moviesCsfdToReal.set(movie.id, dbMovie.id)

    return dbMovie.id
  }

  const password = await Bcrypt.hash('123456', 9)

  const getUserId = async (user: Csfd.User) => {
    if (usersCsfdToReal.has(user.id)) {
      return usersCsfdToReal.get(user.id)
    }

    const dbUser = await User.create({
      name: user.name,
      password
    })

    usersCsfdToReal.set(user.id, dbUser.id)

    return dbUser.id
  }

  const start = Date.now()

  const movies = crawlConfig.type === 'new' ? await loadNewMovies(crawlConfig.moviesCount) : await loadMovies(crawlConfig.type, crawlConfig.moviesCount)

  let movieN = 1
  for (let basicMovie of movies) {
    console.log(`M ${movieN}/${movies.length}`)

    const movie = await loadMovie(basicMovie.id, crawlConfig.moviePages)
    const dbMovieId = await getMovieId(movie)

    let ratingN = 1
    for (let rating of movie.ratings) {
      console.log(`R ${ratingN}/${movie.ratings.length} M ${movieN}/${movies.length}`)

      const dbUserId = await getUserId(rating.user)

      try {
        await Rating.create({
          userId: dbUserId,
          movieId: dbMovieId,
          value: rating.value
        })
      }
      catch (err) {}

      const user = await loadUser(rating.user.id, crawlConfig.userPages)

      let userRatingN = 1
      for (let rating of user.ratings) {
        console.log(`U ${userRatingN}/${user.ratings.length} R ${ratingN}/${movie.ratings.length} M ${movieN}/${movies.length}`)

        const dbMovieId = await getMovieId(rating.movie)

        try {
          await Rating.create({
            userId: dbUserId,
            movieId: dbMovieId,
            value: rating.value
          })
        }
        catch (err) {}

        console.log(`U ${userRatingN}/${user.ratings.length} R ${ratingN}/${movie.ratings.length} M ${movieN}/${movies.length} DONE!`)
        userRatingN += 1
      }

      console.log(`R ${ratingN}/${movie.ratings.length} M ${movieN}/${movies.length} DONE!`)
      ratingN += 1
    }

    console.log(`M ${movieN}/${movies.length} DONE!`)
    movieN += 1
  }

  console.log(`Total time: ${Date.now() - start} ms`)
}

crawl()
