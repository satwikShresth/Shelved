import { Router } from 'express';

const getSearchRouter = () => {
   const router = Router();

   router.get('/search', (_req, res) => {
      res.render('search');
   });

   return router;
};

export default getSearchRouter;
