import express from "express";
import pg from "pg";
import env from "../env.json" with { type: "json" };
import cookieParser from "cookie-parser";
import { authMiddleware, authRouter } from "./auth.js";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.redirect("/login");
});

const landing = express.Router();

landing.use((req, res, next) => {
  const originalSendStatus = res.sendStatus;

  res.sendStatus = (statusCode) => {
    if (statusCode === 403) {
      return res.redirect("/");
    }
    return originalSendStatus.call(res, statusCode);
  };

  authMiddleware(req, res, next);
});

app.use("/auth", authRouter);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

landing.get("/homepage", (req, res) => {
  res.render("homepage", { username: res.locals.username });
});

landing.get("/whoami", [authMiddleware], (req, res) => {
  res.send(`Hello user: ${res.locals.user_id}`);
});

app.use("/", landing);

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
