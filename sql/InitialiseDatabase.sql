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

-- Create CaregiverRelationships table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CaregiverRelationships' AND xtype='U')
CREATE TABLE CaregiverRelationships (
    relationshipId INT IDENTITY(1,1) PRIMARY KEY,
    caregiverId INT NOT NULL,
    patientId INT NOT NULL,
    relationship NVARCHAR(50) NOT NULL, -- spouse, child, parent, sibling, relative, friend, caregiver
    accessLevel NVARCHAR(20) NOT NULL DEFAULT 'monitoring', -- monitoring, alerts, full
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NULL,
    FOREIGN KEY (caregiverId) REFERENCES Users(userId) ON DELETE CASCADE,
    FOREIGN KEY (patientId) REFERENCES Users(userId) ON DELETE NO ACTION,
    UNIQUE(caregiverId, patientId)
);

-- Create EmergencyContacts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmergencyContacts' AND xtype='U')
CREATE TABLE EmergencyContacts (
    contactId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    contactName NVARCHAR(100) NOT NULL,
    relationship NVARCHAR(50) NOT NULL, -- spouse, child, parent, sibling, relative, friend, neighbor, caregiver, doctor
    phoneNumber NVARCHAR(20) NOT NULL,
    email NVARCHAR(100) NULL,
    priority INT NOT NULL DEFAULT 1, -- 1 (highest) to 5 (lowest)
    alertDelayHours INT NOT NULL DEFAULT 0, -- 0 = immediate, 1, 2, 4, 24
    isActive BIT NOT NULL DEFAULT 1,
    lastAlertSent DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NULL,
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);

-- Create CaregiverAlerts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CaregiverAlerts' AND xtype='U')
CREATE TABLE CaregiverAlerts (
    alertId INT IDENTITY(1,1) PRIMARY KEY,
    caregiverId INT NOT NULL,
    patientId INT NOT NULL,
    medicationId INT NULL,
    alertType NVARCHAR(50) NOT NULL, -- missed_medication, adherence_concern, emergency
    alertMessage NVARCHAR(500) NOT NULL,
    sentAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    acknowledged BIT NOT NULL DEFAULT 0,
    acknowledgedAt DATETIME2 NULL,
    FOREIGN KEY (caregiverId) REFERENCES Users(userId) ON DELETE CASCADE,
    FOREIGN KEY (patientId) REFERENCES Users(userId) ON DELETE NO ACTION,
    FOREIGN KEY (medicationId) REFERENCES Medications(medicationId) ON DELETE SET NULL
);

-- Create EmergencyAlerts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmergencyAlerts' AND xtype='U')
CREATE TABLE EmergencyAlerts (
    alertId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    contactId INT NOT NULL,
    medicationId INT NULL,
    alertLevel INT NOT NULL DEFAULT 1, -- 1-5, higher = more urgent
    alertMessage NVARCHAR(500) NOT NULL,
    sentAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    deliveryStatus NVARCHAR(20) DEFAULT 'sent', -- sent, delivered, failed
    responseReceived BIT NOT NULL DEFAULT 0,
    responseTime DATETIME2 NULL,
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE,
    FOREIGN KEY (contactId) REFERENCES EmergencyContacts(contactId) ON DELETE CASCADE,
    FOREIGN KEY (medicationId) REFERENCES Medications(medicationId) ON DELETE SET NULL
);

-- Create HealthMetrics table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HealthMetrics' AND xtype='U')
CREATE TABLE HealthMetrics (
    metricId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    metricType NVARCHAR(50) NOT NULL, -- blood_pressure, weight, blood_sugar, heart_rate, temperature, etc.
    value DECIMAL(10,2) NOT NULL,
    unit NVARCHAR(20) NULL, -- mmHg, kg, mg/dL, bpm, °C, etc.
    notes NVARCHAR(200) NULL,
    recordedAt DATETIME2 NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);

-- Create AdherenceReports table for caching report data
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AdherenceReports' AND xtype='U')
CREATE TABLE AdherenceReports (
    reportId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    reportType NVARCHAR(20) NOT NULL, -- daily, weekly, monthly
    reportData NVARCHAR(MAX) NOT NULL, -- JSON data
    generatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    expiresAt DATETIME2 NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);

-- Add new columns to existing Medications table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Medications') AND name = 'category')
    ALTER TABLE Medications ADD category NVARCHAR(50) NULL; -- chronic, acute, supplement, vitamin, etc.

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Medications') AND name = 'reminderEnabled')
    ALTER TABLE Medications ADD reminderEnabled BIT NOT NULL DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Medications') AND name = 'reminderTimes')
    ALTER TABLE Medications ADD reminderTimes NVARCHAR(200) NULL; -- JSON array of reminder times

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Medications') AND name = 'sideEffects')
    ALTER TABLE Medications ADD sideEffects NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Medications') AND name = 'foodInstructions')
    ALTER TABLE Medications ADD foodInstructions NVARCHAR(200) NULL; -- with_food, without_food, empty_stomach

-- Add new columns to existing MedicationLogs table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MedicationLogs') AND name = 'notes')
    ALTER TABLE MedicationLogs ADD notes NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MedicationLogs') AND name = 'takenAt')
    ALTER TABLE MedicationLogs ADD takenAt DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MedicationLogs') AND name = 'reminderSent')
    ALTER TABLE MedicationLogs ADD reminderSent BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MedicationLogs') AND name = 'reminderSentAt')
    ALTER TABLE MedicationLogs ADD reminderSentAt DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MedicationLogs') AND name = 'updatedAt')
    ALTER TABLE MedicationLogs ADD updatedAt DATETIME2 NULL;

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX IX_CaregiverRelationships_CaregiverId 
ON CaregiverRelationships(caregiverId) INCLUDE (patientId, relationship, accessLevel);

CREATE NONCLUSTERED INDEX IX_CaregiverRelationships_PatientId 
ON CaregiverRelationships(patientId) INCLUDE (caregiverId, relationship);

CREATE NONCLUSTERED INDEX IX_EmergencyContacts_UserId 
ON EmergencyContacts(userId) INCLUDE (priority, isActive, alertDelayHours);

CREATE NONCLUSTERED INDEX IX_EmergencyContacts_Priority 
ON EmergencyContacts(userId, priority, isActive);

CREATE NONCLUSTERED INDEX IX_CaregiverAlerts_CaregiverId 
ON CaregiverAlerts(caregiverId, sentAt DESC);

CREATE NONCLUSTERED INDEX IX_EmergencyAlerts_UserId 
ON EmergencyAlerts(userId, sentAt DESC);

CREATE NONCLUSTERED INDEX IX_EmergencyAlerts_ContactId 
ON EmergencyAlerts(contactId, sentAt DESC);

CREATE NONCLUSTERED INDEX IX_HealthMetrics_UserId 
ON HealthMetrics(userId, recordedAt DESC);

CREATE NONCLUSTERED INDEX IX_HealthMetrics_Type 
ON HealthMetrics(userId, metricType, recordedAt DESC);

CREATE NONCLUSTERED INDEX IX_MedicationLogs_Scheduling 
ON MedicationLogs(medicationId, scheduledTime) INCLUDE (taken, takenAt);

CREATE NONCLUSTERED INDEX IX_MedicationLogs_Reminders 
ON MedicationLogs(scheduledTime, reminderSent) WHERE taken = 0;

-- Create views for common queries
GO
CREATE OR ALTER VIEW vw_MedicationAdherence AS
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
CREATE OR ALTER VIEW vw_CaregiverDashboard AS
SELECT 
    cr.caregiverId,
    cr.patientId,
    u.firstName + ' ' + u.lastName as patientName,
    u.email as patientEmail,
    cr.relationship,
    cr.accessLevel,
    COUNT(DISTINCT m.medicationId) as activeMedications,
    AVG(ma.adherenceRate) as avgAdherence,
    COUNT(CASE WHEN ma.adherenceRate < 80 THEN 1 END) as concerningMedications,
    MAX(ca.sentAt) as lastAlertSent
FROM CaregiverRelationships cr
JOIN Users u ON cr.patientId = u.userId
LEFT JOIN Medications m ON cr.patientId = m.userId AND m.active = 1
LEFT JOIN vw_MedicationAdherence ma ON m.medicationId = ma.medicationId
LEFT JOIN CaregiverAlerts ca ON cr.caregiverId = ca.caregiverId AND cr.patientId = ca.patientId
GROUP BY cr.caregiverId, cr.patientId, u.firstName, u.lastName, u.email, cr.relationship, cr.accessLevel;

-- Insert sample data for development/testing
INSERT INTO EmergencyContacts (userId, contactName, relationship, phoneNumber, email, priority, alertDelayHours)
SELECT 1, 'John Doe', 'spouse', '+65 9123 4567', 'john.doe@example.com', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM EmergencyContacts WHERE userId = 1 AND contactName = 'John Doe');

INSERT INTO EmergencyContacts (userId, contactName, relationship, phoneNumber, email, priority, alertDelayHours)
SELECT 1, 'Mary Smith', 'child', '+65 8765 4321', 'mary.smith@example.com', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM EmergencyContacts WHERE userId = 1 AND contactName = 'Mary Smith');

INSERT INTO HealthMetrics (userId, metricType, value, unit, recordedAt)
SELECT 1, 'weight', 65.5, 'kg', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM HealthMetrics WHERE userId = 1 AND metricType = 'weight' AND CAST(recordedAt AS DATE) = CAST(GETDATE() AS DATE));

INSERT INTO HealthMetrics (userId, metricType, value, unit, recordedAt)
SELECT 1, 'blood_pressure', 120, 'mmHg', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM HealthMetrics WHERE userId = 1 AND metricType = 'blood_pressure' AND CAST(recordedAt AS DATE) = CAST(GETDATE() AS DATE));

-- Update existing medications with new fields
UPDATE Medications 
SET category = 'chronic', 
    reminderEnabled = 1,
    foodInstructions = 'with_food'
WHERE category IS NULL AND medicationName LIKE '%blood pressure%';

UPDATE Medications 
SET category = 'supplement', 
    reminderEnabled = 1,
    foodInstructions = 'empty_stomach'
WHERE category IS NULL AND medicationName LIKE '%vitamin%';

-- Create stored procedures for common operations
GO
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
        ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(ml.logId), 2) as adherenceRate
    FROM Medications m
    LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
        AND ml.scheduledTime >= DATEADD(DAY, -@Days, GETDATE())
    WHERE m.userId = @PatientId AND m.active = 1
    GROUP BY m.medicationId, m.medicationName, m.dosage, m.frequency
    ORDER BY adherenceRate ASC;
END;

GO
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

-- Create triggers for audit logging
GO
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
            'Patient has taken ' + m.medicationName + ' (' + m.dosage + ') at ' + FORMAT(i.takenAt, 'yyyy-MM-dd HH:mm')
        FROM inserted i
        JOIN deleted d ON i.logId = d.logId
        JOIN Medications m ON i.medicationId = m.medicationId
        JOIN CaregiverRelationships cr ON m.userId = cr.patientId
        WHERE i.taken = 1 AND d.taken = 0
        AND cr.accessLevel IN ('alerts', 'full');
    END;
END;

PRINT 'Database initialization completed successfully for Medication Manager Sprint 3';
PRINT 'Tables created: CaregiverRelationships, EmergencyContacts, CaregiverAlerts, EmergencyAlerts, HealthMetrics, AdherenceReports';
PRINT 'Views created: vw_MedicationAdherence, vw_CaregiverDashboard';
PRINT 'Stored procedures created: sp_GetPatientAdherence, sp_GetMissedMedications';
PRINT 'Indexes and triggers created for optimal performance';
PRINT 'Sample data inserted for development/testing';


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
