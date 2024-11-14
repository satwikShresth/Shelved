/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("ratings")
    .insert([
      { value: "shite" },
      { value: "meh" },
      { value: "decent" },
      { value: "good" },
      { value: "outstanding" },
    ])
    .onConflict("value")
    .merge();

  await knex("shelf_content_status")
    .insert([
      { value: "consumed" },
      { value: "consuming" },
      { value: "to_consume" },
    ])
    .onConflict("value")
    .merge();

  await knex("visibility_options")
    .insert([{ value: "public" }, { value: "friends" }, { value: "private" }])
    .onConflict("value")
    .merge();
};
