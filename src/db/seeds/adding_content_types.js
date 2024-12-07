/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  await knex("content_type")
    .insert([
      { id: 1, value: "tv" },
      { id: 2, value: "movie" },
      { id: 3, value: "book" },
    ])
    .onConflict("value")
    .merge();
};
