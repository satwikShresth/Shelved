import { Router } from "express";
import { followUser, getFollowers, getFollowing } from "crud/following.js";

const getFriendRouter = () => {
  const router = Router();

  router.get("/friends", async (req, res) => {
    try {
      const user_id = res.locals.username;

      const followersResponse = await getFollowers(user_id);
      const followingResponse = await getFollowing(user_id);

      if (!followersResponse.success || !followingResponse.success) {
        throw new Error("Failed to fetch follow data");
      }

      res.render("friends", {
        username: res.locals.username,
        followers: followersResponse.followers || [],
        following: followingResponse.following || [],
      });
    } catch (error) {
      console.error("Error loading friends page:", error.message);
      res.status(500).send("Failed to load friends page.");
    }
  });

  router.get("/api/friends/search", async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const searchResponse = await searchUsers(query);

      if (!searchResponse.success) {
        throw new Error(searchResponse.message || "Search failed");
      }

      res.json(searchResponse.users);
    } catch (error) {
      console.error("Error searching users:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to search users",
      });
    }
  });
  return router;
};

export default getFriendRouter;
