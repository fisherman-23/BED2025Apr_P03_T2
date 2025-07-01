const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { hash, compare } = require("../utils/hash.js");
const jwt = require("jsonwebtoken");

async function getUserIdByUUID(uuid) {
  const connection = await sql.connect(dbConfig);
  const result = await connection
    .request()
    .input("uuid", sql.UniqueIdentifier, uuid)
    .query("SELECT ID FROM Users WHERE PublicUUID = @uuid AND IsActive = 1");

  return result.recordset[0]?.ID || null;
}

async function checkRequestOrFriendshipExists(senderId, receiverId) {
  const connection = await sql.connect(dbConfig);
  const result = await connection
    .request()
    .input("sender", sql.Int, senderId)
    .input("receiver", sql.Int, receiverId).query(`
  SELECT 
    SenderID AS UserID1,
    ReceiverID AS UserID2
  FROM FriendRequests
  WHERE 
    (SenderID = @sender AND ReceiverID = @receiver)
    OR (SenderID = @receiver AND ReceiverID = @sender)

  UNION

  SELECT 
    UserID1,
    UserID2
  FROM Friends
  WHERE
    (UserID1 = @sender AND UserID2 = @receiver)
    OR (UserID1 = @receiver AND UserID2 = @sender)
`);

  return result.recordset.length > 0;
}

async function insertFriendRequest(senderId, receiverId) {
  const connection = await sql.connect(dbConfig);
  await connection
    .request()
    .input("sender", sql.Int, senderId)
    .input("receiver", sql.Int, receiverId)
    .query(
      "INSERT INTO FriendRequests (SenderID, ReceiverID) VALUES (@sender, @receiver)"
    );
}

async function getAllPendingRequests(userId) {
  const connection = await sql.connect(dbConfig);

  const incoming = await connection.request().input("userId", sql.Int, userId)
    .query(`
      SELECT 
        FR.ID,
        FR.SenderID,
        U.Name,
        U.PublicUUID,
        'incoming' AS Direction
      FROM FriendRequests FR
      JOIN Users U ON FR.SenderID = U.ID
      WHERE FR.ReceiverID = @userId
      AND FR.Status != 'pending'
    `);

  const outgoing = await connection.request().input("userId", sql.Int, userId)
    .query(`
      SELECT 
        FR.ID,
        FR.ReceiverID AS TargetID,
        U.Name,
        U.PublicUUID,
        'outgoing' AS Direction
      FROM FriendRequests FR
      JOIN Users U ON FR.ReceiverID = U.ID
      WHERE FR.SenderID = @userId
      AND FR.Status == 'pending'

    `);

  return {
    incoming: incoming.recordset,
    outgoing: outgoing.recordset,
  };
}

async function getFriends(userId) {
  const connection = await sql.connect(dbConfig);
  const result = await connection.request().input("userId", sql.Int, userId)
    .query(`
      SELECT 
        U.ID AS FriendID,
        U.Name,
        U.PublicUUID
      FROM Friends F
      JOIN Users U ON 
        (U.ID = F.UserID1 AND F.UserID2 = @userId)
        OR (U.ID = F.UserID2 AND F.UserID1 = @userId)
    `);

  return result.recordset;
}
async function acceptFriendRequest(userId, requestId) {
  const connection = await sql.connect(dbConfig);

  // Check if request exists and belongs to user
  const result = await connection
    .request()
    .input("requestId", sql.Int, requestId)
    .input("userId", sql.Int, userId)
    .query(
      `SELECT * FROM FriendRequests WHERE ID = @requestId AND ReceiverID = @userId AND Status = 'pending'`
    );

  if (result.recordset.length === 0) {
    throw new Error("Friend request not found or unauthorized");
  }

  const request = result.recordset[0];
  const [user1, user2] = [request.SenderID, request.ReceiverID].sort(
    (a, b) => a - b
  );

  await connection
    .request()
    .input("user1", sql.Int, user1)
    .input("user2", sql.Int, user2).query(`
      IF NOT EXISTS (
        SELECT 1 FROM Friends WHERE UserID1 = @user1 AND UserID2 = @user2
      )
      INSERT INTO Friends (UserID1, UserID2) VALUES (@user1, @user2)
    `);

  await connection
    .request()
    .input("requestId", sql.Int, requestId)
    .query(
      `UPDATE FriendRequests SET Status = 'accepted' WHERE ID = @requestId`
    );
}

async function rejectFriendRequest(userId, requestId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("requestId", sql.Int, requestId)
    .input("userId", sql.Int, userId)
    .query(
      `SELECT * FROM FriendRequests WHERE ID = @requestId AND ReceiverID = @userId AND Status = 'pending'`
    );

  if (result.recordset.length === 0) {
    throw new Error("Friend request not found or unauthorized");
  }

  await connection
    .request()
    .input("requestId", sql.Int, requestId)
    .query(
      `UPDATE FriendRequests SET Status = 'rejected' WHERE ID = @requestId`
    );
}

module.exports = {
  getUserIdByUUID,
  checkRequestOrFriendshipExists,
  insertFriendRequest,
  getAllPendingRequests,
  getFriends,
  acceptFriendRequest,
  rejectFriendRequest,
};
