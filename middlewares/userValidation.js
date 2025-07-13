const Joi = require("joi");
const IdSchema = Joi.object({
  ID: Joi.number().integer().positive().required().messages({
    "number.base": "ID must be a number",
    "number.integer": "ID must be an integer",
    "number.positive": "ID must be a positive number",
    "any.required": "ID is required",
  }),
});

const loginUserSchema = Joi.object({
  searchTerm: Joi.string().min(1).required().messages({
    "string.base": "Search term must be a string",
    "string.empty": "Search term cannot be empty",
    "string.min": "Search term must be at least 1 character long",
    "any.required": "Search term is required",
  }),
  Password: Joi.string().min(8).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
});

const createUserSchema = Joi.object({
  Email: Joi.string().email().max(100).required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email cannot be empty",
    "string.max": "Email cannot exceed 100 characters",
    "any.required": "Email is required",
  }),
  Password: Joi.string().min(8).max(100).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 100 characters",
    "any.required": "Password is required",
  }),
  Name: Joi.string().min(1).max(30).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 1 character long",
    "string.max": "Name cannot exceed 30 characters",
    "any.required": "Name is required",
  }),
  PhoneNumber: Joi.string()
    .length(8)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.base": "Phone number must be a string",
      "string.empty": "Phone number cannot be empty",
      "string.length": "Phone number must be exactly 8 digits",
      "string.pattern.base": "Phone number must contain only digits",
      "any.required": "Phone number is required",
    }),
  DateOfBirth: Joi.date().iso().required().messages({
    "date.base": "Date of Birth must be a valid date",
    "date.iso": "Date of Birth must be in YYYY-MM-DD format",
    "any.required": "Date of Birth is required",
  }),
  ProfilePicture: Joi.string().uri().allow(null, "").messages({
    "string.base": "Profile picture URL must be a string",
    "string.uri": "Profile picture must be a valid URL",
  }),
});

const updateUserSchema = Joi.object({
  Email: Joi.string().email().max(100).required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email cannot be empty",
    "string.max": "Email cannot exceed 100 characters",
    "any.required": "Email is required",
  }),
  Name: Joi.string().min(1).max(30).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 1 character long",
    "string.max": "Name cannot exceed 30 characters",
    "any.required": "Name is required",
  }),
  AboutMe: Joi.string().max(200).allow(null, "").messages({
    "string.base": "About Me must be a string",
    "string.max": "About Me cannot exceed 200 characters",
  }),
  PhoneNumber: Joi.string()
    .length(8)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.base": "Phone number must be a string",
      "string.empty": "Phone number cannot be empty",
      "string.length": "Phone number must be exactly 8 digits",
      "string.pattern.base": "Phone number must contain only digits",
      "any.required": "Phone number is required",
    }),
  Password: Joi.string().messages({
    "string.base": "Current password must be a string",
    "string.empty": "Current password cannot be empty",
    "any.required": "Current password is required",
  }),
  NewPassword: Joi.string().min(8).max(100).optional().messages({
    "string.base": "New password must be a string",
    "string.empty": "New password cannot be empty",
    "string.min": "New password must be at least 8 characters long",
    "string.max": "New password cannot exceed 100 characters",
  }),
  ProfilePicture: Joi.string().uri().allow(null, "").messages({
    "string.base": "Profile picture URL must be a string",
    "string.uri": "Profile picture must be a valid URL",
  }),
});

const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token && !req.cookies.refreshToken) {
    return res.status(401).json({ error: "Authentication token required" });
  } else if (!token) {
    return tokenRefresher(req, res, next);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if( err.name === "TokenExpiredError") { 
      console.log("Token expired, checking for refresh token...");
      return tokenRefresher(req, res, next);
      }
    else{
      return res.status(403).json({ error: "Invalid token" });
    }
  }
}

function tokenRefresher(req, res, next) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }
  try{
    decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    newToken = jwt.sign(
          { id: decodedRefresh.id, email: decodedRefresh.email },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
    res.cookie("token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 1000 * 60 * 60, // expires in 1h
        });
    req.user = decodedRefresh;
    return next();
  } catch (err) {
    console.error("Refresh token verification failed:", err);
    return res.status(403).json({ error: "Invalid refresh token" });
  }
}

function validateUserId(req, res, next) {
  const params = { ID: Number(req.params.ID) };
  const { error } = IdSchema.validate(params, { abortEarly: false });
  if (error) {
    const errormessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errormessage });
  }
  next();
}

function validateLoginUser(req, res, next) {
  const { error } = loginUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errormessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errormessage });
  }
  next();
}

function validateCreateUser(req, res, next) {
  const { error } = createUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errormessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errormessage });
  }
  next();
}

function validateUpdateUser(req, res, next) {
  const { error } = updateUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errormessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errormessage });
  }
  next();
}

module.exports = {
  validateUserId,
  validateLoginUser,
  validateCreateUser,
  validateUpdateUser,
  authenticateJWT,
};
