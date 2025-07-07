const jwt = require("jsonwebtoken");
// Core protectRoute middleware (already yours)
function protectRoute(req, res, next) {
  const token = req.cookies?.token; // get token from cookies
  let decodedRefresh;
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
    if( err.name === "TokenExpiredError") {
      console.error("Token expired, checking for refresh token...");
      if (req.cookies && req.cookies.refreshToken) {
        refreshToken = req.cookies.refreshToken;
        try{
          decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        }
        catch (error) {
          console.error("Refresh token verification failed:", error);
          return res.status(403).redirect("/login.html");
        }
        newToken = jwt.sign(
              { id: decodedRefresh.ID, email: decodedRefresh.Email },
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
      }
    }else{
      console.error("Token verification failed:", err); 
      return res.status(403).redirect("/login.html");
    }
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
