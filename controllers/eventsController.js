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
  try {
    const newGroup = await eventsModel.createGroup(groupData);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Controller error in createGroup:", error);
    res.status(500).json({ error: "Error creating group" });
  }
}


module.exports = {
  getJoinedGroups,
  getAvailableGroups,
  createGroup
};