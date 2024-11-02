// deno-lint-ignore-file no-prototype-builtins
import { Router } from 'express';
import pg from 'pg';
import env from '../env.json' with { type: 'json' };
import * as bcrypt from 'bcrypt';

const pool = new pg.Pool(env);
const router = Router();

// Make sure we have username and password in the fields
const validateLogin = (req, res, next) => {
   if (
      !req.body.hasOwnProperty('username') ||
      !req.body.hasOwnProperty('password')
   ) {
      return res.sendStatus(400);
   }
   next();
};

router.use(validateLogin);

function randomHex() {
   const bytes = new Uint8Array(32);
   crypto.getRandomValues(bytes);
   return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
}

router.post('/create', async (req, res) => {
   const { body } = req;
   const { username, password } = body;

   // TODO check username doesn't already exist
   // TODO validate username/password meet requirements

   let hash;
   try {
      hash = await bcrypt.hash(password);
   } catch (error) {
      console.log('HASH FAILED', error);
      return res.sendStatus(500);
   }

   try {
      await pool.query(
         'INSERT INTO users (username, password) VALUES ($1, $2)',
         [
            username,
            hash,
         ],
      );
   } catch (error) {
      console.log('INSERT FAILED', error);
      return res.sendStatus(500);
   }

   // TODO automatically log people in when they create account, because why not?
   return res.status(200).send();
});

export const authRouter = router;
