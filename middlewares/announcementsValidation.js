const Joi = require("joi");

const createAnnouncementSchema = Joi.object({
  GroupID: Joi.number().integer().positive().required(),
  Title:   Joi.string().trim().min(1).max(100).required(),
  Content: Joi.string().trim().min(1).max(2000).required(),
  ImageURL:Joi.string().uri().allow(null, ""),
});

const postCommentSchema = Joi.object({
  announcementId: Joi.number().integer().positive().required(),
  content:        Joi.string().trim().min(1).max(1000).required(),
});

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
  validatePostComment
};
