-- Drop tables if they exist
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    DROP TABLE dbo.Users;

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
