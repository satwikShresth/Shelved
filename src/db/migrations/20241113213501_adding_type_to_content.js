/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.table("content", (table) => {
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
export const down = function (knex) {
  return knex.schema.table("content", (table) => {
    table.dropColumn("type_id");
  });
};
