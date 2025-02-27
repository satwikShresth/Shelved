import { validateMediaType, validateRange } from 'services/tmdbService.js';
import { getAllShelvesContent } from 'crud/shelf.js';
import services from 'services/index.js';

export const validateMediaTypeParam = (req, _res, next) => {
   const { mediaType } = req.query;
   validateMediaType(mediaType);
   next();
};

export const validateRangeParam = (req, _res, next) => {
   const { range } = req.query;
   validateRange(range);
   next();
};

export const getDetailedShelfContent = async (req, res, next) => {
   const { user_id } = req.session;

   const shelvesResponse = await getAllShelvesContent(user_id);

   if (!shelvesResponse.success) {
      return res.status(500).json({
         success: false,
         error: shelvesResponse.message,
      });
   }

   const detailedShelves = {};

   for (const shelfName in shelvesResponse.shelves) {
      detailedShelves[shelfName] = [];

      for (const item of shelvesResponse.shelves[shelfName]) {
         try {
            const service = services[item.db_source];

            if (!service) {
               throw new Error(
                  `Failed to initialize ${item.db_source} service`,
               );
            }

            const details = await service.getDetailsById({
               id: item.external_id,
               media_type: item.content_type,
            });

            detailedShelves[shelfName].push({
               ...details,
               source: item.db_source,
               media_type: item.content_type,
            });
         } catch (error) {
            console.error(
               `Error fetching details for ${item.content_type} with ID ${item.external_id}:`,
               error.message,
            );
            detailedShelves[shelfName].push({
               error:
                  `Failed to fetch details for ${item.content_type} with ID ${item.external_id}`,
            });
         }
      }
   }

   req.detailedShelves = detailedShelves;
   next();
};
