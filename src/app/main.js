import express from "express";
import swaggerDocs from "./swagger.js";
import cookieParser from "cookie-parser";
import swaggerUI from "swagger-ui-express";
import { authMiddleware } from "middlewares/authMiddleware.js";

//Routers
import getLandingRouter from "routers/landingRouter.js";
import getAuthRouter from "routers/api/auth/authRouter.js";
import getHomeRouter from "routers/protected/homeRouter.js";
import getTmdbRouter from "routers/api/services/tmdbRouter.js";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", "./views");

//routes
app.use("/", getLandingRouter());
app.use("/api/auth", getAuthRouter());
app.use("/api/services", getTmdbRouter());
//routes protected
app.use("/protected/", authMiddleware, getHomeRouter());

if (Deno.env.get("ENV") === "development") {
  app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
}

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
