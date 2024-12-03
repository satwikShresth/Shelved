import { Router } from "express";
import { unfollowUser, followUser, getFollowers, getFollowing } from "crud/following.js";

export const getFriendViewRouter = () => {
  const router = Router();

  router.get("/friends", async (_, res) => {
    try {
      const username = res.locals.username;

      const followersResponse = await getFollowers(username);
      const followingResponse = await getFollowing(username);

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
  return router;
};

export const getFriendApiRouter = () => {
  const router = Router();

  router.post("/add", async (req, res) => {
    try {
      const { userToFollow } = req.body;
      const username = res.locals.username;

      if (!userToFollow) {
        return res.status(400).json({
          success: false,
          message: "Username to follow is required",
        });
      }

      const followResponse = await followUser(username, userToFollow);

      if (!followResponse.success) {
        return res.status(400).json({
          success: false,
          message: followResponse.error || "Failed to follow user",
        });
      }

      res.json({
        success: true,
        message: followResponse.message,
      });
    } catch (error) {
      console.error("Error following user:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to follow user",
      });
    }
  });

  router.post("/remove", async (req, res) => {
    try {
      const { userToUnfollow } = req.body;
      const username = res.locals.username;

      if (!userToUnfollow) {
        return res.status(400).json({
          success: false,
          message: "Username to unfollow is required",
        });
      }

      const followResponse = await unfollowUser(username, userToUnfollow);

      if (!followResponse.success) {
        return res.status(400).json({
          success: false,
          message: followResponse.error || "Failed to unfollow user",
        });
      }

      res.json({
        success: true,
        message: followResponse.message,
      });
    } catch (error) {
      console.error("Error unfollowing user:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to unfollow user",
      });
    }
  });
  return router;
};
