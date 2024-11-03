// deno-lint-ignore-file no-prototype-builtins
import { Router } from "express";
import * as bcrypt from "bcrypt";
import db from "../db/knex.js";

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

// Middleware to check if username already exists
const validateUserCreation = async (req, res, next) => {
  const { username } = req.body;

  try {
    const result = await db("users").select("username").where({ username });
    if (result.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }
    next();
  } catch (error) {
    console.log("SELECT FAILED", error);
    return res.sendStatus(500);
  }
};

// Create user route
router.post(
  "/create",
  [validateUsernamePassword, validateUserCreation],
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // Ensure password is treated as a string
      // Hash the password
      const hashedPassword = await bcrypt.hash(password);
      console.log(await hashedPassword);

      await db("users").insert({ username, password: await hashedPassword });
      res.status(201).send({ message: "User created successfully" });
    } catch (error) {
      console.log("INSERT FAILED", error);
      return res.sendStatus(500);
    }
  },
);

// Login route
router.post("/login", [validateUsernamePassword], async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db("users")
      .select("id", "password")
      .where({ username })
      .first();

    if (!user) {
      return res.sendStatus(400); // User not found
    }

    const isPasswordCorrect = await bcrypt.verify(user.password, password);
    if (!isPasswordCorrect) {
      return res.sendStatus(400); // Incorrect password
    }

    const user_id = user.id;
    const now = new Date();

    // Check for an existing valid session
    let session = await db("sessions")
      .select("session_token", "expires_at")
      .where({ user_id })
      .first();

    let token;
    if (session && new Date(session.expires_at) > now) {
      token = session.session_token; // Use existing token if valid
    } else {
      // Create a new session token if expired or not found
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const insertResult = await db("sessions")
        .insert({
          user_id,
          expires_at: expiresAt,
        })
        .returning("session_token");

      token = insertResult[0].session_token;
    }

    // Set cookie with the session token
    res
      .cookie("token", token, cookieOptions)
      .send({ message: "Login successful" });
  } catch (error) {
    console.log("LOGIN FAILED", error);
    res.sendStatus(500);
  }
});

// Logout route
router.post("/logout", async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    console.log("Already logged out");
    return res.sendStatus(400);
  }

  try {
    await db("sessions").where({ session_token: token }).del();
    res
      .clearCookie("token", cookieOptions)
      .send({ message: "Logout successful" });
  } catch (error) {
    console.log("LOGOUT FAILED", error);
    res.sendStatus(500);
  }
});

// Authorization middleware
const authorize = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.sendStatus(403);
  }

  try {
    const session = await db("sessions")
      .select("user_id", "expires_at")
      .where({ session_token: token })
      .first();

    if (!session) {
      return res.sendStatus(403);
    }

    const now = new Date();
    if (new Date(session.expires_at) <= now) {
      await db("sessions").where({ session_token: token }).del();
      return res.clearCookie("token", cookieOptions).sendStatus(403);
    }

    const user = await db("users")
      .select("username")
      .where({ id: session.user_id })
      .first();

    if (!user) {
      return res.sendStatus(403); // No user found
    }

    res.locals.username = user.username;
    next();
  } catch (error) {
    console.log("AUTHORIZATION FAILED", error);
    res.sendStatus(500);
  }
};

export const authRouter = router;
export const authMiddleware = authorize;
