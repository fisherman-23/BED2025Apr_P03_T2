const sql = require("mssql");
const config = require("../dbConfig");
const { callGemini } = require("../utils/geminiApi");

/**
 * Checks if a user is a participant in a given conversation.
 *
 * @param {number} userId - ID of the user to check.
 * @param {number} conversationId - ID of the conversation.
 * @returns {Promise<boolean>} True if the user is in the conversation, false otherwise.
 * @throws Will throw if the database query fails.
 */
async function isUserInConversation(userId, conversationId) {
  let connection;

  try {
    connection = await sql.connect(config);
    const result = await connection
      .request()
      .input("id", sql.Int, conversationId)
      .query("SELECT User1ID, User2ID FROM Conversations WHERE ID = @id");

    const convo = result.recordset[0];
    return convo && (convo.User1ID === userId || convo.User2ID === userId);
  } catch (err) {
    console.error("Error in isUserInConversation:", err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}
/**
 * Retrieves an existing conversation between two users or creates a new one if it doesn't exist.
 *
 * @param {number} user1Id - ID of the first user.
 * @param {number} user2Id - ID of the second user.
 * @returns {Promise<Object>} The conversation object from the database.
 * @throws Will throw if the database operation fails.
 */
async function getOrCreateConversation(user1Id, user2Id) {
  const [userA, userB] =
    user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
  let connection;
  try {
    connection = await sql.connect(config);

    const result = await connection
      .request()
      .input("user1", sql.Int, userA)
      .input("user2", sql.Int, userB)
      .query(
        `SELECT * FROM Conversations WHERE User1ID = @user1 AND User2ID = @user2`
      );

    if (result.recordset.length > 0) return result.recordset[0];

    const insert = await connection
      .request()
      .input("user1", sql.Int, userA)
      .input("user2", sql.Int, userB).query(`
        INSERT INTO Conversations (User1ID, User2ID) VALUES (@user1, @user2);
        SELECT * FROM Conversations WHERE ID = SCOPE_IDENTITY();
      `);

    return insert.recordset[0];
  } finally {
    if (connection) await connection.close();
  }
}
/**
 * Fetches all conversations that the specified user is a participant in.
 *
 * @param {number} userId - ID of the user.
 * @returns {Promise<Object[]>} Array of conversation objects with user details.
 * @throws Will throw if the database operation fails.
 */
async function getUserConversations(userId) {
  let connection;
  try {
    connection = await sql.connect(config);

    const result = await connection.request().input("id", sql.Int, userId)
      .query(`
            SELECT 
            c.ID,
            c.User1ID,
            u1.Name AS User1Name,
            c.User2ID,
            u2.Name AS User2Name,
            c.CreatedAt
            FROM Conversations c
            JOIN Users u1 ON c.User1ID = u1.ID
            JOIN Users u2 ON c.User2ID = u2.ID
            WHERE c.User1ID = @id OR c.User2ID = @id
      `);
    console.log("Conversations fetched:", result.recordset);

    return result.recordset;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection for getUserConversations:", e);
      }
    }
  }
}
/**
 * Retrieves all messages for a specific conversation, ordered by send time.
 *
 * @param {number} conversationId - ID of the conversation.
 * @returns {Promise<Object[]>} Array of message objects.
 * @throws Will throw if the database operation fails.
 */
async function getMessages(conversationId) {
  let connection;
  try {
    connection = await sql.connect(config);

    const result = await connection
      .request()
      .input("id", sql.Int, conversationId).query(`
        SELECT * FROM Messages WHERE ConversationID = @id ORDER BY SentAt ASC
      `);

    return result.recordset;
  } finally {
    if (connection) await connection.close();
  }
}
/**
 * Inserts a new message into a conversation and returns the created message.
 *
 * @param {number} conversationId - ID of the conversation.
 * @param {number} senderId - ID of the user sending the message.
 * @param {string} content - Content of the message.
 * @returns {Promise<Object>} The inserted message object.
 * @throws Will throw if the database operation fails.
 */
async function sendMessage(conversationId, senderId, content) {
  let connection;
  try {
    connection = await sql.connect(config);

    const result = await connection
      .request()
      .input("conversationId", sql.Int, conversationId)
      .input("senderId", sql.Int, senderId)
      .input("content", sql.Text, content).query(`
        INSERT INTO Messages (ConversationID, SenderID, Content)
        VALUES (@conversationId, @senderId, @content);
        SELECT * FROM Messages WHERE ID = SCOPE_IDENTITY();
      `);

    return result.recordset[0];
  } finally {
    if (connection) await connection.close();
  }
}
/**
 * Marks a message as deleted if the requester is the original sender.
 *
 * @param {number} messageId - ID of the message to delete.
 * @param {number} userId - ID of the user attempting to delete the message.
 * @returns {Promise<void>}
 * @throws Will throw if the database operation fails.
 */
async function deleteMessage(messageId, userId) {
  let connection;
  try {
    connection = await sql.connect(config);

    await connection
      .request()
      .input("messageId", sql.Int, messageId)
      .input("userId", sql.Int, userId).query(`
        UPDATE Messages SET IsDeleted = 1, DeletedAt = GETDATE()
        WHERE ID = @messageId AND SenderID = @userId
      `);
  } finally {
    if (connection) await connection.close();
  }
}
/**
 * Generates a smart reply suggestion based on the given message content using Gemini API.
 *
 * @param {string} message - The message to generate a reply for.
 * @returns {Promise<string>} A short, friendly reply string.
 * @throws Will throw if the Gemini API call fails.
 */
async function generateSmartReplies(message) {
  const prompt = `Suggest 1 short, friendly reply to these messages from the perspective of the user, not the other person. Do not include emojis. Messages: "${message}"`;

  const geminiResponse = await callGemini(prompt);
  return geminiResponse.candidates[0].content.parts[0].text;
}

/**
 * Retrieves a specific message by its ID.
 *
 * @param {number} messageId - ID of the message.
 * @returns {Promise<Object|undefined>} The message object or undefined if not found.
 * @throws Will throw an error if the database operation fails.
 */

async function getMessageById(messageId) {
  let connection;

  try {
    connection = await sql.connect(config);
    const result = await connection
      .request()
      .input("messageId", sql.Int, messageId)
      .query("SELECT * FROM Messages WHERE ID = @messageId");

    return result.recordset[0]; // returns the message object or undefined
  } catch (err) {
    console.error("Error in getMessageById:", err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}
module.exports = {
  getOrCreateConversation,
  getUserConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  generateSmartReplies,
  isUserInConversation,
  getMessageById,
};
