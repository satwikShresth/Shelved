import express from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import swaggerUI from "swagger-ui-express";
import swaggerDoc from "./swagger.js";
import { join } from "path";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());

const setNeedAuthentication = (needsAuthentication) => (req, _res, next) => {
  req.needAuthentication = needsAuthentication;
  next();
};

app.set("view engine", "ejs");
app.set("views", "./views");

const routesDir = join(Deno.cwd(), "app", "routers");

async function initRoute(dir, base = "/api") {
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory) {
      await initRoute(entryPath, `${base}/${entry.name}`);
    } else if (entry.isFile && entry.name.endsWith(".js")) {
      const modulePath = join(dir, entry.name);
      try {
        const {
          default: { getRouter, routeBase = "/", needsAuthentication = true },
        } = await import(modulePath);

        if (getRouter && typeof getRouter === "function") {
          app.use(
            base,
            setNeedAuthentication(needsAuthentication),
            authMiddleware,
            getRouter(),
          );

          console.log(
            `Loaded ${entry.name}:\n  - Base: ${base}\n  - needsAuthentication: ${needsAuthentication}`,
          );
        } else {
          console.warn(`No default export found in ${entry.name}`);
        }
      } catch (error) {
        console.error(`Error loading router in ${entry.name}:`, error);
      }
    }
  }
}

initRoute(routesDir)
  .then(() => {
    if (Deno.env.get("ENV") == "development") {
      app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDoc));
    }

    app.listen(port, hostname, () => {
      console.log(`Listening at: http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error loading routers:", error);
  });
