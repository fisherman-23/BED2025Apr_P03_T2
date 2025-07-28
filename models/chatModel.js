const sql = require("mssql");
const config = require("../dbConfig");
const { callGemini } = require("../utils/geminiApi");

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

async function generateSmartReplies(message) {
  const prompt = `Suggest 1 short, friendly reply to these messages from the perspective of the user. Do not include emojis. Messages from the user will be marked with (You:). Messages: "${message}"`;

  const geminiResponse = await callGemini(prompt);
  return geminiResponse.candidates[0].content.parts[0].text;
}

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
