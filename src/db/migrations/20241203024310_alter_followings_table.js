/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable("followings", (table) => {
    // Drop the existing unique constraint to replace with primary key
    table.dropUnique(["user_id", "followed_user_id"]);

    // Add primary key constraint
    table.primary(["user_id", "followed_user_id"]);

    // Add individual indexes
    table.index("user_id");
    table.index("followed_user_id");
  })
    .raw(`
    ALTER TABLE followings
    ADD CONSTRAINT no_self_follow
    CHECK (user_id != followed_user_id)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable("followings", (table) => {
    // Remove the check constraint
    table.dropChecks(["no_self_follow"]);

    // Remove indexes
    table.dropIndex("user_id");
    table.dropIndex("followed_user_id");

    // Drop primary key and restore unique constraint
    table.dropPrimary();
    table.unique(["user_id", "followed_user_id"]);
  });
};
