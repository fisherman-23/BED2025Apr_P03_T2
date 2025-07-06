const friendModel = require("../models/friendModel");

async function sendFriendRequest(req, res) {
  console.log("Received request to send friend request");
  const senderId = req.user.id; // from JWT middleware
  console.log("Sender ID:", senderId);
  const receiverUUID = req.params.uuid;
  console.log("Receiver UUID:", receiverUUID);

  try {
    const receiverId = await friendModel.getUserIdByUUID(receiverUUID);

    if (!receiverId) {
      return res.status(404).json({ message: "User not found" });
    }

    if (senderId === receiverId) {
      console.log("Sender and receiver are the same user");
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

async function listAllPendingRequests(req, res) {
  try {
    const userId = req.user.id;
    const requests = await friendModel.getAllPendingRequests(userId);

    res.status(200).json({
      incoming: requests.incoming,
      outgoing: requests.outgoing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch friend requests" });
  }
}
async function listFriends(req, res) {
  try {
    const userId = req.user.id;
    const friends = await friendModel.getFriends(userId);

    res.status(200).json({ friends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch friends list" });
  }
}

async function acceptFriendRequest(req, res) {
  const userId = req.user.id;
  console.log("User ID:", userId);
  const requestId = parseInt(req.params.id);
  console.log("Request ID:", requestId);

  try {
    await friendModel.acceptFriendRequest(userId, requestId);
    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error(err);
    if (err.message === "Friend request not found or unauthorized") {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
}

async function rejectFriendRequest(req, res) {
  const userId = req.user.ID;
  const requestId = parseInt(req.params.id);

  try {
    await friendModel.rejectFriendRequest(userId, requestId);
    res.status(200).json({ message: "Friend request rejected" });
  } catch (err) {
    console.error(err);
    if (err.message === "Friend request not found or unauthorized") {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
}

async function removeFriend(req, res) {
  const userId = req.user.id;
  const friendId = parseInt(req.params.friendId);

  if (isNaN(friendId)) {
    return res.status(400).json({ message: "Invalid friend ID" });
  }

  try {
    const removed = await friendModel.removeFriend(userId, friendId);

    if (removed) {
      return res.status(200).json({ message: "Friend removed successfully" });
    } else {
      return res
        .status(404)
        .json({ message: "Friend not found or already removed" });
    }
  } catch (err) {
    console.error("Error removing friend:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  sendFriendRequest,
  listAllPendingRequests,
  listFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
};
