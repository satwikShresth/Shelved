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

      res.render('profile', {
         username: res.locals.username,
         shelves,
         shelvesData: req.detailedShelves,
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
      const item = await service.getDetailsById({
         id: external_id,
         media_type,
      });
      const reviews = await getReviewsByContentID(content_id);

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
