import { Router } from 'express';
import { getVisibilityOptions } from 'crud/visibility.js';
import { getShelvesByUserId } from 'crud/shelf.js';
import services from 'services/index.js';
import { getDetailedShelfContent } from 'middlewares/tmdbMiddleware.js';
import { getContentById } from 'crud/content.js';
import { getReviewsByContentID } from 'crud/reveiw.js';

const getHomeRouter = () => {
   const router = Router();

   router.get('/homepage', async (req, res) => {
      const shelvesResponse = await getShelvesByUserId(req.session.user_id);

      if (!shelvesResponse.success) {
         return res.status(500).send('Failed to fetch shelves.');
      }

      const tmdb = services['tmdb'];
      const openlibrary = services['openlibrary'];

      const trendingData = {
         movies: await tmdb
            .getTrending({ range: 'week', mediaType: 'movie' }),
         shows: await tmdb
            .getTrending({ range: 'week', mediaType: 'tv' }),
         books: await openlibrary
            .getTrending(),
      };

      if (
         !trendingData?.movies ||
         !trendingData?.shows ||
         !trendingData?.books
      ) {
         throw new Error('Invalid API response');
      }

      trendingData.movies = trendingData.movies.slice(0, 5);
      trendingData.shows = trendingData.shows.slice(0, 5);

      return res.render('homepage', {
         username: res.locals.username,
         trendingData,
         shelves: shelvesResponse.shelves || [],
      });
   });

   router.get('/profile', getDetailedShelfContent, async (req, res) => {
      const user_id = req.session.user_id;

      const shelvesResponse = await getShelvesByUserId(user_id);

      if (!shelvesResponse.success) {
         return res.status(500).send('Failed to fetch shelves.');
      }

      const shelves = shelvesResponse.shelves || [];

      const visibilityOptionsResponse = await getVisibilityOptions();

      if (!visibilityOptionsResponse.success) {
         return res.status(500).send('Failed to fetch visibility options.');
      }

      const formattedShelves = {};

      shelves.forEach((shelf) => {
         const formattedShelf = [];

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
               });
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
         });

         formattedShelves[shelf.name] = formattedShelf;
      });

      res.render('profile', {
         username: res.locals.username,
         shelves,
         shelvesData: formattedShelves,
         visibilityOptions: visibilityOptionsResponse.visibilityOptions,
      });
   });

   router.get('/content/:content_id', async (req, res) => {
      const { content_id } = req.params;

      const { success, message, data } = await getContentById(content_id);

      if (!success) {
         throw new Error(`Cannot get External ID: ${message}`);
      }

      const { external_id, media_type, source } = data;

      const service = services[source];
      console.log(service);
      console.log(external_id, source, media_type);
      const item = await service.getDetailsById({
         id: external_id,
         media_type,
      });
      const reviews = await getReviewsByContentID(content_id);

      console.log(reviews);

      if (!item) {
         throw new Error('Content not found');
      }

      res.render('media_page', {
         username: res.locals.username,
         data: item,
         media_type,
         content_id,
         source,
         reviews,

         formatDate: (inputDate) =>
            new Intl.DateTimeFormat('en-US', {
               year: 'numeric',
               month: 'long',
               day: 'numeric',
            }).format(new Date(inputDate)),
      });
   });

   router.get('/whoami', (_req, res) => {
      res.send(`Hello user: ${res.locals.username}`);
   });

   return router;
};

export default getHomeRouter;
