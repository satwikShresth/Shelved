import { Router } from 'express';
import { getContentID } from 'crud/content.js';
import { validateBodyString } from 'middlewares/commonMiddleware.js';
import { addReview } from 'crud/reveiw.js';

const getContentRouter = () => {
   const router = Router();

   router.post(
      '/',
      validateBodyString(['contentId', 'media_type', 'source']),
      async (req, res) => {
         const { contentId, source, media_type } = req.body;

         const contentResult = await getContentID(
            source,
            media_type,
            contentId,
         );

         if (!contentResult.success) {
            throw new Error(contentResult.message);
         }

         const localContentId = contentResult.content_id;
         const targetUrl = `/p/content/${localContentId}`;

         res.status(200).json({ redirectUrl: targetUrl });
      },
   );

   router.post(
      '/reviews/add',
      validateBodyString(['title', 'body']),
      async (req, res) => {
         const { rating_id } = req.body;
         const user_id = req.session.user_id;

         const reviewId = await addReview({ user_id, ...req.body });

         if (!reviewId) {
            throw new Error('Failed to add review');
         }

         res.status(200).json({ success: true, message: `Added review` });
      },
   );

   return router;
};

export default getContentRouter;
