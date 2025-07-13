const Joi = require("joi");

const goalSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "string.base": "Goal name must be a string",
    "string.empty": "Goal name cannot be empty",
    "string.min": "Goal name must be at least 1 character long",
    "string.max": "Goal name cannot exceed 100 characters",
    "any.required": "Goal name is required",
}),
  description: Joi.string().max(300).messages({
    "string.base": "Description must be a string",
    "string.empty": "Description cannot be empty",
    "string.max": "Description cannot exceed 300 characters",
  })
});

function validateGoal(req, res, next) {
    const { error } = goalSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ message: errorMessage });
    }
    next();
}

module.exports = validateGoal;