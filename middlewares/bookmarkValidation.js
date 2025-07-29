const Joi = require("joi");

const bookmarkSchema = Joi.object({
  facilityId: Joi.number().integer().positive().required()
    .messages({
      "number.base": "Facility ID must be a valid number",
      "number.integer": "Facility ID must be a whole number",
      "number.positive": "Facility ID must be greater than 0",
      "any.required": "Facility ID is required to create a bookmark"
    }),
  locationName: Joi.string().max(100).optional().messages({
    "string.base": "Location name must be text",
    "string.max": "Location name cannot exceed 100 characters"
  }),
  note: Joi.string().allow('').max(500).optional().messages({
    "string.base": "Note must be text",
    "string.max": "Note cannot exceed 500 characters"
  })
});

function validateBookmarkId(req, res, next) {
    const bookmarkId = Number(req.params.bookmarkId);
    if (isNaN(bookmarkId) || bookmarkId <= 0) {
        return res.status(400).json({ error: "Invalid bookmark ID" });
    }
    next();
}

function validateFacilityIdParam(req, res, next) {
    const facilityId = Number(req.params.facilityId);
    if (isNaN(facilityId) || facilityId <= 0) {
        return res.status(400).json({ error: "Invalid facility ID" });
    }
    next();
}

function validateBookmarkData(req, res, next) {
    const { error } = bookmarkSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: `Bookmark validation failed: ${errorMessages}` });
    }
    next();
}

module.exports = {
    validateBookmarkId,
    validateBookmarkData,
    validateFacilityIdParam,
};
