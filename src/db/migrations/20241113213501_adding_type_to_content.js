/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("content", function (table) {
    table
      .integer("type_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("content_type")
      .onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("content", function (table) {
    table.dropColumn("type_id");
  });
};
