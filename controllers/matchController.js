const matchModel = require("../models/matchModel");

/**
 * Creates a match profile for the authenticated user if one doesn't already exist.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body` with profile data.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 201 if created, 409 if already exists, or error.
 */
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
/**
 * Checks whether the authenticated user has an existing match profile.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with `{ exists: boolean }` or error.
 */
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
/**
 * Updates the authenticated user's match profile if it exists.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body` with updated profile data.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with confirmation or 404 if profile doesn't exist.
 */
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
/**
 * Retrieves the authenticated user's match profile.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with profile data or 404 if not found.
 */
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
/**
 * Fetches potential matches for the authenticated user based on profile compatibility.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with an array of potential match profiles or error.
 */
async function getPotentialMatches(req, res) {
  const userId = req.user.id;

  try {
    const matches = await matchModel.getPotentialMatches(userId);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch potential matches." });
  }
}
/**
 * Likes another user on behalf of the authenticated user.
 * Returns whether the like resulted in a match.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.targetUserId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with `{ success: true, matched: boolean }` or error.
 */
async function likeUser(req, res) {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId, 10);

  if (userId === targetUserId) {
    return res.status(400).json({ error: "You cannot like yourself." });
  }

  try {
    const result = await matchModel.likeUser(userId, targetUserId);
    res.json({ success: true, matched: result.matched });
  } catch (err) {
    console.error("likeUser error:", err);
    res.status(500).json({ error: "Failed to like user." });
  }
}
/**
 * Skips (dislikes) another user on behalf of the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.targetUserId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with `{ success: true }` or error.
 */
async function skipUser(req, res) {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId, 10);

  if (userId === targetUserId) {
    return res.status(400).json({ error: "You cannot skip yourself." });
  }

  try {
    await matchModel.skipUser(userId, targetUserId);
    res.json({ success: true });
  } catch (err) {
    console.error("skipUser error:", err);
    res.status(500).json({ error: "Failed to skip user." });
  }
}

module.exports = {
  createMatchProfile,
  hasMatchProfile,
  updateMatchProfile,
  getMatchProfile,
  getPotentialMatches,
  likeUser,
  skipUser,
};
