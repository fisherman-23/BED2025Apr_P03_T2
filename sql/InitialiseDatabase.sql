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


-- Module 1: Medication & Appointment Manager
-- Create Medications Table
CREATE TABLE Medications (
    medicationId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    dosage NVARCHAR(100) NOT NULL,
    frequency NVARCHAR(50) NOT NULL, -- 'Once daily', 'Twice daily', 'Three times daily', etc.
    timing TIME NOT NULL, -- Time to take medication
    startDate DATE NOT NULL,
    endDate DATE NULL, -- NULL means ongoing
    instructions NVARCHAR(MAX) NULL,
    prescribedBy NVARCHAR(255) NOT NULL,
    active BIT DEFAULT 1, -- 1 = active, 0 = discontinued
    qrCode NVARCHAR(255) NULL, -- QR code for pill bottle verification
    category NVARCHAR(100) NULL, -- 'Heart Health', 'Diabetes', 'Blood Pressure', etc.
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
    -- FOREIGN KEY (userId) REFERENCES Users(id) -- Add this after Users table exists
);
GO

-- Create Doctors Table
CREATE TABLE Doctors (
    doctorId INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    specialty NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    location NVARCHAR(255) NOT NULL, -- General area/district
    address NVARCHAR(500) NOT NULL, -- Full address for directions
    rating DECIMAL(3,2) DEFAULT 4.5, -- Rating out of 5
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
    duration INT DEFAULT 30, -- Duration in minutes
    reason NVARCHAR(500) NOT NULL,
    status NVARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no-show'
    notes NVARCHAR(MAX) NULL, -- Preparation notes or post-visit notes
    reminderSent BIT DEFAULT 0,
    followUpNeeded BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
    -- FOREIGN KEY (userId) REFERENCES Users(id), -- Add after Users table exists
    -- FOREIGN KEY (doctorId) REFERENCES Doctors(doctorId) -- Add after confirming structure
);
GO

-- Create MedicationLogs Table for tracking medication adherence
CREATE TABLE MedicationLogs (
    logId INT IDENTITY(1,1) PRIMARY KEY,
    medication_id INT NOT NULL,
    taken_at DATETIME2 NOT NULL,
    missed BIT DEFAULT 0, -- 0 = taken, 1 = missed
    notes NVARCHAR(255) NULL,
    created_at DATETIME2 DEFAULT GETDATE()
    -- FOREIGN KEY (medication_id) REFERENCES Medications(medicationId) -- Add after confirming structure
);
GO

-- Create DrugInteractions Table for checking drug conflicts
CREATE TABLE DrugInteractions (
    interactionId INT IDENTITY(1,1) PRIMARY KEY,
    drug1 NVARCHAR(255) NOT NULL,
    drug2 NVARCHAR(255) NOT NULL,
    severity NVARCHAR(50) NOT NULL, -- 'mild', 'moderate', 'severe'
    description NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Create DrugConflicts Table for user-specific conflicts
CREATE TABLE DrugConflicts (
    conflictId INT IDENTITY(1,1) PRIMARY KEY,
    medicationId INT NOT NULL,
    conflicting_medication NVARCHAR(255) NOT NULL,
    severity NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    resolved BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
    -- FOREIGN KEY (medicationId) REFERENCES Medications(medicationId) -- Add after confirming structure
);
GO

-- Create DoctorAvailability Table for appointment booking
CREATE TABLE DoctorAvailability (
    availabilityId INT IDENTITY(1,1) PRIMARY KEY,
    doctorId INT NOT NULL,
    day_of_week NVARCHAR(20) NOT NULL, -- 'Monday', 'Tuesday', etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
    -- FOREIGN KEY (doctorId) REFERENCES Doctors(doctorId) -- Add after confirming structure
);
GO

-- Add foreign key for Medications (if Users table exists)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    ALTER TABLE Medications 
    ADD CONSTRAINT FK_Medications_Users 
    FOREIGN KEY (userId) REFERENCES Users(id);
END
GO

-- Add foreign key for Appointments to Users (if Users table exists)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    ALTER TABLE Appointments 
    ADD CONSTRAINT FK_Appointments_Users 
    FOREIGN KEY (userId) REFERENCES Users(id);
END
GO

-- Add foreign key for Appointments to Doctors
ALTER TABLE Appointments 
ADD CONSTRAINT FK_Appointments_Doctors 
FOREIGN KEY (doctorId) REFERENCES Doctors(doctorId);
GO

-- Add foreign key for MedicationLogs
ALTER TABLE MedicationLogs 
ADD CONSTRAINT FK_MedicationLogs_Medications 
FOREIGN KEY (medication_id) REFERENCES Medications(medicationId);
GO

-- Add foreign key for DrugConflicts
ALTER TABLE DrugConflicts 
ADD CONSTRAINT FK_DrugConflicts_Medications 
FOREIGN KEY (medicationId) REFERENCES Medications(medicationId);
GO

-- Add foreign key for DoctorAvailability
ALTER TABLE DoctorAvailability 
ADD CONSTRAINT FK_DoctorAvailability_Doctors 
FOREIGN KEY (doctorId) REFERENCES Doctors(doctorId);
GO

-- Insert Sample Doctors
INSERT INTO Doctors (name, specialty, phone, email, location, address, rating) VALUES
('Dr. Sarah Lim', 'General Practitioner', '+65 6123 4567', 'sarah.lim@clinic.com', 'Buona Vista', '123 North Buona Vista Road, Singapore 138888', 4.8),
('Dr. Michael Chen', 'Cardiologist', '+65 6234 5678', 'michael.chen@heart.com', 'Jurong East', '456 Jurong Gateway Road, Singapore 608532', 4.9),
('Dr. Priya Kumar', 'Endocrinologist', '+65 6345 6789', 'priya.kumar@diabetes.com', 'Tampines', '789 Tampines Avenue 4, Singapore 529681', 4.7),
('Dr. James Wong', 'Orthopedic Surgeon', '+65 6456 7890', 'james.wong@ortho.com', 'Raffles Place', '321 Robinson Road, Singapore 068903', 4.6),
('Dr. Lisa Tan', 'Dermatologist', '+65 6567 8901', 'lisa.tan@skin.com', 'Orchard', '654 Orchard Road, Singapore 238859', 4.5),
('Dr. Ahmed Hassan', 'Neurologist', '+65 6678 9012', 'ahmed.hassan@neuro.com', 'Clementi', '987 Clementi Road, Singapore 129834', 4.7),
('Dr. Maria Rodriguez', 'Psychiatrist', '+65 6789 0123', 'maria.rodriguez@mind.com', 'Toa Payoh', '654 Lorong 1 Toa Payoh, Singapore 319762', 4.6);
GO

-- Insert Doctor Availability (Monday to Friday, 9 AM to 5 PM)
DECLARE @doctorId INT = 1;
WHILE @doctorId <= 7
BEGIN
    INSERT INTO DoctorAvailability (doctorId, day_of_week, start_time, end_time) VALUES
    (@doctorId, 'Monday', '09:00:00', '17:00:00'),
    (@doctorId, 'Tuesday', '09:00:00', '17:00:00'),
    (@doctorId, 'Wednesday', '09:00:00', '17:00:00'),
    (@doctorId, 'Thursday', '09:00:00', '17:00:00'),
    (@doctorId, 'Friday', '09:00:00', '17:00:00');
    SET @doctorId = @doctorId + 1;
END;
GO

-- Insert Sample Drug Interactions
INSERT INTO DrugInteractions (drug1, drug2, severity, description) VALUES
('Aspirin', 'Warfarin', 'severe', 'Increased risk of bleeding when taken together'),
('Metformin', 'Alcohol', 'moderate', 'May increase risk of lactic acidosis'),
('Lisinopril', 'Potassium supplements', 'moderate', 'May cause elevated potassium levels'),
('Atorvastatin', 'Grapefruit juice', 'mild', 'Grapefruit may increase medication levels'),
('Simvastatin', 'Amlodipine', 'moderate', 'Increased risk of muscle problems'),
('Digoxin', 'Furosemide', 'moderate', 'May increase digoxin levels'),
('Insulin', 'Beta-blockers', 'moderate', 'May mask signs of low blood sugar'),
('Lithium', 'Diuretics', 'severe', 'May increase lithium toxicity');
GO

-- Index on userId for faster queries
CREATE INDEX IX_Medications_UserId ON Medications(userId);
CREATE INDEX IX_Appointments_UserId ON Appointments(userId);
CREATE INDEX IX_MedicationLogs_MedicationId ON MedicationLogs(medication_id);
GO

-- Index on appointment dates for calendar functionality
CREATE INDEX IX_Appointments_Date ON Appointments(appointmentDate);
GO

-- Index on active medications
CREATE INDEX IX_Medications_Active ON Medications(active) WHERE active = 1;
GO

-- Index on doctor availability
CREATE INDEX IX_DoctorAvailability_DoctorDay ON DoctorAvailability(doctorId, day_of_week);
GO

-- Index on drug interactions for conflict checking
CREATE INDEX IX_DrugInteractions_Drugs ON DrugInteractions(drug1, drug2);
GO

-- Procedure to get medication compliance rate for a user
CREATE PROCEDURE GetMedicationCompliance
    @userId INT
AS
BEGIN
    SELECT 
        m.medicationId,
        m.name,
        COUNT(ml.logId) as total_doses,
        COUNT(CASE WHEN ml.missed = 0 THEN 1 END) as taken_doses,
        COUNT(CASE WHEN ml.missed = 1 THEN 1 END) as missed_doses,
        CASE 
            WHEN COUNT(ml.logId) > 0 THEN 
                ROUND((CAST(COUNT(CASE WHEN ml.missed = 0 THEN 1 END) AS FLOAT) / COUNT(ml.logId)) * 100, 2)
            ELSE 0 
        END as compliance_rate
    FROM Medications m
    LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medication_id
        AND ml.taken_at >= DATEADD(MONTH, -1, GETDATE())
    WHERE m.userId = @userId AND m.active = 1
    GROUP BY m.medicationId, m.name
    ORDER BY m.name;
END;
GO

-- Procedure to check upcoming appointments
CREATE PROCEDURE GetUpcomingAppointments
    @userId INT,
    @days INT = 7
AS
BEGIN
    SELECT 
        a.*,
        d.name as doctorName,
        d.specialty,
        d.location,
        d.address,
        DATEDIFF(DAY, GETDATE(), a.appointmentDate) as days_until_appointment
    FROM Appointments a
    INNER JOIN Doctors d ON a.doctorId = d.doctorId
    WHERE a.userId = @userId 
        AND a.appointmentDate > GETDATE()
        AND a.appointmentDate <= DATEADD(DAY, @days, GETDATE())
        AND a.status = 'scheduled'
    ORDER BY a.appointmentDate ASC;
END;
GO

-- Procedure to check for drug interactions
CREATE PROCEDURE CheckDrugInteractions
    @userId INT
AS
BEGIN
    SELECT DISTINCT
        m1.name as medication1,
        m2.name as medication2,
        di.severity,
        di.description
    FROM Medications m1
    INNER JOIN Medications m2 ON m1.userId = m2.userId AND m1.medicationId != m2.medicationId
    INNER JOIN DrugInteractions di ON 
        (LOWER(m1.name) = LOWER(di.drug1) AND LOWER(m2.name) = LOWER(di.drug2))
        OR (LOWER(m1.name) = LOWER(di.drug2) AND LOWER(m2.name) = LOWER(di.drug1))
    WHERE m1.userId = @userId 
        AND m1.active = 1 
        AND m2.active = 1
    ORDER BY di.severity DESC, m1.name;
END;
GO

-- View for medication summary with compliance
CREATE VIEW MedicationSummary AS
SELECT 
    m.*,
    COALESCE(
        ROUND(
            (CAST(COUNT(CASE WHEN ml.missed = 0 THEN 1 END) AS FLOAT) / 
             NULLIF(COUNT(ml.logId), 0)) * 100, 0
        ), 0
    ) as compliance_rate,
    COUNT(CASE WHEN ml.missed = 1 THEN 1 END) as missed_doses_last_month,
    MAX(CASE WHEN ml.missed = 0 THEN ml.taken_at END) as last_taken
FROM Medications m
LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medication_id
    AND ml.taken_at >= DATEADD(MONTH, -1, GETDATE())
WHERE m.active = 1
GROUP BY 
    m.medicationId, m.userId, m.name, m.dosage, m.frequency, 
    m.timing, m.startDate, m.endDate, m.instructions, 
    m.prescribedBy, m.active, m.qrCode, m.category,
    m.createdAt, m.updatedAt;
GO

-- View for appointment details with doctor info
CREATE VIEW AppointmentDetails AS
SELECT 
    a.*,
    d.name as doctorName,
    d.specialty,
    d.phone as doctorPhone,
    d.email as doctorEmail,
    d.location,
    d.address,
    d.rating,
    CASE 
        WHEN a.appointmentDate < GETDATE() THEN 'past'
        WHEN CAST(a.appointmentDate AS DATE) = CAST(GETDATE() AS DATE) THEN 'today'
        ELSE 'upcoming'
    END as appointment_status,
    DATEDIFF(DAY, GETDATE(), a.appointmentDate) as days_until_appointment
FROM Appointments a
INNER JOIN Doctors d ON a.doctorId = d.doctorId;
GO

PRINT 'Database tables, indexes, procedures, and views created successfully!';
PRINT 'Sample data inserted for Doctors and Drug Interactions.';
PRINT 'Ready for Module 1: Medication & Appointment Manager testing.';

-- Show created tables
SELECT 'Tables Created:' as Status, TABLE_NAME as Name 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' 
AND TABLE_NAME IN ('Medications', 'Doctors', 'Appointments', 'MedicationLogs', 'DrugInteractions', 'DrugConflicts', 'DoctorAvailability');

-- Emergency Contacts Table
CREATE TABLE EmergencyContacts (
    contactId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    relationship NVARCHAR(50) NOT NULL,
    phoneNumber NVARCHAR(20) NOT NULL,
    email NVARCHAR(100),
    isPrimary BIT DEFAULT 0,
    alertPreferences NVARCHAR(MAX), -- JSON string for alert settings
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (userId) REFERENCES Users(ID),
    CONSTRAINT UC_PrimaryContact UNIQUE (userId, isPrimary) -- Only one primary contact per user
);

-- Health Metrics Table
CREATE TABLE HealthMetrics (
    metricId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    metricType NVARCHAR(50) NOT NULL, -- 'blood_pressure', 'weight', 'heart_rate', 'blood_sugar', etc.
    value NVARCHAR(50) NOT NULL, -- stored as string to handle different formats
    unit NVARCHAR(20) NOT NULL, -- 'mmHg', 'kg', 'bpm', 'mg/dL', etc.
    notes NVARCHAR(500),
    recordedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (userId) REFERENCES Users(ID)
);

-- Alert History Table
CREATE TABLE AlertHistory (
    alertId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    medicationId INT NULL,
    alertType NVARCHAR(50) NOT NULL, -- 'missed_medication', 'emergency', 'appointment_reminder'
    message NVARCHAR(500) NOT NULL,
    severity NVARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    contactsNotified INT DEFAULT 0,
    acknowledged BIT DEFAULT 0,
    acknowledgedBy INT NULL,
    acknowledgedAt DATETIME NULL,
    acknowledgeNotes NVARCHAR(500),
    triggeredAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (userId) REFERENCES Users(ID),
    FOREIGN KEY (medicationId) REFERENCES Medications(medicationId),
    FOREIGN KEY (acknowledgedBy) REFERENCES Users(ID)
);

-- Caregiver Relationships Table
CREATE TABLE CaregiverRelationships (
    relationshipId INT PRIMARY KEY IDENTITY(1,1),
    caregiverId INT NOT NULL,
    patientId INT NOT NULL,
    relationship NVARCHAR(50) NOT NULL, -- 'spouse', 'child', 'sibling', 'friend', 'professional'
    permissions NVARCHAR(MAX), -- JSON string for permissions
    alertPreferences NVARCHAR(MAX), -- JSON string for alert settings
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (caregiverId) REFERENCES Users(ID),
    FOREIGN KEY (patientId) REFERENCES Users(ID),
    CONSTRAINT UC_CaregiverPatient UNIQUE (caregiverId, patientId)
);

-- Caregiver Notes Table
CREATE TABLE CaregiverNotes (
    noteId INT PRIMARY KEY IDENTITY(1,1),
    caregiverId INT NOT NULL,
    patientId INT NOT NULL,
    noteType NVARCHAR(50) DEFAULT 'general', -- 'general', 'medication', 'health', 'appointment'
    content NVARCHAR(MAX) NOT NULL,
    visibility NVARCHAR(20) DEFAULT 'private', -- 'private', 'shared_with_patient', 'shared_with_doctors'
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (caregiverId) REFERENCES Users(ID),
    FOREIGN KEY (patientId) REFERENCES Users(ID)
);

-- Enhanced Medication Logs for better tracking
-- Add new columns to existing MedicationLogs table
ALTER TABLE MedicationLogs ADD COLUMN confirmedBy INT NULL;
ALTER TABLE MedicationLogs ADD COLUMN confirmationMethod NVARCHAR(50) DEFAULT 'manual'; -- 'manual', 'qr_code', 'caregiver'
ALTER TABLE MedicationLogs ADD COLUMN sideEffects NVARCHAR(500) NULL;
ALTER TABLE MedicationLogs ADD COLUMN adherenceScore INT DEFAULT 100; -- 0-100 score

-- Add foreign key for confirmedBy
ALTER TABLE MedicationLogs ADD CONSTRAINT FK_MedicationLogs_ConfirmedBy 
FOREIGN KEY (confirmedBy) REFERENCES Users(ID);

-- Medication Compliance View (SCRUM-33)
CREATE VIEW MedicationComplianceView AS
SELECT 
    m.userId,
    m.medicationId,
    m.name as medicationName,
    m.dosage,
    m.frequency,
    COUNT(ml.logId) as dosesTaken,
    CASE m.frequency
        WHEN 'once_daily' THEN 7
        WHEN 'twice_daily' THEN 14
        WHEN 'three_times_daily' THEN 21
        WHEN 'four_times_daily' THEN 28
        ELSE 7
    END as scheduledDoses,
    CAST(COUNT(ml.logId) * 100.0 / 
        CASE m.frequency
            WHEN 'once_daily' THEN 7
            WHEN 'twice_daily' THEN 14
            WHEN 'three_times_daily' THEN 21
            WHEN 'four_times_daily' THEN 28
            ELSE 7
        END AS DECIMAL(5,2)) as complianceRate
FROM Medications m
LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
    AND ml.takenAt >= DATEADD(DAY, -7, GETDATE())
WHERE m.active = 1
GROUP BY m.userId, m.medicationId, m.name, m.dosage, m.frequency;

-- Health Trends View (SCRUM-33)
CREATE VIEW HealthTrendsView AS
SELECT 
    userId,
    metricType,
    AVG(CAST(value AS FLOAT)) as avgValue,
    MIN(CAST(value AS FLOAT)) as minValue,
    MAX(CAST(value AS FLOAT)) as maxValue,
    COUNT(*) as recordCount,
    CAST(recordedAt AS DATE) as recordDate
FROM HealthMetrics
WHERE recordedAt >= DATEADD(DAY, -30, GETDATE())
GROUP BY userId, metricType, CAST(recordedAt AS DATE);

-- Insert Sample Data for Testing
-- Sample Emergency Contacts
INSERT INTO EmergencyContacts (userId, name, relationship, phoneNumber, email, isPrimary, alertPreferences) VALUES
(1, 'Mary Johnson', 'daughter', '+6591234567', 'mary.johnson@email.com', 1, '{"immediate": true, "missed_medication": true, "emergency": true}'),
(1, 'Dr. Smith', 'family_doctor', '+6587654321', 'dr.smith@clinic.com', 0, '{"missed_medication": true, "health_alerts": true}'),
(2, 'John Tan', 'spouse', '+6598765432', 'john.tan@email.com', 1, '{"immediate": true, "all_alerts": true}');

-- Sample Health Metrics
INSERT INTO HealthMetrics (userId, metricType, value, unit, notes) VALUES
(1, 'blood_pressure', '120/80', 'mmHg', 'Normal reading'),
(1, 'weight', '65.5', 'kg', 'Stable weight'),
(1, 'heart_rate', '72', 'bpm', 'Resting heart rate'),
(1, 'blood_sugar', '95', 'mg/dL', 'Fasting glucose'),
(2, 'blood_pressure', '140/90', 'mmHg', 'Slightly elevated'),
(2, 'weight', '78.2', 'kg', 'Weight loss goal'),
(2, 'heart_rate', '85', 'bpm', 'After light exercise');

-- Sample Caregiver Relationships
INSERT INTO CaregiverRelationships (caregiverId, patientId, relationship, permissions, alertPreferences) VALUES
(2, 1, 'spouse', '{"view_medications": true, "view_appointments": true, "receive_alerts": true}', '{"missed_medication": true, "health_alerts": true, "emergency": true}'),
(3, 1, 'daughter', '{"view_medications": true, "view_health_metrics": true, "book_appointments": true}', '{"missed_medication": true, "appointment_reminders": true}');

-- Sample Alert History
INSERT INTO AlertHistory (userId, medicationId, alertType, message, severity, contactsNotified) VALUES
(1, 1, 'missed_medication', 'Aspirin dose missed for 2 hours', 'medium', 1),
(1, NULL, 'health_alert', 'Blood pressure reading elevated', 'high', 2),
(2, 2, 'missed_medication', 'Metformin dose missed for 3 hours', 'high', 1);

-- Sample Caregiver Notes
INSERT INTO CaregiverNotes (caregiverId, patientId, noteType, content, visibility) VALUES
(2, 1, 'medication', 'Patient reported mild nausea after taking morning medication', 'shared_with_doctors'),
(2, 1, 'general', 'Seems more energetic today, appetite has improved', 'private'),
(3, 1, 'appointment', 'Scheduled follow-up with cardiologist for next week', 'shared_with_patient');

-- Create Indexes for Performance
CREATE INDEX IX_EmergencyContacts_UserId ON EmergencyContacts(userId);
CREATE INDEX IX_HealthMetrics_UserId_RecordedAt ON HealthMetrics(userId, recordedAt);
CREATE INDEX IX_AlertHistory_UserId_TriggeredAt ON AlertHistory(userId, triggeredAt);
CREATE INDEX IX_CaregiverRelationships_CaregiverId ON CaregiverRelationships(caregiverId);
CREATE INDEX IX_CaregiverRelationships_PatientId ON CaregiverRelationships(patientId);
CREATE INDEX IX_CaregiverNotes_PatientId ON CaregiverNotes(patientId);

-- Stored Procedures for Complex Operations
-- Calculate Overall Medication Compliance
CREATE PROCEDURE sp_CalculateMedicationCompliance
    @userId INT,
    @days INT = 7
AS
BEGIN
    SELECT 
        AVG(complianceRate) as overallCompliance,
        COUNT(*) as totalMedications,
        COUNT(CASE WHEN complianceRate >= 80 THEN 1 END) as highComplianceMeds,
        COUNT(CASE WHEN complianceRate < 60 THEN 1 END) as lowComplianceMeds
    FROM MedicationComplianceView
    WHERE userId = @userId;
END;

-- Generate Health Summary
CREATE PROCEDURE sp_GenerateHealthSummary
    @userId INT,
    @days INT = 30
AS
BEGIN
    SELECT 
        metricType,
        COUNT(*) as recordCount,
        AVG(CAST(value AS FLOAT)) as avgValue,
        MIN(CAST(value AS FLOAT)) as minValue,
        MAX(CAST(value AS FLOAT)) as maxValue,
        STDEV(CAST(value AS FLOAT)) as stdDev
    FROM HealthMetrics
    WHERE userId = @userId 
        AND recordedAt >= DATEADD(DAY, -@days, GETDATE())
    GROUP BY metricType
    ORDER BY metricType;
END;

-- Trigger for Automatic Alert Generation
CREATE TRIGGER tr_MedicationMissedAlert
ON MedicationLogs
AFTER INSERT
AS
BEGIN
    -- Check for missed medications and create alerts
    DECLARE @userId INT, @medicationId INT;
    
    SELECT @userId = m.userId, @medicationId = m.medicationId
    FROM Medications m
    INNER JOIN inserted i ON m.medicationId = i.medicationId;
    
    -- Logic for missed medication detection
END;

PRINT 'Sprint 3 database updates completed successfully!';
PRINT 'New tables created: EmergencyContacts, HealthMetrics, AlertHistory, CaregiverRelationships, CaregiverNotes';
PRINT 'Views created: MedicationComplianceView, HealthTrendsView';
PRINT 'Sample data inserted for testing purposes';
GO


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
