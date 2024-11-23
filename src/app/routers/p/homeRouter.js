import { Router } from "express";
import { getVisibilityOptions } from "crud/visibility.js";
import { getShelvesByUserId } from "crud/shelf.js";
import services from "services/index.js";
import { getDetailedShelfContent } from "middlewares/tmdbMiddleware.js";
import axios from 'axios';

const getHomeRouter = () => {
  const router = Router();

  router.get("/homepage", async (req, res) => {
    const user_id = req.session.user_id;

    const shelvesResponse = await getShelvesByUserId(user_id);
    if (!shelvesResponse.success) {
      return res.status(500).send("Failed to fetch shelves.");
    }

    const tmdbService = services["tmdb"];
    
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
    const booksData = await axios
      .request(
        `https://openlibrary.org/search.json?q=subject:fiction&sort=readinglog&limit=5&fields=title,author_name,cover_i,first_publish_year,ratings_average`
      )
      .catch((err) => console.error(err))

    let trendingMovies = [];
    let trendingShows = [];
    let trendingBooks = [];
    for (let i = 0; i < 5; i++) {
      let movie = moviesData.results[i];
      trendingMovies.push({
        title: movie.title,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        poster: `https://image.tmdb.org/t/p/original${movie.poster_path}`,
        media_type: 'movie',
      });

      let show = showsData.results[i];
      trendingShows.push({
        title: show.name,
        release_date: show.first_air_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        poster: `https://image.tmdb.org/t/p/original${show.poster_path}`,
        media_type: 'tv',
      });

      let book = booksData.data.docs[i];
      trendingBooks.push({
        title: book.title,
        release_date: book.first_publish_year.toString(),
        overview: book.author_name[0],
        vote_average: book.ratings_average,
        poster: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
        media_type: 'book',
      });
    }

    res.render("homepage", {
      username: res.locals.username,
      trendingData: {
        movies: trendingMovies,
        shows: trendingShows,
        books: trendingBooks
      },
      shelves: shelvesResponse.shelves || [],
    });
  });

  router.get("/profile", getDetailedShelfContent, async (req, res) => {
    try {
      const user_id = req.session.user_id;

      const shelvesResponse = await getShelvesByUserId(user_id);

      if (!shelvesResponse.success) {
        return res.status(500).send("Failed to fetch shelves.");
      }

      const shelves = shelvesResponse.shelves || [];

      const visibilityOptionsResponse = await getVisibilityOptions();

      if (!visibilityOptionsResponse.success) {
        return res.status(500).send("Failed to fetch visibility options.");
      }

      res.render("profile", {
        user: { name: res.locals.username },
        shelves,
        shelvesData: req.detailedShelves,
        visibilityOptions: visibilityOptionsResponse.visibilityOptions,
      });
    } catch (error) {
      console.error("Error loading profile:", error.message);
      res.status(500).send("Failed to load profile.");
    }
  });

  router.get("/whoami", (_req, res) => {
    res.send(`Hello user: ${res.locals.username}`);
  });

  return router;
};

export default getHomeRouter;
