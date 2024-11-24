/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('user_follows', table => {
    table.integer('follower_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.integer('following_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.timestamp('created_at')
      .defaultTo(knex.fn.now());

    table.primary(['follower_id', 'following_id']);

    table.index('follower_id');
    table.index('following_id');
  })
  .raw(`
    ALTER TABLE user_follows
    ADD CONSTRAINT no_self_follow
    CHECK (follower_id != following_id)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
    return knex.schema.dropTable('user_follows');
};
