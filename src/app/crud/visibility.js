import db from 'db';

export const getVisibilityOptions = async () => {
   try {
      const result = await db('visibility_options').select('value');
      return {
         success: true,
         message: 'Visibility options fetched successfully',
         visibilityOptions: result.map((row) => row.value),
      };
   } catch (error) {
      console.error('Error fetching visibility options:', error.message);
      return {
         success: false,
         message: 'Failed to fetch visibility options',
         error: error.message,
      };
   }
};

export const getVisibilityByValue = async (visibility) => {
   try {
      const result = await db('visibility_options')
         .select('value')
         .where('id', visibility)
         .first();

      if (result) {
         return {
            success: true,
            message: 'Visibility option found',
            value: result.value,
         };
      } else {
         return { success: false, message: 'Visibility option not found' };
      }
   } catch (error) {
      console.error('Error fetching visibility by ID:', error.message);
      return {
         success: false,
         message: 'Failed to fetch visibility by ID',
         error: error.message,
      };
   }
};
