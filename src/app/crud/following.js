import db from "db";

const getUsersByUsernames = async (followerUsername, followingUsername) => {
  try {
    const [follower, following] = await Promise.all([
      db("users").select("id").where({ username: followerUsername }).first(),
      db("users").select("id").where({ username: followingUsername }).first(),
    ]);

    if (!follower) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (!following) {
      return {
        success: false,
        error: "Target user not found",
      };
    }

    return {
      success: true,
      follower,
      following,
    };
  } catch (error) {
    console.error("Get Users Error:", error);
    return {
      success: false,
      error: "Failed to get users",
      details: error.message,
    };
  }
};

export const followUser = async (followerUsername, followingUsername) => {
  try {
    const result = await getUsersByUsernames(
      followerUsername,
      followingUsername,
    );

    if (!result.success) {
      return result;
    }

    const { follower, following } = result;

    // Prevent self-follows
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
    const result = await getUsersByUsernames(
      followerUsername,
      followingUsername,
    );

    if (!result.success) {
      return result;
    }

    const { follower, following } = result;

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
