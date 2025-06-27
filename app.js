const dotenv = require("dotenv");
const express = require("express");
const sql = require("mssql");
const path = require("path");
const cookieParser = require("cookie-parser");
dotenv.config();
const jwt = require("jsonwebtoken");
const userController = require("./controllers/userController.js");
const {
  validateUserId,
  validateLoginUser,
  validateCreateUser,
  validateUpdateUser,
  authenticateJWT,
} = require("./middlewares/userValidation");
const { protectRoute } = require("./middlewares/protectRoute.js");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Middleware to protect specific routes
app.use((req, res, next) => {
  const protectedFiles = [
    "/dashboard.html",
    "/profile.html",
    "/something.html",
  ];

  if (protectedFiles.includes(req.path)) {
    return protectRoute(req, res, next);
  }

  next();
});
// Middleware to redirect logged-in users from public pages
app.use((req, res, next) => {
  const publicOnlyFiles = ["/login.html", "/signup.html"];
  if (publicOnlyFiles.includes(req.path)) {
    const token = req.cookies.token;
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        return res.redirect("/index.html");
      } catch {}
    }
  }
  next();
});

app.get("/me", authenticateJWT, (req, res) => {
  res.json({ username: req.user.email });
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/users/login", validateLoginUser, userController.loginUser);

app.post("/users", validateCreateUser, userController.createUser);

app.get(
  "/users/:ID",
  authenticateJWT,
  validateUserId,
  userController.getUserById
);

app.put(
  "/users/:ID",
  authenticateJWT,
  validateUserId,
  validateUpdateUser,
  userController.updateUser
);

app.delete(
  "/users/:ID",
  authenticateJWT,
  validateUserId,
  userController.deleteUser
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
