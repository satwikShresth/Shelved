import { Router } from "express";

const getSearchRouter = () => {
  const router = Router();

  router.get("/search", async (_req, res) => {
    res.render("search");
  });

  return router;
};

export default getSearchRouter;
