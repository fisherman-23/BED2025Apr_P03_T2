const exerciseModel = require("../models/exerciseModel");

/**
 * Gets exercises based on user preferences, or all exercises if no preferences are set.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and exercises data, or 500 on error.
 */
async function getExercises(req, res) {
  try {
    const userId = req.user.id;
    const exercises = await exerciseModel.getExercises(userId);
    res.status(200).json(exercises);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Gets the steps for a specific exercise.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.params.exerciseId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and steps data, or 500 on error.
 */
async function getSteps(req, res) {
  const exerciseId = parseInt(req.params.exerciseId);
  try {
    const steps = await exerciseModel.getSteps(exerciseId);
    res.status(200).json(steps);
  } catch (error) {
    console.error("Error fetching steps:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Saves the user's preferred exercise categories.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.categoryIds`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 201 on success, or 500 on error.
 */
async function personalisation(req, res) {
  const { categoryIds } = req.body;
  const userId = req.user.id;
  try {
    const result = await exerciseModel.personalisation(categoryIds, userId);
    if (result) {
      res.status(201).json({ message: "Preferences saved successfully" });
    } else {
      res.status(400).json({ error: "Failed to save preferences" });
    }
  } catch (error) {
    console.error("Error saving user preferences", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Gets the user's exercise category preferences.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and categoryIds or message, or 500 on error.
 */
async function getExercisePreferences(req, res) {
  try {
    const userId = req.user.id;
    const preferences = await exerciseModel.getExercisePreferences(userId);
    if (!preferences || preferences.length === 0) {
      res
        .status(200)
        .json({ categoryIds: [], message: "No preferences found" });
    } else {
      res
        .status(200)
        .json({ categoryIds: preferences.map((p) => p.categoryId) });
    }
  } catch (error) {
    console.error("Error getting user exercise preferences", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Updates the user's exercise category preferences.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.categoryIds`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 on success, or 500 on error.
 */
async function updateExercisePreferences(req, res) {
  const { categoryIds } = req.body;
  const userId = req.user.id;
  try {
    await exerciseModel.updateExercisePreferences(categoryIds, userId);
    res.status(200).json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating user preferences", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Deletes all exercise preferences for the user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 on success, or 500 on error.
 */
async function deleteExercisePreference(req, res) {
  const userId = req.user.id;
  try {
    await exerciseModel.deleteExercisePreference(userId);
    res.status(200).json({ message: "Preference deleted successfully" });
  } catch (error) {
    console.error("Error deleting user preference", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Gets statistics for the number exercise and goals the user has completed.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and statistics, or 500 on error.
 */
async function getUserStats(req, res) {
  const userID = req.user.id;
  try {
    const stat = await exerciseModel.getUserStats(userID);
    res.status(200).json(stat);
  } catch (error) {
    console.error("Error in getting user statistics", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Logs an exercise as completed by the user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.params.exerciseID`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 201 on success, or 500 on error.
 */
async function logExerciseCompletion(req, res) {
  const userID = req.user.id;
  const exerciseID = req.params.exerciseID;
  try {
    await exerciseModel.logExerciseCompletion(userID, exerciseID);
    res.status(201).json({ message: "Exercise logged" });
  } catch (error) {
    console.error("Error in logging user completed exercises", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getExercises,
  getSteps,
  personalisation,
  getExercisePreferences,
  updateExercisePreferences,
  deleteExercisePreference,
  getUserStats,
  logExerciseCompletion,
};
