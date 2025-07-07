const exerciseModel = require('../models/exerciseModel');

async function getExercises(req, res) {
    try {
        const userId = req.params.userId;
        const exercises = await exerciseModel.getExercises(userId);
        res.status(200).json(exercises);
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getSteps(req, res) {
    const exerciseId = req.params.exerciseId;
    try {
        const steps = await exerciseModel.getSteps(exerciseId);
        res.status(200).json(steps);
    }catch (error) {
        console.error('Error fetching steps:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function personalisation(req, res) {
    const { categoryIds, userId } = req.body;
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

async function getExercisePreferences(req, res) {
    try{
        const userId = req.params.userId;
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

async function updateExercisePreferences(req, res) {
    const { categoryIds, userId } = req.body;
    try {
        await exerciseModel.updateExercisePreferences(categoryIds, userId);
        res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Error updating user preferences', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function deleteExercisePreference(req, res) {
    const userId = req.params.userId;
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