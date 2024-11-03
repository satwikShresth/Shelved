// deno-lint-ignore-file no-prototype-builtins
import { Router } from "express";
import pg from "pg";
import env from "../env.json" with { type: "json" };
import * as bcrypt from "bcrypt";

const pool = new pg.Pool(env);
const router = Router();

const validateUsernamePassword = (req, res, next) => {
  if (
    !req.body ||
    !req.body.hasOwnProperty("username") ||
    !req.body.hasOwnProperty("password")
  ) {
    return res.sendStatus(400);
  }
  next();
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
};

const validateUserCreation = async (req, res, next) => {
  const { body } = req;
  const { username } = body;

  let result;
  try {
    result = await pool.query(
      "SELECT username FROM users WHERE username = $1",
      [username],
    );
  } catch (error) {
    console.log("SELECT FAILED", error);
    return res.sendStatus(500);
  }

  if (result.rows.length > 0) {
    return res.status(409).json({ error: "Username already exists" });
  }
  next();
};

router.post(
  "/create",
  [validateUsernamePassword, validateUserCreation],
  async (req, res) => {
    const { username, password } = req.body;

    let hash;
    try {
      hash = await bcrypt.hash(password, 10);
    } catch (error) {
      console.log("HASH FAILED", error);
      return res.sendStatus(500);
    }

    try {
      await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        [username, hash],
      );
    } catch (error) {
      console.log("INSERT FAILED", error);
      return res.sendStatus(500);
    }

    return res.status(200).send();
  },
);

router.post("/login", [validateUsernamePassword], async (req, res) => {
  const { username, password } = req.body;

  let usersResult;
  try {
    usersResult = await pool.query(
      "SELECT id, password FROM users WHERE username = $1",
      [username],
    );
  } catch (error) {
    console.log("SELECT FAILED", error);
    return res.sendStatus(500);
  }

  if (usersResult.rows.length === 0) {
    return res.sendStatus(400);
  }

  const hash = usersResult.rows[0].password;
  const user_id = usersResult.rows[0].id;

  let verifyResult;
  try {
    verifyResult = await bcrypt.compare(password, hash);
  } catch (error) {
    console.log("VERIFY FAILED", error);
    return res.sendStatus(500);
  }

  if (!verifyResult) {
    console.log("Credentials didn't match");
    return res.sendStatus(400);
  }

  let sessionsResult;
  try {
    sessionsResult = await pool.query(
      "SELECT session_token FROM sessions WHERE user_id = $1",
      [user_id],
    );
  } catch (error) {
    console.log("SELECT FAILED", error);
    return res.sendStatus(500);
  }

  let token;
  if (sessionsResult.rows.length > 0) {
    token = sessionsResult.rows[0].session_token;
  } else {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      const insertResult = await pool.query(
        "INSERT INTO sessions (user_id, expires_at) VALUES ($1, $2) RETURNING session_token",
        [user_id, expiresAt],
      );
      token = insertResult.rows[0].session_token;
    } catch (error) {
      console.log("INSERT FAILED", error);
      return res.sendStatus(500);
    }
  }

  return res.cookie("token", token, cookieOptions).send();
});

router.post("/logout", (req, res) => {
  const { token } = req.cookies;

  if (token === undefined) {
    console.log("Already logged out");
    return res.sendStatus(400);
  }

  pool.query(
    "DELETE FROM sessions WHERE session_token = $1",
    [token],
    (deleteError) => {
      if (deleteError) {
        console.log("DELETE FAILED", deleteError);
        return res.sendStatus(500);
      }
      return res.clearCookie("token", cookieOptions).send();
    },
  );
});

const authorize = (req, res, next) => {
  const { token } = req.cookies;

  if (token === undefined) {
    return res.sendStatus(403);
  }

  pool.query(
    "SELECT user_id FROM sessions WHERE session_token = $1",
    [token],
    (error, sessionsResult) => {
      if (error) {
        console.log("SELECT FAILED", error);
        return res.sendStatus(500);
      }

      if (sessionsResult.rows.length === 0) {
        return res.sendStatus(403);
      } else {
        res.locals.user_id = sessionsResult.rows[0].user_id;
        next();
      }
    },
  );
};

export const authRouter = router;
export const authMiddleware = authorize;
