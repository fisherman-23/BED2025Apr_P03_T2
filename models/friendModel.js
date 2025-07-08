const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { hash, compare } = require("../utils/hash.js");
const jwt = require("jsonwebtoken");

async function getUserIdByUUID(uuid) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("uuid", sql.UniqueIdentifier, uuid)
      .query("SELECT ID FROM Users WHERE PublicUUID = @uuid AND IsActive = 1");

    return result.recordset[0]?.ID || null;
  } catch (error) {
    console.error("Database error in getUserIdByUUID:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection after getUserIdByUUID:", e);
      }
    }
  }
}

async function checkRequestOrFriendshipExists(senderId, receiverId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("sender", sql.Int, senderId)
      .input("receiver", sql.Int, receiverId).query(`
      SELECT 
        SenderID AS UserID1,
        ReceiverID AS UserID2
      FROM FriendRequests
      WHERE 
        (SenderID = @sender AND ReceiverID = @receiver)
        OR (SenderID = @receiver AND ReceiverID = @sender)

      UNION

      SELECT 
        UserID1,
        UserID2
      FROM Friends
      WHERE
        (UserID1 = @sender AND UserID2 = @receiver)
        OR (UserID1 = @receiver AND UserID2 = @sender)
    `);

    return result.recordset.length > 0;
  } catch (error) {
    console.error("Database error in checkRequestOrFriendshipExists:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(
          "Error closing connection after checkRequestOrFriendshipExists:",
          e
        );
      }
    }
  }
}

async function insertFriendRequest(senderId, receiverId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input("sender", sql.Int, senderId)
      .input("receiver", sql.Int, receiverId)
      .query(
        "INSERT INTO FriendRequests (SenderID, ReceiverID) VALUES (@sender, @receiver)"
      );
  } catch (error) {
    console.error("Database error in insertFriendRequest:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection after insertFriendRequest:", e);
      }
    }
  }
}

async function getAllPendingRequests(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const incoming = await connection.request().input("userId", sql.Int, userId)
      .query(`
        SELECT 
          FR.ID,
          FR.SenderID,
          U.Name,
          U.PublicUUID,
          'incoming' AS Direction
        FROM FriendRequests FR
        JOIN Users U ON FR.SenderID = U.ID
        WHERE FR.ReceiverID = @userId
        AND FR.Status = 'pending'
      `);

    const outgoing = await connection.request().input("userId", sql.Int, userId)
      .query(`
        SELECT 
          FR.ID,
          FR.ReceiverID AS TargetID,
          U.Name,
          U.PublicUUID,
          'outgoing' AS Direction
        FROM FriendRequests FR
        JOIN Users U ON FR.ReceiverID = U.ID
        WHERE FR.SenderID = @userId
        AND FR.Status = 'pending'
      `);

    return {
      incoming: incoming.recordset,
      outgoing: outgoing.recordset,
    };
  } catch (error) {
    console.error("Database error in getAllPendingRequests:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(
          "Error closing connection after getAllPendingRequests:",
          e
        );
      }
    }
  }
}

async function getFriends(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request().input("userId", sql.Int, userId)
      .query(`
        SELECT 
          U.ID AS FriendID,
          U.Name,
          U.PublicUUID,
          F.CreatedAt
        FROM Friends F
        JOIN Users U ON 
          (U.ID = F.UserID1 AND F.UserID2 = @userId)
          OR (U.ID = F.UserID2 AND F.UserID1 = @userId)
      `);

    return result.recordset;
  } catch (error) {
    console.error("Database error in getFriends:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection after getFriends:", e);
      }
    }
  }
}

async function acceptFriendRequest(userId, requestId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Check if request exists and belongs to user
    const result = await connection
      .request()
      .input("requestId", sql.Int, requestId)
      .input("userId", sql.Int, userId)
      .query(
        `SELECT * FROM FriendRequests WHERE ID = @requestId AND ReceiverID = @userId AND Status = 'pending'`
      );

    if (result.recordset.length === 0) {
      throw new Error("Friend request not found or unauthorized");
    }

    const request = result.recordset[0];
    const [user1, user2] = [request.SenderID, request.ReceiverID].sort(
      (a, b) => a - b
    );

    await connection
      .request()
      .input("user1", sql.Int, user1)
      .input("user2", sql.Int, user2).query(`
        IF NOT EXISTS (
          SELECT 1 FROM Friends WHERE UserID1 = @user1 AND UserID2 = @user2
        )
        INSERT INTO Friends (UserID1, UserID2) VALUES (@user1, @user2)
      `);

    await connection
      .request()
      .input("requestId", sql.Int, requestId)
      .query(
        `UPDATE FriendRequests SET Status = 'accepted' WHERE ID = @requestId`
      );
  } catch (error) {
    console.error("Database error in acceptFriendRequest:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection after acceptFriendRequest:", e);
      }
    }
  }
}

async function rejectFriendRequest(userId, requestId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const result = await connection
      .request()
      .input("requestId", sql.Int, requestId)
      .input("userId", sql.Int, userId)
      .query(
        `SELECT * FROM FriendRequests WHERE ID = @requestId AND ReceiverID = @userId AND Status = 'pending'`
      );

    if (result.recordset.length === 0) {
      throw new Error("Friend request not found or unauthorized");
    }

    await connection
      .request()
      .input("requestId", sql.Int, requestId)
      .query(
        `UPDATE FriendRequests SET Status = 'rejected' WHERE ID = @requestId`
      );
  } catch (error) {
    console.error("Database error in rejectFriendRequest:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection after rejectFriendRequest:", e);
      }
    }
  }
}

async function removeFriend(userId, friendId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("friendId", sql.Int, friendId).query(`
      DELETE FROM Friends 
      WHERE (UserID1 = @userId AND UserID2 = @friendId) 
         OR (UserID1 = @friendId AND UserID2 = @userId);

      DELETE FROM FriendRequests
      WHERE 
        ((SenderID = @userId AND ReceiverID = @friendId)
        OR (SenderID = @friendId AND ReceiverID = @userId))
        AND Status = 'accepted';
    `);

    return result.rowsAffected[0] > 0; // returns true if something was deleted
  } catch (error) {
    console.error("Database error in removeFriend:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection after removeFriend:", e);
      }
    }
  }
}

module.exports = {
  getUserIdByUUID,
  checkRequestOrFriendshipExists,
  insertFriendRequest,
  getAllPendingRequests,
  getFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
};
