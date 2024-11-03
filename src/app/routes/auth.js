import { Router } from "express";
import * as bcrypt from "bcrypt";
import db from "db";

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

router.post(
  "/create",
  [validateUsernamePassword, validateUserCreation],
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password);
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
      return res.sendStatus(400);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.sendStatus(400);
    }

    const user_id = user.id;
    const now = new Date();

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

    res
      .cookie("token", token, cookieOptions)
      .send({ message: "Login successful" });
  } catch (error) {
    console.log("LOGIN FAILED", error);
    res.sendStatus(500);
  }
});

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

export default { router: router, base: "/auth", needsAuthentication: false };
