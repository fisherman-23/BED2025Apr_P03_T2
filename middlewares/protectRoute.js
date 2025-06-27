const jwt = require("jsonwebtoken");

// Middleware to protect routes
function protectRoute(req, res, next) {
  const token = req.cookies?.token; // get token from cookies

  if (!token) {
    // No token, redirect to login or send 401
    return res.status(401).redirect("/login.html");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).redirect("/login.html");
  }
}

module.exports = {
  protectRoute,
};
