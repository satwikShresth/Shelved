import db from 'db';

export async function addReview({
   user_id,
   content_id,
   title,
   body,
   rating_id,
}) {
   if (!user_id || isNaN(user_id)) throw new Error('Invalid user_id');
   if (!content_id || isNaN(content_id)) throw new Error('Invalid content_id');
   if (!rating_id || isNaN(rating_id)) throw new Error('Invalid rating_id');
   if (title && title.length > 255) {
      throw new Error('Title exceeds 255 characters');
   }
   if (body && body.length > 256) {
      throw new Error('Body exceeds 256 characters');
   }

   const newReview = {
      user_id,
      content_id,
      title: title || null,
      body: body || null,
      rating_id: rating_id || null,
      created_at: new Date(),
   };

   try {
      const [id] = await db('reviews').insert(newReview).returning('id');
      return { success: true, review_id: id };
   } catch (error) {
      console.error('Error adding review:', error.message);
      throw new Error('Unable to add review');
   }
}

export async function getReviewsByContentID(contentID) {
   if (!contentID || isNaN(contentID)) {
      throw new Error('Invalid content_id');
   }

   try {
      const reviews = await db('reviews')
         .select(
            'users.username',
            'reviews.title',
            'reviews.body',
            'reviews.created_at',
            'ratings.value as rating',
            'ratings.id as rating_id',
         )
         .leftJoin('users', 'reviews.user_id', 'users.id')
         .leftJoin('ratings', 'reviews.rating_id', 'ratings.id')
         .where('reviews.content_id', contentID);

      return reviews;
   } catch (error) {
      console.error('Error fetching reviews:', error.message);
      throw new Error(`Unable to fetch reviews: ${error.message}`);
   }
}
