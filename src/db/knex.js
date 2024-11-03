import config from "./knexfile.js";

const db = knex(config.config);

module.exports = db;
