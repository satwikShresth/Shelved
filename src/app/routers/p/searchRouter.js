import { Router } from "express";
import services from "services/index.js";
import { getShelvesByUserId } from 'crud/shelf.js';

export const getSearchRouter = () => {
  const router = Router();

  router.get("/search", (_req, res) => {
    res.render("search");
  });

  router.get("/search/movies", async (req, res) => {
    try {
      const { name } = req.query;
      const { user_id } = req.session;

      if (!name) {
        return res.render("search", {
          error: "Search query is required"
        });
      }

      const shelvesResponse = await getShelvesByUserId(user_id);

      const [searchResults, shelves] = await Promise.all([
        services["tmdb"].search(name, "movie"),
        shelvesResponse.shelves || []
      ]);

      const data = searchResults.slice(0, 5);

      return res.render("search-results", {
        username: res.locals.username,
        searchType: "movies",
        query: name,
        results: data,
        shelves: shelves.success ? shelves.shelves : []
      });

    } catch (error) {
      console.error("Error searching movies:", error);
      return res.render("search", {
        error: "Failed to search movies",
        details: error.message
      });
    }
  });

  router.get("/search/shows", async (req, res) => {
    try {
      const { name } = req.query;
      const { user_id } = req.session;

      if (!name) {
        return res.render("search", {
          error: "Search query is required"
        });
      }

      const shelvesResponse = await getShelvesByUserId(user_id);

      const [searchResults, shelves] = await Promise.all([
        services["tmdb"].search(name, "tv"),
        shelvesResponse.shelves || []
      ]);

      const data = searchResults.slice(0, 5);

      return res.render("search-results", {
        username: res.locals.username,
        searchType: "shows",
        query: name,
        results: data,
        shelves: shelves.success ? shelves.shelves : []
      });

    } catch (error) {
      console.error("Error searching shows:", error);
      return res.render("search", {
        error: "Failed to search shows",
        details: error.message
      });
    }
  });

  router.get("/search/books", async (req, res) => {
    try {
      const { name } = req.query;
      const { user_id } = req.session;

      if (!name) {
        return res.render("search", {
          error: "Search query is required"
        });
      }

      const shelvesResponse = await getShelvesByUserId(user_id);

      const [searchResults, shelves] = await Promise.all([
        services["tmdb"].search(name),
        shelvesResponse.shelves || []
      ]);

      const data = searchResults.slice(0, 5);

      return res.render("search-results", {
        username: res.locals.username,
        searchType: "books",
        query: name,
        results: data,
        shelves: shelves.success ? shelves.shelves : []
      });

    } catch (error) {
      console.error("Error searching books:", error);
      return res.render("search", {
        error: "Failed to search books",
        details: error.message
      });
    }
  });

  return router;
};
