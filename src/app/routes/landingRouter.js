import { Router } from "express";

const getLandingRouter = () => {
  const router = Router();

  router.get("/", (_req, res) => {
    res.redirect("/login");
  });

  router.get("/login", (_req, res) => {
    res.render("login");
  });

  router.get("/signup", (_req, res) => {
    res.render("signup");
  });

  return router;
};

export default {
  getRouter: getLandingRouter,
  base: "/",
  needsAuthentication: false,
};
