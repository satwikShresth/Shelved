export const validateBodyString = (fields) => {
  return (req, res, next) => {
    for (const field of fields) {
      if (
        typeof req.body[field] !== "string" ||
        req.body[field].trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid or missing field: ${field}`,
        });
      }
    }
    next();
  };
};
