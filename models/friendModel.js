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

module.exports = {
  getUserIdByUUID,
  checkRequestOrFriendshipExists,
  insertFriendRequest,
};
