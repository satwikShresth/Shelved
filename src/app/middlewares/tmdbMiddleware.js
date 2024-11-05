import { validateMediaType, validateRange } from "services/tmdbValidator.js";

const tryCatch = (fn) => (req, res, next) => {
  try {
    fn(req, res, next);
  } catch (error) {
    console.error(error);
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
