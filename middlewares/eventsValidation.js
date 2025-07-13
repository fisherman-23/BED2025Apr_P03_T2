const Joi = require("joi");

const createGroupSchema = Joi.object({
  Name: Joi.string().trim().min(1).max(50).required().messages({
      "string.base": "Name must be a string",
      "string.empty": "Name cannot be empty",
      "string.min": "Name must be at least 1 character long",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),
  Description: Joi.string().allow(null, "").max(200).messages({
      "string.base": "Description must be a string",
      "string.max": "Description cannot exceed 200 characters",
    }),
  GroupPicture: Joi.string().uri().allow(null, "").messages({
      "string.base": "GroupPicture must be a string",
      "string.uri": "GroupPicture must be a valid URL",
    }),
  IsPrivate: Joi.boolean().required().messages({
      "boolean.base": "IsPrivate must be true or false",
      "any.required": "IsPrivate is required",
    }),
});

const groupIdSchema = Joi.object({
  groupId: Joi.number().integer().positive().required().messages({
    "number.base":    "Group ID must be a number",
    "number.integer": "Group ID must be an integer",
    "number.positive":"Group ID must be a positive number",
    "any.required":   "Group ID is required",
  })
});

async function validateCreateGroup(req, res, next) {
  try {
    await createGroupSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (validationError) {
    const errors = validationError.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: errors });
  }
}

async function validateGroupId(req, res, next) {
  try {
    await groupIdSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (validationError) {
    const errors = validationError.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: errors });
  }
}

module.exports = {
  validateCreateGroup,
  validateGroupId
};
