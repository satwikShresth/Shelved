import { Router } from 'express';
import tmdbService from 'services/tmdbService.js';
import {
  validateMediaTypeParam,
  validateRangeParam,
} from 'middlewares/tmdbMiddleware.js';
import axios from 'axios';

const getTmdbRouter = () => {
  const router = Router();

  // New route based on updated api structure
  router.get(
    '/trending',
    async (_req, res) => {
      let trendingMovies = [];
      let trendingShows = [];

      const moviesData = await tmdbService
        .getTrending({ range: 'week', mediaType: 'movie' })
        .catch((error) => {
          console.error('Error fetching trending data:', error.message);
          res.status(500).json({ error: 'Failed to fetch trending data' });
        });
      const showsData = await tmdbService
        .getTrending({ range: 'week', mediaType: 'tv' })
        .catch((error) => {
          console.error('Error fetching trending data:', error.message);
          res.status(500).json({ error: 'Failed to fetch trending data' });
        });

      for (let i = 0; i < 5; i++) {
        let movie = moviesData.results[i];
        trendingMovies.push({
          title: movie.title,
          release_date: movie.release_date,
          poster: `https://image.tmdb.org/t/p/original${movie.poster_path}`,
          media_type: 'movie',
        });

        let show = showsData.results[i];
        trendingShows.push({
          title: show.name,
          release_date: show.first_air_date,
          poster: `https://image.tmdb.org/t/p/original${show.poster_path}`,
          media_type: 'tv',
        });
      }
      res.json({
        movies: trendingMovies,
        shows: trendingShows,
      });
    }
  );

  // Old route based on initial api structure
  router.get('/test', async (_req, res) => {
    let trendingMovies = [];
    let trendingShows = [];
    let trendingBooks = [];
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${Deno.env.get('TMDB_API_KEY')}`,
      },
    };

    const [moviesData, showsData, bookData] = await Promise.all([
      axios
        .request({
          ...options,
          url: 'https://api.themoviedb.org/3/trending/movie/week?language=en-US',
        })
        .catch((err) => console.error(err)),
      axios
        .request({
          ...options,
          url: 'https://api.themoviedb.org/3/trending/tv/week?language=en-US',
        })
        .catch((err) => console.error(err)),
      axios
        .request(
          `https://openlibrary.org/search.json?q=subject:fiction&sort=readinglog&limit=5&fields=title,author_name,cover_i,first_publish_year`
        )
        .catch((err) => console.error(err)),
    ]);

    if (!moviesData || !showsData || !bookData) {
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    for (let i = 0; i < 5; i++) {
      let movie = moviesData.data.results[i];
      trendingMovies.push({
        title: movie.title,
        release_date: movie.release_date,
        poster: `https://image.tmdb.org/t/p/original${movie.poster_path}`,
        media_type: 'movie',
      });

      let show = showsData.data.results[i];
      trendingShows.push({
        title: show.name,
        release_date: show.first_air_date,
        poster: `https://image.tmdb.org/t/p/original${show.poster_path}`,
        media_type: 'show',
      });

      let book = bookData.data.docs[i];
      trendingBooks.push({
        title: book.title,
        author: book.author_name[0],
        release_date: book.first_publish_year.toString(),
        poster: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
        media_type: 'book',
      });
    }

    res.json({
      movies: trendingMovies,
      shows: trendingShows,
      books: trendingBooks,
    });
  });

  return router;
};

export default {
  getRouter: getTmdbRouter,
  needsAuthentication: false,
};
