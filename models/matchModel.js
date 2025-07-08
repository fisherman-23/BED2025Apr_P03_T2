const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { hash, compare } = require("../utils/hash.js");
const jwt = require("jsonwebtoken");

async function createMatchProfile(userId, data) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      INSERT INTO MatchProfile (
        UserID, Bio, 
        LikesHiking, LikesGardening, LikesBoardGames, LikesSinging,
        LikesReading, LikesWalking, LikesCooking, LikesMovies, LikesTaiChi
      )
      VALUES (
        @userId, @bio,
        @likesHiking, @likesGardening, @likesBoardGames, @likesSinging,
        @likesReading, @likesWalking, @likesCooking, @likesMovies, @likesTaiChi
      )
    `;

    const request = connection.request();
    request.input("userId", sql.Int, userId);
    request.input("bio", sql.NVarChar, data.bio || "");
    request.input("likesHiking", sql.Bit, data.likesHiking || 0);
    request.input("likesGardening", sql.Bit, data.likesGardening || 0);
    request.input("likesBoardGames", sql.Bit, data.likesBoardGames || 0);
    request.input("likesSinging", sql.Bit, data.likesSinging || 0);
    request.input("likesReading", sql.Bit, data.likesReading || 0);
    request.input("likesWalking", sql.Bit, data.likesWalking || 0);
    request.input("likesCooking", sql.Bit, data.likesCooking || 0);
    request.input("likesMovies", sql.Bit, data.likesMovies || 0);
    request.input("likesTaiChi", sql.Bit, data.likesTaiChi || 0);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (e) {
    console.error("Database error in createMatchProfile:", e);
    throw e;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection in createMatchProfile:", e);
      }
    }
  }
}

async function hasMatchProfile(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT 1 FROM MatchProfile WHERE UserID = @userId";
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);
    return result.recordset.length > 0;
  } catch (error) {
    console.error("Database error in hasMatchProfile:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection in hasMatchProfile:", e);
      }
    }
  }
}

async function updateMatchProfile(userId, data) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE MatchProfile SET
        Bio = @bio,
        LikesHiking = @likesHiking,
        LikesGardening = @likesGardening,
        LikesBoardGames = @likesBoardGames,
        LikesSinging = @likesSinging,
        LikesReading = @likesReading,
        LikesWalking = @likesWalking,
        LikesCooking = @likesCooking,
        LikesMovies = @likesMovies,
        LikesTaiChi = @likesTaiChi,
        LastUpdated = GETDATE()
      WHERE UserID = @userId
    `;
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    request.input("bio", sql.NVarChar, data.bio || "");
    request.input("likesHiking", sql.Bit, data.likesHiking || 0);
    request.input("likesGardening", sql.Bit, data.likesGardening || 0);
    request.input("likesBoardGames", sql.Bit, data.likesBoardGames || 0);
    request.input("likesSinging", sql.Bit, data.likesSinging || 0);
    request.input("likesReading", sql.Bit, data.likesReading || 0);
    request.input("likesWalking", sql.Bit, data.likesWalking || 0);
    request.input("likesCooking", sql.Bit, data.likesCooking || 0);
    request.input("likesMovies", sql.Bit, data.likesMovies || 0);
    request.input("likesTaiChi", sql.Bit, data.likesTaiChi || 0);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error in updateMatchProfile:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection in updateMatchProfile:", e);
      }
    }
  }
}

async function getMatchProfileByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM MatchProfile WHERE UserID = @userId";
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error in getMatchProfileByUserId:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(
          "Error closing connection in getMatchProfileByUserId:",
          e
        );
      }
    }
  }
}

async function getPotentialMatches(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      WITH CurrentUserProfile AS (
        SELECT LikesHiking, LikesGardening, LikesBoardGames, LikesSinging, LikesReading,
               LikesWalking, LikesCooking, LikesMovies, LikesTaiChi
        FROM MatchProfile
        WHERE UserID = @userId
      )
      SELECT 
        MP.UserID,
        U.Name,
        U.DateOfBirth,
        MP.Bio,
        MP.LikesHiking,
        MP.LikesGardening,
        MP.LikesBoardGames,
        MP.LikesSinging,
        MP.LikesReading,
        MP.LikesWalking,
        MP.LikesCooking,
        MP.LikesMovies,
        MP.LikesTaiChi,
        (
          CASE WHEN MP.LikesHiking = CUP.LikesHiking AND CUP.LikesHiking = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesGardening = CUP.LikesGardening AND CUP.LikesGardening = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesBoardGames = CUP.LikesBoardGames AND CUP.LikesBoardGames = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesSinging = CUP.LikesSinging AND CUP.LikesSinging = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesReading = CUP.LikesReading AND CUP.LikesReading = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesWalking = CUP.LikesWalking AND CUP.LikesWalking = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesCooking = CUP.LikesCooking AND CUP.LikesCooking = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesMovies = CUP.LikesMovies AND CUP.LikesMovies = 1 THEN 1 ELSE 0 END +
          CASE WHEN MP.LikesTaiChi = CUP.LikesTaiChi AND CUP.LikesTaiChi = 1 THEN 1 ELSE 0 END
        ) AS HobbyMatchScore
      FROM MatchProfile MP
      JOIN Users U ON MP.UserID = U.ID
      CROSS JOIN CurrentUserProfile CUP
      WHERE MP.UserID != @userId
        AND MP.UserID NOT IN (
          SELECT TargetUserID FROM MatchInteractions WHERE UserID = @userId
        )
        AND MP.UserID NOT IN (
          SELECT CASE 
                   WHEN UserID1 = @userId THEN UserID2 
                   ELSE UserID1 
                 END
          FROM Friends
          WHERE UserID1 = @userId OR UserID2 = @userId
        )
      ORDER BY HobbyMatchScore DESC, MP.LastUpdated DESC;
    `;

    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);

    return result.recordset;
  } catch (error) {
    console.error("Error in getPotentialMatches:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection in getPotentialMatches:", e);
      }
    }
  }
}

async function likeUser(userId, targetUserId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Update status to 'liked' or insert if not exists
    await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("targetUserId", sql.Int, targetUserId).query(`
        MERGE MatchInteractions AS target
        USING (SELECT @userId AS UserID, @targetUserId AS TargetUserID) AS source
        ON target.UserID = source.UserID AND target.TargetUserID = source.TargetUserID
        WHEN MATCHED THEN
          UPDATE SET Status = 'liked', Timestamp = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, TargetUserID, Status)
          VALUES (@userId, @targetUserId, 'liked');
      `);

    // Check for reciprocal 'liked' status
    const reciprocal = await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("targetUserId", sql.Int, targetUserId).query(`
        SELECT Status FROM MatchInteractions
        WHERE UserID = @targetUserId AND TargetUserID = @userId
      `);

    if (
      reciprocal.recordset.length > 0 &&
      reciprocal.recordset[0].Status === "liked"
    ) {
      // set both status to 'matched'
      await connection
        .request()
        .input("userId", sql.Int, userId)
        .input("targetUserId", sql.Int, targetUserId).query(`
          UPDATE MatchInteractions
          SET Status = 'matched', Timestamp = GETDATE()
          WHERE (UserID = @userId AND TargetUserID = @targetUserId)
             OR (UserID = @targetUserId AND TargetUserID = @userId);
        `);

      // Insert into Friends table if not exists
      // Ensure user1 is always the smaller ID and user2 is the larger ID
      const user1 = Math.min(userId, targetUserId);
      const user2 = Math.max(userId, targetUserId);

      await connection
        .request()
        .input("user1", sql.Int, user1)
        .input("user2", sql.Int, user2).query(`
          IF NOT EXISTS (
            SELECT 1 FROM Friends
            WHERE UserID1 = @user1 AND UserID2 = @user2
          )
          INSERT INTO Friends (UserID1, UserID2)
          VALUES (@user1, @user2);
        `);

      return { matched: true };
    }

    return { matched: false };
  } catch (error) {
    console.error("Error in likeUser:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection in likeUser:", e);
      }
    }
  }
}

async function skipUser(userId, targetUserId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("targetUserId", sql.Int, targetUserId).query(`
        MERGE MatchInteractions AS target
        USING (SELECT @userId AS UserID, @targetUserId AS TargetUserID) AS source
        ON target.UserID = source.UserID AND target.TargetUserID = source.TargetUserID
        WHEN MATCHED THEN
          UPDATE SET Status = 'skipped', Timestamp = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, TargetUserID, Status)
          VALUES (@userId, @targetUserId, 'skipped');
      `);
  } catch (error) {
    console.error("Error in skipUser:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection in skipUser:", e);
      }
    }
  }
}

module.exports = {
  createMatchProfile,
  hasMatchProfile,
  updateMatchProfile,
  getMatchProfileByUserId,
  getPotentialMatches,
  likeUser,
  skipUser,
};
