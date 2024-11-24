import db from "db";

export const followUser = async (followerUsername, followingUsername) => {
  try {
    const follower = await db("users")
      .select("id")
      .where({ username: followerUsername })
      .first();

    if (!follower) {
      return {
        success: false,
        error: "Follower not found",
      };
    }

    const following = await db("users")
      .select("id")
      .where({ username: followingUsername })
      .first();

    if (!following) {
      return {
        success: false,
        error: "User to follow not found",
      };
    }

    // Prevent self-follows. This is specified in the DB schema too but just in case
    if (follower.id === following.id) {
      return {
        success: false,
        error: "Cannot follow yourself",
      };
    }

    await db("user_follows").insert({
      follower_id: follower.id,
      following_id: following.id,
    });

    return {
      success: true,
      message: "Successfully followed user",
    };
  } catch (error) {
    console.error("Follow Error:", error);
    return {
      success: false,
      error: "Failed to follow user",
      details: error.message,
    };
  }
};

export const getFollowers = async (username) => {
  try {
    const followers = await db("users AS followers")
      .join("user_follows", "user_follows.follower_id", "followers.id")
      .join("users AS following", "user_follows.following_id", "following.id")
      .where("following.username", username)
      .select("followers.username", "user_follows.created_at as followed_at")
      .orderBy("user_follows.created_at", "desc");

    return {
      success: true,
      followers,
    };
  } catch (error) {
    console.error("Get Followers Error:", error);
    return {
      success: false,
      error: "Failed to get followers",
      details: error.message,
    };
  }
};

export const getFollowing = async (username) => {
  try {
    const following = await db("users AS following")
      .join("user_follows", "user_follows.following_id", "following.id")
      .join("users AS follower", "user_follows.follower_id", "follower.id")
      .where("follower.username", username)
      .select("following.username", "user_follows.created_at as followed_at")
      .orderBy("user_follows.created_at", "desc");

    return {
      success: true,
      following,
    };
  } catch (error) {
    console.error("Get Following Error:", error);
    return {
      success: false,
      error: "Failed to get following list",
      details: error.message,
    };
  }
};
