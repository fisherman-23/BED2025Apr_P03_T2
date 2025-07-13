const exerciseModel = require('../models/exerciseModel');

// Get exercises based on user preferences or all exercises if no preferences are set
async function getExercises(req, res) {
    try {
        const userId = req.user.id;
        const exercises = await exerciseModel.getExercises(userId);
        res.status(200).json(exercises);
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Get steps for a specific exercise
async function getSteps(req, res) {
    const exerciseId = parseInt(req.params.exerciseId);
    try {
        const steps = await exerciseModel.getSteps(exerciseId);
        res.status(200).json(steps);
    }catch (error) {
        console.error('Error fetching steps:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Add user preferences for exercises
async function personalisation(req, res) {
    const { categoryIds} = req.body;
    const userId = req.user.id;
    try {
        const result = await exerciseModel.personalisation(categoryIds, userId);
        if (result) {
            res.status(200).json({ message: 'Preferences saved successfully' });
        } else {
            res.status(400).json({ error: 'Failed to save preferences' });
        }
    }catch (error) {
        console.error('Error saving user preferences', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Get user preferences
async function getExercisePreferences(req, res) {
    try{
        const userId = req.user.id;
        const preferences = await exerciseModel.getExercisePreferences(userId);
        if (!preferences || preferences.length === 0) {
            res.status(200).json({ categoryIds: [], message: 'No preferences found' });
        } else {
            res.status(200).json({ categoryIds: preferences.map(p => p.categoryId) });
        }
    }catch (error) {
        console.error('Error getting user exercise preferences', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Update user preferences
async function updateExercisePreferences(req, res) {
    const { categoryIds} = req.body;
    const userId = req.user.id;
    try {
        await exerciseModel.updateExercisePreferences(categoryIds, userId);
        res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Error updating user preferences', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Delete user preferences
async function deleteExercisePreference(req, res) {
    const userId = req.user.id;
    try {
        await exerciseModel.deleteExercisePreference(userId);
        res.status(200).json({ message: 'Preference deleted successfully' });
    } catch (error) {
        console.error('Error deleting user preference', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
module.exports = {
    getExercises,
    getSteps,
    personalisation,
    getExercisePreferences,
    updateExercisePreferences,
    deleteExercisePreference
};