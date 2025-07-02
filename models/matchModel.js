const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { hash, compare } = require("../utils/hash.js");
const jwt = require("jsonwebtoken");

async function createMatchProfile(userId, data) {
  const connection = await sql.connect(dbConfig);
  await connection
    .request()
    .input("userId", sql.Int, userId)
    .input("bio", sql.NVarChar, data.bio || "")
    .input("likesHiking", sql.Bit, data.likesHiking || 0)
    .input("likesGardening", sql.Bit, data.likesGardening || 0)
    .input("likesBoardGames", sql.Bit, data.likesBoardGames || 0)
    .input("likesSinging", sql.Bit, data.likesSinging || 0)
    .input("likesReading", sql.Bit, data.likesReading || 0)
    .input("likesWalking", sql.Bit, data.likesWalking || 0)
    .input("likesCooking", sql.Bit, data.likesCooking || 0)
    .input("likesMovies", sql.Bit, data.likesMovies || 0)
    .input("likesTaiChi", sql.Bit, data.likesTaiChi || 0).query(`
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
    `);
}

async function hasMatchProfile(userId) {
  const connection = await sql.connect(dbConfig);
  const result = await connection
    .request()
    .input("userId", sql.Int, userId)
    .query("SELECT 1 FROM MatchProfile WHERE UserID = @userId");

  return result.recordset.length > 0;
}

async function updateMatchProfile(userId, data) {
  const connection = await sql.connect(dbConfig);
  await connection
    .request()
    .input("userId", sql.Int, userId)
    .input("bio", sql.NVarChar, data.bio || "")
    .input("likesHiking", sql.Bit, data.likesHiking || 0)
    .input("likesGardening", sql.Bit, data.likesGardening || 0)
    .input("likesBoardGames", sql.Bit, data.likesBoardGames || 0)
    .input("likesSinging", sql.Bit, data.likesSinging || 0)
    .input("likesReading", sql.Bit, data.likesReading || 0)
    .input("likesWalking", sql.Bit, data.likesWalking || 0)
    .input("likesCooking", sql.Bit, data.likesCooking || 0)
    .input("likesMovies", sql.Bit, data.likesMovies || 0)
    .input("likesTaiChi", sql.Bit, data.likesTaiChi || 0).query(`
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
    `);
}
async function getMatchProfileByUserId(userId) {
  const connection = await sql.connect(dbConfig);
  const result = await connection
    .request()
    .input("userId", sql.Int, userId)
    .query("SELECT * FROM MatchProfile WHERE UserID = @userId");

  return result.recordset[0] || null;
}

async function getPotentialMatches(userId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input("userId", sql.Int, userId).query(`
        WITH CurrentUserProfile AS (
          SELECT LikesHiking, LikesGardening, LikesBoardGames, LikesSinging, LikesReading,
                 LikesWalking, LikesCooking, LikesMovies, LikesTaiChi
          FROM MatchProfile
          WHERE UserID = @userId
        )
        SELECT MP.UserID, MP.Bio,
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
        CROSS JOIN CurrentUserProfile CUP
        WHERE MP.UserID != @userId
          AND MP.UserID NOT IN (
            SELECT TargetUserID FROM MatchInteractions WHERE UserID = @userId
          )
        ORDER BY HobbyMatchScore DESC, MP.LastUpdated DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error in getPotentialMatches:", error);
    throw error;
  }
}

module.exports = {
  getPotentialMatches,
};

module.exports = {
  createMatchProfile,
  hasMatchProfile,
  updateMatchProfile,
  getMatchProfileByUserId,
  getPotentialMatches,
};
