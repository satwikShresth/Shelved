import db from "db";

export const addContent = async (external_id, source, type) => {
  try {
    const [newContent] = await db("content")
      .insert({
        external_id,
        source_id: await db("source")
          .select("id")
          .where("name", source)
          .first(),
        type_id: await db("content_type")
          .select("id")
          .where("name", type)
          .first(),
      })
      .returning("id");

    return {
      success: true,
      content_id: newContent.id,
      message: "Content added successfully",
    };
  } catch (error) {
    console.error("Error adding content:", error.message);
    return {
      success: false,
      message: "Failed to add content",
      error: error.message,
    };
  }
};
