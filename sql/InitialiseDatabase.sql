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
