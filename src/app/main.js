import express from "express";
import pg from "pg";
import env from "../env.json" with { type: "json" };
import cookieParser from "cookie-parser";
import { authMiddleware, authRouter } from "./auth.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(authRouter);

const port = 3000;
const hostname = "0.0.0.0";

const pool = new pg.Pool(env);

pool
  .connect()
  .then(function () {
    console.log(`Connected to database ${env.database}`);
  })
  .catch(function (error) {
    console.error(`Error connecting to database: ${error.message}`);
    return error;
  });

app.use("/auth", authRouter);

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", (_, res) => {
  res.send("Hello from Deno with Express!");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/whoami", [authMiddleware], (req, res) => {
  res.send(`Hello user: ${res.locals.user_id}`);
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
