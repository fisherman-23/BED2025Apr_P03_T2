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
  const { conversationId } = req.params;
  try {
    const result = await chatModel.getMessages(conversationId);
    console.log("Fetched messages:", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error fetching messages" });
  }
}

async function sendMessage(req, res) {
  const senderId = req.user.id;
  const { conversationId } = req.params;
  const { content } = req.body;

  try {
    const message = await chatModel.sendMessage(
      conversationId,
      senderId,
      content
    );
    // Optionally emit via WebSocket here
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Error sending message" });
  }
}

async function deleteMessage(req, res) {
  const userId = req.user.id;
  const { messageId } = req.params;

  try {
    await chatModel.deleteMessage(messageId, userId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Error deleting message" });
  }
}

async function getSmartReplies(req, res) {
  const { content } = req.body;
  console.log("Received message for smart reply:", content);

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
