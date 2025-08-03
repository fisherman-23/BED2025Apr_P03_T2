const axios = require("axios");
const sql = require("mssql");
const dbConfig = require("../dbConfig");

const DAILY_API_KEY = process.env.DAILY_API_KEY;
if (!DAILY_API_KEY) {
  throw new Error("Missing DAILY_API_KEY in environment");
}

/**
 * Creates a new Daily.co video meeting room with optional name and expiration.
 * @param {string} [name] - Optional name for the meeting room.
 * @returns {Promise<Object>} Object containing room name and URL.
 */
async function createRoom(name) {
  const endpoint = "https://api.daily.co/v1/rooms";
  const headers = {
    Authorization: `Bearer ${DAILY_API_KEY}`,
    "Content-Type": "application/json",
  };

  const newTime = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
    properties: {
      exp: newTime,
    },
  };
  if (name) {
    payload.name = name;
  }

  const response = await axios.post(endpoint, payload, { headers });
  return {
    name: response.data.name,
    url: response.data.url,
  };
}

/**
 * Generates a meeting token for accessing a specific Daily.co room.
 * @param {string} roomName - The name of the room to generate token for.
 * @param {boolean} [isOwner=false] - Whether the token holder should have owner privileges.
 * @returns {Promise<string>} The generated meeting token.
 */
async function createMeetingToken(roomName, isOwner = false) {
  const endpoint = "https://api.daily.co/v1/meeting-tokens";
  const headers = {
    Authorization: `Bearer ${DAILY_API_KEY}`,
    "Content-Type": "application/json",
  };
  const payload = {
    properties: {
      is_owner: isOwner,
      room_name: roomName
    }
  };

  const response = await axios.post(endpoint, payload, { headers });
  return response.data.token;
}

/**
 * Saves meeting information to the database.
 * @param {string} roomName - The name of the meeting room.
 * @param {string} roomUrl - The URL of the meeting room.
 * @param {number} hostId - The ID of the user hosting the meeting.
 * @returns {Promise<number>} The ID of the saved meeting record.
 */
async function saveMeeting(roomName, roomUrl, hostId) {
  const connection = await sql.connect(dbConfig);
  try {
    const result = await connection
      .request()
      .input("RoomName", sql.VarChar(100), roomName)
      .input("RoomURL", sql.VarChar(500), roomUrl)
      .input("HostID", sql.Int, hostId)
      .query(`
        INSERT INTO Meetings (RoomName, RoomURL, HostID)
        VALUES (@RoomName, @RoomURL, @HostID);
        SELECT SCOPE_IDENTITY() AS ID;
      `);
    return result.recordset[0].ID;
  } finally {
    await connection.close();
  }
}

/**
 * Retrieves meeting information by meeting ID.
 * @param {number} meetingId - The ID of the meeting to retrieve.
 * @returns {Promise<Object|null>} Meeting object with HostID and RoomName, or null if not found.
 */
async function getMeetingById(meetingId) {
  const conn = await sql.connect(dbConfig);
  try {
    const result = await conn
      .request()
      .input("ID", sql.Int, meetingId)
      .query(`
        SELECT ID, RoomName, RoomURL, HostID, CreatedAt
        FROM Meetings
        WHERE ID = @ID
      `);
    return result.recordset[0] || null;
  } finally {
    await conn.close();
  }
}

/**
 * Retrieves meeting URL by room name.
 * @param {string} roomName - The name of the room to look up.
 * @returns {Promise<string|null>} The meeting URL if found, null otherwise.
 */
async function getMeetingByName(roomName) {
  const connection = await sql.connect(dbConfig);
  try {
    const result = await connection.request()
      .input("RoomName", sql.VarChar(100), roomName)
      .query(`
        SELECT RoomURL
        FROM Meetings
        WHERE RoomName = @RoomName
      `);
    return result.recordset[0]?.RoomURL || null;
  } finally {
    await connection.close();
  }
}

module.exports = {
  createRoom,
  createMeetingToken,
  getMeetingById,
  saveMeeting,
  getMeetingByName,
};

