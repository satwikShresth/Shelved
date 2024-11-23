/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function (knex) {
  return await knex.schema.createTable("content_type", (table) => {
    table.increments("id").primary();
    table.string("value", 255).notNullable().unique();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  return await knex.schema.dropTableIfExists("content_type");
};
