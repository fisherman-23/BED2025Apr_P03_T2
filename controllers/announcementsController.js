const announcementsModel = require("../models/announcementsModel");
const sql = require("mssql");

async function getAnnouncements(req, res) {
  const groupId = Number(req.query.groupId);
  try {
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
    const group = await announcementsModel.getGroupById(GroupID);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.CreatedBy !== userId) {
      return res.status(403).json({ error: "Only the group owner can post announcements" });
    }

    const newId = await announcementsModel.createAnnouncement({ GroupID, Title, Content, ImageURL, CreatedBy: userId });

    return res.status(201).json({ id: newId });
  } catch (err) {
    console.error("Controller error in createAnnouncement:", err);
    return res.status(500).json({ error: "Error creating announcement" });
  }
}


async function getComments(req, res) {
  const announcementId = Number(req.params.id);
  const userId = req.user.id;
  try {
    const raw = await announcementsModel.getCommentsForAnnouncement(announcementId);
    const list = raw.map(c => ({
      ...c,
      IsOwnComment: c.UserID === userId
    }));
    res.json(list);
  } catch (err) {
    console.error("Controller error in getComments:", err);
    res.status(500).json({ error: "Error retrieving comments" });
  }
}

async function postComment(req, res) {
  const userId = req.user.id;
  const { announcementId, content } = req.body;

  try {
    const commentId = await announcementsModel.postComment({
      AnnouncementID: announcementId,
      UserID: userId,
      Content: content,
    });
    res.status(201).json({ id: commentId });
  } catch (err) {
    console.error("Controller error in postComment:", err);
    res.status(500).json({ error: "Error posting comment" });
  }
}


async function deleteComment(req, res) {
  const userId = req.user.id;
  const commentId = Number(req.params.id);

  try {
    await announcementsModel.deleteComment(userId, commentId);
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    if (err.code === "FORBIDDEN") {
      return res.status(403).json({ error: err.message });
    }
    console.error("Controller error in deleteComment:", err);
    res.status(500).json({ error: "Error deleting comment" });
  }
}




module.exports = {
  getAnnouncements,
  createAnnouncement,
  getComments,
  postComment,
  deleteComment
};
