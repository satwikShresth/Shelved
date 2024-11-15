import { Router } from "express";
import { getVisibilityOptions } from "crud/visibility.js";
import { getShelvesByUserId } from "crud/shelf.js";
import services from "services/index.js";
import { getDetailedShelfContent } from "middlewares/tmdbMiddleware.js";

const getHomeRouter = () => {
  const router = Router();

  router.get("/homepage", async (req, res) => {
    const user_id = req.session.user_id;

    const shelvesResponse = await getShelvesByUserId(user_id);
    if (!shelvesResponse.success) {
      return res.status(500).send("Failed to fetch shelves.");
    }

    const tmdbService = services["tmdb"];

    const tmdbTrending = await tmdbService
      .getTrending({ range: "week", mediaType: "all" })
      .then((data) => data.results)
      .catch((error) => {
        console.error("Error fetching TMDB trending data:", error.message);
        return [];
      });

    res.render("homepage", {
      username: res.locals.username,
      trendingData: {
        tmdb: tmdbTrending,
      },
      shelves: shelvesResponse.shelves || [],
    });
  });

  router.get("/profile", getDetailedShelfContent, async (req, res) => {
    try {
      const user_id = req.session.user_id;

      const shelvesResponse = await getShelvesByUserId(user_id);

      if (!shelvesResponse.success) {
        return res.status(500).send("Failed to fetch shelves.");
      }

      const shelves = shelvesResponse.shelves || [];

      const visibilityOptionsResponse = await getVisibilityOptions();

      if (!visibilityOptionsResponse.success) {
        return res.status(500).send("Failed to fetch visibility options.");
      }

      res.render("profile", {
        user: { name: res.locals.username },
        shelves,
        shelvesData: req.detailedShelves,
        visibilityOptions: visibilityOptionsResponse.visibilityOptions,
      });
    } catch (error) {
      console.error("Error loading profile:", error.message);
      res.status(500).send("Failed to load profile.");
    }
  });

  router.get("/whoami", (_req, res) => {
    res.send(`Hello user: ${res.locals.username}`);
  });

  return router;
};

export default getHomeRouter;
