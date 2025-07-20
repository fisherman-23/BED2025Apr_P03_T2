const meetingsModel = require("../models/meetingsModel");


async function createMeeting(req, res) {
  try {
    const room = await meetingsModel.createRoom();
    return res.status(201).json({ url: room.url });
  } catch (err) {
    console.error("Error creating Daily room:", err);
    return res.status(500).json({ error: "Could not create meeting room" });
  }
}

module.exports = { createMeeting };
