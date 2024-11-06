import { Router } from "express";
import { retrieveSession } from "crud/session.js";

export const checkTokenAndRedirect = async (req, res, next) => {
  const { token } = req.cookies;
  const sessionResult = await retrieveSession(token);

  if (!sessionResult.success) return next();

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
