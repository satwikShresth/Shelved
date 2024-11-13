import db from "db";

export const getDbId = async (name) => {
  try {
    const result = await db("db_source").select("id").where({ name }).first();

    return result
      ? { success: true, id: result.id }
      : {
          success: true,
          error: "API key not found for the given source name",
        };
  } catch (error) {
    console.error("Crud Error:", error);
    return { success: false, error: "Database error", details: error.message };
  }
};

export const getApiKey = async (name) => {
  try {
    const result = await db("db_source")
      .select("api_key")
      .where({ name })
      .first();

    return result
      ? { success: true, api_key: result.api_key }
      : {
          success: false,
          error: "API key not found for the given source name",
        };
  } catch (error) {
    console.error("Crud Error:", error);
    return { success: false, error: "Database error", details: error.message };
  }
};
