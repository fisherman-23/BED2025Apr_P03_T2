const Joi = require("joi");

const reviewIdSchema = Joi.number().integer().positive().required().messages({
    "number.base": "Review ID must be a number",
    "number.integer": "Review ID must be an integer",
    "number.positive": "Review ID must be a positive number",
    "any.required": "Review ID is required",
});

const reasonSchema = Joi.string().min(1).max(200).required().messages({
    "string.base": "Reason must be a string",
    "string.empty": "Reason cannot be empty",
    "string.min": "Reason must be at least 1 character long",
    "string.max": "Reason must be at most 200 characters long",
    "any.required": "Reason is required",
});

const reportSchema = Joi.object({
    reviewId: reviewIdSchema,
    reason: reasonSchema
});

function validateReportData(req, res, next) {
    const { error } = reportSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

module.exports = {
    validateReportData
};