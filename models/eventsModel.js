const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");

async function getJoinedGroups(userId) {
 let connection;
 try { 
  connection = await sql.connect(dbConfig);
  const query = `SELECT g.ID, g.Name, g.Description, g.GroupPicture, g.IsPrivate, g.CreatedAt
    FROM Groups g
    INNER JOIN GroupMembers gm ON g.ID = gm.GroupID
    WHERE gm.UserID = @UserID`;
  const request = connection.request();
  request.input("UserID", userId);
  const result = await request.query(query);
  connection.close();
  return result.recordset;
 } catch (error) {
  console.error("Database error in getJoinedGroups:", error);
  throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection in getJoinedGroups:", err);
      }
    }
  }
}

async function getAvailableGroups(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `SELECT ID, Name, Description, GroupPicture, IsPrivate, CreatedAt
      FROM Groups
      WHERE IsPrivate = 0
        AND ID NOT IN (
          SELECT GroupID FROM GroupMembers WHERE UserID = @UserID
        )`;
    const request = connection.request();
    request.input("UserID", userId);
    const result = await request.query(query);
    connection.close();
    return result.recordset;
  } catch (error) {
    console.error("Database error in getAvailableGroups:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection in getAvailableGroups:", err);
      }
    }
  }
}

async function createGroup(groupData, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Groups
        (Name, Description, GroupPicture, IsPrivate, CreatedAt, CreatedBy)
      VALUES
        (@Name, @Description, @GroupPicture, @IsPrivate, @CreatedAt, @CreatedBy);
      SELECT
        ID, Name, Description, GroupPicture, IsPrivate, CreatedAt, CreatedBy
      FROM Groups
      WHERE ID = SCOPE_IDENTITY();
    `;
    const request = connection.request();
    request.input("Name", sql.VarChar(50), groupData.Name);
    request.input("Description", sql.VarChar(200), groupData.Description || null);
    request.input("GroupPicture", sql.VarChar(500), groupData.GroupPicture || null);
    request.input("IsPrivate", sql.Bit, groupData.IsPrivate ? 1 : 0);
    request.input("CreatedAt", sql.DateTime, new Date());
    request.input("CreatedBy", sql.Int, userId);
    
    const result = await request.query(query);
    const newGroup = result.recordset[0];

    // Add creator to GroupMembers automatically
    const addMemberRequest = connection.request();
    addMemberRequest.input("UserID", sql.Int, userId);
    addMemberRequest.input("GroupID", sql.Int, newGroup.ID);
    await addMemberRequest.query(`
      INSERT INTO GroupMembers (UserID, GroupID)
      VALUES (@UserID, @GroupID);
    `);

    return newGroup;
  } catch (error) {
    console.error("Database error in createGroup:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection in createGroup:", err);
      }
    }
  }
}


async function joinGroup(userId, groupId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO GroupMembers (UserID, GroupID)
      VALUES (@UserID, @GroupID);
    `;
    const request = connection.request();
    request.input("UserID", sql.Int, userId);
    request.input("GroupID", sql.Int, groupId);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error in joinGroup:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection in joinGroup:", err);
      }
    }
  }
}

async function leaveGroup(userId, groupId) {
    let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("UserID", sql.Int, userId);
    request.input("GroupID", sql.Int, groupId);
    const result = await request.query(`
      DELETE FROM GroupMembers
      WHERE UserID = @UserID AND GroupID = @GroupID
    `);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error in exitGroup:", error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (err) { console.error("Error closing connection in exitGroup:", err); }
    }
  }
}


module.exports = {
  getJoinedGroups,
  getAvailableGroups,
  createGroup,
  joinGroup,
  leaveGroup
};