import express from 'express';
import pg from 'pg';
import env from '../env.json' with { type: 'json' };

const app = express();
const port = 3000;
const hostname = '0.0.0.0';

const Pool = pg.Pool;
const pool = new Pool(env);

pool
   .connect()
   .then(function () {
      console.log(`Connected to database ${env.database}`);
   })
   .catch(function (error) {
      console.error(`Error connecting to database: ${error.message}`);
      return error;
   });

app.get('/', (_, res) => {
   res.send('Hello from Deno with Express!');
});

app.listen(port, hostname, () => {
   console.log(`Listening at: http://${hostname}:${port}`);
});
