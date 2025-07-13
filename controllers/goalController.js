goalModel = require('../models/goalModel');

// Create a new goal
async function createGoal(req, res) {
    const userId = req.user.id; // from JWT middleware
    const { name, description } = req.body;
    try {
        const goal = await goalModel.createGoal(userId, name, description);
        res.status(201).json(goal);
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
}
 
// Get all goals for a user
async function getGoals(req, res) {
    const userId = parseInt(req.user.id); // from JWT middleware
    try {
        const goals = await goalModel.getGoals(userId);
        res.status(200).json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
}
 
// Delete a goal
async function deleteGoal(req, res) {
    const goalId = parseInt(req.params.goalId);
    try {
        await goalModel.deleteGoal(goalId);
        res.status(200).json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
}

// Update goals
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
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
}

// Get incompleted goals
async function getIncompletedGoals(req, res) {
    const userId = parseInt(req.user.id); // from JWT middleware
    try {
        const goals = await goalModel.getIncompletedGoals(userId);
        res.status(200).json(goals);
    } catch (error) {
        console.error('Error fetching incompleted goals:', error);
        res.status(500).json({ error: 'Failed to fetch incompleted goals' });
    }
}

// Reset all goals
async function resetGoal(req, res) {
    const userId = parseInt(req.user.id); // from JWT middleware
    try{
        const reset = await goalModel.resetGoal(userId);
        res.status(200).json(reset);
    }catch (error) {
        console.error('Error resetting goal:', error);
        res.status(500).json({ error: 'Failed to reset goal' });
    }
}

module.exports = {
    createGoal,
    getGoals,
    deleteGoal,
    updateGoal,
    getIncompletedGoals,
    resetGoal
};