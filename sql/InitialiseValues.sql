INSERT INTO Conversations (User1ID, User2ID)
VALUES
(1, 2),  -- Alice & Bob
(1, 3);  -- Alice & Carol

INSERT INTO Messages (ConversationID, SenderID, Content)
VALUES
(1, 1, 'Hey Bob, how are you?'),          -- Alice to Bob
(1, 2, 'Hi Alice! I am good, thanks!'),   -- Bob replies
(2, 3, 'Hey Alice, ready for the meeting?'), -- Carol to Alice
(2, 1, 'Yes, Carol! Starting soon.');     -- Alice replies

SET IDENTITY_INSERT Users ON;

INSERT INTO Users (
  ID,
  PublicUUID,
  Email,
  Password,
  Name,
  AboutMe,
  PhoneNumber,
  DateOfBirth,
  ProfilePicture,
  CreatedAt,
  UpdatedAt,
  IsActive
)
VALUES (
  1,
  NEWID(),
  'ranen@gmail.com',
  '$2b$05$SuhzjSpTVmBZGh5poFUOzO.8v3pD1sRdPnIyJnGrrw0y8sIyxbNgC',
  'Ranen Sim',
  NULL,
  '12343561',
  '2000-01-01',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/profile_pictures%2F1753825162062_Penguin%20PFP%20Rounded.png',
  '2025-07-30 05:39:24.273',
  '2025-07-30 05:39:24.273',
  1
);

SET IDENTITY_INSERT Users OFF;

-- Module 1: Medication & appointment manager
PRINT 'Starting InitialiseValues.sql for MODULE 1: Medication & Appointment Manager...';

-- Ensure we have test users first (update the existing user to Ryan Yip)
-- Update existing user with new name and additional fields
UPDATE Users 
SET Name = 'Ryan Yip',
    firstName = 'Ryan', 
    lastName = 'Yip',
    Email = 'ryan.yip@gmail.com'
WHERE ID = 1;

-- Insert additional test users for comprehensive testing
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'mary.tan@gmail.com')
INSERT INTO Users (Email, Password, Name, firstName, lastName, PhoneNumber, DateOfBirth, AboutMe)
VALUES ('mary.tan@gmail.com', '$2b$05$SuhzjSpTVmBZGh5poFUOzO.8v3pD1sRdPnIyJnGrrw0y8sIyxbNgC', 'Mary Tan', 'Mary', 'Tan', '87654321', '1965-03-15', 'Retired teacher who loves gardening');

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'john.lim@gmail.com')
INSERT INTO Users (Email, Password, Name, firstName, lastName, PhoneNumber, DateOfBirth, AboutMe)
VALUES ('john.lim@gmail.com', '$2b$05$SuhzjSpTVmBZGh5poFUOzO.8v3pD1sRdPnIyJnGrrw0y8sIyxbNgC', 'John Lim', 'John', 'Lim', '98765432', '1958-07-22', 'Former engineer with diabetes and hypertension');

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'sarah.wong@gmail.com')
INSERT INTO Users (Email, Password, Name, firstName, lastName, PhoneNumber, DateOfBirth, AboutMe)
VALUES ('sarah.wong@gmail.com', '$2b$05$SuhzjSpTVmBZGh5poFUOzO.8v3pD1sRdPnIyJnGrrw0y8sIyxbNgC', 'Sarah Wong', 'Sarah', 'Wong', '91234567', '1975-11-08', 'Caregiver daughter managing elderly parents healthcare');

-- Insert realistic Medications for different users
-- User 1 (Ryan Yip) - Complex medication regimen
INSERT INTO Medications (userId, name, dosage, frequency, timing, startDate, instructions, prescribedBy, category, reminderEnabled, foodInstructions, sideEffects)
VALUES 
(1, 'Metformin', '500mg', 'Twice daily', '08:00:00', '2024-01-15', 'Take with meals to reduce stomach upset', 'Dr. Sarah Lim', 'Diabetes', 1, 'with_food', 'Nausea, diarrhea, metallic taste'),
(1, 'Lisinopril', '10mg', 'Once daily', '07:00:00', '2024-01-15', 'Take at the same time each day', 'Dr. Michael Chen', 'Blood Pressure', 1, 'without_food', 'Dry cough, dizziness'),
(1, 'Atorvastatin', '20mg', 'Once daily', '20:00:00', '2024-02-01', 'Take in the evening', 'Dr. Michael Chen', 'Cholesterol', 1, 'without_food', 'Muscle pain, fatigue'),
(1, 'Aspirin', '81mg', 'Once daily', '07:30:00', '2024-01-15', 'Low-dose for heart protection', 'Dr. Michael Chen', 'Heart Health', 1, 'with_food', 'Stomach irritation');

-- User 2 (Mary Tan) - Moderate medication needs
INSERT INTO Medications (userId, name, dosage, frequency, timing, startDate, instructions, prescribedBy, category, reminderEnabled, foodInstructions)
VALUES 
(2, 'Amlodipine', '5mg', 'Once daily', '08:00:00', '2024-03-01', 'For blood pressure control', 'Dr. Sarah Lim', 'Blood Pressure', 1, 'without_food'),
(2, 'Calcium Carbonate', '600mg', 'Twice daily', '09:00:00', '2024-03-01', 'Take with meals for better absorption', 'Dr. Sarah Lim', 'Supplement', 1, 'with_food'),
(2, 'Vitamin D3', '1000IU', 'Once daily', '08:30:00', '2024-03-01', 'For bone health', 'Dr. Sarah Lim', 'Vitamin', 1, 'with_food');

-- User 3 (John Lim) - Complex diabetes and heart condition
INSERT INTO Medications (userId, name, dosage, frequency, timing, startDate, instructions, prescribedBy, category, reminderEnabled, foodInstructions, sideEffects)
VALUES 
(3, 'Insulin Glargine', '20 units', 'Once daily', '22:00:00', '2024-01-01', 'Long-acting insulin, inject at bedtime', 'Dr. Priya Patel', 'Diabetes', 1, 'without_food', 'Injection site reactions, hypoglycemia'),
(3, 'Metformin', '850mg', 'Twice daily', '07:00:00', '2024-01-01', 'Extended release formulation', 'Dr. Priya Patel', 'Diabetes', 1, 'with_food', 'GI upset'),
(3, 'Carvedilol', '6.25mg', 'Twice daily', '08:00:00', '2024-02-15', 'Take with food to reduce side effects', 'Dr. Michael Chen', 'Heart Health', 1, 'with_food', 'Dizziness, fatigue'),
(3, 'Furosemide', '40mg', 'Once daily', '07:00:00', '2024-02-15', 'Water pill - take in morning', 'Dr. Michael Chen', 'Heart Health', 1, 'without_food', 'Frequent urination, dehydration');

-- Insert MedicationLogs for adherence tracking (last 30 days)
-- Generate realistic medication logs with varying compliance rates
DECLARE @StartDate DATE = DATEADD(DAY, -30, GETDATE());
DECLARE @CurrentDate DATE = @StartDate;
DECLARE @MedId INT;
DECLARE @UserId INT;
DECLARE @ScheduledTime DATETIME2;
DECLARE @Taken BIT;
DECLARE @TakenTime DATETIME2;

-- Create medication logs for User 1 (85% compliance)
WHILE @CurrentDate <= GETDATE()
BEGIN
    -- Metformin (twice daily) - 8:00 AM and 8:00 PM
    INSERT INTO MedicationLogs (medicationId, scheduledTime, taken, takenAt, missed, reminderSent)
    VALUES 
    (1, DATEADD(HOUR, 8, CAST(@CurrentDate AS DATETIME2)), 
     CASE WHEN RAND() < 0.9 THEN 1 ELSE 0 END,
     CASE WHEN RAND() < 0.9 THEN DATEADD(MINUTE, 15, DATEADD(HOUR, 8, CAST(@CurrentDate AS DATETIME2))) ELSE NULL END,
     CASE WHEN RAND() < 0.9 THEN 0 ELSE 1 END, 1),
    (1, DATEADD(HOUR, 20, CAST(@CurrentDate AS DATETIME2)),
     CASE WHEN RAND() < 0.85 THEN 1 ELSE 0 END,
     CASE WHEN RAND() < 0.85 THEN DATEADD(MINUTE, 10, DATEADD(HOUR, 20, CAST(@CurrentDate AS DATETIME2))) ELSE NULL END,
     CASE WHEN RAND() < 0.85 THEN 0 ELSE 1 END, 1);
    
    -- Lisinopril (once daily) - 7:00 AM
    INSERT INTO MedicationLogs (medicationId, scheduledTime, taken, takenAt, missed, reminderSent)
    VALUES 
    (2, DATEADD(HOUR, 7, CAST(@CurrentDate AS DATETIME2)),
     CASE WHEN RAND() < 0.95 THEN 1 ELSE 0 END,
     CASE WHEN RAND() < 0.95 THEN DATEADD(MINUTE, 8, DATEADD(HOUR, 7, CAST(@CurrentDate AS DATETIME2))) ELSE NULL END,
     CASE WHEN RAND() < 0.95 THEN 0 ELSE 1 END, 1);
    
    -- Atorvastatin (once daily) - 8:00 PM
    INSERT INTO MedicationLogs (medicationId, scheduledTime, taken, takenAt, missed, reminderSent)
    VALUES 
    (3, DATEADD(HOUR, 20, CAST(@CurrentDate AS DATETIME2)),
     CASE WHEN RAND() < 0.80 THEN 1 ELSE 0 END,
     CASE WHEN RAND() < 0.80 THEN DATEADD(MINUTE, 30, DATEADD(HOUR, 20, CAST(@CurrentDate AS DATETIME2))) ELSE NULL END,
     CASE WHEN RAND() < 0.80 THEN 0 ELSE 1 END, 1);
    
    SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
END;

-- Insert sample Appointments
INSERT INTO Appointments (userId, doctorId, appointmentDate, reason, status, notes, duration)
VALUES 
-- Upcoming appointments
(1, 1, DATEADD(HOUR, 10, DATEADD(DAY, 7, GETDATE())), 'Regular diabetes checkup', 'scheduled', 'Bring latest blood test results and medication list', 30),
(1, 2, DATEADD(HOUR, 14, DATEADD(MINUTE, 30, DATEADD(DAY, 14, GETDATE()))), 'Cardiology follow-up', 'scheduled', 'Review current medications and blood pressure readings', 45),
(2, 1, DATEADD(HOUR, 9, DATEADD(MINUTE, 30, DATEADD(DAY, 3, GETDATE()))), 'Annual health screening', 'scheduled', 'Fasting required - no food after midnight', 60),
(3, 3, DATEADD(HOUR, 11, DATEADD(DAY, 10, GETDATE())), 'Diabetes management review', 'scheduled', 'Insulin dosage adjustment consultation', 30),

-- Past appointments for history
(1, 1, DATEADD(HOUR, 15, DATEADD(DAY, -30, GETDATE())), 'Initial diabetes consultation', 'completed', 'Started on Metformin. Follow up in 1 month.', 45),
(2, 1, DATEADD(HOUR, 10, DATEADD(MINUTE, 30, DATEADD(DAY, -15, GETDATE()))), 'Hypertension consultation', 'completed', 'Blood pressure well controlled. Continue current medication.', 30),
(3, 2, DATEADD(HOUR, 16, DATEADD(DAY, -45, GETDATE())), 'Heart failure consultation', 'completed', 'Added Carvedilol and Furosemide. Lifestyle counseling provided.', 60);

-- Insert Emergency Contacts
INSERT INTO EmergencyContacts (userId, contactName, relationship, phoneNumber, email, priority, alertDelayHours)
VALUES 
-- For User 1 (Ryan Yip)
(1, 'Linda Yip', 'spouse', '+65 9123 4567', 'linda.yip@gmail.com', 1, 0),
(1, 'David Yip', 'son', '+65 8765 4321', 'david.yip@gmail.com', 2, 2),
(1, 'Dr. Sarah Lim Clinic', 'doctor', '+65 6123 4567', 'emergency@sarahlim.clinic', 3, 0),

-- For User 2 (Mary)
(2, 'Peter Tan', 'son', '+65 9876 5432', 'peter.tan@gmail.com', 1, 0),
(2, 'Jenny Tan', 'daughter', '+65 8123 4567', 'jenny.tan@gmail.com', 2, 1),

-- For User 3 (John)
(3, 'Alice Lim', 'wife', '+65 9234 5678', 'alice.lim@gmail.com', 1, 0),
(3, 'Michael Lim', 'son', '+65 8345 6789', 'michael.lim@gmail.com', 2, 2);

-- Insert Caregiver Relationships
INSERT INTO CaregiverRelationships (caregiverId, patientId, relationship, accessLevel)
VALUES 
-- Sarah Wong as caregiver for both elderly users
(4, 2, 'daughter', 'full'),  -- Sarah caring for Mary (if Sarah is user 4)
(4, 3, 'family_friend', 'alerts'), -- Sarah helping John's family

-- Family member relationships
(1, 2, 'friend', 'monitoring'),  -- Ryan and Mary are friends
(2, 3, 'neighbor', 'monitoring'); -- Mary helps monitor John

-- Insert some Health Metrics for tracking
INSERT INTO HealthMetrics (userId, metricType, value, unit, notes, recordedAt)
VALUES 
-- User 1 recent metrics
(1, 'blood_glucose', 145, 'mg/dL', 'Fasting glucose slightly elevated', DATEADD(DAY, -2, GETDATE())),
(1, 'blood_pressure_systolic', 135, 'mmHg', 'Morning reading', DATEADD(DAY, -1, GETDATE())),
(1, 'blood_pressure_diastolic', 85, 'mmHg', 'Morning reading', DATEADD(DAY, -1, GETDATE())),
(1, 'weight', 78.5, 'kg', 'After breakfast', GETDATE()),

-- User 2 metrics
(2, 'blood_pressure_systolic', 128, 'mmHg', 'Well controlled', DATEADD(DAY, -3, GETDATE())),
(2, 'blood_pressure_diastolic', 78, 'mmHg', 'Well controlled', DATEADD(DAY, -3, GETDATE())),
(2, 'weight', 65, 'kg', 'Stable weight', DATEADD(DAY, -1, GETDATE())),

-- User 3 metrics (diabetes + heart)
(3, 'blood_glucose', 180, 'mg/dL', 'Post-meal reading, needs attention', DATEADD(DAY, -1, GETDATE())),
(3, 'hba1c', 7.8, '%', 'Quarterly lab result', DATEADD(DAY, -7, GETDATE())),
(3, 'weight', 82, 'kg', 'Gradual weight loss as recommended', GETDATE());

-- Insert some CaregiverAlerts for demonstration
INSERT INTO CaregiverAlerts (caregiverId, patientId, medicationId, alertType, alertMessage, severity)
VALUES 
(4, 2, 5, 'medication_missed', 'Mary Tan missed her Amlodipine dose at 8:00 AM', 'warning'),
(4, 3, 8, 'medication_taken', 'John Lim took his Insulin Glargine at 10:15 PM (15 minutes late)', 'info'),
(1, 2, NULL, 'health_concern', 'Blood pressure reading of 145/90 recorded - higher than usual', 'warning');

-- Insert Drug Conflicts for testing conflict detection
INSERT INTO DrugConflicts (medicationId, conflicting_medication, severity, description, resolved)
VALUES 
(1, 'Alcohol', 'moderate', 'Alcohol may increase the risk of lactic acidosis with Metformin', 0),
(4, 'Ibuprofen', 'moderate', 'NSAIDs may increase bleeding risk when taken with Aspirin', 0);

-- Insert Doctor Availability for remaining doctors
INSERT INTO DoctorAvailability (doctorId, day_of_week, start_time, end_time, is_available)
VALUES 
-- Dr. Priya Patel (Endocrinologist) - specialized hours
(3, 'Monday', '08:00:00', '16:00:00', 1),
(3, 'Tuesday', '08:00:00', '16:00:00', 1),
(3, 'Wednesday', '08:00:00', '12:00:00', 1),
(3, 'Thursday', '08:00:00', '16:00:00', 1),
(3, 'Friday', '08:00:00', '14:00:00', 1),

-- Dr. James Wong (Geriatrician) - senior-friendly hours
(4, 'Monday', '09:00:00', '17:00:00', 1),
(4, 'Tuesday', '09:00:00', '17:00:00', 1),
(4, 'Wednesday', '09:00:00', '17:00:00', 1),
(4, 'Thursday', '09:00:00', '17:00:00', 1),
(4, 'Friday', '09:00:00', '15:00:00', 1);

-- Create some adherence reports for demonstration
INSERT INTO AdherenceReports (userId, reportType, reportData, expiresAt)
VALUES 
(1, 'weekly', '{"adherence_rate": 87, "medications": [{"name": "Metformin", "taken": 12, "missed": 2}, {"name": "Lisinopril", "taken": 7, "missed": 0}], "generated": "2025-07-31"}', DATEADD(DAY, 7, GETDATE())),
(2, 'monthly', '{"adherence_rate": 94, "medications": [{"name": "Amlodipine", "taken": 28, "missed": 2}], "generated": "2025-07-31"}', DATEADD(DAY, 30, GETDATE())),
(3, 'weekly', '{"adherence_rate": 78, "medications": [{"name": "Insulin Glargine", "taken": 6, "missed": 1}, {"name": "Metformin", "taken": 11, "missed": 3}], "generated": "2025-07-31"}', DATEADD(DAY, 7, GETDATE()));

-- Update medication categories for better organization
UPDATE Medications SET category = 'Chronic Disease' WHERE name IN ('Metformin', 'Lisinopril', 'Insulin Glargine', 'Carvedilol');
UPDATE Medications SET category = 'Preventive Care' WHERE name IN ('Aspirin', 'Atorvastatin');
UPDATE Medications SET category = 'Supplements' WHERE name LIKE '%Vitamin%' OR name LIKE '%Calcium%';

-- Create sample emergency alerts for testing
INSERT INTO EmergencyAlerts (userId, contactId, alertType, alertMessage, sentVia, deliveryStatus, sentAt)
VALUES 
(1, 1, 'missed_medication', 'Ranen has missed 2 consecutive Metformin doses. Last dose: Yesterday 8:00 PM', 'sms', 'delivered', DATEADD(HOUR, -2, GETDATE())),
(3, 7, 'health_concern', 'John Lim blood glucose reading of 280 mg/dL is critically high. Immediate attention needed.', 'email', 'delivered', DATEADD(HOUR, -6, GETDATE()));

PRINT 'InitialiseValues.sql completed successfully!';
PRINT 'Test data created for:';
PRINT '- 4 Test users with different medical profiles';
PRINT '- 10 Realistic medications with proper categories and instructions';
PRINT '- 30 days of medication logs showing varying compliance rates';
PRINT '- 7 Sample appointments (past, present, and future)';
PRINT '- 8 Emergency contacts with different relationships and alert settings';
PRINT '- 4 Caregiver relationships with different access levels';
PRINT '- Health metrics tracking for all users';
PRINT '- Sample alerts and notifications';
PRINT '- Drug conflict detection examples';
PRINT '- Doctor availability schedules';
PRINT '- Adherence reports for testing dashboard features';
PRINT '';
PRINT 'Your MODULE 1 database is now ready for comprehensive testing and demonstration!';

-- Verification queries to show what was created
SELECT 'Total Users' as Metric, COUNT(*) as Count FROM Users
UNION ALL
SELECT 'Total Medications', COUNT(*) FROM Medications  
UNION ALL
SELECT 'Total Medication Logs', COUNT(*) FROM MedicationLogs
UNION ALL
SELECT 'Total Appointments', COUNT(*) FROM Appointments
UNION ALL
SELECT 'Total Emergency Contacts', COUNT(*) FROM EmergencyContacts
UNION ALL
SELECT 'Total Caregiver Relationships', COUNT(*) FROM CaregiverRelationships
UNION ALL
SELECT 'Total Health Metrics', COUNT(*) FROM HealthMetrics;

-- Show adherence rates by user
SELECT 
    u.Name as UserName,
    COUNT(ml.logId) as TotalDoses,
    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as TakenDoses,
    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(ml.logId), 1) as AdherenceRate
FROM Users u
JOIN Medications m ON u.ID = m.userId
JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
WHERE ml.scheduledTime >= DATEADD(DAY, -30, GETDATE())
GROUP BY u.ID, u.Name
ORDER BY AdherenceRate DESC;


-- Module 2: Community Events
-- Sample data for community groups
INSERT INTO Groups (Name, Description, GroupPicture, IsPrivate, CreatedAt, CreatedBy)
VALUES 
(
  'Nature Explorers of Singapore - Hiking and Trails',
  'Join fellow nature lovers on weekend hikes, wildlife spotting, and eco-outings across Singapore’s best parks and hidden trails. Everyone is welcome, no experience needed!',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402184362_couple-hiking-mountain-climbing.jpg',
  0,
  '2025-07-13 10:23:05.883',
  1
),
(
  'Singapore Tech Talk Collective - AI, Apps, and Mor',
  'Dive into lively discussions on artificial intelligence, mobile apps, smart gadgets, and tech news over casual meetups. Great for all ages and skill levels.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753826510097_tech-talks-series-social-en.jpg',
  0,
  '2025-07-13 10:24:06.550',
  1
),
(
  'Golden Groove Society - Music Lovers and Jammers',
  'Whether you sing, strum, or just love to listen, this group connects generations through music appreciation sessions, informal jam nights, and storytelling.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402291784_655e0fa544c67c1ee5ce0f7c_how-to.jpg',
  0,
  '2025-07-13 10:24:53.320',
  1
),
(
  'Book Buddies Reading Circle - Monthly Book Discuss',
  'From thrillers to biographies, our members vote on a new book every month and meet to discuss over tea. Ideal for casual readers and literary enthusiasts alike.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402308787_older-male-friends-reading-newsp.jpg',
  0,
  '2025-07-13 10:25:10.370',
  1
),
(
  'Early Risers Walking Group - Morning Wellness Stro',
  'Kickstart your mornings with a refreshing walk and friendly chatter. We explore parks, gardens, and local landmarks while promoting healthy living and community bonding.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402321077_360_F_462429607_hh4RpG0tYZ5j9BFx.jpg',
  0,
  '2025-07-13 10:25:22.573',
  1
);

INSERT INTO Announcements (GroupID, Title, Content, ImageUrl, CreatedAt, CreatedBy)
VALUES
  (1,
   'Trail Clean‑Up Day',
   'Join us next Sunday for a community trail clean‑up at MacRitchie Reservoir. Gloves and trash bags will be provided!',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753827587369_622c9db03e233386fd9e8fd9_cleanup.jpg',
   '2025-07-30 06:19:48.680',
   1),
  (1,
   'Sunrise Trek Reminder',
   'Don''t forget our sunrise trek this Saturday at Bukit Timah Hill! Meet at the main entrance by 6:30 AM. Water and light snack recommended',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753827507713_1680164838571.jpg',
   '2025-07-30 06:18:29.967',
   1),
  (2,
   'Guest Speaker: Cloud Security',
   'Excited to host Jane Tan on July 29 at 7 PM. She''ll share best practices in cloud security for mobile apps.',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753827832237_Cloud-security-as-a-service-head.jpg',
   '2025-07-30 06:23:53.760',
   1),
  (2,
   'Next AI Meetup',
   'Our next meetup is on Tuesday at 7 PM in the tech lab. We''ll demo a few open‑source AI tools—bring your laptop!',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753827787996_1746631413729.jpg',
   '2025-07-30 06:23:10.220',
   1),
  (3,
   'New Jam Schedule',
   'We''ve updated our jam session schedule: Tuesdays 6 PM and Saturdays 4 PM at Community Hall 3. See you there!',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753827919119_images.jpg',
   '2025-07-30 06:25:20.697',
   1),
  (3,
   'Open Mic Night',
   'Get ready for our monthly open mic this Friday at 8 PM. Instruments, vocals, or just your ears—everyone''s welcome!',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753827878054_httpscdn.evbuc.comimages10535807.jpg',
   '2025-07-30 06:24:39.430',
   1),
  (4,
   'July Discussion Recap',
   'Thanks to everyone who joined the July meeting on "The Alchemist." Notes and highlights have been uploaded to our shared folder.',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753828010297_Untitled-design-3-e1536867937710.jpg',
   '2025-07-30 06:26:51.833',
   1),
  (4,
   'August Book Pick: "Educated"',
   'We''ve voted on our August read: Tara Westover''s memoir "Educated." Grab your copy and join us August 30 at 3 PM.',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753827973948_Educated-Tara-Westover.jpg',
   '2025-07-30 06:26:15.247',
   1),
  (5,
   'Monthly Wellness Breakfast',
   'Join us next month for a post‑walk healthy breakfast at the café near the ArtScience Museum, July 28 at 8 AM.',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753828100663_50710c0b805cee57b74b34fb1324cfef.jpg',
   '2025-07-30 06:28:22.047',
   1),
  (5,
   'Weekend Botanic Walk',
   'This Saturday we''ll explore the Flower Dome and Supertree Grove at 7 AM. Meet at the Gardens by the Bay main gate.',
   'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1753828055095_1siO2ETUnwgtQCauzF5mK7Q.jpg',
   '2025-07-30 06:27:37.163',
   1);

INSERT INTO Comments (AnnouncementID, UserID, Content, CreatedAt)
VALUES
  (2,  1, 'Great initiative! Count me in.',              '2025-07-30 07:00:00'),
  (2,  1, 'Can’t wait to help tidy up the trail.',       '2025-07-30 07:05:00'),
  (1,  1, 'Sounds awesome—see you bright and early!',    '2025-07-30 07:10:00'),
  (4,  1, 'Jane Tan always gives the best insights.',     '2025-07-30 07:20:00'),
  (4,  1, 'Looking forward to learning more about this.', '2025-07-30 07:25:00'),
  (3,  1, 'I’ll bring my laptop—ready to code!',          '2025-07-30 07:30:00'),
  (6,  1, 'Perfect—Tuesdays work best for me.',           '2025-07-30 07:35:00'),
  (6,  1, 'Can we also set up a Sunday afternoon slot?',  '2025-07-30 07:40:00'),
  (5,  1, 'I might just bring my guitar!',                '2025-07-30 07:45:00'),
  (8,  1, 'Thanks for sharing the notes—very helpful!',   '2025-07-30 07:50:00'),
  (7,  1, 'Great choice—a must-read!',                    '2025-07-30 07:55:00'),
  (10, 1, 'Sounds delicious—I’m in!',                     '2025-07-30 08:00:00'),
  (10, 1, 'Any vegetarian options available?',            '2025-07-30 08:05:00'),
  (9,  1, 'Can’t wait to see the Supertrees again.',      '2025-07-30 08:10:00');




-- Module 3: Transport Navigator
-- Sample data for facilities
INSERT INTO Facilities (
    name, address, facilityType, phoneNo, hours,
    image_url, static_map_url, latitude, longitude,
    google_place_id
)
VALUES
    ('Bukit Panjang Polyclinic', 
    '50 Woodlands Rd, #03-02, Singapore', 
    'Polyclinic', 
    '6908 2222', 
    'Monday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Tuesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Wednesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Thursday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Friday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Saturday: 8:00 AM - 12:30 PM; Sunday: Closed',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpe0VXI08H39yiBv_f99RLm0d7Yb0-_isIvPBx5US7eDmQ0w-Th0Dk_0K8azJVIgdm6eykcDfx3h2vi8aj6cRtWhwOxrcperM3n4c-ukaKWn-VQP_7cVMvVHIkUlE0m6CKOXwor2cHvBEER1keMHGsnqsxUrulxMJGlGuIXbiq3O4PlhK5buW3-KlFXmpwYbVGw0Fyfxq-NpJyS7uZd3Ru4HCW3jpab-9oaaamViSX67inxGw6hFnSTB_GjLD8Kimfg7Z5oM_0_OwXFyAvuvPrqR8P0S58JzICoI8482_68p1C7EtO5ZwlYEEXso1zZtX-Q7ts2yatett5Tm449cqXaQAUc9vnR9jhbaHXAE_SL2Mx49pfIL1NIK2gCYi7_xsY2WlH-iXGpB5zurZB3x7Wb9bNBAjuYXS-pfrD2sdNibpo7eimxCQIo6ZA275_-uHFMnUqoV_6P7DPvtIKN_aWKLpVxBLuc0l4nfSJitapCl8aVmE4UXTP1ZmwsuZ5zzL8-ODMLfgihTEuiwPORDYJJh8oq34RBKGxCNHG-cbTQnS0m0-94AGW5R--LSf9WgwXGKYU7d&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3830275,103.7598355&zoom=15&size=400x200&markers=color:red%7C1.3830275,103.7598355&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3830275, 
    103.7598355,
    'ChIJzYwU2PoR2jERoCNtSpIlsQU'
    ),
    ('Kallang Polyclinic', 
    '701 Serangoon Rd, Singapore', 
    'Polyclinic', 
    '6355 3000', 
    'Monday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Tuesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Wednesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Thursday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Friday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Saturday: 8:00 AM - 12:30 PM; Sunday: Closed',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpctCOJDv6VngJwnpPjD0c28m5jFFFeXUyYFrhBGZbASUZ66KYikikBMm-GAIyH6cvHpj0C2Yo5oxq08bcKe6ScSMJrfHVOWmFmTa8-WxHv5vW4jsx4gmMz0izh8EKylaAVvjieGooF-3hf5xhc48-Gcx7DrXK7_5pwrwMCtuC-CZbPWgI50fjz_9H5IHYiYPrcaWYYlNmG3ZBtav7CZEHGL8jxw-REt_5nRBgXTHFlu2V5FU7FFNw7IsmjC3fJxi2_WSZbh7QLRVxpXKBSevdeLnitZhGCwEdyEVD5KopG32sLXTpcBGQqu7ShTu6gzlEhASc0NYsrBd9qBRBgQtBV6TOYdvnEeAt3RReITpMk9YdAuKKzkfBzYFaRHfdtZJ_XdgkyLKpZJczmg_K97TF2raEo6mz4gMlQRJfwZsBdRo6ZzT5JnL6mCsuF_q8w7gE-ZxufJhiIISQcXhAHeQFTPDnq5sT04i5I85UhZ-15KhzDVu-s8xg-UPReuuGXM_u8A5MtNjSAexjjB09srscECHy216vYlxSDHCxTX5BUl8TzrF7QGHeqghZF9O4oz8PRFE30u&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3166556,103.8586735&zoom=15&size=400x200&markers=color:red%7C1.3166556,103.8586735&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3166556, 
    103.8586735,
    'ChIJW-QhM_kZ2jEReRtSMTpBYcM'
    ),
    ('Gleneagles Hospital', 
    '6A Napier Road', 
    'Hospital', 
    '6575 7575', 
    'Monday: Open 24 hours; Tuesday: Open 24 hours; Wednesday: Open 24 hours; Thursday: Open 24 hours; Friday: Open 24 hours; Saturday: Open 24 hours; Sunday: Open 24 hours',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpfn8yvQ5FyJg3s8rc9ujll86_FsJFqHoJ6kGVu49_ssbFuquGhhZTEcdchAAhODCG7xBzlntvYFLS1z1mIZY3boJps5WyM10G85iPb4zrXv3BDyQ6K2DCIcAlYwx13VgomXHiSVwwvdkdmt7NLHS0cyB5eLMurWNKbxocPVeM_E_yX30-eKICS4dtKwqmZtdEspY0xdcMVXbKYMNYfCRgxkWDg4BThdmjZr0IC7VXyGeyFAFzkKqin77JWiXrp4nXuqlHzKPPJgw6S4KZRmg96puOiQpdib0o-a1Ip4FoG9ONlKyp8C5_ChGZoIwj6XVU-S_GnFnXI&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3830275,103.7598355&zoom=15&size=400x200&markers=color:red%7C1.3830275,103.7598355&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcYhttps://maps.googleapis.com/maps/api/staticmap?center=1.3076174,103.8198659&zoom=15&size=400x200&markers=color:red%7C1.3076174,103.8198659&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3076174, 
    103.8198659,
    'ChIJWXTRJCAa2jERXNBB0kxTWSU'
    ),
    ('Mount Alvernia Hospital', 
    '820 Thomson Road', 
    'Hospital', 
    '6347 6688', 
    'Monday: Open 24 hours; Tuesday: Open 24 hours; Wednesday: Open 24 hours; Thursday: Open 24 hours; Friday: Open 24 hours; Saturday: Open 24 hours; Sunday: Open 24 hours',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpcZEtk_d2nmm1udd1Jjm4SeOQDgMMPqNpyRUtw8dYE7K00hl07DilsFH_sciAediZMNH9YtjXuqYJRzHhtmyfHd8UZDtD6MkKgVyLNkfgBlDhtYEM8DYNuG-U0MvYSN0zkPj03KldRSTdymWjgBiQTaxdIqls4S0wQObwqguNJgjHvngVby2pge9tK5MjJNS6ankJgfaLNWuJlhYqmaq4L5RoqMbAXmpmtU_K4ihDNJQVezoitWPimPsMNqyCEy-RPRViA9m38QqE_n7U1XI9hdYpgXMjO4WACICYZ4xD5g0BHXzSByWwAXf6S6hmsTrRo5cCyT&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3419494,103.8377041&zoom=15&size=400x200&markers=color:red%7C1.3419494,103.8377041&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3419494, 
    103.8377041,
    'ChIJ0yUHzEYX2jERjwP0e9XyUpk'
    ),
    ('Singapore Botanic Gardens', 
    '1 Cluny Road, Singapore', 
    'Park', 
    '6471 7138', 
    'Monday: 5:00 AM - 12:00 AM; Tuesday: 5:00 AM - 12:00 AM; Wednesday: 5:00 AM - 12:00 AM; Thursday: 5:00 AM - 12:00 AM; Friday: 5:00 AM - 12:00 AM; Saturday: 5:00 AM - 12:00 AM; Sunday: 5:00 AM - 12:00 AM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpd1oMcxkBv-4xzProJp7RmLKURmzQHQMUIiUp0sYO6H4ZSEb-KPZM0pleiChWV_Pzd3GmtIJgbGH7k6cmm-JCFkVwwEzUlfoouC9sUSoKS4g_76Kr-vh2ghBRgYSfkT6dRizmyjW5X8dtrQcwhsMe_ebYeV-AfRi60UMEVuZtHJiHv_c2ukujs4xaiA-jsmQsnA3COk_pEDCqKckfGOAz-3n9McFioWJuRIgTpRa0x45ixo_ABfhzR0ki2f8b7pyKYgjOSQST3d2uY6-D27mSCtQh9JgD6FoEjDqLlTW8BanBa7vbCJIkbF9S3zvcEciE-B1fQEmrq6fglFi0fijdngg8BcxK49Awt3wtcf8WqyvOt55utxHMCUwV5d51IIleT2YzaAOyt69ATJKsN1WQ8pOzzkjr58yj1e3PhmXqRLbX9D64rM11uSWWxZXjuwCOKBof4qc9GEOMzBXqFf4okcRHfRIW20rdnAxQRpVeePMhfL3r_Qwirjtvb63oFaDYNlV5TRhnY_nyQCT3A55UYtWK-0xxJvkYQmuT2eBNYqiRoHQgU12oKb1mtgRXtztlD57GP0bVNyunrR4RsOgS-RDQTOJEhQh0YKfNIcZ1p2xd_4WVLWFJe-EcP9c-Dn6e0L3Q&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3138397,103.8159136&zoom=15&size=400x200&markers=color:red%7C1.3138397,103.8159136&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3138397, 
    103.8159136,
    'ChIJvWDbfRwa2jERgNnTOpAU3-o'
    ),
    ('Gardens by the Bay', 
    '18 Marina Gardens Drive', 
    'Park', 
    '6420 6848', 
    'Monday: 5:00 AM - 2:00 AM; Tuesday: 5:00 AM - 2:00 AM; Wednesday: 5:00 AM - 2:00 AM; Thursday: 5:00 AM - 2:00 AM; Friday: 5:00 AM - 2:00 AM; Saturday: 5:00 AM - 2:00 AM; Sunday: 5:00 AM - 2:00 AM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpecmCaXeJXgBs08qNBMSRreiIeFFIc5bNfoWOSH4qZAjILG7umimX9IRiAZE4j3AbsHHxKrQ49_IoGTPumOpMpCVnOepWOyctNqoZ-SUNgszN7cUtLGlrhuhYKrr-cZrJbkhgcPN6h9xqTMqlD8Vi1ifNHkEvDbFbnHbQwpAZ818OZ_Uck-bpDbEdnHppwCsx7f0609oP4MY54qTgjJDnwf2CN_FcFQd0nHYDUaDBqlQfxQ4JJJqW8GunwTo1x-LoQXHS4_8q0dWkBcmT0z9eBcrQl59q5_TIDsGz9gMmdVBT9hwUNZmucXFGPDAZA1aIKBzkKeIidG-bDXnF_urHy8MKPlU5yE_fTV1Ak6SwkOKOsAtmujalY_qDq-jqWEw79owvqYa_nfY1TcUCBDH4z6UHO3B0S6I_mxpZmPkxf5HK9PdEfA_MCPtwRvk9fY9DXYlBMzOtnbRg6Hmd5WHTeTgDBssOx9gaER0EK9YuMm4Sa33lrXP1Na_hheMg6zrkPsbNvKxtRRinZ57olb6H97mwanpeyFhB9S7Ie3YyxTW8ZQR77x8Tl7-Vw4HA2XJ4Tn8lUlJ1JPB0CmCAo4H29ig-rWR6YR3XXkctj7MkNq7rVjWopj21A-8RvF0fBq08JJZw&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.2815683,103.8636132&zoom=15&size=400x200&markers=color:red%7C1.2815683,103.8636132&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.2815683, 
    103.8636132,
    'ChIJMxZ-kwQZ2jERdsqftXeWCWI'
    ),
    ('Jalan Besar Community Club', 
    '69 Jellicoe Rd, Singapore', 
    'Community Center', 
    '6298 6110', 
    'Monday: 9:00 AM - 10:00 PM; Tuesday: 9:00 AM - 10:00 PM; Wednesday: 9:00 AM - 10:00 PM; Thursday: 9:00 AM - 10:00 PM; Friday: 9:00 AM - 10:00 PM; Saturday: 9:00 AM - 10:00 PM; Sunday: 9:00 AM - 10:00 PM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpdlXiU1VcZ4bEXqVafaWcbtLACPIJF2mT2QZk3Om_HeM-GyQhNqPQnvmvC8XZPQ9uuAaR_VkjpxLLztrBK0u6eUmdvuBi2VC7swpM5-bRGFoatM45JyiDJm3SoXcaGYO_gl2zRvric1EKPlpn6A2PbMbfupjBjQ0NcjJG1TkufGiFjN3gGJqwAzf5wRlTp1ewcsyneTF5I78H2m3sN9UujFDA07aKuJ2FcxnnWvzrggjRZ10bCjqsuC6HgWF_ahk0mMOfsmRwV4CIcOifCW8dEk9bHWyVauxhTcF7PkN4w8VRaRpAm7FQXydbwl6oFmh39WKffb3ujtc-aQcisHyKNNqvOFiVCAxjVNdpbPvZoSHUbJGZqB-ZmgcY5KmWknpUQEDQEBxR4nZ7EBgl69x4ScmOQ8sQ_KP4pPqIiD4TGKrzm0yxSJtvHivJgUeEmED9unIuCSLQNX4mF5Rl_CghQYBQpWf6Aawjmu4R393g0_EMM1zFxwy9hd8m5_amoTfG5mCVevY79pcEtnLKfLNl5FEt3LjP-Py4Dmpsk7bOsRH1JDUT4hXwEUHVUlqlEErOol6gAZ&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3078946,103.8617082&zoom=15&size=400x200&markers=color:red%7C1.3078946,103.8617082&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3078946, 
    103.8617082,
    'ChIJd4Ja-ckZ2jERhr2arEOISJg'
    ),
    ('Tanjong Pagar Community Club', 
    '101 Cantonment Rd, Singapore', 
    'Community Center', 
    '6221 9898', 
    'Monday: 10:00 AM - 6:00 PM; Tuesday: 10:00 AM - 6:00 PM; Wednesday: 10:00 AM - 6:00 PM; Thursday: 10:00 AM - 6:00 PM; Friday: 10:00 AM - 6:00 PM; Saturday: 10:00 AM - 6:00 PM; Sunday: 10:00 AM - 6:00 PM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpffUxEy2DC3X2lH92Y4gVPBByDBD2c6vQHpNIqbBFjMjTSm2cl5bQzhJahiI4ehwMsQf21vthpMi4Qk7FqqGgteAK8v0ML_tCBgJXsvOB9TqxvYe2Qgqs4yRDIIcR_n8Ycl7ZM7V2iWDKfYMJA1MhI-hae-jqOgwP4-vg_qtg_Hpu3BdDAR8eV_RSi26FQvRH_Pnxiibr9D2g0h8q2jNRRD-sFy3tMJ6i_coFWzDDKzoTjIzugCvDVXJNkZwnIAX9_ZuYIqwnzXl6BkwWV4Pl5Ui7Hz4UAfcpFLJrm6lgEBUqc_--LEOj2GkLy05W5DbbD5PQBGVUf6V_yAY3XzoY6MYmrZvcXq6zBl513rOdMrQC_Hm6DUdjrCkAlYlqOpuMzqADpuHKjE8FLri8IPzU9itmm6UD53T8j86VWFlYZJR1xsXidf6bZh_SaCzxRc63twQ_rnCNDYAw0V6jBnWbCHsad-ysC9kffoMgvIzbXAMhChyXkao29NKjjKmhSfG441PauL2t2G1vB50p16GgnPf7WZzTD99XsdHBVYc-HSVwwAxPYnVfwFP-TWMxTPNOP6vsL0&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.2761083,103.8416067&zoom=15&size=400x200&markers=color:red%7C1.2761083,103.8416067&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.2761083, 
    103.8416067,
    'ChIJoSghZGwZ2jERh4q9jEcnnXM'
    );


-- Module 4: Senior Fitness Coach
-- Sample Data

-- Categories
INSERT INTO categories (name) VALUES
('Limited Mobility / Seated Exercises'),
('Full Mobility / Active Seniors'),
('Heart Health & Light Cardio'),
('Relaxation & Flexibility');

-- Exercises
INSERT INTO exercises (title, description, image_url, categoryId, benefits) VALUES
-- Category 1: Limited Mobility / Seated Exercises
('Seated Knee Lifts', 
 'A simple seated movement that strengthens thighs and supports circulation. Ideal for those with limited mobility.', 
 '/exercise/images/seated_knee_lifts.png', 1,
 'This exercise helps stimulate blood flow in your legs and strengthens your thigh muscles. You may feel improved lower-body control and reduced stiffness.'),
 
('Seated Arm Circles', 
 'A gentle arm movement performed while seated to promote flexibility and shoulder mobility.', 
 '/exercise/images/seated_arm_circles.png', 1,
 'Expect improved range of motion in your shoulders and upper arms. You’ll feel more limber and energized in your upper body.'),

('Seated Toe Taps', 
 'Tap your toes to light music while seated. Helps with ankle flexibility and blood flow.', 
 '/exercise/images/seated_toe_taps.png', 1,
 'Your ankles will feel more mobile and engaged. This light cardio can also boost circulation in your lower legs.'),

('Chair Yoga', 
 'A gentle form of yoga performed while seated or using a chair for support. Great for beginners and people with limited mobility.', 
 '/exercise/images/chairyoga.png', 1,
 'You should feel a sense of calm, reduced stress, and gentle flexibility. Expect improved posture and mental clarity after the session.'),

-- Category 2: Full Mobility / Active Seniors (Outdoor Activities)
('Guided Nature Walk', 
 'A leisurely outdoor walk through parks or gardens that promotes mobility, cardiovascular health, and mental wellness.', 
 '/exercise/images/guided_nature_walk.png', 2,
 'You’ll feel refreshed and energized, with better circulation and cardiovascular endurance. The outdoor setting also supports mental relaxation.'),

('Outdoor Tai Chi', 
 'A flowing, low-impact movement routine practiced in open spaces to improve balance, flexibility, and mindfulness.', 
 '/exercise/images/outdoor_tai_chi.png', 2,
 'You will notice increased mental clarity and body control. Expect a sense of peace and enhanced joint flexibility.'),

('Park Pole Stretches', 
 'Use walking poles or park railings to support gentle stretches for the arms, shoulders, and back.', 
 '/exercise/images/park_pole_stretches.png', 2,
 'This routine promotes flexibility and eases muscular tension in the upper body. You’ll finish with a looser, more open posture.'),

-- Category 3: Heart Health & Light Cardio
('Walk in Place', 
 'A gentle way to get the heart pumping by walking on the spot. Great for warming up or light movement.', 
 '/exercise/images/walk_in_place.png', 3,
 'Your heart rate will gently increase, supporting cardiovascular fitness. You’ll feel warmer, more awake, and physically active.'),

('Seated Jumping Jacks', 
 'A safe, modified version of jumping jacks done while seated. Encourages full-body movement.', 
 '/exercise/images/seated_jumping_jacks.png', 3,
 'You’ll activate both your arms and legs while staying seated. Expect a light cardio boost and improved coordination.'),

('Side Steps with Arm Swings', 
 'Step side to side while gently swinging arms to boost heart rate and coordination.', 
 '/exercise/images/side_steps_arm_swings.png', 3,
 'This movement increases your overall mobility and elevates heart rate. It also improves coordination between upper and lower body.'),

-- Category 4: Relaxation & Flexibility
('Neck Rolls', 
 'A calming movement to reduce neck stiffness and relax upper body muscles. Done gently while seated.', 
 '/exercise/images/neck_rolls.png', 4,
 'Expect a noticeable release of tension in your neck and shoulders. You may feel more at ease and less stiff in your upper body.'),

('Deep Breathing', 
 'A mindful breathing technique to promote relaxation and reduce stress. Can be done anywhere.', 
 '/exercise/images/deep_breathing.png', 4,
 'You will feel calmer and more centered, with slower breathing and reduced tension. It helps reset your body and mind.'),

('Gentle Seated Twists', 
 'Turn your upper body slowly while seated to stretch the spine and improve flexibility.', 
 '/exercise/images/gentle_seated_twists.png', 4,
 'This twist can enhance spinal flexibility and circulation. You’ll finish feeling refreshed and more mobile in your upper torso.');

-- Exercises steps
INSERT INTO exercise_steps (exerciseId, step_number, instruction) VALUES
-- Seated Knee Lifts
(1, 1, 'Sit upright on a sturdy chair with feet flat on the ground.'),
(1, 2, 'Place hands on the sides of the chair for balance.'),
(1, 3, 'Lift your right knee slowly toward your chest.'),
(1, 4, 'Lower your right leg back to the floor.'),
(1, 5, 'Lift your left knee toward your chest.'),
(1, 6, 'Lower your left leg back to the floor.'),
(1, 7, 'Repeat for 10–12 repetitions per leg.'),

-- Seated Arm Circles
(2, 1, 'Sit comfortably with your back straight.'),
(2, 2, 'Extend both arms out to the sides at shoulder height.'),
(2, 3, 'Slowly make small circles with your arms forward.'),
(2, 4, 'Increase the size of the circles gradually.'),
(2, 5, 'Reverse and make circles in the opposite direction.'),
(2, 6, 'Lower arms and relax.'),
(2, 7, 'Repeat 2–3 sets as comfortable.'),

-- Seated Toe Taps
(3, 1, 'Sit on a chair with your feet flat and back straight.'),
(3, 2, 'Tap your toes on the ground while keeping your heels down.'),
(3, 3, 'Tap in rhythm, alternating feet if desired.'),
(3, 4, 'Add light music for pacing if preferred.'),
(3, 5, 'Continue tapping for 20–30 seconds.'),
(3, 6, 'Rest and repeat for 2 more rounds.'),

-- Chair Yoga
(4, 1, 'Sit on a chair with your back straight and feet grounded.'),
(4, 2, 'Inhale deeply and raise your arms overhead.'),
(4, 3, 'Exhale and slowly bend forward, reaching toward your toes.'),
(4, 4, 'Return to upright and twist gently to the right.'),
(4, 5, 'Return to center and twist to the left.'),
(4, 6, 'Raise arms again and take a deep breath.'),
(4, 7, 'Exhale and lower arms to relax.'),

-- Guided Nature Walk
(5, 1, 'Start at a comfortable walking pace.'),
(5, 2, 'Take deep breaths and observe your surroundings.'),
(5, 3, 'Maintain good posture and relaxed arms.'),
(5, 4, 'Pause at intervals to stretch or rest.'),
(5, 5, 'Hydrate if needed and continue walking.'),
(5, 6, 'Walk for 15–30 minutes depending on ability.'),

-- Outdoor Tai Chi
(6, 1, 'Stand tall with feet shoulder-width apart.'),
(6, 2, 'Inhale and slowly raise both arms in front of you.'),
(6, 3, 'Exhale while bending knees slightly and pushing arms forward.'),
(6, 4, 'Perform gentle flowing movements in a continuous rhythm.'),
(6, 5, 'Shift weight from one leg to the other slowly.'),
(6, 6, 'Repeat basic forms for 5–10 minutes.'),
(6, 7, 'End by standing still and breathing deeply.'),

-- Park Pole Stretches
(7, 1, 'Stand near a walking pole or railing.'),
(7, 2, 'Place hands on the pole at shoulder height.'),
(7, 3, 'Step back slightly and stretch your arms forward.'),
(7, 4, 'Hold the stretch for 10–15 seconds.'),
(7, 5, 'Perform side stretches by leaning to each side.'),
(7, 6, 'Gently rotate shoulders and back using the pole.'),
(7, 7, 'Repeat each stretch 2–3 times.'),

-- Walk in Place
(8, 1, 'Stand with feet shoulder-width apart.'),
(8, 2, 'Begin marching gently in place.'),
(8, 3, 'Swing arms naturally for balance.'),
(8, 4, 'Increase pace slightly to elevate heart rate.'),
(8, 5, 'Continue walking for 1–2 minutes.'),
(8, 6, 'Slow down gradually and stop.'),
(8, 7, 'Repeat for 2–3 rounds with rest.'),

-- Seated Jumping Jacks
(9, 1, 'Sit upright in a chair with feet flat.'),
(9, 2, 'Extend arms and legs outwards like a jumping jack.'),
(9, 3, 'Return arms and legs to the center.'),
(9, 4, 'Continue the motion in a rhythmic pattern.'),
(9, 5, 'Maintain a steady pace for 30 seconds.'),
(9, 6, 'Rest and repeat 2 more sets.'),

-- Side Steps with Arm Swings
(10, 1, 'Stand with feet together and arms by your side.'),
(10, 2, 'Step to the right and swing arms gently forward.'),
(10, 3, 'Step back to center and repeat to the left.'),
(10, 4, 'Keep movements light and controlled.'),
(10, 5, 'Repeat steps for 1–2 minutes.'),
(10, 6, 'Rest and do another set if desired.'),

-- Neck Rolls
(11, 1, 'Sit or stand comfortably.'),
(11, 2, 'Tilt your head gently toward your right shoulder.'),
(11, 3, 'Roll your head slowly to the front.'),
(11, 4, 'Continue rolling to the left shoulder.'),
(11, 5, 'Complete a full circle slowly and gently.'),
(11, 6, 'Reverse direction and repeat.'),
(11, 7, 'Do 3–5 neck rolls per direction.'),

-- Deep Breathing
(12, 1, 'Sit or lie down in a relaxed position.'),
(12, 2, 'Close your eyes and place one hand on your chest.'),
(12, 3, 'Inhale slowly through your nose for 4 seconds.'),
(12, 4, 'Hold your breath for 2 seconds.'),
(12, 5, 'Exhale slowly through your mouth for 6 seconds.'),
(12, 6, 'Repeat the breathing cycle for 5–10 minutes.'),

-- Gentle Seated Twists
(13, 1, 'Sit tall in a sturdy chair with feet flat.'),
(13, 2, 'Place right hand on the left knee.'),
(13, 3, 'Gently twist your upper body to the left.'),
(13, 4, 'Hold for 5–10 seconds while breathing.'),
(13, 5, 'Return to center and repeat on the other side.'),
(13, 6, 'Do 3–5 repetitions per side.');

