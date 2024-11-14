import { Router } from "express";
import { getVisibilityOptions } from "crud/common.js";
import { getShelvesByUserId } from "crud/shelf.js";
import { getVisibilityById } from "crud/common.js";
import { getService } from "services/index.js";
import { getDetailedShelfContent } from "middlewares/tmdbMiddleware.js";

const getHomeRouter = () => {
  const router = Router();

  router.get("/homepage", async (req, res) => {
    const user_id = req.session.user_id;

    const shelvesResponse = await getShelvesByUserId(user_id);
    if (!shelvesResponse.success) {
      return res.status(500).send("Failed to fetch shelves.");
    }

    const tmdbService = await getService("tmdb");

    const tmdbTrending = await tmdbService
      .getTrending({ range: "week", mediaType: "all" })
      .then((data) => data.results)
      .catch((error) => {
        console.error("Error fetching TMDB trending data:", error.message);
        return [];
      });

    console.log(tmdbTrending);

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

      for (const shelf of shelves) {
        const visibilityResponse = await getVisibilityById(shelf.visibility_id);
        if (visibilityResponse.success) {
          shelf.visibility = visibilityResponse.value;
        } else {
          console.error(
            `Failed to fetch visibility for shelf ID ${shelf.id}:`,
            visibilityResponse.message,
          );
          shelf.visibility = "Unknown";
        }
      }

      const visibilityOptionsResponse = await getVisibilityOptions();

      if (!visibilityOptionsResponse.success) {
        return res.status(500).send("Failed to fetch visibility options.");
      }

      console.log(shelves);
      console.log(req.detailedShelves);

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
