import express from "express";
import swaggerDocs from "./swagger.js";
import cookieParser from "cookie-parser";
import swaggerUI from "swagger-ui-express";
import { authMiddleware } from "middlewares/authMiddleware.js";

//Routers
import getLandingRouter from "routers/landingRouter.js";
import getAuthRouter from "routers/api/auth/authRouter.js";
import getHomeRouter from "routers/p/homeRouter.js";
import getShelfRouter from "routers/p/api/shelf/shelfRouter.js";
import getSearchRouter from "routers/p/searchRouter.js";
import getContentRouter from "routers/p/api/content/contentRouter.js";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "./views");

//routes
app.use("/", getLandingRouter());
app.use("/api/auth", getAuthRouter());
//routes protected
app.use("/p/", authMiddleware);
app.use("/p/", getHomeRouter());
app.use("/p/", getSearchRouter());
app.use("/p/api/shelf", getShelfRouter());
app.use("/p/api/content", getContentRouter());

if (Deno.env.get("ENV") === "development") {
  app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
  app.use((req, res, next) => {
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
  });
}

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
