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
const meetingsController = require("./controllers/meetingsController.js");

const facilitiesController = require("./controllers/facilitiesController.js");
const bookmarkController = require("./controllers/bookmarkController.js");
const reviewController = require("./controllers/reviewController.js");
const navigationController = require("./controllers/navigationController.js");
const reportController = require("./controllers/reportController.js");

const exerciseController = require("./controllers/exerciseController.js");
const medicationController = require("./controllers/medicationController.js");
const appointmentController = require("./controllers/appointmentController.js");
const goalController = require("./controllers/goalController.js");
const weatherController = require("./controllers/weatherController.js");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

const {
  validateCreateGroup,
  validateGroupId,
} = require("./middlewares/eventsValidation.js");
const {
  validateCreateAnnouncement,
  validatePostComment,
  validateDeleteComment,
  validateEditAnnouncement,
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
  validateBookmarkData,
} = require("./middlewares/bookmarkValidation.js");
const {
  validateReviewIdParam,
  validateReviewData,
  validateUpdateReviewData,
} = require("./middlewares/reviewValidation.js");

const { validateReportData } = require("./middlewares/reportValidation.js");

const { validateMessage } = require("./middlewares/chatValidation.js");

const { compareSync } = require("bcrypt");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(protectSpecificRoutes);
app.use(redirectIfAuthenticated);

app.get("/me", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get the authenticated user\'s basic profile information'

  res.json({ username: req.user.email, id: req.user.id, uuid: req.user.uuid });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

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

app.get("/users/uuid/:uuid", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get a user by UUID'
  // #swagger.parameters['uuid'] = { description: 'UUID of the user', in: 'path', required: true, type: 'string' }
  userController.getUserByUUID(req, res);
});

app.post("/friend-invite/:uuid", authenticateJWT, (req, res) => {
  // #swagger.description = 'Send a friend request to the user identified by UUID'
  // #swagger.parameters['uuid'] = { description: 'UUID of the user to send friend request to', in: 'path', required: true, type: 'string' }

  friendController.sendFriendRequest(req, res);
});

app.get("/friend-requests", authenticateJWT, (req, res) => {
  // #swagger.description = 'List all pending friend requests for the authenticated user'
  friendController.listAllPendingRequests(req, res);
});

app.get("/friends", authenticateJWT, (req, res) => {
  // #swagger.description = 'List all friends of the authenticated user'
  friendController.listFriends(req, res);
});

app.patch("/friend-requests/:id/accept", authenticateJWT, (req, res) => {
  // #swagger.description = 'Accept a friend request identified by its ID'
  // #swagger.parameters['id'] = { description: 'ID of the friend request to accept', in: 'path', required: true, type: 'string' }
  friendController.acceptFriendRequest(req, res);
});

app.post(
  "/api/upload/:folder",
  authenticateJWT,
  upload.single("file"),
  handleUpload
);

app.patch("/friend-requests/:id/reject", authenticateJWT, (req, res) => {
  // #swagger.description = 'Reject a friend request by its ID'
  // #swagger.parameters['id'] = { description: 'ID of the friend request to reject', in: 'path', required: true, type: 'string' }

  friendController.rejectFriendRequest(req, res);
});

app.delete("/friends/:friendId", authenticateJWT, (req, res) => {
  // #swagger.description = 'Remove a friend by their friend ID'
  // #swagger.parameters['friendId'] = { description: 'ID of the friend to remove', in: 'path', required: true, type: 'string' }

  friendController.removeFriend(req, res);
});

app.delete("/friend-requests/:id/withdraw", authenticateJWT, (req, res) => {
  // #swagger.description = 'Withdraw a previously sent friend request by its ID'
  // #swagger.parameters['id'] = { description: 'ID of the friend request to withdraw', in: 'path', required: true, type: 'string' }

  friendController.withdrawFriendRequest(req, res);
});

app.get("/match/profile/check", authenticateJWT, (req, res) => {
  // #swagger.description = 'Check if the authenticated user has a match profile'

  matchController.hasMatchProfile(req, res);
});

app.get("/match/profile", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get the authenticated user\'s match profile'

  matchController.getMatchProfile(req, res);
});

app.put("/match/profile", authenticateJWT, validateMatchProfile, (req, res) => {
  // #swagger.description = 'Update the authenticated user\'s match profile'

  matchController.updateMatchProfile(req, res);
});

app.post(
  "/match/profile",
  authenticateJWT,
  validateMatchProfile,
  (req, res) => {
    // #swagger.description = 'Create a new match profile for the authenticated user'

    matchController.createMatchProfile(req, res);
  }
);

app.get("/match/potential", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get potential matches for the authenticated user'

  matchController.getPotentialMatches(req, res);
});

app.post("/match/like/:targetUserId", authenticateJWT, (req, res) => {
  // #swagger.description = 'Like a user by their targetUserId'
  // #swagger.parameters['targetUserId'] = { description: 'ID of the user to like', in: 'path', required: true, type: 'string' }

  matchController.likeUser(req, res);
});

app.post("/match/skip/:targetUserId", authenticateJWT, (req, res) => {
  // #swagger.description = 'Skip a user by their targetUserId'
  // #swagger.parameters['targetUserId'] = { description: 'ID of the user to skip', in: 'path', required: true, type: 'string' }

  matchController.skipUser(req, res);
});

// Module 2: Community Events

app.get("/groups/joined", authenticateJWT, eventsController.getJoinedGroups);

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
);

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

// New invite token routes
app.get(
  "/groups/:groupId/invite-token",
  authenticateJWT,
  eventsController.getGroupInviteToken
);

app.get(
  "/groups/token/:token",
  authenticateJWT,
  eventsController.findGroupByToken
);

app.post(
  "/groups/join-by-token",
  authenticateJWT,
  eventsController.joinGroupByToken
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

app.post("/meetings", authenticateJWT, meetingsController.createMeeting);

app.get(
  "/meetings/:meetingId/data",
  authenticateJWT,
  meetingsController.getMeetingData
);

app.get("/meetings/join", authenticateJWT, meetingsController.joinByName);

app.put(
  "/announcements/:id",
  authenticateJWT,
  validateEditAnnouncement,
  announcementsController.editAnnouncement
);

app.delete(
  "/announcements/:id",
  authenticateJWT,
  announcementsController.deleteAnnouncement
);

// Module 3: Transport Navigator
app.get(
  "/facilities/nearby",
  authenticateJWT,
  validateNearbyFacilities,
  facilitiesController.getNearbyFacilities
);

app.get(
  "/facilities/id/:id",
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

app.get("/facilities", authenticateJWT, facilitiesController.getFacilities);

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

app.post("/api/geocode", authenticateJWT, navigationController.geocodeAddress);

// Module 4: Senior fitness coach

app.get("/exercises/goals", authenticateJWT, goalController.getGoals);
app.get("/exercise/stats", authenticateJWT, exerciseController.getUserStats);
app.get(
  "/exercises/incompleted-goals",
  authenticateJWT,
  goalController.getIncompletedGoals
);

app.get("/exercises", authenticateJWT, exerciseController.getExercises);

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

app.put("/exercises/reset", authenticateJWT, goalController.resetGoal);

app.post(
  "/exercises/personalisation",
  authenticateJWT,
  exerciseController.personalisation
);

app.put("/exercises/goals", authenticateJWT, goalController.updateGoal);

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

app.post("/exercise/weather", authenticateJWT, weatherController.getWeather);

app.post(
  "/exercise/logExercise/:exerciseID",
  authenticateJWT,
  exerciseController.logExerciseCompletion
);

app.post(
  "/exercise/logGoals",
  authenticateJWT,
  goalController.logGoalCompletion
);

// Module 1: Medication & Appointment Manager
// Medication routes
app.post(
  "/api/medications",
  authenticateJWT,
  medicationController.createMedication
);
app.get(
  "/api/medications",
  authenticateJWT,
  medicationController.getUserMedications
);
app.get(
  "/api/medications/:id",
  authenticateJWT,
  medicationController.getMedicationById
);
app.put(
  "/api/medications/:id",
  authenticateJWT,
  medicationController.updateMedication
);
app.delete(
  "/api/medications/:id",
  authenticateJWT,
  medicationController.deleteMedication
);
app.post(
  "/api/medications/:id/taken",
  authenticateJWT,
  medicationController.markMedicationTaken
);
app.get(
  "/api/medications/reminders/upcoming",
  authenticateJWT,
  medicationController.getUpcomingReminders
);

// Appointment routes
app.post(
  "/api/appointments",
  authenticateJWT,
  appointmentController.createAppointment
);
app.get(
  "/api/appointments",
  authenticateJWT,
  appointmentController.getUserAppointments
);
app.get(
  "/api/appointments/:id",
  authenticateJWT,
  appointmentController.getAppointmentById
);
app.put(
  "/api/appointments/:id",
  authenticateJWT,
  appointmentController.updateAppointment
);
app.delete(
  "/api/appointments/:id",
  authenticateJWT,
  appointmentController.deleteAppointment
);

// Doctor routes
app.get("/api/doctors", authenticateJWT, appointmentController.getAllDoctors);
app.get(
  "/api/doctors/search",
  authenticateJWT,
  appointmentController.searchDoctors
);
app.get(
  "/api/doctors/:doctorId/availability",
  authenticateJWT,
  appointmentController.getDoctorAvailability
);

// Appointment helper routes
app.post(
  "/api/appointments/:id/reminder",
  authenticateJWT,
  appointmentController.sendAppointmentReminder
);
app.post(
  "/api/appointments/:id/directions",
  authenticateJWT,
  appointmentController.getDirections
);

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
  // #swagger.description = 'Serve the invite HTML page'

  res.sendFile(path.join(__dirname, "public/invite.html"));
});

app.post("/conversations", authenticateJWT, (req, res) => {
  // #swagger.description = 'Start a new conversation'

  chatController.startConversation(req, res);
});

app.get("/conversations", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get all conversations for the authenticated user'

  chatController.getConversations(req, res);
});

app.get(
  "/conversations/:conversationId/messages",
  authenticateJWT,
  (req, res) => {
    // #swagger.description = 'Get messages for a specific conversation by conversationId'
    // #swagger.parameters['conversationId'] = { description: 'ID of the conversation', in: 'path', required: true, type: 'string' }

    chatController.getMessages(req, res);
  }
);

app.post(
  "/conversations/:conversationId/messages",
  authenticateJWT,
  validateMessage,
  (req, res) => {
    // #swagger.description = 'Send a message in a specific conversation'
    // #swagger.parameters['conversationId'] = { description: 'ID of the conversation', in: 'path', required: true, type: 'string' }

    chatController.sendMessage(req, res);
  }
);

app.delete("/messages/:messageId", authenticateJWT, (req, res) => {
  // #swagger.description = 'Delete a message by its ID'
  // #swagger.parameters['messageId'] = { description: 'ID of the message to delete', in: 'path', required: true, type: 'string' }

  chatController.deleteMessage(req, res);
});

app.post("/smart-reply", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get smart reply suggestions based on the input message'

  chatController.getSmartReplies(req, res);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
