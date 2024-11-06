import express from "express";
import swaggerDocs from "./swagger.js";
import cookieParser from "cookie-parser";
import swaggerUI from "swagger-ui-express";
import {
  authMiddleware,
  validateSessionToken,
} from "./middlewares/authMiddleware.js";
import { join } from "path";
import { walk } from "walk";
import { getRouteDetails } from "utils/common.js";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());

const authWrapper = (needsAuthentication) => (req, res, next) => {
  if (needsAuthentication) {
    validateSessionToken(req, res, () => authMiddleware(req, res, next));
  } else {
    next();
  }
};

app.set("view engine", "ejs");
app.set("views", "./views");

const routesDir = join(Deno.cwd(), "app", "routers");

try {
  const arrayData = await getRouteDetails();

  for (const { path, base, filename } of arrayData) {
    const module = await import(path);
    const { getRouter, needsAuthentication = true } = module.default;

    app.use(base, authWrapper(needsAuthentication), getRouter());

    console.log(
      `Loaded ${filename}:\n  - Base: ${base}\n  - needsAuthentication: ${needsAuthentication}`,
    );
  }
} catch (error) {
  console.error(`Failed to load route from ${path}: ${error}`);
}

if (Deno.env.get("ENV") === "development") {
  app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
}

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
