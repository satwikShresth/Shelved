import express from "express";
import cookieParser from "cookie-parser";
import authMiddleware from "./middlewares/auth.js";
import { join } from "path";

const port = 3000;
const hostname = "0.0.0.0";

const app = express();
app.use(express.json());
app.use(cookieParser());

const authMiddlewareWrap = (req, res, next) => {
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
};

const setNeedAuthentication = (needsAuthentication) => (req, _res, next) => {
  req.needAuthentication = needsAuthentication;
  next();
};

app.set("view engine", "ejs");
app.set("views", "./views");

const routesDir = join(Deno.cwd(), "app", "routes");

try {
  for await (const entry of Deno.readDir(routesDir)) {
    if (entry.isFile && entry.name.endsWith(".js")) {
      const modulePath = join(routesDir, entry.name);
      const {
        default: { router, base = "/", needsAuthentication = true },
      } = await import(modulePath);

      if (router && typeof router === "function") {
        app.use(
          base,
          setNeedAuthentication(needsAuthentication),
          authMiddlewareWrap,
          router,
        );

        console.log(
          `Loaded ${entry.name}:\n  - Base: ${base}\n  - needsAuthentication: ${needsAuthentication}`,
        );
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
