const friendModel = require("../models/friendModel");

async function sendFriendRequest(req, res) {
  console.log("Received request to send friend request");
  const senderId = req.user.id; // from JWT middleware
  console.log("Sender ID:", senderId);
  const receiverUUID = req.params.uuid;

  try {
    const receiverId = await friendModel.getUserIdByUUID(receiverUUID);

    if (!receiverId) {
      return res.status(404).json({ message: "User not found" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "Can't send request to yourself" });
    }

    const exists = await friendModel.checkRequestOrFriendshipExists(
      senderId,
      receiverId
    );

    if (exists) {
      return res
        .status(400)
        .json({ message: "Request or friendship already exists" });
    }

    await friendModel.insertFriendRequest(senderId, receiverId);

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { sendFriendRequest };
