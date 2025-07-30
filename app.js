const dotenv = require("dotenv");
const express = require("express");
const sql = require("mssql");
const path = require("path");
const cookieParser = require("cookie-parser");
dotenv.config();
const jwt = require("jsonwebtoken");
const { upload, handleUpload } = require("./utils/fileUpload.js");

// Controllers
const userController = require("./controllers/userController.js");
const friendController = require("./controllers/friendController.js");
const matchController = require("./controllers/matchController.js");
const chatController = require("./controllers/chatController.js");

const caregiverController = require("./controllers/caregiverController.js");
const emergencyContactsController = require("./controllers/emergencyContactsController.js");
const healthMetricsController = require("./controllers/healthMetricsController.js");

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

// Swagger setup
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

// Middlewares
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
  validateFacilityIdParam,
} = require("./middlewares/bookmarkValidation.js");
const {
  validateReviewIdParam,
  validateReviewData,
  validateUpdateReviewData,
} = require("./middlewares/reviewValidation.js")
const { 
  validateReportData 
} = require("./middlewares/reportValidation.js");

const { validateMessage } = require("./middlewares/chatValidation.js");

const { compareSync } = require("bcrypt");

// Initialize the database connection
const app = express();
const port = process.env.PORT || 3000;

// Database connection configuration
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(protectSpecificRoutes);
app.use(redirectIfAuthenticated);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/me", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get the authenticated user\'s basic profile information'

  res.json({ username: req.user.email, id: req.user.id, uuid: req.user.uuid });
});
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Routes for user authentication and management
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

// Module 1: Medication & Appointment Manager
/**
 * @swagger
 * /api/medications/analytics:
 *   get:
 *     summary: Get medication adherence analytics
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Analytics period
 *       - in: query
 *         name: medicationId
 *         schema:
 *           type: integer
 *         description: Specific medication ID (optional)
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
app.get(
  "/api/medications/analytics",
  authenticateJWT,
  medicationController.getAdherenceAnalytics
);

/**
 * @swagger
 * /api/medications/missed:
 *   get:
 *     summary: Get missed medications with alert recommendations
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hoursThreshold
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Hours threshold for missed medications
 *     responses:
 *       200:
 *         description: Missed medications retrieved successfully
 */
app.get(
  "/api/medications/missed",
  authenticateJWT,
  medicationController.getMissedMedications
);

// caregiver management routes
/**
 * @swagger
 * /api/caregiver/patients:
 *   get:
 *     summary: Get all patients under caregiver's care
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients list retrieved successfully
 *       403:
 *         description: Access denied
 */
app.get(
  "/api/caregiver/patients",
  authenticateJWT,
  caregiverController.getCaregiverPatients
);

/**
 * @swagger
 * /api/caregiver/patients/{patientId}/dashboard:
 *   get:
 *     summary: Get real-time medication compliance dashboard for a patient
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient dashboard data retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Patient not found
 */
app.get(
  "/api/caregiver/patients/:patientId/dashboard",
  authenticateJWT,
  caregiverController.getCaregiverDashboard
);

/**
 * @swagger
 * /api/caregiver/patients/{patientId}/reports:
 *   get:
 *     summary: Get medication adherence reports for a patient
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly]
 *           default: weekly
 *         description: Report period
 *     responses:
 *       200:
 *         description: Adherence reports retrieved successfully
 */
app.get(
  "/api/caregiver/patients/:patientId/reports",
  authenticateJWT,
  caregiverController.getAdherenceReports
);

/**
 * @swagger
 * /api/caregiver/relationships:
 *   post:
 *     summary: Add a new caregiver relationship
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientEmail
 *               - relationship
 *             properties:
 *               patientEmail:
 *                 type: string
 *                 description: Patient's email address
 *               relationship:
 *                 type: string
 *                 enum: [spouse, child, parent, sibling, relative, friend, caregiver]
 *               accessLevel:
 *                 type: string
 *                 enum: [monitoring, alerts, full]
 *                 default: monitoring
 *     responses:
 *       201:
 *         description: Caregiver relationship added successfully
 *       404:
 *         description: Patient not found
 *       409:
 *         description: Relationship already exists
 */
app.post(
  "/api/caregiver/relationships",
  authenticateJWT,
  caregiverController.addCaregiverRelationship
);

/**
 * @swagger
 * /api/caregiver/alerts/missed-medication:
 *   post:
 *     summary: Send missed medication alert to emergency contacts
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *             properties:
 *               patientId:
 *                 type: integer
 *               medicationId:
 *                 type: integer
 *               alertLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 2
 *     responses:
 *       200:
 *         description: Alert sent successfully
 *       403:
 *         description: Access denied
 */
app.post(
  "/api/caregiver/alerts/missed-medication",
  authenticateJWT,
  caregiverController.sendMissedMedicationAlert
);

// emergency contacts routes
/**
 * @swagger
 * /api/emergency-contacts:
 *   get:
 *     summary: Get all emergency contacts for the user
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency contacts retrieved successfully
 *   post:
 *     summary: Create a new emergency contact
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactName
 *               - relationship
 *               - phoneNumber
 *             properties:
 *               contactName:
 *                 type: string
 *                 description: Full name of the emergency contact
 *               relationship:
 *                 type: string
 *                 enum: [spouse, child, parent, sibling, relative, friend, neighbor, caregiver, doctor]
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number with country code
 *               email:
 *                 type: string
 *                 format: email
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 1
 *               alertDelayHours:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Emergency contact created successfully
 *       400:
 *         description: Validation error
 */
app.get(
  "/api/emergency-contacts",
  authenticateJWT,
  emergencyContactsController.getUserEmergencyContacts
);

app.post(
  "/api/emergency-contacts",
  authenticateJWT,
  emergencyContactsController.createEmergencyContact
);

/**
 * @swagger
 * /api/emergency-contacts/{contactId}:
 *   put:
 *     summary: Update an emergency contact
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactName:
 *                 type: string
 *               relationship:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               priority:
 *                 type: integer
 *               alertDelayHours:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Emergency contact updated successfully
 *       404:
 *         description: Contact not found
 *   delete:
 *     summary: Delete an emergency contact
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Emergency contact deleted successfully
 *       404:
 *         description: Contact not found
 */
app.put(
  "/api/emergency-contacts/:contactId",
  authenticateJWT,
  emergencyContactsController.updateEmergencyContact
);

app.delete(
  "/api/emergency-contacts/:contactId",
  authenticateJWT,
  emergencyContactsController.deleteEmergencyContact
);

/**
 * @swagger
 * /api/emergency-contacts/{contactId}/test:
 *   post:
 *     summary: Send test alert to emergency contact
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test alert sent successfully
 *       404:
 *         description: Contact not found
 */
app.post(
  "/api/emergency-contacts/:contactId/test",
  authenticateJWT,
  emergencyContactsController.testEmergencyContact
);

/**
 * @swagger
 * /api/emergency-contacts/alerts/trigger:
 *   post:
 *     summary: Trigger emergency alerts for missed medications
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medicationId
 *             properties:
 *               medicationId:
 *                 type: integer
 *               alertLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 1
 *     responses:
 *       200:
 *         description: Emergency alerts triggered successfully
 *       404:
 *         description: Medication not found
 */
app.post(
  "/api/emergency-contacts/alerts/trigger",
  authenticateJWT,
  emergencyContactsController.triggerEmergencyAlert
);

/**
 * @swagger
 * /api/emergency-contacts/alerts/history:
 *   get:
 *     summary: Get emergency alert history
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of alerts to return
 *     responses:
 *       200:
 *         description: Alert history retrieved successfully
 */
app.get(
  "/api/emergency-contacts/alerts/history",
  authenticateJWT,
  emergencyContactsController.getEmergencyAlertHistory
);


// health metrics routes
/**
 * @swagger
 * /api/health/dashboard:
 *   get:
 *     summary: Get comprehensive health dashboard data
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health dashboard data retrieved successfully
 */
app.get(
  "/api/health/dashboard",
  authenticateJWT,
  healthMetricsController.getHealthDashboard
);

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Get health metrics history
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metricType
 *         schema:
 *           type: string
 *         description: Filter by metric type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of records
 *     responses:
 *       200:
 *         description: Health metrics retrieved successfully
 *   post:
 *     summary: Record a new health metric
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metricType
 *               - value
 *             properties:
 *               metricType:
 *                 type: string
 *                 enum: [blood_pressure, weight, blood_sugar, heart_rate, temperature]
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *               notes:
 *                 type: string
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Health metric recorded successfully
 *       400:
 *         description: Validation error
 */
app.get(
  "/api/health/metrics",
  authenticateJWT,
  healthMetricsController.getHealthMetrics
);

app.post(
  "/api/health/metrics",
  authenticateJWT,
  healthMetricsController.recordHealthMetric
);

/**
 * @swagger
 * /api/health/reports/adherence:
 *   get:
 *     summary: Generate medication adherence report
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, quarterly]
 *           default: monthly
 *         description: Report period
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *           default: json
 *         description: Report format
 *     responses:
 *       200:
 *         description: Adherence report generated successfully
 */
app.get(
  "/api/health/reports/adherence",
  authenticateJWT,
  healthMetricsController.generateAdherenceReport
);

/**
 * @swagger
 * /api/health/analytics/adherence:
 *   get:
 *     summary: Get medication adherence analytics and insights
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Adherence analytics retrieved successfully
 */
app.get(
  "/api/health/analytics/adherence",
  authenticateJWT,
  healthMetricsController.getAdherenceAnalytics
);

// static file routes
// serve static HTML files for the medication manager module
app.get("/caregiver-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/medicationManager/caregiver-dashboard.html"));
});

app.get("/emergency-contacts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/medicationManager/emergency-contacts.html"));
});

app.get("/health-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/medicationManager/health-dashboard.html"));
});

// Module 2: Community Events
app.get("/groups/joined", authenticateJWT, (req, res) => {
  // #swagger.description = 'List all groups the authenticated user has joined'
  eventsController.getJoinedGroups(req, res);
});

app.get("/groups/available", authenticateJWT, (req, res) => {
  // #swagger.description = 'List all public/available groups the user can join'
  eventsController.getAvailableGroups(req, res);
});

app.post("/groups", authenticateJWT, validateCreateGroup, (req, res) => {
  // #swagger.description = 'Create a new group'
  // #swagger.parameters['body'] = { in: 'body', schema: { $ref: '#/components/schemas/CreateGroup' } }
  eventsController.createGroup(req, res);
});

app.post("/groups/join", authenticateJWT, validateGroupId, (req, res) => {
  // #swagger.description = 'Join an existing group by its ID'
  // #swagger.parameters['body'] = { in: 'body', schema: { type: 'object', properties: { groupId: { type: 'integer' } } } }
  eventsController.joinGroup(req, res);
});

app.delete("/groups/leave", authenticateJWT, validateGroupId, (req, res) => {
  // #swagger.description = 'Leave a group'
  // #swagger.parameters['body'] = { in: 'body', schema: { type: 'object', properties: { groupId: { type: 'integer' } } } }
  eventsController.leaveGroup(req, res);
});

app.get("/groups/:groupId/invite-token", authenticateJWT, (req, res) => {
  // #swagger.description = 'Retrieve the invite token for a specific group'
  // #swagger.parameters['groupId'] = { in: 'path', required: true, type: 'integer', description: 'ID of the group' }
  eventsController.getGroupInviteToken(req, res);
});

app.get("/groups/token/:token", authenticateJWT, (req, res) => {
  // #swagger.description = 'Find a group by its invite token'
  // #swagger.parameters['token'] = { in: 'path', required: true, type: 'string', description: 'Invite token' }
  eventsController.findGroupByToken(req, res);
});

app.post("/groups/join-by-token", authenticateJWT, (req, res) => {
  // #swagger.description = 'Join a group using its invite token'
  // #swagger.parameters['body'] = { in: 'body', schema: { type: 'object', properties: { token: { type: 'string' } } } }
  eventsController.joinGroupByToken(req, res);
});

app.get("/announcements", authenticateJWT, (req, res) => {
  // #swagger.description = 'List announcements for a specified group'
  // #swagger.parameters['groupId'] = { in: 'query', required: true, type: 'integer', description: 'ID of the group' }
  announcementsController.getAnnouncements(req, res);
});

app.post(
  "/announcements",
  authenticateJWT,
  validateCreateAnnouncement,
  (req, res) => {
    // #swagger.description = 'Create a new announcement in a group'
    // #swagger.parameters['body'] = { in: 'body', schema: { $ref: '#/components/schemas/CreateAnnouncement' } }
    announcementsController.createAnnouncement(req, res);
  }
);

app.get("/announcements/:id/comments", authenticateJWT, (req, res) => {
  // #swagger.description = 'Retrieve all comments for a given announcement'
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Announcement ID' }
  announcementsController.getComments(req, res);
});

app.post(
  "/announcements/:id/comments",
  authenticateJWT,
  validatePostComment,
  (req, res) => {
    // #swagger.description = 'Post a comment on an announcement'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Announcement ID' }
    // #swagger.parameters['body'] = { in: 'body', schema: { $ref: '#/components/schemas/PostComment' } }
    announcementsController.postComment(req, res);
  }
);

app.delete(
  "/announcements/:annId/comments/:id",
  authenticateJWT,
  validateDeleteComment,
  (req, res) => {
    // #swagger.description = 'Delete a specific comment on an announcement'
    // #swagger.parameters['annId'] = { in: 'path', required: true, type: 'integer', description: 'Announcement ID' }
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Comment ID' }
    announcementsController.deleteComment(req, res);
  }
);

app.post("/meetings", authenticateJWT, (req, res) => {
  // #swagger.description = 'Create a new meeting room for a group'
  // #swagger.parameters['body'] = { in: 'body', schema: { $ref: '#/components/schemas/CreateMeeting' } }
  meetingsController.createMeeting(req, res);
});

app.get("/meetings/:meetingId/data", authenticateJWT, (req, res) => {
  // #swagger.description = 'Get WebRTC signaling data for joining a meeting'
  // #swagger.parameters['meetingId'] = { in: 'path', required: true, type: 'integer', description: 'Meeting ID' }
  meetingsController.getMeetingData(req, res);
});

app.get("/meetings/join", authenticateJWT, (req, res) => {
  // #swagger.description = 'Join a meeting room by its name'
  meetingsController.joinByName(req, res);
});

app.put(
  "/announcements/:id",
  authenticateJWT,
  validateEditAnnouncement,
  (req, res) => {
    // #swagger.description = 'Edit an existing announcement'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Announcement ID' }
    // #swagger.parameters['body'] = { in: 'body', schema: { $ref: '#/components/schemas/EditAnnouncement' } }
    announcementsController.editAnnouncement(req, res);
  }
);

app.delete("/announcements/:id", authenticateJWT, (req, res) => {
  // #swagger.description = 'Delete an announcement'
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Announcement ID' }
  announcementsController.deleteAnnouncement(req, res);
});

// Module 3: Transport Navigator
app.get(
  "/facilities/nearby",
  authenticateJWT,
  validateNearbyFacilities,
  (req, res) => {
    // #swagger.description = 'Get nearby facilities based on user location'
    // #swagger.parameters['lat'] = { in: 'query', required: true, type: 'number', description: 'Latitude coordinate of user location' }
    // #swagger.parameters['lng'] = { in: 'query', required: true, type: 'number', description: 'Longitude coordinate of user location' }
    // #swagger.parameters['rad'] = { in: 'query', required: false, type: 'number', description: 'Search radius in meters' }
    facilitiesController.getNearbyFacilities(req, res);
  }
);

app.get(
  "/facilities/id/:id",
  authenticateJWT,
  validateFacilityId,
  (req, res) => {
    // #swagger.description = 'Get facility details of a facility by its facilityId'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'ID of the facility' }
    facilitiesController.getFacilityById(req, res);
  }
);

app.get(
  "/facilities/type/:type",
  authenticateJWT,
  validateFacilityType,
  (req, res) => {
    // #swagger.description = 'Get all facilities of a specific type (Polyclinic, Hospital, Community Center, Park)'
    // #swagger.parameters['type'] = { in: 'path', required: true, type: 'string', description: 'Type of facility', enum: ['Polyclinic', 'Hospital', 'Community Center', 'Park'] }
    facilitiesController.getFacilitiesByType(req, res);
  }
);

app.get("/facilities", 
  authenticateJWT, 
  (req, res) => {
    // #swagger.description = 'Get all available facilities'
    facilitiesController.getFacilities(req, res);
  }
);

app.get(
  "/api/geocode",
  authenticateJWT,
  validateLocationAccess,
  (req, res) => {
    // #swagger.description = 'Convert latitude and longitude coordinates to a readable address using reverse geocoding'
    // #swagger.parameters['lat'] = { in: 'query', required: true, type: 'number', description: 'Latitude coordinate' }
    // #swagger.parameters['lng'] = { in: 'query', required: true, type: 'number', description: 'Longitude coordinate' }
    facilitiesController.handleLocationAccess(req, res);
  }
);

app.post("/api/geocode", 
  authenticateJWT, 
  (req, res) => {
    // #swagger.description = 'Convert an address to latitude and longitude coordinates using forward geocoding'
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { type: 'object', properties: { address: { type: 'string', description: 'Address to convert to coordinates' } } } }
    navigationController.geocodeAddress(req, res);
  }
);

app.get(
  "/bookmarks/:facilityId",
  authenticateJWT,
  validateFacilityIdParam,
  (req, res) => {
    // #swagger.description = 'Check if a specific facility is bookmarked by the authenticated user'
    // #swagger.parameters['facilityId'] = { in: 'path', required: true, type: 'integer', description: 'ID of the facility to check bookmark status for' }
    bookmarkController.checkIfBookmarked(req, res);
  }
);

app.get(
  "/bookmarks",
  authenticateJWT,
  (req, res) => {
    // #swagger.description = 'Get all bookmarked facilities for the authenticated user'
    bookmarkController.getBookmarkedFacilities(req, res);
  }
);

app.post(
  "/bookmarks",
  authenticateJWT,
  validateBookmarkData,
  (req, res) => {
    // #swagger.description = 'Create a new bookmark for a facility'
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { type: 'object', properties: { facilityId: { type: 'integer', description: 'ID of the facility to bookmark' }, locationName: { type: 'string', description: 'Name of the selected facility', maxLength: 100 }, note: { type: 'string', description: 'Personal notes for the facility', maxLength: 500 } } } }
    bookmarkController.saveBookmark(req, res);
  }
);

app.put(
  "/bookmarks/:bookmarkId",
  authenticateJWT,
  validateBookmarkId,
  validateBookmarkData,
  (req, res) => {
    // #swagger.description = 'Update an existing bookmark with new notes'
    // #swagger.parameters['bookmarkId'] = { in: 'path', required: true, type: 'integer', description: 'ID of the bookmark to update' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { type: 'object', properties: { facilityId: { type: 'integer', description: 'ID of the facility' }, locationName: { type: 'string', description: 'Name of the bookmark', maxLength: 100 }, note: { type: 'string', description: 'Updated personal notes', maxLength: 500 } } } }
    bookmarkController.updateBookmark(req, res);
  }
);

app.delete(
  "/bookmarks/:bookmarkId",
  authenticateJWT,
  validateBookmarkId,
  (req, res) => {
    // #swagger.description = 'Delete a specific bookmark by its ID'
    // #swagger.parameters['bookmarkId'] = { in: 'path', required: true, type: 'integer', description: 'ID of the bookmark to delete' }
    bookmarkController.deleteBookmark(req, res);
  }
);

app.get(
  "/reviews/:facilityId",
  authenticateJWT,
  validateFacilityIdParam,
  (req, res) => {
    // #swagger.description = 'Get all reviews for a specific facility and sort them optionally'
    // #swagger.parameters['facilityId'] = { in: 'path', required: true, type: 'integer', description: 'ID of the facility to get reviews for' }
    // #swagger.parameters['sort'] = { in: 'query', required: false, type: 'string', description: 'Sort order for reviews', enum: ['newest', 'oldest', 'highest', 'lowest'] }
    reviewController.getReviewsByFacilityId(req, res);
  }
);

app.put(
  "/reviews/:id",
  authenticateJWT,
  validateReviewIdParam,
  validateUpdateReviewData,
  (req, res) => {
    // #swagger.description = 'Update an existing review by the authenticated user'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'ID of the review to update' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { type: 'object', properties: { rating: { type: 'integer', minimum: 1, maximum: 5, description: 'Updated accessibility rating' }, comment: { type: 'string', maxLength: 500, description: 'Updated review comment' } } } }
    reviewController.updateReview(req, res);
  }
);

app.delete(
  "/reviews/:id",
  authenticateJWT,
  validateReviewIdParam,
  (req, res) => {
    // #swagger.description = 'Delete a review written by the authenticated user by its ID'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'ID of the review to delete' }
    reviewController.deleteReview(req, res);
  }
);

app.post(
  "/reviews",
  authenticateJWT,
  validateReviewData,
  (req, res) => {
    // #swagger.description = 'Create a new review for a facility'
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { type: 'object', properties: { facilityId: { type: 'integer', description: 'ID of the facility being reviewed' }, rating: { type: 'integer', minimum: 1, maximum: 5, description: 'Accessibility rating from 1 to 5' }, comment: { type: 'string', maxLength: 500, description: 'Review comment' } } } }
    reviewController.createReview(req, res);
  }
);

app.post(
  "/reports",
  authenticateJWT,
  validateReportData,
  (req, res) => {
    // #swagger.description = 'Report an inappropriate review by another user for moderation'
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { type: 'object', properties: { reviewId: { type: 'integer', description: 'ID of the review being reported' }, reason: { type: 'string', description: 'Reason for reporting the review' } } } }
    reportController.createReport(req, res);
  }
);

app.get(
  "/api/google-maps-config",
  authenticateJWT,
  (req, res) => {
    // #swagger.description = 'Get Google Maps API configuration for frontend map integration'
    navigationController.getGoogleMapsConfig(req, res);
  }
);

app.post(
  "/api/directions/:facilityId",
  authenticateJWT,
  (req, res) => {
    // #swagger.description = 'Get navigation directions from origin to a specific facility using Google Maps'
    // #swagger.parameters['facilityId'] = { in: 'path', required: true, type: 'integer', description: 'ID of the destination facility' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { type: 'object', properties: { origin: { type: 'string', description: 'Starting location (address or coordinates)' }, travelMode: { type: 'string', enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'], description: 'Mode of transportation' } } } }
    navigationController.getFacilityDirections(req, res);
  }
);

// Module 4: Senior fitness coach

app.get("/exercises/goals", authenticateJWT, (req, res) => {
  goalController.getGoals(req, res);
  // #swagger.description = 'Get the user exercise goals'
});

app.get("/exercises/stats", authenticateJWT, (req, res) => {
  exerciseController.getUserStats(req, res);
  // #swagger.description = 'Get the user exercise statistics (number of exercise and goal completed)'
});

app.get("/exercises/incompleted-goals", authenticateJWT, (req, res) => {
  goalController.getIncompletedGoals(req, res);
  // #swagger.description = 'Get the user incompleted exercise goals'
});

app.get("/exercises", authenticateJWT, (req, res) => {
  exerciseController.getExercises(req, res);
  // #swagger.description = 'Get exercises from database'
});

app.get("/exercises/steps/:exerciseId", authenticateJWT, (req, res) => {
  exerciseController.getSteps(req, res);
  // #swagger.description = 'Get exercise step from database'
  // #swagger.parameters['exerciseId"] = { description: 'ID of the exercise the user wants to view the steps', in: 'path', required: true, type: 'string' }
});

app.get("/exercises/preferences", authenticateJWT, (req, res) => {
  exerciseController.getExercisePreferences(req, res);
  // #swagger.description = 'Get user exercise preferences'
});

app.put("/exercises/preferences", authenticateJWT, (req, res) => {
  exerciseController.updateExercisePreferences(req, res);
  /*
   #swagger.description = 'Updates user exercise preferences'
   #swagger.parameters['body'] = {
     in: 'body',
      required: true,
     schema: {
       $categoryIds: [1, 2, 3]
      }
    }
  */
});

app.put("/exercises/reset", authenticateJWT, (req, res) => {
  goalController.resetGoal(req, res);
  // #swagger.description = 'Resets exercise goals user has completed the day before'
});

app.post("/exercises/personalisation", authenticateJWT, (req, res) => {
  exerciseController.personalisation(req, res);
  /*
   #swagger.description = 'Saves user exercise preferences'
   #swagger.parameters['body'] = {
     in: 'body',
     required: true,
     schema: {
       $categoryIds: [1, 2, 3]
     }
   }
  */
});

app.put("/exercises/goals", authenticateJWT, (req, res) => {
  goalController.updateGoal(req, res);
  /*
   #swagger.description = 'Updates user exercise goal to completed'
   #swagger.parameters['body'] = {
     in: 'body',
     required: true,
     schema: {
       $goalIds: [1, 2, 3]
     }
   }
  */
});

app.post("/exercises/goals", authenticateJWT, validateGoal, (req, res) => {
  goalController.createGoal(req, res);
  /*
   #swagger.description = 'Creates user exercise goal'
   #swagger.parameters['body'] = {
     in: 'body',
     required: true,
     schema: {
       $name: "Name of goal",
       $description: "Description of goal"
     }
   }
  */
});

app.delete("/exercises/goals/:goalId", authenticateJWT, (req, res) => {
  goalController.deleteGoal(req, res);
  // #swagger.description = 'Delete user exercise goal'
  // #swagger.parameters['goalId'] = { description: 'ID of the goal the user is trying to delete', in: 'path', required: true, type: 'string' }
});

app.delete("/exercises/preferences", authenticateJWT, (req, res) => {
  exerciseController.deleteExercisePreference(req, res);
  // #swagger.description = 'Delete user exercises preferences'
});

app.post("/exercises/weather", authenticateJWT, (req, res) => {
  weatherController.getWeather(req, res);
  /*
   #swagger.description = 'Get weather data from external api'
   #swagger.parameters['body'] = {
     in: 'body',
     required: true,
     schema: {
       $lat: "latitude of user location",
       $lon: "Longitude of user location"
     }
   }
  */
});

app.post("/exercises/logExercise/:exerciseID", authenticateJWT, (req, res) => {
  exerciseController.logExerciseCompletion(req, res);
  // #swagger.description = 'Log completed exercise for user'
  // #swagger.parameters['exerciseID'] = { description: 'ID of the exercise the user just completed', in: 'path', required: true, type: 'string' }
});

app.post("/exercises/logGoals", authenticateJWT, (req, res) => {
  goalController.logGoalCompletion(req, res);
  /*
   #swagger.description = 'Log completed exercise for user'
   #swagger.parameters['body'] = {
     in: 'body',
     required: true,
     schema: {
       $goalIds: [1, 2]
     }
   }
  */
});

// Module 5: Messaging and Buddy System
// Routes for friend system
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

app.get("/invite", (req, res) => {
  // #swagger.description = 'Serve the invite HTML page'

  res.sendFile(path.join(__dirname, "public/invite.html"));
});

// Routes for profile matching system
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

// Chat system routes
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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
