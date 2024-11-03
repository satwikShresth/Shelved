import express from "express";
import cookieParser from "cookie-parser";
import { join } from "path";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.needAuthentication) {
    const originalSendStatus = res.sendStatus;

    res.sendStatus = (statusCode) => {
      if (statusCode === 403) {
        return res.redirect("/");
      }
      return originalSendStatus.call(res, statusCode);
    };
    authMiddleware(req, res, next);
  } else {
    next();
  }
});

app.set("view engine", "ejs");
app.set("views", "./views");

const routesDir = join(Deno.cwd(), "app", "routes");
const basePaths = {
  "auth.js": "/auth",
};

try {
  console.log(`Loaded routers:`);
  for await (const entry of Deno.readDir(routesDir)) {
    if (entry.isFile && entry.name.endsWith(".js")) {
      const modulePath = join(routesDir, entry.name);
      const { default: router } = await import(modulePath);

      if (router && typeof router === "function") {
        const basePath = basePaths[entry.name] || "/";
        app.use(basePath, router);
        console.log(`    Loaded ${entry.name} with base path ${basePath}`);
      } else {
        console.warn(`No default export found in ${entry.name}`);
      }
    }
  }
} catch (error) {
  console.error("Error loading routers:", error);
}
app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
