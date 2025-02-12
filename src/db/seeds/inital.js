/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  const bcrypt = await import("bcrypt");

  await knex('shelf_content').del();
  await knex('shelf').del();
  await knex('followings').del();
  await knex('users').del();

  await knex("users").insert([
    { username: "admin", password: await bcrypt.hash("admin") },
  ]);
  const {default: { tmdb, openlibrary }} = await import('../../app/services/index.js');

  const getContentID = async (source, media_type, media_id) => {
    try {
      const existingContent = await knex('content')
        .select('id')
        .where('external_id', media_id)
        .andWhere(
          'source_id',
          knex('db_source').select('id').where('name', source),
        )
        .andWhere(
          'type_id',
          knex('content_type').select('id').where('value', media_type),
        )
        .first();

      if (existingContent) {
        return {
          success: true,
          content_id: existingContent.id,
          message: 'Content already indexed',
        };
      }

      const newContent = await addContentID(media_id, source, media_type);

      if (newContent.success) {
        return {
          success: true,
          content_id: newContent.content_id,
          message: 'Content added successfully',
        };
      } else {
        throw new Error(newContent.message);
      }
    } catch (error) {
      console.error('Error in getContent:', error.message);
      return {
        success: false,
        message: 'Failed to retrieve or add content',
        error: error.message,
      };
    }
  };

  const addContentID = async (external_id, source, type) => {
    try {
      const sourceRecord = await knex('db_source')
        .select('id')
        .where('name', source)
        .first();
      if (!sourceRecord) {
        throw new Error(`Source '${source}' not found.`);
      }

      const typeRecord = await knex('content_type')
        .select('id')
        .where('value', type)
        .first();
      if (!typeRecord) {
        throw new Error(`Content type '${type}' not found.`);
      }

      const [contentResult] = await knex('content')
        .insert({
          external_id,
          source_id: sourceRecord.id,
          type_id: typeRecord.id,
        })
        .onConflict(['external_id', 'source_id'])
        .merge()
        .returning('id');

      if (!contentResult) {
        throw new Error('Failed to insert or retrieve content ID.');
      }

      return {
        success: true,
        content_id: contentResult.id,
        message: 'Content added or retrieved successfully',
      };
    } catch (error) {
      console.error('Error adding content:', error.message);
      return {
        success: false,
        message: 'Failed to add or retrieve content',
        error: error.message,
      };
    }
  };

  const addContentToShelf = async ({external_id, source, shelf, content_type, status}) => {
    try {
      const contentResult = await getContentID(source, content_type, external_id);
      if (!contentResult.success) {
        throw new Error(contentResult.message);
      }

      const shelfRecord = await knex('shelf')
        .select('id')
        .where('id', shelf)
        .first();
      if (!shelfRecord) {
        throw new Error(`Shelf '${shelf}' not found.`);
      }

      const statusRecord = await knex('shelf_content_status')
        .select('id')
        .where('value', status)
        .first();
      if (!statusRecord) {
        throw new Error(`Status '${status}' not found.`);
      }

      await knex('shelf_content')
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


 const testUsers = [
    { username: 'TestUser', password: 'password' },
    { username: 'TestUserFriend1', password: 'password123' },
    { username: 'TestUserFriend2', password: 'password123' },
    { username: 'TestUserFriend3', password: 'password123' },
    { username: 'TestUserFriend4', password: 'password123' },
    { username: 'TestUserFriend5', password: 'password123' },
  ];

  try {
    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      testUsers.map(async (user) => ({
        username: user.username,
        password: await bcrypt.hash(user.password)
      }))
    );

    // Insert users and get their IDs
    const users = await knex('users')
      .insert(hashedUsers)
      .returning(['id', 'username']);

    const mainUser = users[0];
    const friendUsers = users.slice(1);

    // Create following relationships
    const followingRelations = friendUsers.map(friend => ({
      user_id: friend.id,
      followed_user_id: mainUser.id
    }));


    const followerRelations = friendUsers.map(friend => ({
      followed_user_id: friend.id,
      user_id: mainUser.id
    }));

    // Insert following relationships
    await knex('followings').insert(followingRelations);
    await knex('followings').insert(followerRelations);

    // Fetch mixed content with retry logic
    const [books, movies, tvShows] = await Promise.all([
      openlibrary.getTrending({ query: 'fiction', limit: 20 }),
      tmdb.getTrending({ mediaType: 'movie', limit: 20 }),
      tmdb.getTrending({ mediaType: 'tv', limit: 20 })
    ]);

    // Create shelves for each user
    const shelfTypes = ['consumed', 'consuming', 'to_consume'];

    for (const user of users) {
      // Create the three shelves for the user
      const shelves = await knex('shelf')
        .insert(shelfTypes.map(type => ({
          user_id: user.id,
          name: type
        })))
        .returning(['id', 'name']);

      // Add content to each shelf
      for (const shelf of shelves) {
        const status = shelf.name;
        const shuffleArray = array => {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
        };

        const validBooks = shuffleArray(books.filter(book => book && book.id)).slice(0, 3);
        const validMovies = shuffleArray(movies.filter(movie => movie && movie.id)).slice(0, 3);
        const validTvShows = shuffleArray(tvShows.filter(show => show && show.id)).slice(0, 3);
        // Add books
        for (const book of validBooks) {
          await addContentToShelf({
            external_id: book.id,
            source: 'openlibrary',
            content_type: book.media_type,
            shelf: shelf.id,
            status: status
          });
        }

        // Add movies
        for (const movie of validMovies) {
          await addContentToShelf({
            external_id: movie.id,
            source: 'tmdb',
            content_type: movie.media_type,
            shelf: shelf.id,
            status: status
          });
        }

        // Add TV shows
        for (const show of validTvShows) {
          await addContentToShelf({
            external_id: show.id,
            source: 'tmdb',
            content_type: show.media_type,
            shelf: shelf.id,
            status: status
          });
        }
      }
    }
    
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
  
}
