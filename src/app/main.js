import express from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { join } from "path";
import swaggerUI from "swagger-ui-express";
import swaggerDocs from "./swagger.js";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());

const addNeedsAuthentication = (needsAuthentication) => (req, res, next) => {
  req.needsAuthentication = needsAuthentication;
  next();
};

const authWrapper = (needsAuthentication) => (req, res, next) => {
  if (needsAuthentication) {
    authMiddleware(req, res, next);
  } else {
    next();
  }
};

app.set("view engine", "ejs");
app.set("views", "./views");

const routesDir = join(Deno.cwd(), "app", "routers");

async function loadRoutes(dir, base = "/") {
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory) {
      const newBase =
        base === "/" ? `${base}${entry.name}` : `${base}/${entry.name}`;
      await loadRoutes(entryPath, newBase);
    } else if (entry.isFile && entry.name.endsWith(".js")) {
      const modulePath = join(dir, entry.name);
      try {
        const {
          default: { getRouter, routeBase = "/", needsAuthentication = true },
        } = await import(modulePath);

        if (getRouter && typeof getRouter === "function") {
          const mountPath = `${base}${routeBase}`.replace(/\/+/g, "/");

          await app.use(
            mountPath,
            authWrapper(needsAuthentication),
            getRouter(),
          );

          console.log(
            `Loaded ${entry.name}:\n  - Base: ${mountPath}\n  - needsAuthentication: ${needsAuthentication}`,
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

try {
  await loadRoutes(routesDir);
} catch (error) {
  console.error("Error loading routers:", error);
}

if (Deno.env.get("ENV") == "development")
  app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
