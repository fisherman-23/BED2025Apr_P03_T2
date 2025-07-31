goalModel = require("../models/goalModel");

/**
 * Creates a new exercise goal for the user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.name`, `req.body.description`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 201 and the created goal, or 500 on error.
 */
async function createGoal(req, res) {
  const userId = req.user.id; // from JWT middleware
  const { name, description } = req.body;
  try {
    const goal = await goalModel.createGoal(userId, name, description);
    res.status(201).json(goal);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
}

/**
 * Gets all goals for the user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and goal list, or 500 on error.
 */
async function getGoals(req, res) {
  const userId = parseInt(req.user.id); // from JWT middleware
  try {
    const goals = await goalModel.getGoals(userId);
    res.status(200).json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
}

/**
 * Deletes a goal by its ID.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.params.goalId`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 on success, or 500 on error.
 */
async function deleteGoal(req, res) {
  const goalId = parseInt(req.params.goalId);
  try {
    await goalModel.deleteGoal(goalId);
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
}

/**
 * Updates the completion status of a list of goals.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.goalIds`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and updated goals, or 500 on error.
 */
async function updateGoal(req, res) {
  const goalIds = req.body.goalIds;
  console.log("Goal IDs to update:", goalIds);
  const userId = parseInt(req.user.id); // from JWT middleware
  try {
    const results = [];
    for (const goalId of goalIds) {
      const updatedGoal = await goalModel.updateGoal(parseInt(goalId), userId);
      results.push(updatedGoal);
    }
    res.status(200).json(results);
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
}

/**
 * Gets all incomplete goals for the user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and list of incomplete goals, or 500 on error.
 */
async function getIncompletedGoals(req, res) {
  const userId = parseInt(req.user.id); // from JWT middleware
  try {
    const goals = await goalModel.getIncompletedGoals(userId);
    res.status(200).json(goals);
  } catch (error) {
    console.error("Error fetching incompleted goals:", error);
    res.status(500).json({ error: "Failed to fetch incompleted goals" });
  }
}

/**
 * Resets all goals that have been completed the day before.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 200 and reset result, or 500 on error.
 */
async function resetGoal(req, res) {
  const userId = parseInt(req.user.id); // from JWT middleware
  try {
    const reset = await goalModel.resetGoal(userId);
    res.status(200).json(reset);
  } catch (error) {
    console.error("Error resetting goal:", error);
    res.status(500).json({ error: "Failed to reset goal" });
  }
}

/**
 * Logs completion for a list of goals for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object. Requires `req.user.id` and `req.body.goalIds`.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {void} Responds with 201 on success, or 500 on error.
 */
async function logGoalCompletion(req, res) {
  const userId = parseInt(req.user.id);
  const goalIds = req.body.goalIds;
  try {
    for (const goalID of goalIds) {
      await goalModel.logGoalCompletion(userId, goalID);
    }
    res.status(201).json({ message: "Goal logged" });
  } catch (error) {
    console.error("Error logging goal", error);
    res.status(500).json({ error: "Failed to log goal" });
  }
}

module.exports = {
  createGoal,
  getGoals,
  deleteGoal,
  updateGoal,
  getIncompletedGoals,
  resetGoal,
  logGoalCompletion,
};
