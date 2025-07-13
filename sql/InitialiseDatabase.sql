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
-- Module 1: Medication & Appointment Manager Tables
-- Medications table
CREATE TABLE Medications (
    medicationId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    timing VARCHAR(100) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NULL,
    instructions TEXT,
    prescribedBy VARCHAR(100),
    active BIT DEFAULT 1,
    qrCode VARCHAR(100),
    category VARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Medication tracking table
CREATE TABLE MedicationTracking (
    trackingId INT PRIMARY KEY IDENTITY(1,1),
    medicationId INT NOT NULL,
    takenAt DATETIME NOT NULL,
    missed BIT DEFAULT 0,
    notes TEXT,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (medicationId) REFERENCES Medications(medicationId)
);

-- Doctors table
CREATE TABLE Doctors (
    doctorId INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    location VARCHAR(200),
    address TEXT,
    rating DECIMAL(2,1),
    languages VARCHAR(200),
    createdAt DATETIME DEFAULT GETDATE()
);

-- Appointments table
CREATE TABLE Appointments (
    appointmentId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    doctorId INT NOT NULL,
    appointmentDate DATETIME NOT NULL,
    duration VARCHAR(20),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    reminderSent BIT DEFAULT 0,
    followUpNeeded BIT DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (doctorId) REFERENCES Doctors(doctorId)
);

-- Emergency contacts table
CREATE TABLE EmergencyContacts (
    contactId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    isPrimary BIT DEFAULT 0,
    alertOnMissedMeds BIT DEFAULT 1,
    alertThresholdHours INT DEFAULT 2,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Health data tracking table
CREATE TABLE HealthData (
    healthId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    recordDate DATE NOT NULL,
    bloodPressureSystolic INT,
    bloodPressureDiastolic INT,
    weight DECIMAL(5,2),
    bloodSugar INT,
    notes TEXT,
    complianceScore INT,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Insert sample data
INSERT INTO Doctors (name, specialty, phone, email, location, address, rating, languages) VALUES
('Dr. Sarah Wilson', 'Cardiologist', '6737-8888', 'swilson@heartcenter.sg', 'Mount Elizabeth Hospital', '3 Mount Elizabeth, Singapore 228510', 4.9, 'English,Mandarin'),
('Dr. Michael Brown', 'Endocrinologist', '6225-5555', 'mbrown@sgh.com.sg', 'Singapore General Hospital', 'Outram Road, Singapore 169608', 4.8, 'English,Hokkien'),
('Dr. Lisa Tan', 'Family Medicine', '6444-3333', 'ltan@familyclinic.sg', 'Raffles Medical', '585 North Bridge Road, Singapore 188770', 4.7, 'English,Mandarin,Malay');

-- Sample medications (assuming user with id 1 exists)
INSERT INTO Medications (userId, name, dosage, frequency, timing, startDate, instructions, prescribedBy, category, qrCode) VALUES
(1, 'Lisinopril', '10mg', 'Once daily', '08:00', '2024-01-15', 'Take with breakfast, avoid grapefruit', 'Dr. Sarah Wilson', 'Heart Health', 'MED001-LISINOPRIL-10MG'),
(1, 'Metformin', '500mg', 'Twice daily', '08:00,20:00', '2024-02-01', 'Take with meals to reduce stomach upset', 'Dr. Michael Brown', 'Diabetes', 'MED002-METFORMIN-500MG');

-- Sample appointments
INSERT INTO Appointments (userId, doctorId, appointmentDate, duration, reason, status, notes) VALUES
(1, 1, '2024-06-15 10:00:00', '45 min', 'Regular heart checkup', 'scheduled', 'Bring blood pressure readings from home'),
(1, 2, '2024-06-08 14:30:00', '30 min', 'Diabetes management review', 'scheduled', 'Bring latest glucose monitor readings');

-- Sample emergency contacts
INSERT INTO EmergencyContacts (userId, name, relationship, phone, email, isPrimary, alertOnMissedMeds, alertThresholdHours) VALUES
(1, 'Sarah Chen', 'Daughter', '+65 9111-2222', 'sarah.chen@email.com', 1, 1, 2),
(1, 'David Chen', 'Son', '+65 9333-4444', 'david.chen@email.com', 0, 1, 4);

-- Sample health data
INSERT INTO HealthData (userId, recordDate, bloodPressureSystolic, bloodPressureDiastolic, weight, bloodSugar, notes, complianceScore) VALUES
(1, '2024-06-05', 128, 78, 65.0, 110, 'Feeling good today, walked for 30 minutes', 95),
(1, '2024-06-04', 135, 85, 65.2, 125, 'Forgot morning Metformin, took it at lunch', 75);


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

