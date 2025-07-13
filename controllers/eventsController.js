const eventsModel = require("../models/eventsModel.js");

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


module.exports = {
  getJoinedGroups,
  getAvailableGroups,
  createGroup,
  joinGroup,
  leaveGroup
};