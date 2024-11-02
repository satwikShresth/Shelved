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
          id INTEGER PRIMARY KEY,
          username VARCHAR,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP
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

function main() {
  initializeUsersTable();
}

main();
