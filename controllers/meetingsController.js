const meetingsModel = require("../models/meetingsModel");


async function createMeeting(req, res) {
  try {
    const { name, url } = await meetingsModel.createRoom();
    const token = await meetingsModel.createMeetingToken(name, /* isOwner= */ true);
    return res.status(201).json({ url, token });
  } catch (err) {
    console.error("Error creating Daily room or token:", err);
    return res
      .status(500)
      .json({ error: "Could not create meeting room or token" });
  }
}

module.exports = {
  createMeeting,
};
