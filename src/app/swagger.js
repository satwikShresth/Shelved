import swaggerAutogen from "swagger-autogen";
import { join } from "path";

const doc = {
  info: {
    title: "My API",
    description: "Description",
  },
  host: "localhost:3000",
  basePath: "/",
  schemes: ["http"],
};

const outputFile = "./swagger.json";
const routesDir = join(Deno.cwd(), "app", "routers");
let allPaths = {};

async function loadRoutes(dir, base = "/") {
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory) {
      await loadRoutes(entryPath, `${base}/${entry.name}`);
    } else if (entry.isFile && entry.name.endsWith(".js")) {
      const modulePath = join(dir, entry.name);
      const baseTags = base.split("/").filter(Boolean) || ["Base"];
      const tags = baseTags.length ? baseTags : ["Base"];

      console.log(tags);

      const tempDoc = { ...doc, paths: {} };
      const swaggerData = await swaggerAutogen({ writeOutputFile: false })(
        outputFile,
        [modulePath],
        doc,
      );
      if (swaggerData?.data?.paths) {
        const prefixedPaths = {};
        for (const [routePath, routeInfo] of Object.entries(
          swaggerData.data.paths,
        )) {
          const fullPath = `${base}${routePath}`.replace(/\/+/g, "/");

          for (const op in routeInfo) {
            routeInfo[op].tags = tags;
          }
          prefixedPaths[fullPath] = routeInfo;
        }
        Object.assign(allPaths, prefixedPaths);
      }
    }
  }
}

try {
  await loadRoutes(routesDir);
  const finalDoc = { swagger: "2.0", ...doc, paths: allPaths };
  await Deno.writeTextFile(
    join(Deno.cwd(), "app", "swagger.json"),
    JSON.stringify(finalDoc),
  );
} catch (error) {
  console.error("Error generating Swagger documentation:", error);
}
