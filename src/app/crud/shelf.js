import db from "db";
import { getContent } from "crud/content.js";

export const getShelvesByUserId = async (user_id) => {
  try {
    const shelves = await db("shelf")
      .select("id", "name", "visibility_id", "created_at")
      .where({ user_id });

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
  source_id,
  shelf_id,
  status_id = 3,
}) => {
  try {
    const contentResult = await getContent(external_id, source_id);
    if (!contentResult.success) {
      return {
        success: false,
        message: "Failed to add new content",
        error: contentResult.error,
      };
    }
    console.log(contentResult);

    const content_id = contentResult.content_id;

    await db("shelf_content").insert({
      shelf_id,
      content_id,
      status_id,
    });

    return { success: true, message: "Item added to shelf successfully" };
  } catch (error) {
    console.error("Error adding item to shelf:", error.message);
    return {
      success: false,
      message: "Failed to add item to shelf",
      error: error.message,
    };
  }
};
