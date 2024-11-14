/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex("content_type")
    .insert([
      { id: 1, value: "tv" },
      { id: 2, value: "movie" },
    ])
    .onConflict("value")
    .merge();
};
