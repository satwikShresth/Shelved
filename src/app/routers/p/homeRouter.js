import { Router } from "express";
import { getVisibilityOptions } from "crud/visibility.js";
import { getShelvesByUserId } from "crud/shelf.js";
import services from "services/index.js";
import { getDetailedShelfContent } from "middlewares/tmdbMiddleware.js";
import { getContentById } from "crud/content.js";
import { getReviewsByContentID } from "crud/reveiw.js";
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
        `https://openlibrary.org/search.json?q=subject:fiction&sort=readinglog&limit=5&fields=title,author_name,cover_i,first_publish_year,ratings_average,key`
      )
      .catch((err) => console.error(err))

    let trendingMovies = [];
    let trendingShows = [];
    let trendingBooks = [];
    for (let i = 0; i < 5; i++) {
      let movie = moviesData.results[i];
      trendingMovies.push({
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        poster_path: movie.poster_path,
        media_type: 'movie',
      });

      let show = showsData.results[i];
      trendingShows.push({
        id: show.id,
        title: show.name,
        release_date: show.first_air_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        poster_path: show.poster_path,
        media_type: 'tv',
      });

      let book = booksData.data.docs[i];
      trendingBooks.push({
        id: book.key,
        title: book.title,
        release_date: book.first_publish_year.toString(),
        overview: book.author_name[0],
        vote_average: book.ratings_average,
        poster_path: book.cover_i,
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
      
      let formattedShelves = {};

      shelves.forEach((shelf) => {
        let formattedShelf = [];

        req.detailedShelves[shelf.name].forEach((media) => {
          if (media.media_type === 'movie') {
            formattedShelf.push({
              id: media.id,
              title: media.title,
              release_date: media.release_date,
              overview: media.overview,
              vote_average: media.vote_average,
              poster_path: media.poster_path,
              media_type: 'movie',
            })
          } else if (media.media_type === 'tv') {
            formattedShelf.push({
              id: media.id,
              title: media.name,
              release_date: media.first_air_date,
              overview: media.overview,
              vote_average: media.vote_average,
              poster_path: media.poster_path,
              media_type: 'tv',
            });
          } else if (media.media_type === 'book') {
            formattedShelf.push({
              id: media.key,
              title: media.title,
              release_date: media.first_publish_year.toString(),
              overview: media.author_name[0],
              vote_average: media.ratings_average,
              poster_path: media.cover_i,
              media_type: 'book',
            });
          }
        })

        formattedShelves[shelf.name] = formattedShelf;
      });

      res.render("profile", {
        username: res.locals.username,
        shelves,
        shelvesData: formattedShelves,
        visibilityOptions: visibilityOptionsResponse.visibilityOptions,
      });
    } catch (error) {
      console.error("Error loading profile:", error.message);
      res.status(500).send("Failed to load profile.");
    }
  });

  router.get("/content/:content_id", async (req, res) => {
    const { content_id } = req.params;

    try {
      const { success, message, data } = await getContentById(content_id);

      if (!success) {
        throw new Error(`Cannot get External ID: ${message}`);
      }

      const { external_id, content_type, source } = data;

      const service = services[source];

      const item = await service.getDetailsById(external_id, content_type);
      const reviews = await getReviewsByContentID(content_id);

      console.log(reviews);

      if (!item) {
        throw new Error("Content not found");
      }

      res.render("media_page", {
        username: res.locals.username,
        data: item,
        media_type: content_type,
        content_id: content_id,
        source,
        reviews,

        formatDate: (inputDate) =>
          new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(inputDate)),
      });
    } catch (error) {
      console.error("Error fetching content:", error.message);
      res.status(500).send("Failed to load content page.");
    }
  });

  router.get("/whoami", (_req, res) => {
    res.send(`Hello user: ${res.locals.username}`);
  });

  return router;
};

export default getHomeRouter;
