import { Router } from "express";
import { getSessionByToken } from "crud/session.js";

export const checkTokenAndRedirect = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next();
  }

  const sessionResult = await getSessionByToken(token);
  if (!sessionResult.success) {
    return next();
  }

  const { session } = sessionResult;
  const now = new Date();

  if (new Date(session.expires_at) <= now) {
    await deleteSession(token);
    res.clearCookie("token", cookieOptions);
    return next();
  }

  return res.redirect("/p/homepage");
};

const getLandingRouter = () => {
  const router = Router();

  router.get("/", (_req, res) => {
    res.redirect("/login");
  });

  router.get("/login", [checkTokenAndRedirect], (_req, res) => {
    res.render("login");
  });

  router.get("/signup", [checkTokenAndRedirect], (_req, res) => {
    res.render("signup");
  });

  return router;
};

export default {
  getRouter: getLandingRouter,
  needsAuthentication: false,
};
