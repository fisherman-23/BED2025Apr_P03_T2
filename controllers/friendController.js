const friendModel = require("../models/friendModel");

/**
 * Sends a friend request from the authenticated user to another user by UUID.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.uuid`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or an error status.
 */
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

    const status = await friendModel.getFriendshipStatus(senderId, receiverId);

    if (status === "friends") {
      return res.status(400).json({ message: "You are already friends" });
    }

    if (status === "outgoing_pending") {
      return res.status(400).json({
        message:
          "You have already sent a request. Please wait for the other user to accept.",
      });
    }

    if (status === "incoming_pending") {
      return res.status(400).json({
        message:
          "The other user has sent you a request. Please accept it from your friend requests tab.",
      });
    }

    if (status === "rejected") {
      return res.status(400).json({
        message:
          "A friend request was previously rejected. You cannot send another request.",
      });
    }

    await friendModel.insertFriendRequest(senderId, receiverId);

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Error in sendFriendRequest:", err);
    res.status(500).json({ message: "Server error" });
  }
}
/**
 * Lists all incoming and outgoing pending friend requests for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with incoming and outgoing friend requests.
 */
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
} /**
 * Retrieves the full list of friends for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a list of friends or an error.
 */
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
/**
 * Accepts a pending friend request by request ID for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a confirmation or error status.
 */
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
/**
 * Rejects a pending friend request by request ID for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a confirmation or error status.
 */
async function rejectFriendRequest(req, res) {
  const userId = req.user.id;
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
/**
 * Removes an existing friend relationship between the authenticated user and another user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.friendId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success or error message.
 */
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
/**
 * Withdraws an outgoing pending friend request by ID for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or a 404 if the request is not found.
 */
async function withdrawFriendRequest(req, res) {
  const userId = req.user.id;
  const requestId = parseInt(req.params.id);

  try {
    const result = await friendModel.removeFriendRequest(requestId, userId);
    if (result) {
      res.status(200).json({ message: "Friend request withdrawn" });
    } else {
      res.status(404).json({ message: "Friend request not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  sendFriendRequest,
  listAllPendingRequests,
  listFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  withdrawFriendRequest,
};
