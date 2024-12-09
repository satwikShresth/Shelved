import db from 'db';
import { getContentID } from 'crud/content.js';
import { getUserById } from 'crud/user.js';

export const getShelvesByUserId = async (user_id) => {
   try {
      const shelves = await db('shelf')
         .leftJoin(
            'visibility_options',
            'shelf.visibility_id',
            '=',
            'visibility_options.id',
         )
         .select('shelf.name', 'visibility_options.value as visibility')
         .where({ 'shelf.user_id': user_id });

      return {
         success: true,
         shelves: shelves.length ? shelves : null,
      };
   } catch (error) {
      console.error('Error fetching shelves:', error.message);
      return {
         success: false,
         error: `Shelve error: ${error.message}`,
      };
   }
};

export const createShelf = async ({ user_id, name, visibility }) => {
   try {
      const visibilityResult = await db('visibility_options')
         .select('id')
         .where('value', visibility)
         .first();

      if (!visibilityResult) {
         throw new Error(`Invalid visibility value: ${visibility}`);
      }

      const [newShelf] = await db('shelf')
         .insert({ user_id, name, visibility_id: visibilityResult.id })
         .returning(['id', 'user_id', 'name', 'visibility_id', 'created_at']);

      return {
         success: true,
         shelf: newShelf,
      };
   } catch (error) {
      console.error('Error creating shelf:', error.message);
      return {
         success: false,
         error: `Shelve error: ${error.message}`,
      };
   }
};

export const addContentToShelf = async ({
   external_id,
   source,
   shelf,
   content_type,
   status,
}) => {
   try {
      const contentResult = await getContentID(
         source,
         content_type,
         external_id,
      );
      if (!contentResult.success) {
         throw new Error(contentResult.message);
      }

      const shelfRecord = await db('shelf')
         .select('id')
         .where('id', shelf)
         .first();
      if (!shelfRecord) {
         throw new Error(`Shelf '${shelf}' not found.`);
      }

      const statusRecord = await db('shelf_content_status')
         .select('id')
         .where('value', status)
         .first();
      if (!statusRecord) {
         throw new Error(`Status '${status}' not found.`);
      }

      await db('shelf_content')
         .insert({
            shelf_id: shelfRecord.id,
            content_id: contentResult.content_id,
            status_id: statusRecord.id,
         })
         .onConflict(['shelf_id', 'content_id'])
         .merge();

      return { success: true, message: 'Item added to shelf successfully' };
   } catch (error) {
      console.error('Error adding item to shelf_content:', error.message);
      return {
         success: false,
         error: `Shelf error: ${error.message}`,
      };
   }
};

export const getShelfContent = async (user_id, shelf) => {
   try {
      const shelfRecord = await db('shelf')
         .select('id')
         .where({ id: shelf, user_id })
         .first();

      if (!shelfRecord) {
         throw new Error('Shelf not found or does not belong to the user');
      }

      const shelfContentData = await db('shelf_content')
         .join('content', 'shelf_content.content_id', '=', 'content.id')
         .join('content_type', 'content.type_id', '=', 'content_type.id')
         .join('db_source', 'content.source_id', '=', 'db_source.id')
         .select(
            'content.external_id',
            'content_type.value as content_type',
            'db_source.name as db_source',
            'shelf_content.shelf_id',
         )
         .where('shelf_content.shelf_id', shelf);

      return { success: true, content: shelfContentData };
   } catch (error) {
      console.error('Error fetching shelf content:', error.message);
      return {
         success: false,
         error: `Shelve error: ${error.message}`,
      };
   }
};

export const getAllShelvesContent = async (user_id) => {
   try {
      const userShelves = await db('shelf')
         .select('id', 'name')
         .where({ user_id });

      if (userShelves.length === 0) {
         return {
            success: true,
            shelves: {},
            message: 'No shelves found for this user',
         };
      }

      const shelvesContent = {};
      for (const shelf of userShelves) {
         const shelfContentResponse = await getShelfContent(user_id, shelf.id);

         if (!shelfContentResponse.success) {
            throw new Error(
               `Failed to fetch content for shelf ID ${shelf.id}: ${shelfContentResponse.message}`,
            );
         }
         shelvesContent[shelf.name] = shelfContentResponse.content.map((
            item,
         ) => ({
            content_type: item.content_type,
            external_id: item.external_id,
            db_source: item.db_source,
         }));
      }

      return { success: true, shelves: shelvesContent };
   } catch (error) {
      console.error('Error aggregating shelves content:', error.message);
      return {
         success: false,
         error: `Shelve error: ${error.message}`,
      };
   }
};
