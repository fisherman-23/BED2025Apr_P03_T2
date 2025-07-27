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
const chatController = require("./controllers/chatController.js");
const eventsController = require("./controllers/eventsController.js");
const announcementsController = require("./controllers/announcementsController.js");


const facilitiesController = require("./controllers/facilitiesController.js");
const bookmarkController = require("./controllers/bookmarkController.js");
const reviewController = require("./controllers/reviewController.js");
const navigationController = require("./controllers/navigationController.js");
const reportController = require("./controllers/reportController.js");

const exerciseController = require("./controllers/exerciseController.js");
const medicationController = require("./controllers/medicationController.js");
const appointmentController = require("./controllers/appointmentController.js");
const goalController = require("./controllers/goalController.js");

const {
  validateCreateGroup,
  validateGroupId,
} = require("./middlewares/eventsValidation.js");
const {
  validateCreateAnnouncement,
  validatePostComment,
  validateDeleteComment,
} = require("./middlewares/announcementsValidation.js");

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
const validateGoal = require("./middlewares/goalValidation.js");
const {
  validateLocationAccess,
  validateNearbyFacilities,
  validateFacilityId,
  validateFacilityType,
} = require("./middlewares/facilitiesValidation.js");
const {
  validateBookmarkId,
  validateFacilityIdParam,
  validateBookmarkData,
} = require("./middlewares/bookmarkValidation.js");
const {
  validateReviewIdParam,
  validateReviewData,
  validateUpdateReviewData,
} = require("./middlewares/reviewValidation.js");
const {
    validateReportData,
} = require("./middlewares/reportValidation.js"); 

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


app.post(
  "/api/upload/:folder",
  authenticateJWT, upload.single("file"),
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


// Module 2: Community Events

app.get(
  "/groups/joined",
  authenticateJWT,
  eventsController.getJoinedGroups
);

app.get(
  "/groups/available",
  authenticateJWT,
  eventsController.getAvailableGroups
);

app.post(
  "/groups",
  authenticateJWT,
  validateCreateGroup,
  eventsController.createGroup
)

app.post(
  "/groups/join",
  authenticateJWT, 
  validateGroupId, 
  eventsController.joinGroup
);

app.delete(
  "/groups/leave", 
  authenticateJWT, 
  validateGroupId, 
  eventsController.leaveGroup
);



app.get(
  "/announcements",
  authenticateJWT,
  announcementsController.getAnnouncements
);

app.post(
  "/announcements",
  authenticateJWT,
  validateCreateAnnouncement,
  announcementsController.createAnnouncement
);

app.get(
  "/announcements/:id/comments",
  authenticateJWT,
  announcementsController.getComments
);

app.post(
  "/announcements/:id/comments",
  authenticateJWT,
  validatePostComment,
  announcementsController.postComment
);

app.delete(
  "/announcements/:annId/comments/:id",
  authenticateJWT,
  validateDeleteComment,
  announcementsController.deleteComment
);




// Module 3: Transport Navigator
app.get(
  "/facilities/nearby",
  authenticateJWT,
  validateNearbyFacilities,
  facilitiesController.getNearbyFacilities
);

app.get("/facilities/id/:id",
  authenticateJWT,
  validateFacilityId,
  facilitiesController.getFacilityById
);

app.get(
  "/facilities/type/:type",
  authenticateJWT,
  validateFacilityType,
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
  validateLocationAccess,
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
  validateBookmarkData,
  bookmarkController.saveBookmark
);

app.put(
  "/bookmarks/:bookmarkId",
  authenticateJWT,
  validateBookmarkId,
  bookmarkController.updateBookmark
);

app.delete(
  "/bookmarks/:bookmarkId",
  authenticateJWT,
  validateBookmarkId,
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
  validateReviewIdParam,
  validateUpdateReviewData,
  reviewController.updateReview
);

app.post(
  "/reviews",
  authenticateJWT,
  validateReviewData,
  reviewController.createReview
);

app.delete(
  "/reviews/:id",
  authenticateJWT,
  validateReviewIdParam,
  reviewController.deleteReview
);

app.post(
  "/reports",
  authenticateJWT,
  validateReportData,
  reportController.createReport
);

// endpoints for Google Maps API integration
app.get(
  "/api/google-maps-config",
  authenticateJWT,
  navigationController.getGoogleMapsConfig
);

app.post(
  "/api/directions/:facilityId",
  authenticateJWT,
  navigationController.getFacilityDirections
);

app.post(
  "/api/geocode",
  authenticateJWT,
  navigationController.geocodeAddress
);

// Module 4: Senior fitness coach

app.get(
  "/exercises/goals",
  authenticateJWT,
  goalController.getGoals
);

app.get(
  "/exercises/incompleted-goals",
  authenticateJWT,
  goalController.getIncompletedGoals
);

app.get(
  "/exercises",
  authenticateJWT,
  exerciseController.getExercises
);

app.get(
  "/exercises/steps/:exerciseId",
  authenticateJWT,
  exerciseController.getSteps
);

app.get(
  "/exercises/preferences",
  authenticateJWT,
  exerciseController.getExercisePreferences
);

app.put(
  "/exercises/preferences",
  authenticateJWT,
  exerciseController.updateExercisePreferences
);

app.put(
  "/exercises/reset",
  authenticateJWT,
  goalController.resetGoal
);

app.post(
  "/exercises/personalisation",
  authenticateJWT,
  exerciseController.personalisation
);

app.put(
  "/exercises/goals",
  authenticateJWT,
  goalController.updateGoal
)

app.post(
  "/exercises/goals",
  authenticateJWT, 
  validateGoal,
  goalController.createGoal
);

app.delete(
  "/exercises/goals/:goalId",
  authenticateJWT,
  goalController.deleteGoal
);

app.delete(
  "/exercises/preferences",
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

app.post("/conversations", authenticateJWT, chatController.startConversation);

app.get("/conversations", authenticateJWT, chatController.getConversations);

app.get(
  "/conversations/:conversationId/messages",
  authenticateJWT,
  chatController.getMessages
);

app.post(
  "/conversations/:conversationId/messages",
  authenticateJWT,
  chatController.sendMessage
);

app.delete(
  "/messages/:messageId",
  authenticateJWT,
  chatController.deleteMessage
);

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
