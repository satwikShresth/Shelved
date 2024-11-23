/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return (
    knex.schema
      // Enable UUID extension
      .raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

      // Enums
      .raw(
        `
      CREATE TYPE rating_enum AS ENUM ('shite', 'meh', 'decent', 'good', 'outstanding');
    `,
      )
      .raw(
        `
      CREATE TYPE shelf_status_enum AS ENUM ('consumed', 'consuming', 'to_consume');
    `,
      )
      .raw(
        `
      CREATE TYPE visibility_enum AS ENUM ('public', 'friends', 'private');
    `,
      )

      // Users table
      .createTable("users", (table) => {
        table.increments("id").primary();
        table.string("username").notNullable();
        table.string("password", 255).notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // DB Source table
      .createTable("db_source", (table) => {
        table.increments("id").primary();
        table.string("name", 255).notNullable();
        table.string("api_key", 255);
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // Content table
      .createTable("content", (table) => {
        table.increments("id").primary();
        table.string("external_id", 255).notNullable();
        table
          .integer("source_id")
          .notNullable()
          .references("id")
          .inTable("db_source")
          .onDelete("CASCADE");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.unique(["source_id", "external_id"]);
      })

      // Reviews table
      .createTable("reviews", (table) => {
        table.increments("id").primary();
        table
          .integer("user_id")
          .notNullable()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table
          .integer("content_id")
          .notNullable()
          .references("id")
          .inTable("content")
          .onDelete("CASCADE");
        table.string("title");
        table.string("body", 256);
        table.specificType("rating", "rating_enum").notNullable(); // Using rating_enum type
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.unique(["user_id", "content_id"]);
      })

      // Shelf table
      .createTable("shelf", (table) => {
        table.increments("id").primary();
        table
          .integer("user_id")
          .notNullable()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table.specificType("visibility", "visibility_enum").notNullable(); // Using visibility_enum type
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.unique(["user_id"]);
      })

      // Shelf Content table
      .createTable("shelf_content", (table) => {
        table
          .integer("shelf_id")
          .notNullable()
          .references("id")
          .inTable("shelf")
          .onDelete("CASCADE");
        table
          .integer("content_id")
          .notNullable()
          .references("id")
          .inTable("content")
          .onDelete("CASCADE");
        table.specificType("status", "shelf_status_enum").notNullable(); // Using shelf_status_enum type
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.primary(["shelf_id", "content_id"]);
      })

      // Followings table
      .createTable("followings", (table) => {
        table
          .integer("user_id")
          .notNullable()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table
          .integer("followed_user_id")
          .notNullable()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.unique(["user_id", "followed_user_id"]);
      })

      // Sessions table with UUID session_token
      .createTable("sessions", (table) => {
        table.increments("id").primary();
        table
          .integer("user_id")
          .notNullable()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table
          .uuid("session_token")
          .unique()
          .notNullable()
          .defaultTo(knex.raw("uuid_generate_v4()"));
        table.timestamp("expires_at").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema
    .dropTableIfExists("sessions")
    .dropTableIfExists("followings")
    .dropTableIfExists("shelf_content")
    .dropTableIfExists("shelf")
    .dropTableIfExists("reviews")
    .dropTableIfExists("content")
    .dropTableIfExists("users")
    .dropTableIfExists("db_source")
    .raw("DROP TYPE IF EXISTS rating_enum")
    .raw("DROP TYPE IF EXISTS shelf_status_enum")
    .raw("DROP TYPE IF EXISTS visibility_enum")
    .raw('DROP EXTENSION IF EXISTS "uuid-ossp";');
};
