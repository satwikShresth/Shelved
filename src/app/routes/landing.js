import express from "express";

const router = express.Router();

router.use((req, _res, next) => {
  req.needAuthentication = false;
  next();
});

router.get("/", (_req, res) => {
  res.redirect("/login");
});

router.get("/login", (_req, res) => {
  res.render("login");
});

router.get("/signup", (_req, res) => {
  res.render("signup");
});

export default router;
