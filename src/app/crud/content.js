import db from "db";

export const addContentID = async (external_id, source, type) => {
  try {
    const sourceRecord = await db("db_source")
      .select("id")
      .where("name", source)
      .first();
    if (!sourceRecord) {
      throw new Error(`Source '${source}' not found.`);
    }

    const typeRecord = await db("content_type")
      .select("id")
      .where("value", type)
      .first();
    if (!typeRecord) {
      throw new Error(`Content type '${type}' not found.`);
    }

    const [contentResult] = await db("content")
      .insert({
        external_id,
        source_id: sourceRecord.id,
        type_id: typeRecord.id,
      })
      .onConflict(["external_id", "source_id"])
      .merge()
      .returning("id");

    if (!contentResult) {
      throw new Error("Failed to insert or retrieve content ID.");
    }

    return {
      success: true,
      content_id: contentResult.id,
      message: "Content added or retrieved successfully",
    };
  } catch (error) {
    console.error("Error adding content:", error.message);
    return {
      success: false,
      message: "Failed to add or retrieve content",
      error: error.message,
    };
  }
};

export const getContentById = async (id) => {
  try {
    const content = await db("content")
      .join("content_type", "content.type_id", "=", "content_type.id")
      .join("db_source", "content.source_id", "=", "db_source.id")
      .select(
        "content.external_id",
        "content_type.value as content_type",
        "db_source.name as source",
      )
      .where("content.id", id)
      .first();

    if (content) {
      return {
        success: true,
        data: {
          external_id: content.external_id,
          content_type: content.content_type,
          source: content.source,
        },
        message: "Content retrieved successfully",
      };
    } else {
      return {
        success: false,
        message: "Content not found",
      };
    }
  } catch (error) {
    console.error("Error in getContentById:", error.message);
    return {
      success: false,
      message: "Failed to retrieve content",
      error: error.message,
    };
  }
};

export const getContentID = async (source, media_type, media_id) => {
  try {
    const existingContent = await db("content")
      .select("id")
      .where("external_id", media_id)
      .andWhere("source_id", db("db_source").select("id").where("name", source)) // Changed to "db_source"
      .andWhere(
        "type_id",
        db("content_type").select("id").where("value", media_type),
      )
      .first();

    if (existingContent) {
      return {
        success: true,
        content_id: existingContent.id,
        message: "Content already indexed",
      };
    }

    const newContent = await addContentID(media_id, source, media_type);

    if (newContent.success) {
      return {
        success: true,
        content_id: newContent.content_id,
        message: "Content added successfully",
      };
    } else {
      throw new Error(newContent.message);
    }
  } catch (error) {
    console.error("Error in getContent:", error.message);
    return {
      success: false,
      message: "Failed to retrieve or add content",
      error: error.message,
    };
  }
};
