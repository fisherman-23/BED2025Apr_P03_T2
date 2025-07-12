const Medication = require('../models/medicationModel');

class MedicationController {
    // creates a new medication record
    async createMedication(req, res) {
        try {
            const medicationData = req.body;
            medicationData.userId = req.user.id; // from JWT token
            
            const newMedication = await Medication.createMedication(medicationData);
            
            res.status(201).json({
                status: 'success',
                message: 'Medication added successfully',
                data: { medication: newMedication }
            });
        } catch (error) {
            console.error('Error creating medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to add medication',
                error: error.message
            });
        }
    }

    // gets all medications for the current user
    async getUserMedications(req, res) {
        try {
            const medications = await Medication.getMedicationsByUserId(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { medications }
            });
        } catch (error) {
            console.error('Error fetching medications:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve medications',
                error: error.message
            });
        }
    }

    // gets a specific medication by ID
    async getMedicationById(req, res) {
        try {
            const medicationId = req.params.id;
            const medication = await Medication.getMedicationById(medicationId);
            
            if (!medication) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }

            // check if medication belongs to current user
            if (medication.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this medication record'
                });
            }
            
            res.status(200).json({
                status: 'success',
                data: { medication }
            });
        } catch (error) {
            console.error('Error fetching medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve medication',
                error: error.message
            });
        }
    }

    // updates a medication record
    async updateMedication(req, res) {
        try {
            const medicationId = req.params.id;
            const updateData = req.body;
            
            // first check if medication exists and belongs to user
            const existingMedication = await Medication.getMedicationById(medicationId);
            if (!existingMedication) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }

            if (existingMedication.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this medication record'
                });
            }
            
            const updated = await Medication.updateMedication(medicationId, updateData);
            
            if (updated) {
                res.status(200).json({
                    status: 'success',
                    message: 'Medication updated successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to update medication'
                });
            }
        } catch (error) {
            console.error('Error updating medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update medication',
                error: error.message
            });
        }
    }

    // deletes a medication record
    async deleteMedication(req, res) {
        try {
            const medicationId = req.params.id;
            
            // first check if medication exists and belongs to user
            const existingMedication = await Medication.getMedicationById(medicationId);
            if (!existingMedication) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }

            if (existingMedication.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this medication record'
                });
            }
            
            const deleted = await Medication.deleteMedication(medicationId);
            
            if (deleted) {
                res.status(200).json({
                    status: 'success',
                    message: 'Medication deleted successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to delete medication'
                });
            }
        } catch (error) {
            console.error('Error deleting medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete medication',
                error: error.message
            });
        }
    }

    // marks medication as taken
    async markMedicationTaken(req, res) {
        try {
            const medicationId = req.params.id;
            
            // check if medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            const result = await Medication.markAsTaken(medicationId);
            
            res.status(200).json({
                status: 'success',
                message: 'Medication marked as taken',
                data: result
            });
        } catch (error) {
            console.error('Error marking medication as taken:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to mark medication as taken',
                error: error.message
            });
        }
    }

    // gets upcoming medication reminders for user
    async getUpcomingReminders(req, res) {
        try {
            const reminders = await Medication.getUpcomingReminders(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { reminders }
            });
        } catch (error) {
            console.error('Error fetching reminders:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve reminders',
                error: error.message
            });
        }
    }
}

module.exports = new MedicationController();