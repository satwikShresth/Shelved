/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("ratings").del();
  await knex("ratings").insert([
    { value: "shite" },
    { value: "meh" },
    { value: "decent" },
    { value: "good" },
    { value: "outstanding" },
  ]);

  await knex("shelf_content_status").del();
  await knex("shelf_content_status").insert([
    { value: "consumed" },
    { value: "consuming" },
    { value: "to_consume" },
  ]);

  await knex("visibility_options").del();
  await knex("visibility_options").insert([
    { value: "public" },
    { value: "friends" },
    { value: "private" },
  ]);
};
