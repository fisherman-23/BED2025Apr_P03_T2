const exerciseModel = require('../models/exerciseModel');

async function getExercises(req, res) {
    try {
        const exercises = await exerciseModel.getExercises();
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
module.exports = {
    getExercises,
    getSteps
};