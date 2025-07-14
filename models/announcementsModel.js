const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAnnouncementsByGroup(groupId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT a.ID, a.Title, a.Content, a.ImageURL, a.CreatedAt, u.Name AS CreatedByName
      FROM Announcements a
      JOIN Users u ON a.CreatedBy = u.ID
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
    request.input("GroupID",  sql.Int,         GroupID);
    request.input("Title",    sql.VarChar(100), Title);
    request.input("Content",  sql.VarChar(2000), Content);
    request.input("ImageURL", sql.VarChar(1000), ImageURL || null);
    request.input("CreatedBy",sql.Int,         CreatedBy);
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

async function postComment({ AnnouncementID, UserID, Content }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Comments
        (AnnouncementID, UserID, Content)
      VALUES
        (@AnnouncementID, @UserID, @Content);
      SELECT SCOPE_IDENTITY() AS ID;
    `;
    const request = connection.request();
    request.input("AnnouncementID", sql.Int, AnnouncementID);
    request.input("UserID", sql.Int, UserID);
    request.input("Content", sql.VarChar(1000), Content);
    const result = await request.query(query);
    const newId = result.recordset[0].ID;
    connection.close();
    return newId;
  } catch (error) {
    console.error("Database error in postComment:", error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (err) { console.error("Error closing connection in postComment:", err); }
    }
  }
}

module.exports = {
  getAnnouncementsByGroup,
  createAnnouncement,
  getCommentsForAnnouncement,
  postComment
};
