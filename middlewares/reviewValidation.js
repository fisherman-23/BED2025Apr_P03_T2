const Joi = require("joi");
const { validateFacilityIdParam } = require("./bookmarkValidation");

const reviewSchema = Joi.object({
    facilityId: Joi.number().integer().positive().required().messages({
        "number.base": "Facility ID must be a valid number",
        "number.integer": "Facility ID must be a whole number",
        "number.positive": "Facility ID must be greater than 0",
        "any.required": "Facility ID is required to submit a review"
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
        "number.base": "Rating must be a number",
        "number.integer": "Rating must be an integer",
        "number.min": "Rating must be at least 1",
        "number.max": "Rating must be at most 5",
        "any.required": "Rating is required to submit a review"
    }),
    comment: Joi.string().max(500).optional().allow('', null).messages({
        "string.base": "Comment must be text",
        "string.max": "Comment cannot exceed 500 characters"
    })
});

const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional().messages({
        "number.base": "Rating must be a number",
        "number.integer": "Rating must be an integer", 
        "number.min": "Rating must be at least 1",
        "number.max": "Rating must be at most 5"
    }),
    comment: Joi.string().max(500).optional().messages({
        "string.base": "Comment must be text",
        "string.max": "Comment cannot exceed 500 characters"
    })
});

function validateReviewIdParam(req, res, next) {
    const reviewId = Number(req.params.id);
    if (isNaN(reviewId) || reviewId <= 0) {
        return res.status(400).json({ error: "Invalid review ID" });
    }
    next();
}

function validateReviewData(req, res, next) {
    const { error } = reviewSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: `Review submission failed: ${errorMessages}` });
    }
    next();
}

function validateUpdateReviewData(req, res, next) {
    const { error } = updateReviewSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: `Review update failed: ${errorMessages}` });
    }
    next();
}

module.exports = {
    validateReviewIdParam,
    validateFacilityIdParam,
    validateReviewData,
    validateUpdateReviewData,
};