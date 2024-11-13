import { Router } from "express";
import { addContentToShelf, createShelf } from "crud/shelf.js";
import { validateBodyString } from "middlewares/commonMiddleware.js";

const getShelfRouter = () => {
  const router = Router();

  router.post(
    "/create",
    validateBodyString(["shelfName", "visibility"]),
    async (req, res) => {
      console.log(req.body);
      const { shelfName, visibility } = req.body;
      const user_id = req.session.user_id;

      try {
        await createShelf({ user_id, name: shelfName, visibility });
        res
          .status(201)
          .json({ success: true, message: "Shelf created successfully" });
      } catch (error) {
        console.error("Error creating shelf:", error.message);
        res
          .status(500)
          .json({ success: false, message: "Failed to create shelf" });
      }
    },
  );

  router.post(
    "/content/add",
    validateBodyString(["external_id"]),
    async (req, res) => {
      const { external_id, source_id, shelf_id, status } = req.body;

      const result = await addContentToShelf({
        external_id,
        source_id,
        shelf_id,
        status,
      });
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    },
  );

  return router;
};

export default getShelfRouter;
