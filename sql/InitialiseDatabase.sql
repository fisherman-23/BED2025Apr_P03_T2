-- Drop tables if they exist
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    DROP TABLE dbo.Users;

CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(30) NOT NULL,
	aboutMe VARCHAR(200) NULL,
    phoneNumber CHAR(8) NOT NULL,
    dateOfBirth DATE NOT NULL,
    profilePicture VARCHAR(500) NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    isActive BIT DEFAULT 1
);