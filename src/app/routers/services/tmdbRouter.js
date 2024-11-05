import { Router } from "express";
import tmdbService from "services/tmdbService.js";
import {
  validateMediaTypeParam,
  validateRangeParam,
} from "middlewares/tmdbMiddleware.js";

const getTmdbRouter = () => {
  const router = Router();

  router.get(
    "/trending",
    [validateMediaTypeParam, validateRangeParam],
    (req, res) => {
      const { range, mediaType } = req.query;

      tmdbService
        .getTrending({ range, mediaType })
        .then((data) => {
          const top5Results = data.results.slice(0, 5);
          res.json(top5Results);
        })
        .catch((error) => {
          console.error("Error fetching trending data:", error.message);
          res.status(500).json({ error: "Failed to fetch trending data" });
        });
    },
  );

  return router;
};

export default {
  getRouter: getTmdbRouter,
  needsAuthentication: false,
};
