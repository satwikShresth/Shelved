import pg from 'pg';
import env from '../env.json' with { type: 'json' };

const Pool = pg.Pool;
const pool = new Pool(env);

function initializeUsersTable() {
  pool.connect().then(client => {
    try {
      // Create users table if it doesn't exist
      client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR,
          password VARCHAR(255) NOT NULL
        )
      `);

      console.log("Users table created successfully");
    } catch (error) {
      console.error("Error initializing Users table:", error);
      throw error;
    } finally {
      client.release();
    }
  });
}

function initializeSessionsTable() {
  pool.connect().then(client => {
    try {
      client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          session_token VARCHAR(255) PRIMARY KEY,
          user_id INTEGER NOT NULL
        )
      `);
      console.log("Sessions table initialized successfully");
    } catch (error) {
      console.error("Error initializing sessions table:", error);
      throw error;
    } finally {
      client.release();
    }
  });
}

function main() {
  initializeUsersTable();
  initializeSessionsTable();
}

main();
