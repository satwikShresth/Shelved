import { Router } from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "crud/following.js";
import services from "services/index.js";
import { getAllShelvesContent } from "crud/shelf.js";
import { getUserByUsername } from "crud/user.js";

const getDetailedShelfContentByUsername = async (username) => {
  try {
    const userResponse = await getUserByUsername(username);

    if (!userResponse.success) {
      return {
        success: false,
        error: "Failed to fetch user",
        details: userResponse.error,
      };
    }

    if (!userResponse.exists) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const shelvesResponse = await getAllShelvesContent(userResponse.user.id);

    if (!shelvesResponse.success) {
      return {
        success: false,
        error: "Failed to fetch shelves content",
        details: shelvesResponse.message,
      };
    }

    const detailedShelves = {};

    for (const shelfName in shelvesResponse.shelves) {
      detailedShelves[shelfName] = [];

      for (const item of shelvesResponse.shelves[shelfName]) {
        try {
          const service = services[item.db_source];

          if (!service) {
            throw new Error(
              `Failed to initialize ${item.db_source} service`,
            );
          }

          const details = await service.getDetailsById({
            id: item.external_id,
            media_type: item.content_type,
          });

          detailedShelves[shelfName].push({
            ...details,
            source: item.db_source,
            media_type: item.content_type,
          });
        } catch (error) {
          console.error(
            `Error fetching details for ${item.content_type} with ID ${item.external_id}:`,
            error.message,
          );
          detailedShelves[shelfName].push({
            error:
              `Failed to fetch details for ${item.content_type} with ID ${item.external_id}`,
          });
        }
      }
    }

    return {
      success: true,
      shelves: detailedShelves,
    };
  } catch (error) {
    console.error("Error in getDetailedShelfContentByUsername:", error);
    return {
      success: false,
      error: "Internal server error",
      details: error.message,
    };
  }
};

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

  router.get("/discover", async (req, res) => {
    try {
      const username = res.locals.username;

      const followersResponse = await getFollowers(username);
      const followingResponse = await getFollowing(username);

      if (!followersResponse.success || !followingResponse.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch follow data",
        });
      }

      // Find mutual followers
      const followers = followersResponse.followers.map((f) => f.username);
      const following = followingResponse.following.map((f) => f.username);
      const mutuals = followers.filter((f) => following.includes(f));

      const mutualShelves = {};

      for (const mutualUsername of mutuals) {
        const shelvesResponse = await getDetailedShelfContentByUsername(
          mutualUsername,
        );

        if (shelvesResponse.success) {
          mutualShelves[mutualUsername] = shelvesResponse.shelves;
        } else {
          console.error(
            `Failed to fetch shelves for ${mutualUsername}:`,
            shelvesResponse.error,
          );
          mutualShelves[mutualUsername] = {
            error: "Failed to fetch shelves",
          };
        }
      }

      return res.render("discover", {
        username: username,
        mutualData: {
          mutualCount: mutuals.length,
          shelves: mutualShelves,
        },
      });
    } catch (error) {
      console.error("Error in discover endpoint:", error);
      return res.status(500).render("error", {
        error: "Internal server error",
        details: error.message,
      });
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
