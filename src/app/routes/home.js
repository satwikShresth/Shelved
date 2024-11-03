import express from "express";

const router = express.Router();

router.get("/homepage", (_req, res) => {
  res.render("homepage", { username: res.locals.username });
});

router.get("/whoami", (_req, res) => {
  res.send(`Hello user: ${res.locals.username}`);
});

export default router;
