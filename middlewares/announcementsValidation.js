const Joi = require("joi");

const createAnnouncementSchema = Joi.object({
  GroupID: Joi.number().integer().positive().required().messages({
    "number.base": "GroupID must be a number",
    "number.integer": "GroupID must be an integer",
    "number.positive":"GroupID must be a positive number",
    "any.required": "GroupID is required",
  }),
  Title: Joi.string().trim().min(1).max(100).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 1 character long",
    "string.max": "Title cannot exceed 100 characters",
    "any.required":  "Title is required",
  }),
  Content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 1 character long",
    "string.max": "Content cannot exceed 2000 characters",
    "any.required": "Content is required",
  }),
  ImageURL: Joi.string().uri().allow(null, "").messages({
    "string.base": "ImageURL must be a string",
    "string.uri": "ImageURL must be a valid URL",
  }),
});

const postCommentSchema = Joi.object({
  announcementId: Joi.number().integer().positive().required().messages({
    "number.base": "Announcement ID must be a number",
    "number.integer": "Announcement ID must be an integer",
    "number.positive":"Announcement ID must be a positive number",
    "any.required": "Announcement ID is required",
  }),
  content: Joi.string().trim().min(1).max(1000).required().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 1 character long",
    "string.max": "Content cannot exceed 1000 characters",
    "any.required": "Content is required",
  }),
});


const deleteCommentSchema = Joi.object({
  annId: Joi.number().integer().positive().required().messages({
    "number.base": "Announcement ID must be a number",
    "number.integer": "Announcement ID must be an integer",
    "number.positive": "Announcement ID must be a positive number",
    "any.required": "Announcement ID is required",
  }),
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Comment ID must be a number",
    "number.integer": "Comment ID must be an integer",
    "number.positive": "Comment ID must be a positive number",
    "any.required": "Comment ID is required",
  })
});

const editAnnouncementSchema = Joi.object({
  Title: Joi.string().trim().min(1).max(100).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 1 character long",
    "string.max": "Title cannot exceed 100 characters",
    "any.required": "Title is required"
  }),
  Content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 1 character long",
    "string.max": "Content cannot exceed 2000 characters",
    "any.required": "Content is required"
  }),
  ImageURL: Joi.string().uri().allow(null, "").messages({
    "string.uri": "Image URL must be a valid URI"
  })
});


async function validateEditAnnouncement(req, res, next) {
  try {
    await editAnnouncementSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (validationError) {
    const errors = validationError.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: errors });
  }
}



async function validateDeleteComment(req, res, next) {
  try {
    await deleteCommentSchema.validateAsync(req.params, { abortEarly: false });
    next();
  } catch (validationError) {
    const errors = validationError.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: errors });
  }
}


async function validateCreateAnnouncement(req, res, next) {
  try {
    await createAnnouncementSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (validationError) {
    const errors = validationError.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: errors });
  }
}

async function validatePostComment(req, res, next) {
  try {
    await postCommentSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (validationError) {
    const errors = validationError.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: errors });
  }
}

module.exports = {
  validateCreateAnnouncement,
  validatePostComment,
  validateDeleteComment,
  validateEditAnnouncement
};
