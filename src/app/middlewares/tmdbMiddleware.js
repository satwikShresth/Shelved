import { validateMediaType, validateRange } from "services/tmdbService.js";
import { getAllShelvesContent } from "crud/shelf.js";
import { getService } from "services/index.js";

const tryCatch = (fn) => (req, res, next) => {
  try {
    fn(req, res, next);
  } catch (error) {
    console.error(`Error Validating Tmdb: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const validateMediaTypeParam = tryCatch((req, _res, next) => {
  const { mediaType } = req.query;
  validateMediaType(mediaType);
  next();
});

export const validateRangeParam = tryCatch((req, _res, next) => {
  const { range } = req.query;
  validateRange(range);
  next();
});

export const getDetailedShelfContent = async (req, res, next) => {
  const { user_id } = req.session;

  try {
    const shelvesResponse = await getAllShelvesContent(user_id);

    if (!shelvesResponse.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch all shelves content",
        error: shelvesResponse.message,
      });
    }

    const detailedShelves = {};

    for (const shelfName in shelvesResponse.shelves) {
      detailedShelves[shelfName] = [];

      for (const item of shelvesResponse.shelves[shelfName]) {
        try {
          const service = await getService(item.db_source);

          if (!service) {
            throw new Error(`Failed to initialize ${item.db_source} service`);
          }

          const details = await service.getDetailsById(
            item.external_id,
            item.content_type,
          );

          detailedShelves[shelfName].push(details);
        } catch (error) {
          console.error(
            `Error fetching details for ${item.content_type} with ID ${item.external_id}:`,
            error.message,
          );
          detailedShelves[shelfName].push({
            error: `Failed to fetch details for ${item.content_type} with ID ${item.external_id}`,
          });
        }
      }
    }

    req.detailedShelves = detailedShelves;
    next();
  } catch (error) {
    console.error("Error fetching detailed shelf content:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch detailed shelf content",
      error: error.message,
    });
  }
};
