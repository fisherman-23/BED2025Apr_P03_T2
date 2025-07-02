const matchModel = require("../models/matchModel");

async function createMatchProfile(req, res) {
  const userId = req.user.id;
  const data = req.body;

  try {
    const alreadyExists = await matchModel.hasMatchProfile(userId);
    if (alreadyExists) {
      return res.status(409).json({ error: "Match profile already exists." });
    }

    await matchModel.createMatchProfile(userId, data);
    res.status(201).json({ message: "Match profile created." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create profile." });
  }
}

async function hasMatchProfile(req, res) {
  const userId = req.user.id;

  try {
    const exists = await matchModel.hasMatchProfile(userId);
    res.status(200).json({ exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not check match profile." });
  }
}

async function updateMatchProfile(req, res) {
  const userId = req.user.id;
  const data = req.body;

  try {
    const exists = await matchModel.hasMatchProfile(userId);
    if (!exists) {
      return res
        .status(404)
        .json({ error: "No match profile found to update." });
    }

    await matchModel.updateMatchProfile(userId, data);
    res.status(200).json({ message: "Match profile updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update profile." });
  }
}

async function getMatchProfile(req, res) {
  const userId = req.user.id;
  try {
    const profile = await matchModel.getMatchProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving profile." });
  }
}

async function getPotentialMatches(req, res) {
  const userId = req.user.id;

  try {
    const matches = await matchModel.getPotentialMatches(userId);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch potential matches." });
  }
}

module.exports = {
  createMatchProfile,
  hasMatchProfile,
  updateMatchProfile,
  getMatchProfile,
  getPotentialMatches,
};
