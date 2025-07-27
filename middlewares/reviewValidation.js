const Joi = require("joi");

const facilityIdSchema = Joi.number().integer().positive().required().messages({
    "number.base": "Facility ID must be a number",
    "number.integer": "Facility ID must be an integer",
    "number.positive": "Facility ID must be a positive number",
    "any.required": "Facility ID is required",
});

const reviewIdSchema = Joi.number().integer().positive().required().messages({
    "number.base": "Review ID must be a number",
    "number.integer": "Review ID must be an integer",
    "number.positive": "Review ID must be a positive number",
    "any.required": "Review ID is required",
});

const ratingSchema = Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must be at most 5",
    "any.required": "Rating is required",
});

const commentSchema = Joi.string().allow('', null).max(500).messages({
        "string.base": "Comment must be a string",
        "string.max": "Comment must be at most 500 characters long",
});

const reviewSchema = Joi.object({
    facilityId: facilityIdSchema,
    rating: ratingSchema,
    comment: commentSchema
});

const updateReviewSchema = Joi.object({
    rating: ratingSchema,
    comment: commentSchema
});

function validateReviewIdParam(req, res, next) {
    const { error } = reviewIdSchema.validate((req.params.id), { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

function validateReviewData(req, res, next) {
    const { error } = reviewSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

function validateUpdateReviewData(req, res, next) {
    const { error } = updateReviewSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

module.exports = {
    validateReviewIdParam,
    validateReviewData,
    validateUpdateReviewData,
};