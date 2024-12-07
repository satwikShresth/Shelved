import * as bcrypt from 'bcrypt';
import db from 'db';

export const createUser = async (username, password) => {
   try {
      const hashedPassword = await bcrypt.hash(password);
      await db('users').insert({ username, password: hashedPassword });
      return { success: true, message: 'User created successfully' };
   } catch (error) {
      console.error('Crud Error:', error);
      return { success: false, message: 'Failed to create user' };
   }
};

export const getUserByUsername = async (username) => {
   try {
      const user = await db('users')
         .select('id', 'password', 'username') // Add any other fields as needed
         .where({ username })
         .first();

      return user
         ? { success: true, exists: true, user }
         : { success: true, exists: false, error: 'User not found' };
   } catch (error) {
      console.error('Crud Error:', error);
      return {
         success: false,
         error: 'Database error',
         details: error.message,
      };
   }
};

export const getUserById = async (user_id) => {
   try {
      const user = await db('users')
         .select('username')
         .where({ id: user_id })
         .first();

      return user
         ? { success: true, exists: true, user }
         : { success: true, exists: false, error: 'User not found' };
   } catch (error) {
      console.error('Crud Error:', error);
      return {
         success: false,
         error: 'Database error',
         details: error.message,
      };
   }
};
