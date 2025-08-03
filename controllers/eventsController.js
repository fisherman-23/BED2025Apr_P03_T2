const eventsModel = require("../models/eventsModel.js");

/**
 * Retrieves all groups that the authenticated user has joined.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with an array of joined groups or an error.
 */
async function getJoinedGroups(req, res) {
  const userId = req.user.id;
  try {
    const groups = await eventsModel.getJoinedGroups(userId);
    res.json(groups);
  } catch (error) {
    console.error("Controller error in getJoinedGroups:", error);
    res.status(500).json({ error: "Error retrieving joined groups" });
  }
}

/**
 * Retrieves all available public groups that the authenticated user can join.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with an array of available groups or an error.
 */
async function getAvailableGroups(req, res) {
  const userId = req.user.id;
  try {
    const groups = await eventsModel.getAvailableGroups(userId);
    res.json(groups);
  } catch (error) {
    console.error("Controller error in getAvailableGroups:", error);
    res.status(500).json({ error: "Error retrieving available groups" });
  }
}

/**
 * Creates a new group with the authenticated user as the owner.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and group data in body.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with the created group object or an error status.
 */
async function createGroup(req, res) {
  const groupData = req.body;
  const userId = req.user.id;
  try {
    const newGroup = await eventsModel.createGroup(groupData, userId);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Controller error in createGroup:", error);
    res.status(500).json({ error: "Error creating group" });
  }
}

/**
 * Adds the authenticated user to an existing group as a member.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.groupId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or an error status.
 */
async function joinGroup(req, res) {
  try {
    const userId = req.user.id;
    const { groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    const result = await eventsModel.joinGroup(userId, groupId);
    if (result) {
      res.status(200).json({ message: "Successfully joined the group" });
    } else {
      res.status(404).json({ error: "Group not found or already joined" });
    }
  } catch (error) {
    console.error("Controller error in joinGroup:", error);
    res.status(500).json({ error: "Error joining group" });
  }
}

/**
 * Removes the authenticated user from a group they are currently a member of.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.groupId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or an error status.
 */
async function leaveGroup(req, res) {
    try {
    const userId  = req.user.id;
    const { groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }

    const result = await eventsModel.leaveGroup(userId, groupId);
    if (result) {
      res.status(200).json({ message: "Successfully left the group" });
    } else {
      res.status(404).json({ error: "Not a member of that group" });
    }
  } catch (error) {
    console.error("Controller error in leaveGroup:", error);
    res.status(500).json({ error: "Error leaving group" });
  }
}

/**
 * Generates an invite token for a group owned by the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.groupId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with the invite token or an error status.
 */
async function getGroupInviteToken(req, res) {
  try {
    const userId = req.user.id;
    const groupId = Number(req.params.groupId);
    
    const groupToken = await eventsModel.getGroupInviteToken(userId, groupId);
    if (groupToken) {
      res.json({ inviteToken: groupToken });
    } else {
      res.status(404).json({ error: "Group not found or you're not the owner" });
    }
  } catch (error) {
    console.error("Controller error in getGroupInviteToken:", error);
    res.status(500).json({ error: "Error retrieving group invite token" });
  }
}

/**
 * Finds and returns group information using an invite token.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.params.token`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with group information or an error status.
 */
async function findGroupByToken(req, res) {
  try {
    const token = req.params.token;
    const group = await eventsModel.findGroupByInviteToken(token);
    if (group) {
      res.json(group);
    } else {
      res.status(404).json({ error: "Group not found" });
    }
  } catch (error) {
    console.error("Controller error in findGroupByToken:", error);
    res.status(500).json({ error: "Error finding group" });
  }
}

/**
 * Allows the authenticated user to join a group using an invite token.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.inviteToken`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with a success message or an error status.
 */
async function joinGroupByToken(req, res) {
  try {
    const userId = req.user.id;
    const token = req.body.inviteToken;
    
    if (!token) {
      return res.status(400).json({ error: "Invite token is required" });
    }
    
    const result = await eventsModel.joinGroupByInviteToken(userId, token);
    if (result.success) {
      res.status(200).json({ message: result.message, groupName: result.groupName });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("Controller error in joinGroupByToken:", error);
    res.status(500).json({ error: "Error joining group" });
  }
}


module.exports = {
  getJoinedGroups,
  getAvailableGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  getGroupInviteToken,
  findGroupByToken,
  joinGroupByToken
};