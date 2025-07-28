const joi = require("joi");

const messageSchema = joi.object({
  content: joi.string().min(1).max(1000).required().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "any.required": "Content is required",
    "string.min": "Content must be at least 1 character long",
    "string.max": "Content cannot exceed 1000 characters",
  }),
});

const validateMessage = (req, res, next) => {
  const { error } = messageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateMessage,
};
