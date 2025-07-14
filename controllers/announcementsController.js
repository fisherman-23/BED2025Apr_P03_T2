const announcementsModel = require("../models/announcementsModel");
const sql = require("mssql");

async function getAnnouncements(req, res) {
  const groupId = Number(req.query.groupId);
  try {
    // only group members should call; assume route is protected
    const list = await announcementsModel.getAnnouncementsByGroup(groupId);
    res.json(list);
  } catch (err) {
    console.error("Controller error in getAnnouncements:", err);
    res.status(500).json({ error: "Error retrieving announcements" });
  }
}

async function createAnnouncement(req, res) {
  const userId = req.user.id;
  const { GroupID, Title, Content, ImageURL } = req.body;
  try {
    // ensure req.user is group creator
    // (you could fetch group.CreatedBy from DB and compare)
    const newId = await announcementsModel.createAnnouncement({
      GroupID, Title, Content, ImageURL, CreatedBy: userId
    });
    res.status(201).json({ id: newId });
  } catch (err) {
    console.error("Controller error in createAnnouncement:", err);
    res.status(500).json({ error: "Error creating announcement" });
  }
}

async function getComments(req, res) {
  const announcementId = Number(req.params.id);
  try {
    const list = await announcementsModel.getCommentsForAnnouncement(announcementId);
    res.json(list);
  } catch (err) {
    console.error("Controller error in getComments:", err);
    res.status(500).json({ error: "Error retrieving comments" });
  }
}

async function postComment(req, res) {
  const userId = req.user.id;
  const announcementId = req.body.announcementId;
  const content = req.body.content;
  try {
    // membership‐check…
    const pool = await sql.connect(require("../dbConfig"));
    const check = await pool.request()
      .input("AnnouncementID", announcementId)
      .input("UserID", userId)
      .query(`
        SELECT 1
        FROM Announcements a
        JOIN GroupMembers gm ON a.GroupID = gm.GroupID
        WHERE a.ID = @AnnouncementID
          AND gm.UserID = @UserID
      `);
    if (!check.recordset.length)
      return res.status(403).json({ error: "Must be a member to comment" });

    const commentId = await announcementsModel.postComment({
      AnnouncementID: announcementId,
      UserID: userId,
      Content: content
    });
    res.status(201).json({ id: commentId });
  } catch (err) {
    console.error("Controller error in postComment:", err);
    res.status(500).json({ error: "Error posting comment" });
  }
}


module.exports = {
  getAnnouncements,
  createAnnouncement,
  getComments,
  postComment
};
