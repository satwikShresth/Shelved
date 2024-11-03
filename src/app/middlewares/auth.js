import db from "db";

const authMiddleware = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.sendStatus(403);
  }

  try {
    const session = await db("sessions")
      .select("user_id", "expires_at")
      .where({ session_token: token })
      .first();

    if (!session) {
      return res.sendStatus(403);
    }

    const now = new Date();
    if (new Date(session.expires_at) <= now) {
      await db("sessions").where({ session_token: token }).del();
      return res.clearCookie("token", cookieOptions).sendStatus(403);
    }

    const user = await db("users")
      .select("username")
      .where({ id: session.user_id })
      .first();

    if (!user) {
      return res.sendStatus(403);
    }

    res.locals.username = user.username;
    next();
  } catch (error) {
    console.log("AUTHORIZATION FAILED", error);
    res.sendStatus(500);
  }
};

export default authMiddleware;
