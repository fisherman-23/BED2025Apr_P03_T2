const meetingsModel = require("../models/meetingsModel");


/**
 * Creates a new video meeting room and returns meeting details with host token.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with meeting ID, URL, and host token or an error status.
 */
async function createMeeting(req, res) {
  try {
    const { name, url } = await meetingsModel.createRoom();
    const token = await meetingsModel.createMeetingToken(name, true);
    const meetingId = await meetingsModel.saveMeeting(name, url, req.user.id);
    return res.status(201).json({ meetingId, url, token });
  } catch (err) {
    console.error("Error creating Daily room or token:", err);
    return res
      .status(500)
      .json({ error: "Could not create meeting room or token" });
  }
}

/**
 * Retrieves meeting data by meeting ID for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.params.meetingId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with host ID and room name or an error status.
 */
async function getMeetingData(req, res) {
  const meetingId = parseInt(req.params.meetingId, 10);
  if (Number.isNaN(meetingId)) {
    return res.status(400).json({ error: "Invalid meeting ID" });
  }
  const data = await meetingsModel.getMeetingById(meetingId);
  if (!data) {
    return res.status(404).json({ error: "Meeting not found" });
  }
  res.json({ hostId: data.HostID, roomName: data.RoomName });
}

/**
 * Allows users to join a meeting by providing the room name.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.query.name`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with the meeting URL or an error status.
 */
async function joinByName(req, res) {
  const roomName = (req.query.name || "").trim();
  if (!roomName) {
    return res.status(400).json({ error: "Room name is required" });
  }
  const url = await meetingsModel.getMeetingByName(roomName);
  if (!url) {
    return res.status(404).json({ error: "Meeting not found" });
  }
  res.json({ url });
}


module.exports = {
  createMeeting,
  getMeetingData,
  joinByName,
};
