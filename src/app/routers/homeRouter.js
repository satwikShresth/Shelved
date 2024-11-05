import { Router } from "express";

const getHomeRouter = () => {
  const router = Router();

  router.get("/homepage", (_req, res) => {
    res.render("homepage", { username: res.locals.username });
  });

  router.get("/whoami", (_req, res) => {
    res.send(`Hello user: ${res.locals.username}`);
  });

  return router;
};

export default {
  getRouter: getHomeRouter,
  needsAuthentication: true,
};
