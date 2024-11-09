import { retrieveSession } from "crud/session.js";
import { getUserById, getUserByUsername } from "crud/user.js";

export const cookieOptions = {
  httpOnly: true,
  secure: !Deno.env.has("INSECURE_COOKIE"),
  sameSite: "strict",
};

const clearTokenAndRenderError = (res, message) => {
  res.clearCookie("token", cookieOptions).status(403).render("error", {
    status: 403,
    error: "Forbidden",
    message,
  });
};

export const validateSessionToken = async (req, res, next) => {
  const { token } = req.cookies;
  const sessionResult = await retrieveSession(token);

  if (!sessionResult.success) {
    return clearTokenAndRenderError(res, sessionResult.error);
  }

  req.session = sessionResult.session;
  next();
};

export const validateUserId = async (req, res, next) => {
  const { session } = req;

  if (!session) {
    return clearTokenAndRenderError(res, "Session not validated");
  }

  const userResult = await getUserById(session.user_id);
  if (!userResult.success) {
    return clearTokenAndRenderError(res, userResult.error || "User not found");
  }

  res.locals.username = userResult.user.username;
  next();
};

export const authMiddleware = [validateSessionToken, validateUserId];

export const validateUsernamePassword = (req, res, next) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || username.trim() === "") {
    return res
      .status(400)
      .json({ error: "Username is required and must be a non-empty string" });
  }

  if (typeof password !== "string" || password.trim() === "") {
    return res
      .status(400)
      .json({ error: "Password is required and must be a non-empty string" });
  }

  if (username.length < 3 || username.length > 50) {
    return res
      .status(400)
      .json({ error: "Username must be between 3 and 20 characters" });
  }

  if (password.length < 4) {
    return res
      .status(400)
      .json({ error: "Password must be at least 4 characters" });
  }

  next();
};

export const validateUserCreation = async (req, res, next) => {
  const { username } = req.body;

  const userResult = await getUserByUsername(username);

  if (!userResult.success) {
    return res
      .status(500)
      .json({ error: "Database error", details: userResult.details });
  }

  if (userResult.exists) {
    return res.status(409).json({ error: "Username already exists" });
  }

  next();
};
