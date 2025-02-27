import { Router } from 'express';
import { addContentToShelf, createShelf } from 'crud/shelf.js';
import { validateBodyString } from 'middlewares/commonMiddleware.js';
import db from 'db';

const getShelfRouter = () => {
   const router = Router();

   router.post(
      '/create',
      validateBodyString(['shelfName', 'visibility']),
      async (req, res) => {
         const { shelfName, visibility } = req.body;
         const user_id = req.session.user_id;

         const result = await createShelf({
            user_id,
            name: shelfName,
            visibility,
         });

         if (result.success) {
            res
               .status(201)
               .json({ success: true, message: 'Shelf created successfully' });
         } else {
            res
               .status(500)
               .json({ success: false, message: 'Failed to create shelf' });
         }
      },
   );

   router.post(
      '/content/add',
      validateBodyString(['external_id']),
      async (req, res) => {
         const {
            external_id,
            source,
            shelf,
            content_type,
            status = 'to_consume',
         } = req.body;

         const user_id = req.session.user_id;

         const user_shelf = await db('shelf')
            .select('id')
            .where('user_id', user_id)
            .where('name', shelf)
            .first();

         const result = await addContentToShelf({
            external_id,
            source,
            shelf: user_shelf.id,
            content_type,
            status,
         });

         if (result.success) {
            res.json(result);
         } else {
            res.status(500).json(result);
         }
      },
   );

   return router;
};

export default getShelfRouter;
