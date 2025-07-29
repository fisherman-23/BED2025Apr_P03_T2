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

async function getFriendshipStatus(userA, userB) {
  const connection = await sql.connect(dbConfig);

  // Check if already friends (either direction)
  const friendRes = await connection
    .request()
    .input("userA", sql.Int, userA)
    .input("userB", sql.Int, userB).query(`
      SELECT * FROM Friends 
      WHERE (UserID1 = @userA AND UserID2 = @userB) 
         OR (UserID1 = @userB AND UserID2 = @userA)
    `);

  if (friendRes.recordset.length > 0) {
    return "friends";
  }

  // Check if userA sent a request to userB
  const outgoingRes = await connection
    .request()
    .input("sender", sql.Int, userA)
    .input("receiver", sql.Int, userB).query(`
      SELECT Status FROM FriendRequests 
      WHERE SenderID = @sender AND ReceiverID = @receiver
    `);

  if (outgoingRes.recordset.length > 0) {
    const status = outgoingRes.recordset[0].Status;
    if (status === "pending") return "outgoing_pending";
    if (status === "rejected") return "rejected";
  }

  // Check if userB sent a request to userA
  const incomingRes = await connection
    .request()
    .input("sender", sql.Int, userB)
    .input("receiver", sql.Int, userA).query(`
      SELECT Status FROM FriendRequests 
      WHERE SenderID = @sender AND ReceiverID = @receiver
    `);

  if (incomingRes.recordset.length > 0) {
    const status = incomingRes.recordset[0].Status;
    if (status === "pending") return "incoming_pending";
    if (status === "rejected") return "rejected";
  }

  return null;
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
          U.ProfilePicture,
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
          U.ProfilePicture,
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
          F.CreatedAt,
          U.ProfilePicture
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
    console.log("Rejecting friend request:", requestId, "for user:", userId);

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

async function removeFriendRequest(requestId, userId) {
  console.log(
    "Removing pending friend request ID:",
    requestId,
    "by user:",
    userId
  );

  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const result = await connection
      .request()
      .input("requestId", sql.Int, requestId)
      .input("userId", sql.Int, userId).query(`
        DELETE FROM FriendRequests
        WHERE ID = @requestId
          AND SenderID = @userId
          AND Status = 'pending';
      `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error in removeFriendRequestById:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
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
  getFriendshipStatus,
  removeFriendRequest,
};
