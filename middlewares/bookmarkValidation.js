const Joi = require("joi");

const bookmarkIdSchema = Joi.object({
    bookmarkId: Joi.number().integer().positive().required().messages({
        "number.base": "Bookmark ID must be a number",
        "number.integer": "Bookmark ID must be an integer",
        "number.positive": "Bookmark ID must be a positive number",
        "any.required": "Bookmark ID is required",
    }),
});

const bookmarkSchema = Joi.object({
  facilityId: Joi.number().integer().positive().required()
    .messages({
      "number.base": "Facility ID must be a number",
      "number.integer": "Facility ID must be an integer",
      "number.positive": "Facility ID must be a positive number",
      "any.required": "Facility ID is required"
    }),
  locationName: Joi.string().optional(),
  note: Joi.string().allow('').optional()
});

function validateBookmarkId(req, res, next) {
    const params = { bookmarkId: Number(req.params.bookmarkId) };
    const { error } = bookmarkIdSchema.validate(params, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

function validateBookmarkData(req, res, next) {
    const { error } = bookmarkSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

module.exports = {
    validateBookmarkId,
    validateBookmarkData,
};
