const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAnnouncementsByGroup(groupId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("GroupID", groupId)
    .query(`
      SELECT a.ID, a.Title, a.Content, a.ImageURL, a.CreatedAt, u.Name AS CreatedByName
      FROM Announcements a
      JOIN Users u ON a.CreatedBy = u.ID
      WHERE a.GroupID = @GroupID
      ORDER BY a.CreatedAt DESC
    `);
  return result.recordset;
}

async function createAnnouncement({ GroupID, Title, Content, ImageURL, CreatedBy }) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("GroupID",    sql.Int,    GroupID)
    .input("Title",      sql.VarChar(100), Title)
    .input("Content",    sql.VarChar(2000), Content)
    .input("ImageURL",   sql.VarChar(1000), ImageURL || null)
    .input("CreatedBy",  sql.Int,    CreatedBy)
    .query(`
      INSERT INTO Announcements (GroupID, Title, Content, ImageURL, CreatedBy)
      VALUES (@GroupID, @Title, @Content, @ImageURL, @CreatedBy);
      SELECT SCOPE_IDENTITY() AS ID;
    `);
  return result.recordset[0].ID;
}

async function getCommentsForAnnouncement(announcementId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("AnnouncementID", announcementId)
    .query(`
      SELECT c.ID, c.Content, c.CreatedAt, u.ID AS UserID, u.Name, u.ProfilePicture
      FROM Comments c
      JOIN Users u ON c.UserID = u.ID
      WHERE c.AnnouncementID = @AnnouncementID
      ORDER BY c.CreatedAt ASC
    `);
  return result.recordset;
}

async function postComment({ AnnouncementID, UserID, Content }) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("AnnouncementID", sql.Int, AnnouncementID)
    .input("UserID",        sql.Int, UserID)
    .input("Content",       sql.VarChar(1000), Content)
    .query(`
      INSERT INTO Comments (AnnouncementID, UserID, Content)
      VALUES (@AnnouncementID, @UserID, @Content);
      SELECT SCOPE_IDENTITY() AS ID;
    `);
  return result.recordset[0].ID;
}

module.exports = {
  getAnnouncementsByGroup,
  createAnnouncement,
  getCommentsForAnnouncement,
  postComment
};
