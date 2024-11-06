import db from "db";

export const checkSession = async (user_id) => {
  try {
    const session = await db("sessions")
      .select("session_token", "expires_at")
      .where({ user_id })
      .first();
    return session
      ? { success: true, session }
      : { success: false, error: "Session not found" };
  } catch (error) {
    console.error("Error checking session:", error);
    return { success: false, error: "Database error" };
  }
};

export const createSession = async (user_id) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const [insertResult] = await db("sessions")
      .insert({
        user_id,
        expires_at: expiresAt,
      })
      .returning("session_token");
    return { success: true, token: insertResult.session_token };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: "Database error" };
  }
};

export const getSessionByToken = async (token) => {
  try {
    const session = await db("sessions")
      .select("user_id", "expires_at")
      .where({ session_token: token })
      .first();
    return session
      ? { success: true, session }
      : { success: false, error: "Invalid session token" };
  } catch (error) {
    console.error("Database Error in getSessionByToken:", error);
    return { success: false, error: "Database error while retrieving session" };
  }
};

export const deleteSession = async (token) => {
  try {
    await db("sessions").where({ session_token: token }).del();
    return { success: true };
  } catch (error) {
    console.error("Database Error in deleteSession:", error);
    return { success: false, error: "Database error while deleting session" };
  }
};

export const retrieveSession = async (token) => {
  if (!token) return { success: false, error: "Authentication token missing" };

  const sessionResult = await getSessionByToken(token);
  if (!sessionResult.success)
    return { success: false, error: sessionResult.error || "Invalid session" };

  const { session } = sessionResult;
  const now = new Date();

  if (new Date(session.expires_at) <= now) {
    await deleteSession(token);
    return { success: false, error: "Session expired" };
  }

  return { success: true, session };
};
