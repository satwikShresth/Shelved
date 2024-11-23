/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("shelf", (table) => {
    table.dropUnique(["user_id"]);
    table.unique(["user_id", "name"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("shelf", (table) => {
    table.dropUnique(["user_id", "name"]);
    table.unique(["user_id"]);
  });
};
