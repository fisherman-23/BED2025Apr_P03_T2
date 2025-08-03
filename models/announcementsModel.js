const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * Retrieves all announcements for a specific group with creator information.
 * @param {number} groupId - The ID of the group to get announcements for.
 * @returns {Promise<Array>} Array of announcements with creator names and group creator ID.
 */
async function getAnnouncementsByGroup(groupId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT a.ID, a.Title, a.Content, a.ImageURL, a.CreatedAt, u.Name AS CreatedByName, g.CreatedBy AS GroupCreatorID
      FROM Announcements a
      JOIN Users u ON a.CreatedBy = u.ID
      JOIN Groups g ON a.GroupID = g.ID
      WHERE a.GroupID = @GroupID
      ORDER BY a.CreatedAt DESC
    `;
    const request = connection.request();
    request.input("GroupID", sql.Int, groupId);
    const result = await request.query(query);
    connection.close();
    return result.recordset;
  } catch (error) {
    console.error("Database error in getAnnouncementsByGroup:", error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (err) { console.error("Error closing connection in getAnnouncementsByGroup:", err); }
    }
  }
}

/**
 * Creates a new announcement in a group.
 * @param {Object} announcementData - Object containing GroupID, Title, Content, ImageURL, and CreatedBy.
 * @returns {Promise<number>} The ID of the newly created announcement.
 */
async function createAnnouncement({ GroupID, Title, Content, ImageURL, CreatedBy }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Announcements
        (GroupID, Title, Content, ImageURL, CreatedBy)
      VALUES
        (@GroupID, @Title, @Content, @ImageURL, @CreatedBy);
      SELECT SCOPE_IDENTITY() AS ID;
    `;
    const request = connection.request();
    request.input("GroupID", sql.Int, GroupID);
    request.input("Title", sql.VarChar(100), Title);
    request.input("Content", sql.VarChar(2000), Content);
    request.input("ImageURL", sql.VarChar(1000), ImageURL || null);
    request.input("CreatedBy", sql.Int, CreatedBy);
    const result = await request.query(query);
    const newId = result.recordset[0].ID;
    connection.close();
    return newId;
  } catch (error) {
    console.error("Database error in createAnnouncement:", error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (err) { console.error("Error closing connection in createAnnouncement:", err); }
    }
  }
}

/**
 * Retrieves all comments for a specific announcement with user information.
 * @param {number} announcementId - The ID of the announcement to get comments for.
 * @returns {Promise<Array>} Array of comments with user names and details.
 */
async function getCommentsForAnnouncement(announcementId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT c.ID, c.Content, c.CreatedAt, u.ID AS UserID, u.Name, u.ProfilePicture
      FROM Comments c
      JOIN Users u ON c.UserID = u.ID
      WHERE c.AnnouncementID = @AnnouncementID
      ORDER BY c.CreatedAt ASC
    `;
    const request = connection.request();
    request.input("AnnouncementID", sql.Int, announcementId);
    const result = await request.query(query);
    connection.close();
    return result.recordset;
  } catch (error) {
    console.error("Database error in getCommentsForAnnouncement:", error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (err) { console.error("Error closing connection in getCommentsForAnnouncement:", err); }
    }
  }
}

/**
 * Creates a new comment on an announcement.
 * @param {Object} commentData - Object containing AnnouncementID, UserID, and Content.
 * @returns {Promise<number>} The ID of the newly created comment.
 */
async function postComment({ AnnouncementID, UserID, Content }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();

    request.input("AnnouncementID", sql.Int, AnnouncementID);
    request.input("UserID", sql.Int, UserID);
    const check = await request.query(`
      SELECT 1
        FROM Announcements a
        JOIN GroupMembers gm
          ON a.GroupID = gm.GroupID
          WHERE a.ID = @AnnouncementID
         AND gm.UserID = @UserID
    `);
    if (!check.recordset.length) {
      const err = new Error("Must be a member to comment");
      err.code = "NOT_MEMBER";
      throw err;
    }

    const insertReq = connection.request();
    insertReq.input("AnnouncementID", sql.Int, AnnouncementID);
    insertReq.input("UserID", sql.Int, UserID);
    insertReq.input("Content", sql.VarChar(1000), Content);

    const result = await insertReq.query(`
      INSERT INTO Comments (AnnouncementID, UserID, Content)
      VALUES (@AnnouncementID, @UserID, @Content);
      SELECT SCOPE_IDENTITY() AS ID;
    `);

    return result.recordset[0].ID;
  } catch (err) {
    console.error("Database error in postComment:", err);
    throw err;
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (closeErr) { console.error("Error closing connection in postComment:", closeErr); }
    }
  }
}

/**
 * Deletes a comment if the user is authorized (comment owner or announcement creator).
 * @param {number} userId - The ID of the user attempting to delete the comment.
 * @param {number} commentId - The ID of the comment to delete.
 * @returns {Promise<boolean>} True if comment was deleted, false if unauthorized or not found.
 */
async function deleteComment(userId, commentId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("UserID",    sql.Int, userId);
    request.input("CommentID", sql.Int, commentId);

    const result = await request.query(`
      DELETE FROM Comments
      WHERE ID = @CommentID AND UserID = @UserID
    `);

    if (result.rowsAffected[0] === 0) {
      const err = new Error("You are not authorized to delete this comment");
      err.code = "FORBIDDEN";
      throw err;
    }

    return true;
  } catch (err) {
    console.error("DB error in deleteComment:", err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Retrieves group information by group ID.
 * @param {number} groupId - The ID of the group to retrieve.
 * @returns {Promise<Object|null>} Group object with CreatedBy field, or null if not found.
 */
async function getGroupById(groupId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("ID", sql.Int, groupId)
      .query(`SELECT CreatedBy FROM Groups WHERE ID = @ID`);
    return result.recordset[0] || null;
  } catch (err) {
    console.error("DB error in getGroupById:", err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Updates an existing announcement if the user is authorized (announcement creator).
 * @param {Object} editData - Object containing announcementId, title, content, imageUrl, and userId.
 * @returns {Promise<boolean>} True if announcement was updated, false if unauthorized or not found.
 */
async function editAnnouncement({ announcementId, title, content, imageUrl, userId }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Check if the user is the owner of the group related to this announcement
    const checkRequest = connection.request();
    checkRequest.input("AnnouncementID", sql.Int, announcementId);
    checkRequest.input("UserID", sql.Int, userId);

    const checkResult = await checkRequest.query(`
      SELECT g.CreatedBy
      FROM Announcements a
      JOIN Groups g ON a.GroupID = g.ID
      WHERE a.ID = @AnnouncementID
    `);

    if (checkResult.recordset.length === 0) {
      const err = new Error("Announcement not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    const createdBy = checkResult.recordset[0].CreatedBy;
    if (createdBy !== userId) {
      const err = new Error("Only the group owner can edit this announcement");
      err.code = "FORBIDDEN";
      throw err;
    }

    const updateRequest = connection.request();
    updateRequest.input("AnnouncementID", sql.Int, announcementId);
    updateRequest.input("Title", sql.VarChar(100), title);
    updateRequest.input("Content", sql.VarChar(2000), content);
    updateRequest.input("ImageURL", sql.VarChar(1000), imageUrl || null);

    await updateRequest.query(`
      UPDATE Announcements
      SET Title = @Title, Content = @Content, ImageURL = @ImageURL
      WHERE ID = @AnnouncementID
    `);

    return true;
  } catch (err) {
    console.error("Database error in editAnnouncement:", err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Deletes an announcement if the user is authorized (announcement creator).
 * @param {number} announcementId - The ID of the announcement to delete.
 * @param {number} userId - The ID of the user attempting to delete the announcement.
 * @returns {Promise<boolean>} True if announcement was deleted, false if unauthorized or not found.
 */
async function deleteAnnouncement(announcementId, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const checkRequest = connection.request();
    checkRequest.input("AnnouncementID", sql.Int, announcementId);
    checkRequest.input("UserID", sql.Int, userId);

    const checkResult = await checkRequest.query(`
      SELECT g.CreatedBy, a.CreatedBy as AnnouncementCreatedBy
      FROM Announcements a
      JOIN Groups g ON a.GroupID = g.ID
      WHERE a.ID = @AnnouncementID
    `);

    if (checkResult.recordset.length === 0) {
      const err = new Error("Announcement not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    const groupCreatedBy = checkResult.recordset[0].CreatedBy;
    const announcementCreatedBy = checkResult.recordset[0].AnnouncementCreatedBy;
    
    if (groupCreatedBy !== userId && announcementCreatedBy !== userId) {
      const err = new Error("Only the group owner or announcement creator can delete this announcement");
      err.code = "FORBIDDEN";
      throw err;
    }

    const deleteCommentsRequest = connection.request();
    deleteCommentsRequest.input("AnnouncementID", sql.Int, announcementId);
    await deleteCommentsRequest.query(`
      DELETE FROM Comments WHERE AnnouncementID = @AnnouncementID
    `);

    const deleteRequest = connection.request();
    deleteRequest.input("AnnouncementID", sql.Int, announcementId);
    await deleteRequest.query(`
      DELETE FROM Announcements WHERE ID = @AnnouncementID
    `);

    return true;
  } catch (err) {
    console.error("Database error in deleteAnnouncement:", err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}




module.exports = {
  getAnnouncementsByGroup,
  createAnnouncement,
  getCommentsForAnnouncement,
  postComment,
  deleteComment,
  getGroupById,
  editAnnouncement,
  deleteAnnouncement
};
