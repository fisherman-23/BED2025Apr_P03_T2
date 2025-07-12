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

const facilitiesController = require("./controllers/facilitiesController.js");
const bookmarkController = require("./controllers/bookmarkController.js");
const reviewController = require("./controllers/reviewController.js");

const exerciseController = require("./controllers/exerciseController.js");
const medicationController = require("./controllers/medicationController.js");
const appointmentController = require("./controllers/appointmentController.js");

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
const { compareSync } = require("bcrypt");
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

app.post('/api/upload/:folder', upload.single('file'), handleUpload);

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


// Module 3: Transport Navigator
app.get(
  "/facilities/nearby",
  authenticateJWT,
  facilitiesController.getNearbyFacilities
);

app.get("/facilities/:id",
  authenticateJWT,
  facilitiesController.getFacilityById
);

app.get(
  "/facilities/:type",
  authenticateJWT,
  facilitiesController.getFacilitiesByType
);

app.get(
  "/facilities",
  authenticateJWT,
  facilitiesController.getFacilities
);

app.get(
  "/api/geocode",
  authenticateJWT,
  facilitiesController.handleLocationAccess
);

app.get(
  "/bookmarks/:facilityId",
  authenticateJWT,
  bookmarkController.checkIfBookmarked
);

app.get(
  "/bookmarks",
  authenticateJWT,
  bookmarkController.getBookmarkedFacilities
);

app.post(
  "/bookmarks",
  authenticateJWT,
  bookmarkController.saveBookmark
);

app.put(
  "/bookmarks/:bookmarkId",
  authenticateJWT,
  bookmarkController.updateBookmark
);

app.delete(
  "/bookmarks/:bookmarkId",
  authenticateJWT,
  bookmarkController.deleteBookmark
);

app.get(
  "/reviews/:facilityId",
  authenticateJWT,
  reviewController.getReviewsByFacilityId
);

app.put(
  "/reviews/:id",
  authenticateJWT,
  reviewController.updateReview
)

app.delete(
  "/reviews/:id",
  authenticateJWT,
  reviewController.deleteReview
)

app.post(
  "/reports",
  authenticateJWT,
  reviewController.createReport
)

// Module 4: Senior fitness coach
app.get(
  "/exercises/:userId",
  authenticateJWT,
  exerciseController.getExercises
);

app.get(
  "/exercises/steps/:exerciseId",
  authenticateJWT,
  exerciseController.getSteps
);

app.get(
  "/exercises/preferences/:userId",
  authenticateJWT,
  exerciseController.getExercisePreferences
);

app.put(
  "/exercises/preferences",
  authenticateJWT,
  exerciseController.updateExercisePreferences
);

app.post(
  "/exercises/personalisation",
  authenticateJWT,
  exerciseController.personalisation
);

app.delete(
  "/exercises/preferences/:userId",
  authenticateJWT,
  exerciseController.deleteExercisePreference
);

// Module 1: Medication & Appointment Manager
// Medication routes
app.post("/api/medications", authenticateJWT, medicationController.createMedication);
app.get("/api/medications", authenticateJWT, medicationController.getUserMedications);
app.get("/api/medications/:id", authenticateJWT, medicationController.getMedicationById);
app.put("/api/medications/:id", authenticateJWT, medicationController.updateMedication);
app.delete("/api/medications/:id", authenticateJWT, medicationController.deleteMedication);
app.post("/api/medications/:id/taken", authenticateJWT, medicationController.markMedicationTaken);
app.get("/api/medications/reminders/upcoming", authenticateJWT, medicationController.getUpcomingReminders);

// Appointment routes
app.post("/api/appointments", authenticateJWT, appointmentController.createAppointment);
app.get("/api/appointments", authenticateJWT, appointmentController.getUserAppointments);
app.get("/api/appointments/:id", authenticateJWT, appointmentController.getAppointmentById);
app.put("/api/appointments/:id", authenticateJWT, appointmentController.updateAppointment);
app.delete("/api/appointments/:id", authenticateJWT, appointmentController.deleteAppointment);

// Doctor routes
app.get("/api/doctors", authenticateJWT, appointmentController.getAllDoctors);
app.get("/api/doctors/search", authenticateJWT, appointmentController.searchDoctors);
app.get("/api/doctors/:doctorId/availability", authenticateJWT, appointmentController.getDoctorAvailability);

// Appointment helper routes
app.post("/api/appointments/:id/reminder", authenticateJWT, appointmentController.sendAppointmentReminder);
app.post("/api/appointments/:id/directions", authenticateJWT, appointmentController.getDirections);

app.get("/medicationManager", (req, res) => {
  res.sendFile(path.join(__dirname, "public/medicationManager.html"));
});

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
