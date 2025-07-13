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

const commentSchema = Joi.string().min(1).max(500).required().messages({
    "string.base": "Comment must be a string",
    "string.empty": "Comment cannot be empty",
    "string.min": "Comment must be at least 1 character long",
    "string.max": "Comment must be at most 500 characters long",
    "any.required": "Comment is required",
});

const reasonSchema = Joi.string().min(1).max(200).required().messages({
    "string.base": "Reason must be a string",
    "string.empty": "Reason cannot be empty",
    "string.min": "Reason must be at least 1 character long",
    "string.max": "Reason must be at most 200 characters long",
    "any.required": "Reason is required",
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

const reportSchema = Joi.object({
    reviewId: reviewIdSchema,
    reason: reasonSchema
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

function validateReportData(req, res, next) {
    const { error } = reportSchema.validate(req.body, { abortEarly: false });
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
    validateReportData
};