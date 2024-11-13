import db from "db";

export const addContent = async (external_id, source_id) => {
  try {
    const [newContent] = await db("content")
      .insert({ external_id, source_id })
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

export const getContent = async (external_id, source_id) => {
  try {
    const existingContent = await db("content")
      .select("id")
      .where({ external_id, source_id })
      .first();

    if (existingContent) {
      return { success: true, exists: true, content_id: existingContent.id };
    }

    const newContent = await addContent(external_id, source_id);
    if (!newContent.success) {
      return newContent;
    }

    return {
      success: true,
      exists: false,
      content_id: newContent.content_id,
      message: "New content added",
    };
  } catch (error) {
    console.error("Error fetching or adding content:", error.message);
    return {
      success: false,
      message: "Failed to fetch or add content",
      error: error.message,
    };
  }
};
