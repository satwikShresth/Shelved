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
        error: "User not found",
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

    await db("followings").insert({
      user_id: follower.id,
      followed_user_id: following.id,
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

export const unfollowUser = async (followerUsername, followingUsername) => {
  try {
    const follower = await db("users")
      .select("id")
      .where({ username: followerUsername })
      .first();

    if (!follower) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const following = await db("users")
      .select("id")
      .where({ username: followingUsername })
      .first();

    if (!following) {
      return {
        success: false,
        error: "User to unfollow not found",
      };
    }

    const deleted = await db("followings")
      .where({
        user_id: follower.id,
        followed_user_id: following.id,
      })
      .del();

    if (deleted === 0) {
      return {
        success: false,
        error: "You are not following this user",
      };
    }

    return {
      success: true,
      message: "Successfully unfollowed user",
    };
  } catch (error) {
    console.error("Unfollow Error:", error);
    return {
      success: false,
      error: "Failed to unfollow user",
      details: error.message,
    };
  }
};

export const getFollowers = async (username) => {
  try {
    const followers = await db("users AS followers")
      .join("followings", "followings.user_id", "followers.id")
      .join("users AS following", "followings.followed_user_id", "following.id")
      .where("following.username", username)
      .select("followers.username", "followings.created_at as followed_at")
      .orderBy("followings.created_at", "desc");

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
      .join("followings", "followings.followed_user_id", "following.id")
      .join("users AS follower", "followings.user_id", "follower.id")
      .where("follower.username", username)
      .select("following.username", "followings.created_at as followed_at")
      .orderBy("followings.created_at", "desc");

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
