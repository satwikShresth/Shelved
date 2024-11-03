/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "pg",
    connection: {
      database: Deno.env.get("POSTGRES_DB"),
      host: "localhost",
      port: Deno.env.get("POSTGRES_PORT"),
      user: Deno.env.get("POSTGRES_USER"),
      password: Deno.env.get("POSTGRES_PASSWORD"),
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },

  //staging: {
  //  client: "postgresql",
  //  connection: {
  //    database: "my_db",
  //    user: "username",
  //    password: "password",
  //  },
  //  pool: {
  //    min: 2,
  //    max: 10,
  //  },
  //  migrations: {
  //    tableName: "knex_migrations",
  //  },
  //},
  //
  //production: {
  //  client: "postgresql",
  //  connection: {
  //    database: "my_db",
  //    user: "username",
  //    password: "password",
  //  },
  //  pool: {
  //    min: 2,
  //    max: 10,
  //  },
  //  migrations: {
  //    tableName: "knex_migrations",
  //  },
  //},
};
