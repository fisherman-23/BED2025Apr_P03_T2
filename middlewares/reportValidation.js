const Joi = require("joi");

const reportSchema = Joi.object({
    reviewId: Joi.number().integer().positive().required().messages({
        "number.base": "Review ID must be a valid number",
        "number.integer": "Review ID must be a whole number",
        "number.positive": "Review ID must be greater than 0",
        "any.required": "Review ID is required to report a review"
    }),
    reason: Joi.string().max(100).required().messages({
        "string.base": "Reason must be text",
        "string.max": "Reason cannot exceed 100 characters",
        "any.required": "Reason is required to report a review"
    })
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