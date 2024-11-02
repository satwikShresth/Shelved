// deno-lint-ignore-file no-prototype-builtins
import { Router } from 'express';
import pg from 'pg';
import env from '../env.json' with { type: 'json' };
import * as bcrypt from 'bcrypt';

const pool = new pg.Pool(env);
const router = Router();

// Make sure we have username and password in the fields
const validateUsernamePassword = (req, res, next) => {
    if (
        !req.body ||
        !req.body.hasOwnProperty('username') ||
        !req.body.hasOwnProperty('password')
    ) {
        return res.sendStatus(400);
    }
    next();
};

// Randomly generated "token"
const makeToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
};

const validateUserCreation = async (req, res, next) => {
    const { body } = req;
    const { username, _ } = body;

    let result;
    try {
        result = await pool.query(
            'SELECT username FROM users WHERE username = $1',
            [username],
        );
    } catch (error) {
        console.log('SELECT FAILED', error);
        return res.sendStatus(500);
    }

    if (result.rows.length > 0) {
        return res.status(409).json({ error: 'Username already exists' });
    }
    next();
};

router.post('/create', [validateUsernamePassword, validateUserCreation], async (req, res) => {
    const { body } = req;
    const { username, password } = body;

    let hash;
    try {
        hash = await bcrypt.hash(password);
    } catch (error) {
        console.log('HASH FAILED', error);
        return res.sendStatus(500);
    }

    try {
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [
            username,
            hash,
        ]);
    } catch (error) {
        console.log('INSERT FAILED', error);
        return res.sendStatus(500);
    }

    // TODO automatically log people in when they create account, because why not?
    return res.status(200).send();
});

router.post('/login', [validateUsernamePassword], async (req, res) => {
    const { body } = req;
    const { username, password } = body;

    let usersResult;
    try {
        usersResult = await pool.query(
            'SELECT id, password FROM users WHERE username = $1',
            [username],
        );
    } catch (error) {
        console.log('SELECT FAILED', error);
        return res.sendStatus(500);
    }

    // username doesn't exist
    if (usersResult.rows.length === 0) {
        return res.sendStatus(400);
    }
    const hash = usersResult.rows[0].password;
    const user_id = usersResult.rows[0].id;

    let verifyResult;
    try {
        verifyResult = await bcrypt.compare(password, hash);
    } catch (error) {
        console.log('VERIFY FAILED', error);
        return res.sendStatus(500); // TODO
    }

    // password didn't match
    if (!verifyResult) {
        console.log("Credentials didn't match");
        return res.sendStatus(400);
    }

    let sessionsResult;
    try {
        sessionsResult = await pool.query(
            'SELECT session_token, user_id FROM sessions WHERE user_id = $1',
            [user_id],
        );
    } catch (error) {
        console.log('SELECT FAILED', error);
        return res.sendStatus(500);
    }

    let token;
    if (sessionsResult.rows.length !== 0) {
        console.log(sessionsResult.rows);
        token = sessionsResult.rows[0].session_token;
        return res.cookie('token', token, cookieOptions).send();
    } else {
        token = makeToken();
    }

    try {
        await pool.query(
            'INSERT INTO sessions (session_token, user_id) VALUES ($1, $2)',
            [token, user_id],
        );
    } catch (error) {
        console.log('INSERT FAILED', error);
        return res.sendStatus(500);
    }
    return res.cookie('token', token, cookieOptions).send(); // TODO
});

router.post('/logout', async (req, res) => {
    const { token } = req.cookies;

    if (token === undefined) {
        console.log('Already logged out');
        return res.sendStatus(400);
    }

    let sessionsResult;
    try {
        sessionsResult = await pool.query(
            'SELECT session_token, user_id FROM sessions WHERE session_token = $1',
            [token],
        );
    } catch (error) {
        console.log('SELECT FAILED', error);
        return res.sendStatus(500);
    }

    if (sessionsResult.rows.length === 0) {
        console.log("Token doesn't exist");
        return res.sendStatus(400);
    }

    try {
        await pool.query(
            'DELETE FROM sessions WHERE session_token = $1',
            [token],
        );
    } catch (error) {
        console.log('DELETE FAILED', error);
        return res.sendStatus(500);
    }
    return res.clearCookie('token', cookieOptions).send();
});

export const authRouter = router;
