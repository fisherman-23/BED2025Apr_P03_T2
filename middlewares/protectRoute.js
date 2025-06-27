const jwt = require("jsonwebtoken");

// Core protectRoute middleware (already yours)
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

// Middleware to protect specific routes
function protectSpecificRoutes(req, res, next) {
  const protectedFiles = [
    "/dashboard.html",
    "/profile.html",
    "/something.html",
  ];

  if (protectedFiles.includes(req.path)) {
    return protectRoute(req, res, next);
  }

  next();
}

// Middleware to redirect logged-in users from public pages
function redirectIfAuthenticated(req, res, next) {
  const publicOnlyFiles = ["/login.html", "/signup.html"];

  if (publicOnlyFiles.includes(req.path)) {
    const token = req.cookies.token;
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        return res.redirect("/index.html");
      } catch {}
    }
  }

  next();
}

module.exports = {
  protectRoute,
  protectSpecificRoutes,
  redirectIfAuthenticated,
};
