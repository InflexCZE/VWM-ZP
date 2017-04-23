import { sequelize, User, Movie, Rating } from '../models'
import * as DOM from 'jsdom'

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

if (process.argv.length !== 6) {
  console.error('Usage: npm run crawler {type} {moviesCount} {moviePages} {userPages}')
}

const crawlConfig = {
  type: process.argv[2],
  moviesCount: +process.argv[3],
  moviePages: +process.argv[4],
  userPages: +process.argv[5]
}

async function crawl() {
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

  const getUserId = async (user: Csfd.User) => {
    if (usersCsfdToReal.has(user.id)) {
      return usersCsfdToReal.get(user.id)
    }

    const dbUser = await User.create({
      name: user.name,
      password: ''
    })

    usersCsfdToReal.set(user.id, dbUser.id)

    return dbUser.id
  }

  const movies = await loadMovies(crawlConfig.type, crawlConfig.moviesCount)

  for (let basicMovie of movies) {
    const movie = await loadMovie(basicMovie.id, crawlConfig.moviePages)
    const dbMovieId = await getMovieId(movie)

    for (let rating of movie.ratings) {
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
      for (let rating of user.ratings) {
        const dbMovieId = await getMovieId(rating.movie)

        try {
          await Rating.create({
            userId: dbUserId,
            movieId: dbMovieId,
            value: rating.value
          })
        }
        catch (err) {}
      }
    }
  }
}

crawl()
