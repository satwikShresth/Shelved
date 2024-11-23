/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  await knex("db_source").del();
  await knex("db_source").insert([{ name: "tmdb" }]);
};
