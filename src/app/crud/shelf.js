import db from "db";

export const getShelvesByUserId = async (user_id) => {
  try {
    const shelves = await db("shelf")
      .leftJoin(
        "visibility_options",
        "shelf.visibility_id",
        "=",
        "visibility_options.id",
      )
      .select("shelf.name", "visibility_options.value as visibility")
      .where({ "shelf.user_id": user_id });

    return {
      success: true,
      shelves: shelves.length ? shelves : null,
      message: shelves.length ? "Shelves found" : "No shelves found",
    };
  } catch (error) {
    console.error("Error fetching shelves:", error.message);
    return {
      success: false,
      message: "Failed to fetch shelves",
      error: error.message,
    };
  }
};

export const createShelf = async ({ user_id, name, visibility }) => {
  try {
    const visibilityResult = await db("visibility_options")
      .select("id")
      .where("value", visibility)
      .first();

    if (!visibilityResult) {
      return {
        success: false,
        message: `Invalid visibility value: ${visibility}`,
      };
    }

    const [newShelf] = await db("shelf")
      .insert({ user_id, name, visibility_id: visibilityResult.id })
      .returning(["id", "user_id", "name", "visibility_id", "created_at"]);

    return {
      success: true,
      message: "Shelf created successfully",
      shelf: newShelf,
    };
  } catch (error) {
    console.error("Error creating shelf:", error.message);
    return {
      success: false,
      message: "Failed to create shelf",
      error: error.message,
    };
  }
};

export const addContentToShelf = async ({
  external_id,
  source,
  shelf,
  content_type,
  status,
}) => {
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
      .where("value", content_type)
      .first();
    if (!typeRecord) {
      throw new Error(`Content type '${content_type}' not found.`);
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

    const shelfRecord = await db("shelf")
      .select("id")
      .where("name", shelf)
      .first();
    if (!shelfRecord) {
      throw new Error(`Shelf '${shelf}' not found.`);
    }

    const statusRecord = await db("shelf_content_status")
      .select("id")
      .where("value", status)
      .first();
    if (!statusRecord) {
      throw new Error(`Status '${status}' not found.`);
    }

    await db("shelf_content").insert({
      shelf_id: shelfRecord.id,
      content_id: contentResult.id,
      status_id: statusRecord.id,
    });

    return { success: true, message: "Item added to shelf successfully" };
  } catch (error) {
    console.error("Error adding item to shelf_content:", error.message);
    return {
      success: false,
      message: "Failed to add item to shelf",
      error: error.message,
    };
  }
};

export const getShelfContent = async (user_id, shelf) => {
  try {
    const shelfRecord = await db("shelf")
      .select("id")
      .where({ id: shelf, user_id })
      .first();

    if (!shelfRecord) {
      return {
        success: false,
        message: "Shelf not found or does not belong to the user",
      };
    }

    const shelfContentData = await db("shelf_content")
      .join("content", "shelf_content.content_id", "=", "content.id")
      .join("content_type", "content.type_id", "=", "content_type.id")
      .join("db_source", "content.source_id", "=", "db_source.id")
      .select(
        "content.external_id",
        "content_type.value as content_type",
        "db_source.name as db_source",
        "shelf_content.shelf_id",
      )
      .where("shelf_content.shelf_id", shelf);

    return { success: true, content: shelfContentData };
  } catch (error) {
    console.error("Error fetching shelf content:", error.message);
    return {
      success: false,
      message: "Failed to fetch shelf content",
      error: error.message,
    };
  }
};

export const getAllShelvesContent = async (user_id) => {
  try {
    const userShelves = await db("shelf")
      .select("id", "name")
      .where({ user_id });

    if (userShelves.length === 0) {
      return {
        success: true,
        shelves: {},
        message: "No shelves found for this user",
      };
    }

    const shelvesContent = {};
    for (const shelf of userShelves) {
      const shelfContentResponse = await getShelfContent(user_id, shelf.id);

      if (!shelfContentResponse.success) {
        return {
          success: false,
          message: `Failed to fetch content for shelf ID ${shelf.id}`,
          error: shelfContentResponse.message,
        };
      }
      shelvesContent[shelf.name] = shelfContentResponse.content.map((item) => ({
        content_type: item.content_type,
        external_id: item.external_id,
        db_source: item.db_source,
      }));
    }

    return { success: true, shelves: shelvesContent };
  } catch (error) {
    console.error("Error aggregating shelves content:", error.message);
    return {
      success: false,
      message: "Failed to fetch all shelves content",
      error: error.message,
    };
  }
};
