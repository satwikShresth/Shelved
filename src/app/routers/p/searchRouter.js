import { Router } from "express";
import services from "services/index.js";

export const getSearchViewRouter = () => {
  const router = Router();

  router.get("/search", (_req, res) => {
    res.render("search");
  });

  return router;
};

export const getSearchApiRouter = () => {
  const router = Router();

  router.get("/movies", async (req, res) => {
    try {
      const { name } = req.query;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      const tmdb = services["tmdb"];
      const searchResults = await tmdb.search(name);
      const data = searchResults.slice(0, 5);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error searching movies:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to search movies",
        details: error.message,
      });
    }
  });

  router.get("/books", async (req, res) => {
    try {
      const { name } = req.query;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      const openlibrary = services['openlibrary'];
      const searchResults = await openlibrary.search(name);
      const data = searchResults.slice(0, 5);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error searching books:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to search books",
        details: error.message,
      });
    }
  });
  return router;
};
