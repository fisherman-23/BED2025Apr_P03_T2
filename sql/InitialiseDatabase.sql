-- Drop tables if they exist
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    DROP TABLE dbo.Users;

IF OBJECT_ID('dbo.Medications', 'U') IS NOT NULL
    DROP TABLE dbo.Medications;

IF OBJECT_ID('dbo.MedicationTracking', 'U') IS NOT NULL
    DROP TABLE dbo.MedicationTracking;

IF OBJECT_ID('dbo.Doctors', 'U') IS NOT NULL
    DROP TABLE dbo.Doctors; 

IF OBJECT_ID('dbo.Appointments', 'U') IS NOT NULL
    DROP TABLE dbo.Appointments;

IF OBJECT_ID('dbo.EmergencyContacts', 'U') IS NOT NULL
    DROP TABLE dbo.EmergencyContacts;

IF OBJECT_ID('dbo.HealthData', 'U') IS NOT NULL
    DROP TABLE dbo.HealthData;

IF OBJECT_ID('dbo.FriendRequests', 'U') IS NOT NULL
    DROP TABLE dbo.FriendRequests;

IF OBJECT_ID('dbo.Friends', 'U') IS NOT NULL
    DROP TABLE dbo.Friends;

IF OBJECT_ID('dbo.MatchProfile', 'U') IS NOT NULL
    DROP TABLE dbo.MatchProfile;

IF OBJECT_ID('dbo.MatchInteractions', 'U') IS NOT NULL
    DROP TABLE dbo.MatchInteractions;

IF OBJECT_ID('dbo.Conversations', 'U') IS NOT NULL
    DROP TABLE dbo.Conversations;
    
IF OBJECT_ID('dbo.Messages', 'U') IS NOT NULL
    DROP TABLE dbo.Messages;


CREATE TABLE Users (
    ID INT PRIMARY KEY IDENTITY(1,1),
    PublicUUID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL,
    Name VARCHAR(30) NOT NULL,
	  AboutMe VARCHAR(200) NULL,
    PhoneNumber CHAR(8) NOT NULL,
    DateOfBirth DATE NOT NULL,
    ProfilePicture VARCHAR(500) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

CREATE UNIQUE INDEX idx_users_publicuuid ON Users(PublicUUID);


-- Module 1: Medication & appointment manager
-- Drop views and procedures first
IF OBJECT_ID('dbo.vw_CaregiverDashboard', 'V') IS NOT NULL
    DROP VIEW dbo.vw_CaregiverDashboard;

IF OBJECT_ID('dbo.vw_MedicationAdherence', 'V') IS NOT NULL
    DROP VIEW dbo.vw_MedicationAdherence;

IF OBJECT_ID('dbo.sp_GetMissedMedications', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetMissedMedications;

IF OBJECT_ID('dbo.sp_GetPatientAdherence', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetPatientAdherence;

IF OBJECT_ID('dbo.tr_MedicationLogs_Audit', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_MedicationLogs_Audit;

-- Drop tables in correct order due to foreign key constraints
IF OBJECT_ID('dbo.EmergencyAlerts', 'U') IS NOT NULL
    DROP TABLE dbo.EmergencyAlerts;

IF OBJECT_ID('dbo.CaregiverAlerts', 'U') IS NOT NULL
    DROP TABLE dbo.CaregiverAlerts;

IF OBJECT_ID('dbo.HealthMetrics', 'U') IS NOT NULL
    DROP TABLE dbo.HealthMetrics;

IF OBJECT_ID('dbo.AdherenceReports', 'U') IS NOT NULL
    DROP TABLE dbo.AdherenceReports;

IF OBJECT_ID('dbo.MedicationLogs', 'U') IS NOT NULL
    DROP TABLE dbo.MedicationLogs;

IF OBJECT_ID('dbo.DrugConflicts', 'U') IS NOT NULL
    DROP TABLE dbo.DrugConflicts;

IF OBJECT_ID('dbo.DoctorAvailability', 'U') IS NOT NULL
    DROP TABLE dbo.DoctorAvailability;

IF OBJECT_ID('dbo.Appointments', 'U') IS NOT NULL
    DROP TABLE dbo.Appointments;

IF OBJECT_ID('dbo.CaregiverRelationships', 'U') IS NOT NULL
    DROP TABLE dbo.CaregiverRelationships;

IF OBJECT_ID('dbo.EmergencyContacts', 'U') IS NOT NULL
    DROP TABLE dbo.EmergencyContacts;

IF OBJECT_ID('dbo.Medications', 'U') IS NOT NULL
    DROP TABLE dbo.Medications;

IF OBJECT_ID('dbo.Doctors', 'U') IS NOT NULL
    DROP TABLE dbo.Doctors; 

IF OBJECT_ID('dbo.DrugInteractions', 'U') IS NOT NULL
    DROP TABLE dbo.DrugInteractions;

-- Check if Users table exists, if not create basic structure
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    CREATE TABLE Users (
        ID INT PRIMARY KEY IDENTITY(1,1),
        PublicUUID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        Email VARCHAR(100) UNIQUE NOT NULL,
        Password VARCHAR(100) NOT NULL,
        Name VARCHAR(30) NOT NULL,
        AboutMe VARCHAR(200) NULL,
        PhoneNumber CHAR(8) NOT NULL,
        DateOfBirth DATE NOT NULL,
        ProfilePicture VARCHAR(500) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
    
    CREATE UNIQUE INDEX idx_users_publicuuid ON Users(PublicUUID);
END

-- Add firstName and lastName columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'firstName')
    ALTER TABLE Users ADD firstName VARCHAR(30) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'lastName')
    ALTER TABLE Users ADD lastName VARCHAR(30) NULL;

-- Create Medications Table with ALL required columns
CREATE TABLE Medications (
    medicationId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    medicationName AS name, -- Computed column for compatibility
    dosage NVARCHAR(100) NOT NULL,
    frequency NVARCHAR(50) NOT NULL, -- 'Once daily', 'Twice daily', etc.
    timing TIME NOT NULL, -- Time to take medication
    startDate DATE NOT NULL,
    endDate DATE NULL, -- NULL means ongoing
    instructions NVARCHAR(MAX) NULL,
    prescribedBy NVARCHAR(255) NOT NULL,
    active BIT DEFAULT 1, -- 1 = active, 0 = discontinued
    qrCode NVARCHAR(255) NULL,
    category NVARCHAR(100) NULL, -- Category field
    reminderEnabled BIT NOT NULL DEFAULT 1, -- Reminder settings
    reminderTimes NVARCHAR(200) NULL, -- JSON array of reminder times
    sideEffects NVARCHAR(500) NULL, -- Side effects
    foodInstructions NVARCHAR(200) NULL, -- with_food, without_food, empty_stomach
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(ID)
);
GO

-- Create Doctors Table
CREATE TABLE Doctors (
    doctorId INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    specialty NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    location NVARCHAR(255) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 4.5,
    availability_notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Create Appointments Table
CREATE TABLE Appointments (
    appointmentId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    doctorId INT NOT NULL,
    appointmentDate DATETIME2 NOT NULL,
    duration INT DEFAULT 30,
    reason NVARCHAR(500) NOT NULL,
    status NVARCHAR(50) DEFAULT 'scheduled',
    notes NVARCHAR(MAX) NULL,
    reminderSent BIT DEFAULT 0,
    followUpNeeded BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(ID),
    FOREIGN KEY (doctorId) REFERENCES Doctors(doctorId)
);
GO

-- Create MedicationLogs Table with column names
CREATE TABLE MedicationLogs (
    logId INT IDENTITY(1,1) PRIMARY KEY,
    medicationId INT NOT NULL,
    medication_id AS medicationId, -- Computed column for backward compatibility
    scheduledTime DATETIME2 NOT NULL,
    taken BIT DEFAULT 0, -- 0 = not taken, 1 = taken
    -- Keep both taken_at and takenAt for compatibility
    taken_at DATETIME2 NULL,
    takenAt DATETIME2 NULL,
    missed BIT DEFAULT 0, -- 0 = not missed, 1 = missed
    notes NVARCHAR(255) NULL,
    reminderSent BIT NOT NULL DEFAULT 0, -- Reminder tracking
    reminderSentAt DATETIME2 NULL, -- When reminder was sent
    created_at DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 NULL, -- Update tracking
    FOREIGN KEY (medicationId) REFERENCES Medications(medicationId)
);
GO

-- Create DrugInteractions Table
CREATE TABLE DrugInteractions (
    interactionId INT IDENTITY(1,1) PRIMARY KEY,
    drug1 NVARCHAR(255) NOT NULL,
    drug2 NVARCHAR(255) NOT NULL,
    severity NVARCHAR(50) NOT NULL, -- 'mild', 'moderate', 'severe'
    description NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Create DrugConflicts Table
CREATE TABLE DrugConflicts (
    conflictId INT IDENTITY(1,1) PRIMARY KEY,
    medicationId INT NOT NULL,
    conflicting_medication NVARCHAR(255) NOT NULL,
    severity NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    resolved BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (medicationId) REFERENCES Medications(medicationId)
);
GO

-- Create DoctorAvailability Table
CREATE TABLE DoctorAvailability (
    availabilityId INT IDENTITY(1,1) PRIMARY KEY,
    doctorId INT NOT NULL,
    day_of_week NVARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (doctorId) REFERENCES Doctors(doctorId)
);
GO

-- Create CaregiverRelationships table
CREATE TABLE CaregiverRelationships (
    relationshipId INT IDENTITY(1,1) PRIMARY KEY,
    caregiverId INT NOT NULL,
    patientId INT NOT NULL,
    relationship NVARCHAR(50) NOT NULL, -- spouse, child, parent, etc.
    accessLevel NVARCHAR(20) NOT NULL DEFAULT 'monitoring', -- monitoring, alerts, full
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NULL,
    FOREIGN KEY (caregiverId) REFERENCES Users(ID) ON DELETE CASCADE,
    FOREIGN KEY (patientId) REFERENCES Users(ID) ON DELETE NO ACTION,
    UNIQUE(caregiverId, patientId)
);

-- Create EmergencyContacts table
CREATE TABLE EmergencyContacts (
    contactId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    contactName NVARCHAR(100) NOT NULL,
    relationship NVARCHAR(50) NOT NULL, -- spouse, child, parent, friend, etc.
    phoneNumber NVARCHAR(20) NOT NULL,
    email NVARCHAR(255) NULL,
    priority INT NOT NULL DEFAULT 1, -- 1 = primary, 2 = secondary, etc.
    isActive BIT NOT NULL DEFAULT 1,
    alertDelayHours INT NOT NULL DEFAULT 0, -- Hours to wait before alerting this contact
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NULL,
    FOREIGN KEY (userId) REFERENCES Users(ID) ON DELETE CASCADE
);

-- Create CaregiverAlerts table
CREATE TABLE CaregiverAlerts (
    alertId INT IDENTITY(1,1) PRIMARY KEY,
    caregiverId INT NOT NULL,
    patientId INT NOT NULL,
    medicationId INT NULL,
    alertType NVARCHAR(50) NOT NULL, -- medication_missed, medication_taken, emergency, etc.
    alertMessage NVARCHAR(500) NOT NULL,
    severity NVARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, critical
    isRead BIT NOT NULL DEFAULT 0,
    sentAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    readAt DATETIME2 NULL,
    FOREIGN KEY (caregiverId) REFERENCES Users(ID) ON DELETE CASCADE,
    FOREIGN KEY (patientId) REFERENCES Users(ID) ON DELETE NO ACTION,
    FOREIGN KEY (medicationId) REFERENCES Medications(medicationId) ON DELETE SET NULL
);

-- Create EmergencyAlerts table
CREATE TABLE EmergencyAlerts (
    alertId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    contactId INT NOT NULL,
    alertType NVARCHAR(50) NOT NULL, -- missed_medication, emergency_button, health_concern
    alertMessage NVARCHAR(500) NOT NULL,
    sentVia NVARCHAR(20) NOT NULL, -- sms, email, call
    deliveryStatus NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed
    sentAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    deliveredAt DATETIME2 NULL,
    FOREIGN KEY (userId) REFERENCES Users(ID) ON DELETE CASCADE,
    FOREIGN KEY (contactId) REFERENCES EmergencyContacts(contactId) ON DELETE NO ACTION
);

-- Create HealthMetrics table
CREATE TABLE HealthMetrics (
    metricId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    metricType NVARCHAR(50) NOT NULL, -- weight, blood_pressure, heart_rate, temperature, etc.
    value DECIMAL(10,2) NOT NULL,
    unit NVARCHAR(20) NULL, -- mmHg, kg, mg/dL, bpm, °C, etc.
    notes NVARCHAR(200) NULL,
    recordedAt DATETIME2 NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(ID) ON DELETE CASCADE
);

-- Create AdherenceReports table
CREATE TABLE AdherenceReports (
    reportId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    reportType NVARCHAR(20) NOT NULL, -- daily, weekly, monthly
    reportData NVARCHAR(MAX) NOT NULL, -- JSON data
    generatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    expiresAt DATETIME2 NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users(ID) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX IX_Medications_UserId ON Medications(userId, active);
CREATE NONCLUSTERED INDEX IX_MedicationLogs_MedicationId ON MedicationLogs(medicationId, scheduledTime);
CREATE NONCLUSTERED INDEX IX_MedicationLogs_Scheduling ON MedicationLogs(scheduledTime, taken) WHERE taken = 0;
CREATE NONCLUSTERED INDEX IX_CaregiverRelations_Caregiver ON CaregiverRelationships(caregiverId);
CREATE NONCLUSTERED INDEX IX_CaregiverRelations_Patient ON CaregiverRelationships(patientId);
CREATE NONCLUSTERED INDEX IX_CaregiverAlerts_Caregiver ON CaregiverAlerts(caregiverId, sentAt DESC);

-- Insert Sample Doctors Data
INSERT INTO Doctors (name, specialty, phone, email, location, address, rating) VALUES
('Dr. Sarah Lim', 'General Practitioner', '+65 6123 4567', 'sarah.lim@clinic.com', 'Buona Vista', '123 North Buona Vista Road, Singapore 138888', 4.8),
('Dr. Michael Chen', 'Cardiologist', '+65 6234 5678', 'michael.chen@heart.com', 'Jurong East', '456 Jurong Gateway Road, Singapore 608532', 4.9),
('Dr. Priya Patel', 'Endocrinologist', '+65 6345 6789', 'priya.patel@diabetes.com', 'Tampines', '789 Tampines Central, Singapore 529509', 4.7),
('Dr. James Wong', 'Geriatrician', '+65 6456 7890', 'james.wong@senior.com', 'Clementi', '321 Clementi Avenue, Singapore 129588', 4.6);

-- Insert Sample Drug Interactions
INSERT INTO DrugInteractions (drug1, drug2, severity, description) VALUES
('Warfarin', 'Aspirin', 'severe', 'Increased risk of bleeding when taken together'),
('Metformin', 'Alcohol', 'moderate', 'Alcohol may increase risk of lactic acidosis'),
('Lisinopril', 'Potassium Supplements', 'moderate', 'May cause dangerously high potassium levels');

-- Create Views with column references
GO
CREATE VIEW vw_MedicationAdherence AS
SELECT 
    m.userId,
    m.medicationId,
    m.medicationName,
    m.dosage,
    m.frequency,
    m.category,
    COUNT(ml.logId) as totalDoses,
    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
    CASE 
        WHEN COUNT(ml.logId) > 0 
        THEN ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(ml.logId), 2)
        ELSE 100
    END as adherenceRate,
    MAX(ml.scheduledTime) as lastScheduledTime,
    MAX(CASE WHEN ml.taken = 1 THEN ml.takenAt END) as lastTakenTime
FROM Medications m
LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
    AND ml.scheduledTime >= DATEADD(MONTH, -1, GETDATE())
WHERE m.active = 1
GROUP BY m.userId, m.medicationId, m.medicationName, m.dosage, m.frequency, m.category;
GO

-- Caregiver Dashboard View
CREATE OR ALTER VIEW vw_CaregiverDashboard AS
SELECT 
    cr.caregiverId,
    cr.patientId,
    COALESCE(NULLIF(u.firstName, '') + ' ' + NULLIF(u.lastName, ''), u.Name) as patientName,
    u.Email as patientEmail,
    cr.relationship,
    cr.accessLevel,
    COUNT(DISTINCT m.medicationId) as activeMedications,
    AVG(ma.adherenceRate) as avgAdherence,
    COUNT(CASE WHEN ma.adherenceRate < 80 THEN 1 END) as concerningMedications,
    MAX(ca.sentAt) as lastAlertSent
FROM CaregiverRelationships cr
JOIN Users u ON cr.patientId = u.ID
LEFT JOIN Medications m ON cr.patientId = m.userId AND m.active = 1
LEFT JOIN vw_MedicationAdherence ma ON m.medicationId = ma.medicationId
LEFT JOIN CaregiverAlerts ca ON cr.caregiverId = ca.caregiverId AND cr.patientId = ca.patientId
GROUP BY cr.caregiverId, cr.patientId, u.firstName, u.lastName, u.Name, u.Email, cr.relationship, cr.accessLevel;
GO

-- Create Stored Procedures
CREATE OR ALTER PROCEDURE sp_GetPatientAdherence
    @PatientId INT,
    @Days INT = 30
AS
BEGIN
    SELECT 
        m.medicationName,
        m.dosage,
        m.frequency,
        COUNT(ml.logId) as totalDoses,
        COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
        ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(ml.logId), 0), 2) as adherenceRate
    FROM Medications m
    LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
        AND ml.scheduledTime >= DATEADD(DAY, -@Days, GETDATE())
    WHERE m.userId = @PatientId AND m.active = 1
    GROUP BY m.medicationId, m.medicationName, m.dosage, m.frequency
    ORDER BY adherenceRate ASC;
END;
GO

-- Missed Medications Procedure
CREATE OR ALTER PROCEDURE sp_GetMissedMedications
    @UserId INT,
    @HoursThreshold INT = 2
AS
BEGIN
    SELECT 
        ml.logId,
        ml.medicationId,
        ml.scheduledTime,
        m.medicationName,
        m.dosage,
        DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) as hoursOverdue
    FROM MedicationLogs ml
    JOIN Medications m ON ml.medicationId = m.medicationId
    WHERE m.userId = @UserId 
    AND m.active = 1
    AND ml.taken = 0
    AND ml.scheduledTime < DATEADD(HOUR, -@HoursThreshold, GETDATE())
    ORDER BY ml.scheduledTime ASC;
END;
GO

-- Audit Trigger
CREATE OR ALTER TRIGGER tr_MedicationLogs_Audit
ON MedicationLogs
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Log when medications are marked as taken
    IF UPDATE(taken)
    BEGIN
        INSERT INTO CaregiverAlerts (caregiverId, patientId, medicationId, alertType, alertMessage)
        SELECT DISTINCT
            cr.caregiverId,
            m.userId,
            i.medicationId,
            'medication_taken',
            'Patient has taken ' + m.medicationName + ' (' + m.dosage + ') at ' + FORMAT(COALESCE(i.takenAt, i.taken_at, GETDATE()), 'yyyy-MM-dd HH:mm')
        FROM inserted i
        JOIN deleted d ON i.logId = d.logId
        JOIN Medications m ON i.medicationId = m.medicationId
        JOIN CaregiverRelationships cr ON m.userId = cr.patientId
        WHERE i.taken = 1 AND d.taken = 0
        AND cr.accessLevel IN ('alerts', 'full');
    END;
END;
GO

-- Show what was created
PRINT 'Database initialization completed successfully for MODULE 1: Medication & Appointment Manager';
PRINT 'Tables created: Medications, Doctors, Appointments, MedicationLogs, DrugInteractions, DrugConflicts, DoctorAvailability';
PRINT 'Enhanced tables: CaregiverRelationships, EmergencyContacts, CaregiverAlerts, EmergencyAlerts, HealthMetrics, AdherenceReports';
PRINT 'Views created: vw_MedicationAdherence, vw_CaregiverDashboard';
PRINT 'Stored procedures: sp_GetPatientAdherence, sp_GetMissedMedications';
PRINT 'Triggers and indexes created for optimal performance';
PRINT 'Sample data inserted for Doctors and Drug Interactions';

-- Verify tables exist
SELECT 'Tables Created' as Status, TABLE_NAME as TableName 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' 
AND TABLE_NAME IN ('Medications', 'Doctors', 'Appointments', 'MedicationLogs', 'DrugInteractions', 'DrugConflicts', 'DoctorAvailability', 'CaregiverRelationships', 'EmergencyContacts', 'CaregiverAlerts', 'EmergencyAlerts', 'HealthMetrics', 'AdherenceReports')
ORDER BY TABLE_NAME;



-- Module 2: Community events
-- Groups functionality
CREATE TABLE Groups (
  ID INT PRIMARY KEY IDENTITY(1,1),
  Name VARCHAR(50) NOT NULL,
  Description VARCHAR(200) NULL,
  GroupPicture VARCHAR(1000) NULL,
  IsPrivate BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
  InviteToken UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  CreatedBy INT NOT NULL,
  FOREIGN KEY (CreatedBy) REFERENCES Users(ID)
);

CREATE TABLE GroupMembers (
  GroupID INT NOT NULL,
  UserID INT NOT NULL,

  PRIMARY KEY (GroupID, UserID),
  FOREIGN KEY (GroupID) REFERENCES Groups(ID),
  FOREIGN KEY (UserID) REFERENCES Users(ID)
);


CREATE TABLE Announcements (
    ID INT PRIMARY KEY IDENTITY(1,1),
    GroupID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Content VARCHAR(1000) NOT NULL,
    ImageUrl VARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT NOT NULL,
    
    FOREIGN KEY (GroupID) REFERENCES Groups(ID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(ID)
);

CREATE TABLE Comments (
    ID INT PRIMARY KEY IDENTITY(1,1),
    AnnouncementID INT NOT NULL,
    UserID INT NOT NULL,
    Content VARCHAR(1000) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (AnnouncementID) REFERENCES Announcements(ID),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);


CREATE TABLE Meetings (
    ID INT PRIMARY KEY IDENTITY(1,1),
    RoomName VARCHAR(100) NOT NULL UNIQUE,
    RoomURL VARCHAR(500) NOT NULL,
    HostID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (HostID) REFERENCES Users(ID)
);


-- Module 3: Transport Navigator
-- Facilities data table
CREATE TABLE Facilities (
    facilityId INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    facilityType VARCHAR(50) NOT NULL CHECK (facilityType IN ('Polyclinic', 'Hospital', 'Park', 'Community Center')),
    phoneNo VARCHAR(20) NOT NULL,
    hours NVARCHAR(1000) NOT NULL,
    image_url NVARCHAR(1000) NOT NULL,
    static_map_url VARCHAR(500) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    google_place_id VARCHAR(100) NOT NULL,
    lastVerified DATE DEFAULT GETDATE()
);

-- Bookmarks table
CREATE TABLE Bookmarks (
    bookmarkId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    facilityId INT NOT NULL,
    locationName NVARCHAR(100) NOT NULL,
    note NVARCHAR(500) NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (userId) REFERENCES Users(ID),
    FOREIGN KEY (facilityId) REFERENCES Facilities(facilityId),
    CONSTRAINT UC_Bookmark UNIQUE (userId, facilityId)
);

-- Reviews table
CREATE TABLE Reviews (
    reviewId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    facilityId INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment NVARCHAR(1000) NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    lastModified DATETIME DEFAULT GETDATE(),
    isActive BIT DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES Users(ID),
    FOREIGN KEY (facilityId) REFERENCES Facilities(facilityId),
    CONSTRAINT UC_Review UNIQUE (userId, facilityId)
);

-- Reported Reviews table
CREATE TABLE Reports (
    reportId INT PRIMARY KEY IDENTITY(1,1),
    reviewId INT NOT NULL,
    userId INT NOT NULL,
    reason NVARCHAR(500) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (reviewId) REFERENCES Reviews(reviewId),
    FOREIGN KEY (userId) REFERENCES Users(ID)
);





-- Module 5: Buddy System
-- Friend Functionality
CREATE TABLE FriendRequests (
    ID INT PRIMARY KEY IDENTITY(1,1),
    SenderID INT NOT NULL,
    ReceiverID INT NOT NULL,
    Status VARCHAR(10) NOT NULL DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (SenderID) REFERENCES Users(ID),
    FOREIGN KEY (ReceiverID) REFERENCES Users(ID),

    CONSTRAINT UC_FriendRequest UNIQUE (SenderID, ReceiverID)
);

CREATE TABLE Friends (
    ID INT PRIMARY KEY IDENTITY(1,1),
    UserID1 INT NOT NULL,
    UserID2 INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID1) REFERENCES Users(ID),
    FOREIGN KEY (UserID2) REFERENCES Users(ID),

    CONSTRAINT UC_Friendship UNIQUE (UserID1, UserID2)
);

CREATE TABLE MatchProfile (
    UserID INT PRIMARY KEY FOREIGN KEY REFERENCES Users(ID),
    Bio NVARCHAR(MAX),
    
    LikesHiking BIT DEFAULT 0,
    LikesGardening BIT DEFAULT 0,
    LikesBoardGames BIT DEFAULT 0,
    LikesSinging BIT DEFAULT 0,
    LikesReading BIT DEFAULT 0,
    LikesWalking BIT DEFAULT 0,
    LikesCooking BIT DEFAULT 0,
    LikesMovies BIT DEFAULT 0,
    LikesTaiChi BIT DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE()
);

CREATE TABLE MatchInteractions (
    UserID INT NOT NULL,
    TargetUserID INT NOT NULL,
    Status VARCHAR(10) CHECK (Status IN ('liked', 'skipped', 'matched')),
    Timestamp DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (UserID, TargetUserID),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (TargetUserID) REFERENCES Users(ID)
);


CREATE TABLE Conversations (
    ID INT PRIMARY KEY IDENTITY(1,1),

    -- Store consistent user pairing: User1ID < User2ID
    User1ID INT NOT NULL,
    User2ID INT NOT NULL,

    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Conversation_User1 FOREIGN KEY (User1ID) REFERENCES Users(ID) ON DELETE CASCADE,
    CONSTRAINT FK_Conversation_User2 FOREIGN KEY (User2ID) REFERENCES Users(ID) ON DELETE CASCADE,

    -- Prevent duplicate conversations between same two users
    CONSTRAINT UQ_UserPair UNIQUE (User1ID, User2ID)
);

CREATE TABLE Messages (
    ID INT PRIMARY KEY IDENTITY(1,1),

    ConversationID INT NOT NULL,
    SenderID INT NOT NULL,
    Content TEXT NOT NULL,

    SentAt DATETIME2 DEFAULT SYSUTCDATETIME(),

    IsDeleted BIT DEFAULT 0,
	DeletedAt DATETIME2 NULL

    CONSTRAINT FK_Message_Conversation FOREIGN KEY (ConversationID) REFERENCES Conversations(ID) ON DELETE CASCADE,
    CONSTRAINT FK_Message_Sender FOREIGN KEY (SenderID) REFERENCES Users(ID) ON DELETE NO ACTION
);



-- Module 4: Senior Fitness Coach

CREATE TABLE categories (
  categoryId INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(50) NOT NULL
);

CREATE TABLE exercises (
  exerciseId INT PRIMARY KEY IDENTITY(1,1),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  categoryId INT,
  benefits TEXT,
  CONSTRAINT fk_exercise_category FOREIGN KEY (categoryId) REFERENCES categories(categoryId)
);

CREATE TABLE exercise_preferences (
  userId INT,
  categoryId INT,
  PRIMARY KEY (userId, categoryId),
  FOREIGN KEY (userId) REFERENCES Users(ID),
  FOREIGN KEY (categoryId) REFERENCES categories(categoryId)
);

CREATE TABLE exercise_steps (
  stepId INT PRIMARY KEY IDENTITY(1,1),
  exerciseId INT NOT NULL,
  step_number INT NOT NULL, 
  instruction TEXT NOT NULL,
  FOREIGN KEY (exerciseId) REFERENCES exercises(exerciseId) 
);

CREATE TABLE goals (
    goalId INT PRIMARY KEY IDENTITY(1,1),
    userId INT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    last_completed_at DATETIME,
    FOREIGN KEY (userId) REFERENCES Users(ID)
);

CREATE TABLE exerciseLogs (
    logId INT PRIMARY KEY IDENTITY(1,1),
    userID INT NOT NULL,
    exerciseID INT NOT NULL,
    completedAt DATETIME DEFAULT CURRENT_TIMESTAMP
	FOREIGN KEY (userId) REFERENCES Users(ID),
	FOREIGN KEY (exerciseId) REFERENCES exercises(exerciseId) 
);

CREATE TABLE goalLogs (
    logId INT PRIMARY KEY IDENTITY(1,1),
    userID INT NOT NULL,
    goalID INT NOT NULL,
    completedAt DATETIME DEFAULT CURRENT_TIMESTAMP
	FOREIGN KEY (userId) REFERENCES Users(ID),
);
