import knex from "knex";

const config = await import("./knexfile.js");

export default knex(config[Deno.env.get("ENV") || "local"]);
