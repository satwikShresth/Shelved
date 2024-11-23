/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  const bcrypt = await import("bcrypt");
  await knex("users").del();
  await knex("users").insert([
    { username: "admin", password: await bcrypt.hash("admin") },
  ]);
};
