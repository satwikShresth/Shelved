import { getSessionByToken } from "crud/session.js";
import { getUserById, getUserByUsername } from "crud/user.js";

export const authMiddleware = async (req, res, next) => {
  if (req.needAuthentication) {
    const { token } = req.cookies;

    if (!token) {
      return res.status(403).render("error", {
        status: 403,
        error: "Forbidden",
        message: "Authentication token missing",
      });
    }

    const sessionResult = await getSessionByToken(token);
    if (!sessionResult.success) {
      return res.status(403).render("error", {
        status: 403,
        error: "Forbidden",
        message: sessionResult.error || "Invalid session",
      });
    }

    const { session } = sessionResult;
    const now = new Date();

    if (new Date(session.expires_at) <= now) {
      await deleteSession(token);
      return res
        .clearCookie("token", cookieOptions)
        .status(403)
        .render("error", {
          status: 403,
          error: "Forbidden",
          message: "Session expired",
        });
    }

    const userResult = await getUserById(session.user_id);
    if (!userResult.success) {
      return res.status(403).render("error", {
        status: 403,
        error: "Forbidden",
        message: userResult.error || "User not found",
      });
    }

    res.locals.username = userResult.user.username;
  }
  next();
};

export const validateSessionToken = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(400).json({
      error: "Bad Request",
      message: "No session token found",
    });
  }
  next();
};

export const validateUsernamePassword = (req, res, next) => {
  if (
    !req.body ||
    !req.body.hasOwnProperty("username") ||
    !req.body.hasOwnProperty("password")
  ) {
    return res.sendStatus(400);
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
