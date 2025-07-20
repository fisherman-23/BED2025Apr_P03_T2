const chatModel = require("../models/chatModel");
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

async function getConversations(req, res) {
  const userId = req.user.id;
  try {
    const result = await chatModel.getUserConversations(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error fetching conversations" });
  }
}

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
