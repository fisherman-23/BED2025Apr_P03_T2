const announcementsModel = require("../models/announcementsModel");
const sql = require("mssql");

/**
 * Retrieves all announcements for a specific group.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.query.groupId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with an array of announcements or an error status.
 */
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

/**
 * Creates a new announcement in a group if the user is the group owner.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and announcement data in body.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with the new announcement ID or an error status.
 */
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

/**
 * Retrieves all comments for a specific announcement with ownership flags.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with an array of comments or an error status.
 */
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

/**
 * Creates a new comment on an announcement by the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and comment data in body.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with the new comment ID or an error status.
 */
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

/**
 * Deletes a comment if the user is authorized to do so.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or an error status.
 */
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

/**
 * Updates an existing announcement if the user is the creator.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`, `req.params.id`, and updated data in body.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or an error status.
 */
async function editAnnouncement(req, res) {
  const userId = req.user.id;
  const announcementId = Number(req.params.id);
  const { Title, Content, ImageURL } = req.body;

  try {
    await announcementsModel.editAnnouncement({
      announcementId,
      title: Title,
      content: Content,
      imageUrl: ImageURL,
      userId
    });

    return res.status(200).json({ message: "Announcement updated" });
  } catch (err) {
    if (err.code === "FORBIDDEN") {
      return res.status(403).json({ error: err.message });
    }
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Controller error in editAnnouncement:", err);
    return res.status(500).json({ error: "Error editing announcement" });
  }
}

/**
 * Deletes an announcement if the user is the creator.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or an error status.
 */
async function deleteAnnouncement(req, res) {
  const userId = req.user.id;
  const announcementId = Number(req.params.id);

  try {
    await announcementsModel.deleteAnnouncement(announcementId, userId);
    return res.status(200).json({ message: "Announcement deleted" });
  } catch (err) {
    if (err.code === "FORBIDDEN") {
      return res.status(403).json({ error: err.message });
    }
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Controller error in deleteAnnouncement:", err);
    return res.status(500).json({ error: "Error deleting announcement" });
  }
}



module.exports = {
  getAnnouncements,
  createAnnouncement,
  getComments,
  postComment,
  deleteComment,
  editAnnouncement,
  deleteAnnouncement
};
