import { join } from "path";
import { walk } from "walk";
const routesDir = join(Deno.cwd(), "app", "routers");

export const getRouteDetails = async () => {
  const routeDetails = [];

  for await (const dirEntry of walk(routesDir, { exts: ["js"] })) {
    const base = dirEntry.path
      .split("/")
      .filter(
        (_, idx) =>
          !new Set([1, 2, 3, dirEntry.path.split("/").length - 1]).has(idx),
      )
      .join("/");

    routeDetails.push({
      path: dirEntry.path,
      base: base,
      filename: dirEntry.name,
    });
  }
  return routeDetails;
};
