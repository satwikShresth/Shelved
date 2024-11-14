/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex("db_source").del();
  await knex("db_source").insert([{ name: "tmdb" }]);
};
