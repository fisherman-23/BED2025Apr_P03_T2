const dotenv = require("dotenv");
const express = require("express");
const sql = require("mssql");
const path = require("path");
const cookieParser = require("cookie-parser");
dotenv.config();
const jwt = require("jsonwebtoken");
const { upload, handleUpload } = require("./utils/fileUpload.js");

const userController = require("./controllers/userController.js");
const friendController = require("./controllers/friendController.js");
const matchController = require("./controllers/matchController.js");

const {
  validateUserId,
  validateLoginUser,
  validateCreateUser,
  validateUpdateUser,
  authenticateJWT,
} = require("./middlewares/userValidation");
const {
  protectSpecificRoutes,
  redirectIfAuthenticated,
} = require("./middlewares/protectRoute");
const validateMatchProfile = require("./middlewares/validateMatchProfile.js");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(protectSpecificRoutes);
app.use(redirectIfAuthenticated);

app.get("/me", authenticateJWT, (req, res) => {
  res.json({ username: req.user.email, id: req.user.id, uuid: req.user.uuid });
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/users/login", validateLoginUser, userController.loginUser);
app.post("/users/logout", authenticateJWT, userController.logoutUser);
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

app.get("/users/uuid/:uuid", authenticateJWT, userController.getUserByUUID);

app.post(
  "/friend-invite/:uuid",
  authenticateJWT,
  friendController.sendFriendRequest
);
app.get(
  "/friend-requests",
  authenticateJWT,
  friendController.listAllPendingRequests
);
app.get("/friends", authenticateJWT, friendController.listFriends);

app.patch(
  "/friend-requests/:id/accept",
  authenticateJWT,
  friendController.acceptFriendRequest
);

app.post(
  "/api/upload/:folder",
  /*authenticateJWT,*/ upload.single("file"),
  handleUpload
);

app.patch(
  "/friend-requests/:id/reject",
  authenticateJWT,
  friendController.rejectFriendRequest
);

app.delete(
  "/friends/:friendId",
  authenticateJWT,
  friendController.removeFriend
);

app.delete(
  "/friend-requests/:id/withdraw",
  authenticateJWT,
  friendController.withdrawFriendRequest
);

app.get(
  "/match/profile/check",
  authenticateJWT,
  matchController.hasMatchProfile
);

app.get("/match/profile", authenticateJWT, matchController.getMatchProfile);

app.put(
  "/match/profile",
  authenticateJWT,
  validateMatchProfile,
  matchController.updateMatchProfile
);

app.post(
  "/match/profile",
  authenticateJWT,
  validateMatchProfile,
  matchController.createMatchProfile
);

app.get(
  "/match/potential",
  authenticateJWT,
  matchController.getPotentialMatches
);

app.post(
  "/match/like/:targetUserId",
  authenticateJWT,
  matchController.likeUser
);
app.post(
  "/match/skip/:targetUserId",
  authenticateJWT,
  matchController.skipUser
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

app.get("/invite", (req, res) => {
  res.sendFile(path.join(__dirname, "public/invite.html"));
});

module.exports = app; // export for testing

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
