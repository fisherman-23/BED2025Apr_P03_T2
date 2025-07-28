const axios = require("axios");
const sql = require("mssql");
const dbConfig = require("../dbConfig");

const DAILY_API_KEY = process.env.DAILY_API_KEY;
if (!DAILY_API_KEY) {
  throw new Error("Missing DAILY_API_KEY in environment");
}

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

