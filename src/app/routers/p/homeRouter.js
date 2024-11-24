import { Router } from "express";
import { getVisibilityOptions } from "crud/visibility.js";
import { getShelvesByUserId } from "crud/shelf.js";
import services from "services/index.js";
import { getDetailedShelfContent } from "middlewares/tmdbMiddleware.js";
import { getContentById } from "crud/content.js";
import { getReviewsByContentID } from "crud/reveiw.js";

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
        username: res.locals.username,
        shelves,
        shelvesData: req.detailedShelves,
        visibilityOptions: visibilityOptionsResponse.visibilityOptions,
      });
    } catch (error) {
      console.error("Error loading profile:", error.message);
      res.status(500).send("Failed to load profile.");
    }
  });

  router.get("/content/:content_id", async (req, res) => {
    const { content_id } = req.params;

    try {
      const { success, message, data } = await getContentById(content_id);

      if (!success) {
        throw new Error(`Cannot get External ID: ${message}`);
      }

      const { external_id, content_type, source } = data;

      const service = services[source];

      const item = await service.getDetailsById(external_id, content_type);
      const reviews = await getReviewsByContentID(content_id);

      console.log(reviews);

      if (!item) {
        throw new Error("Content not found");
      }

      res.render("media_page", {
        username: res.locals.username,
        data: item,
        media_type: content_type,
        content_id: content_id,
        source,
        reviews,

        formatDate: (inputDate) =>
          new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(inputDate)),
      });
    } catch (error) {
      console.error("Error fetching content:", error.message);
      res.status(500).send("Failed to load content page.");
    }
  });

  router.get("/whoami", (_req, res) => {
    res.send(`Hello user: ${res.locals.username}`);
  });

  return router;
};

export default getHomeRouter;
