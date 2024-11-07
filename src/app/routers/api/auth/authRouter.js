import { Router } from "express";
import * as bcrypt from "bcrypt";
import { createUser, getUserByUsername } from "crud/user.js";
import { checkSession, createSession, deleteSession } from "crud/session.js";
import {
  validateSessionToken,
  validateUserCreation,
  validateUsernamePassword,
  cookieOptions,
} from "middlewares/authMiddleware.js";

const getAuthRouter = () => {
  const router = Router();

  router.post(
    "/create",
    [validateUsernamePassword, validateUserCreation],
    async (req, res) => {
      const { username, password } = req.body;
      const result = await createUser(username, password);

      res.status(result.success ? 201 : 500).send({ message: result.message });
    },
  );

  router.post("/login", [validateUsernamePassword], async (req, res) => {
    const { username, password } = req.body;

    const userResult = await getUserByUsername(username);

    if (!userResult.success) {
      return res.status(400).send({ message: userResult.error });
    }

    if (!userResult.exists) {
      return res.status(409).json({ message: "Username does not exists" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      userResult.user.password,
    );
    if (!isPasswordCorrect) {
      return res.status(400).send({ message: "Invalid credentials" });
    }

    const user_id = userResult.user.id;
    const now = new Date();

    const sessionResult = await checkSession(user_id);

    let token;

    if (
      sessionResult.success &&
      new Date(sessionResult.session.expires_at) > now
    ) {
      token = sessionResult.session.session_token;
    } else {
      const createSessionResult = await createSession(user_id);
      if (!createSessionResult.success) {
        return res.status(500).send({ message: createSessionResult.error });
      }
      token = createSessionResult.token;
    }

    res
      .cookie("token", token, cookieOptions)
      .send({ message: "Login successful" });
  });

  router.post("/logout", [validateSessionToken], async (req, res) => {
    const { token } = req.cookies;

    const deleteResult = await deleteSession(token);

    if (!deleteResult.success) {
      const status = deleteResult.error === "Session not found" ? 404 : 500;
      return res.status(status).json({ error: deleteResult.error });
    }

    res.clearCookie("token", cookieOptions).send({ message: "Logged out" });
  });

  return router;
};

export default {
  getRouter: getAuthRouter,
  needsAuthentication: false,
};
