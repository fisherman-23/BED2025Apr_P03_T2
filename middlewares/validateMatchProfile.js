const Joi = require("joi");

const matchProfileSchema = Joi.object({
  bio: Joi.string().allow("").max(1000).required(),
  likesHiking: Joi.boolean().optional(),
  likesGardening: Joi.boolean().optional(),
  likesBoardGames: Joi.boolean().optional(),
  likesSinging: Joi.boolean().optional(),
  likesReading: Joi.boolean().optional(),
  likesWalking: Joi.boolean().optional(),
  likesCooking: Joi.boolean().optional(),
  likesMovies: Joi.boolean().optional(),
  likesTaiChi: Joi.boolean().optional(),
});

function validateMatchProfile(req, res, next) {
  const { error } = matchProfileSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      error: "Invalid request body",
      details: error.details.map((d) => d.message),
    });
  }

  next();
}

module.exports = validateMatchProfile;
