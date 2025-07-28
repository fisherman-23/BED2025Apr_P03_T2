const chatModel = require("../models/chatModel");
/**
 * Starts a new conversation between two users if one doesn't exist,
 * or retrieves the existing conversation.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 *
 * Request body should contain:
 * @param {string} req.body.otherUserId - The ID of the other user to start a conversation with.
 *
 * Authentication middleware must attach `req.user.id` (current user ID).
 *
 * @returns {void} Responds with the conversation object or an error.
 */
async function startConversation(req, res) {
  const user1 = req.user.id;
  const { otherUserId } = req.body;

  try {
    const convo = await chatModel.getOrCreateConversation(user1, otherUserId);
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: "Error starting conversation" });
  }
}

/**
 * Retrieves all conversations that is under the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires 'req.user.id' from the middleware.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Returns a JSON array of conversations or an error response.
 */
async function getConversations(req, res) {
  const userId = req.user.id;
  try {
    const result = await chatModel.getUserConversations(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error fetching conversations" });
  }
}

/**
 * Retrieves all messages in a conversation if the authenticated user is a participant.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.conversationId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with an array of messages or an appropriate error.
 */
async function getMessages(req, res) {
  const userId = parseInt(req.user.id);
  const conversationId = parseInt(req.params.conversationId);

  if (isNaN(conversationId)) {
    return res.status(400).json({ error: "Invalid conversation ID" });
  }

  try {
    const authorized = await chatModel.isUserInConversation(
      userId,
      conversationId
    );
    if (!authorized) {
      return res
        .status(403)
        .json({ error: "Access denied to this conversation" });
    }

    const messages = await chatModel.getMessages(conversationId);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Error fetching messages" });
  }
}

/**
 * Sends a message in a conversation on behalf of the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`, `req.params.conversationId`, and `req.body.content`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with the created message or an error.
 */
async function sendMessage(req, res) {
  const senderId = parseInt(req.user.id);
  const conversationId = parseInt(req.params.conversationId);
  const { content } = req.body;

  // Validate inputs
  if (isNaN(conversationId) || !content || content.trim() === "") {
    return res
      .status(400)
      .json({ error: "Invalid conversation ID or empty message content" });
  }

  try {
    const isAuthorized = await chatModel.isUserInConversation(
      senderId,
      conversationId
    );
    if (!isAuthorized) {
      return res.status(403).json({ error: "User not in conversation" });
    }

    const message = await chatModel.sendMessage(
      conversationId,
      senderId,
      content
    );

    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Error sending message" });
  }
}

/**
 * Deletes a message if the authenticated user is a participant in the conversation.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.messageId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 204 on success, or appropriate error codes.
 */
async function deleteMessage(req, res) {
  const userId = parseInt(req.user.id);
  const messageId = parseInt(req.params.messageId);

  if (isNaN(messageId)) {
    return res.status(400).json({ error: "Invalid message ID" });
  }

  try {
    const message = await chatModel.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isAuthorized = await chatModel.isUserInConversation(
      userId,
      message.ConversationID
    );
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }
    await chatModel.deleteMessage(messageId, userId);
    try {
      await chatModel.deleteMessage(messageId, userId);
    } catch (err) {
      console.error("Error during message deletion:", err);
      return res.status(500).json({ error: "Error deleting message" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ error: "Error deleting message" });
  }
}

/**
 * Generates smart reply suggestions based on the provided message content.
 *
 * @param {import("express").Request} req - Express request object. Requires 'req.body.content'.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with an array of smart reply suggestions or an error.
 */
async function getSmartReplies(req, res) {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const suggestions = await chatModel.generateSmartReplies(content);
    res.json({ suggestions });
  } catch (err) {
    console.error("Smart reply error:", err);
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
}

module.exports = {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  getSmartReplies,
};
