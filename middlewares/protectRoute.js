const { types } = require("joi");
const jwt = require("jsonwebtoken");
// Core protectRoute middleware (already yours)
function protectRoute(req, res, next) {
  const token = req.cookies?.token; // get token from cookies
  if (!token && !req.cookies.refreshToken) {
    return res.status(403).redirect("/login.html");
  } else if (!token) {
    return tokenRefresher(req, res, next);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("Token expired, checking for refresh token...");
      return tokenRefresher(req, res, next);
    } else {
      console.error("Token verification failed:", err);
      return res.status(403).redirect("/login.html");
    }
  }
}

function tokenRefresher(req, res, next) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(403).redirect("/login.html");
  }
  try {
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
    return res.status(403).redirect("/login.html");
  }
}

// Middleware to protect specific routes
function protectSpecificRoutes(req, res, next) {
  const protectedFiles = [
    "/dashboard.html",
    "/profile.html",
    "/events.html",
    "/chat.html",
    "/social.html",
    "/invite",
    "/index.html",
    "/include.html",
    "/account.html",
    "/announcements.html",
    "/exercise-steps.html",
    "/exercise.html",
    "/facilities.html",
    "/medicationManager.html",
    "/meetings.html",
    "/navigation.html",
    "/review.html",
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
