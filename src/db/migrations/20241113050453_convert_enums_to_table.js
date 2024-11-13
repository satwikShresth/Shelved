/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("ratings", (table) => {
    table.increments("id").primary();
    table.string("value").notNullable().unique();
  });

  await knex.schema.createTable("shelf_content_status", (table) => {
    table.increments("id").primary();
    table.string("value").notNullable().unique();
  });

  await knex.schema.createTable("visibility_options", (table) => {
    table.increments("id").primary();
    table.string("value").notNullable().unique();
  });

  await knex.schema.alterTable("reviews", (table) => {
    table.dropColumn("rating");
    table.integer("rating_id").unsigned().references("id").inTable("ratings");
  });

  await knex.schema.alterTable("shelf", (table) => {
    table.dropColumn("visibility");
    table
      .integer("visibility_id")
      .unsigned()
      .references("id")
      .inTable("visibility_options");
  });

  await knex.schema.alterTable("shelf_content", (table) => {
    table.dropColumn("status");
    table
      .integer("status_id")
      .unsigned()
      .references("id")
      .inTable("shelf_content_status");
  });

  await knex.schema.raw(`DROP TYPE IF EXISTS rating_enum`);
  await knex.schema.raw(`DROP TYPE IF EXISTS shelf_status_enum`);
  await knex.schema.raw(`DROP TYPE IF EXISTS visibility_enum`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.raw(`
    CREATE TYPE rating_enum AS ENUM ('shite', 'meh', 'decent', 'good', 'outstanding');
  `);
  await knex.schema.raw(`
    CREATE TYPE shelf_status_enum AS ENUM ('consumed', 'consuming', 'to_consume');
  `);
  await knex.schema.raw(`
    CREATE TYPE visibility_enum AS ENUM ('public', 'friends', 'private');
  `);

  await knex.schema.alterTable("reviews", (table) => {
    table.dropColumn("rating_id");
    table.specificType("rating", "rating_enum").notNullable();
  });

  await knex.schema.alterTable("shelf", (table) => {
    table.dropColumn("visibility_id");
    table.specificType("visibility", "visibility_enum").notNullable();
  });

  await knex.schema.alterTable("shelf_content", (table) => {
    table.dropColumn("status_id");
    table.specificType("status", "shelf_status_enum").notNullable();
  });

  await knex.schema.dropTableIfExists("visibility_options");
  await knex.schema.dropTableIfExists("shelf_content_status");
  await knex.schema.dropTableIfExists("ratings");
};
