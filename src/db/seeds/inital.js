/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const bcrypt = await import("bcrypt");
  await knex("users").del();
  await knex("users").insert([
    { username: "admin", password: await bcrypt.hash("admin") },
  ]);
};
