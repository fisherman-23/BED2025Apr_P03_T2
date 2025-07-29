const Caregiver = require('../models/caregiverModel');

class CaregiverController {
    // creates a new caregiver relationship
    async createCaregiverRelationship(req, res) {
        try {
            const relationshipData = req.body;
            relationshipData.caregiverId = req.user.id; // from JWT token
            
            const newRelationship = await Caregiver.createCaregiverRelationship(relationshipData);
            
            res.status(201).json({
                status: 'success',
                message: 'Caregiver relationship created successfully',
                data: { relationship: newRelationship }
            });
        } catch (error) {
            console.error('Error creating caregiver relationship:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to create caregiver relationship',
                error: error.message
            });
        }
    }

    // gets all patients for the current caregiver
    async getCaregiverPatients(req, res) {
        try {
            const patients = await Caregiver.getPatientsByCaregiverId(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { patients }
            });
        } catch (error) {
            console.error('Error fetching caregiver patients:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve patients',
                error: error.message
            });
        }
    }

    // gets real-time monitoring dashboard for a specific patient
    async getPatientMonitoringDashboard(req, res) {
        try {
            const { patientId } = req.params;
            
            // verify caregiver has access to this patient
            const hasAccess = await Caregiver.verifyCaregiverAccess(req.user.id, patientId);
            if (!hasAccess) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this patient'
                });
            }
            
            const dashboard = await Caregiver.getPatientMonitoringDashboard(patientId);
            
            res.status(200).json({
                status: 'success',
                data: dashboard
            });
        } catch (error) {
            console.error('Error fetching patient monitoring dashboard:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve patient monitoring dashboard',
                error: error.message
            });
        }
    }

    // gets medication adherence alerts for caregiver
    async getMedicationAlerts(req, res) {
        try {
            const { patientId } = req.params;
            const { status = 'active' } = req.query;
            
            // verify caregiver has access
            const hasAccess = await Caregiver.verifyCaregiverAccess(req.user.id, patientId);
            if (!hasAccess) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this patient'
                });
            }
            
            const alerts = await Caregiver.getMedicationAlerts(patientId, status);
            
            res.status(200).json({
                status: 'success',
                data: { alerts }
            });
        } catch (error) {
            console.error('Error fetching medication alerts:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve medication alerts',
                error: error.message
            });
        }
    }

    // adds caregiver notes about patient
    async addCaregiverNote(req, res) {
        try {
            const { patientId } = req.params;
            const noteData = req.body;
            noteData.caregiverId = req.user.id;
            noteData.patientId = patientId;
            
            // verify caregiver has access
            const hasAccess = await Caregiver.verifyCaregiverAccess(req.user.id, patientId);
            if (!hasAccess) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this patient'
                });
            }
            
            const note = await Caregiver.addCaregiverNote(noteData);
            
            res.status(201).json({
                status: 'success',
                message: 'Caregiver note added successfully',
                data: { note }
            });
        } catch (error) {
            console.error('Error adding caregiver note:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to add caregiver note',
                error: error.message
            });
        }
    }

    // gets caregiver notes for a patient
    async getCaregiverNotes(req, res) {
        try {
            const { patientId } = req.params;
            
            // verify caregiver has access
            const hasAccess = await Caregiver.verifyCaregiverAccess(req.user.id, patientId);
            if (!hasAccess) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this patient'
                });
            }
            
            const notes = await Caregiver.getCaregiverNotes(patientId, req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { notes }
            });
        } catch (error) {
            console.error('Error fetching caregiver notes:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve caregiver notes',
                error: error.message
            });
        }
    }

    // acknowledges an alert
    async acknowledgeAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { notes } = req.body;
            
            const result = await Caregiver.acknowledgeAlert(alertId, req.user.id, notes);
            
            if (result) {
                res.status(200).json({
                    status: 'success',
                    message: 'Alert acknowledged successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to acknowledge alert'
                });
            }
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to acknowledge alert',
                error: error.message
            });
        }
    }

    // generates weekly adherence report
    async generateWeeklyReport(req, res) {
        try {
            const { patientId } = req.params;
            
            // verify caregiver has access
            const hasAccess = await Caregiver.verifyCaregiverAccess(req.user.id, patientId);
            if (!hasAccess) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this patient'
                });
            }
            
            const report = await Caregiver.generateWeeklyReport(patientId);
            
            res.status(200).json({
                status: 'success',
                data: { report }
            });
        } catch (error) {
            console.error('Error generating weekly report:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate weekly report',
                error: error.message
            });
        }
    }

    // updates alert preferences for caregiver
    async updateAlertPreferences(req, res) {
        try {
            const { patientId } = req.params;
            const preferences = req.body;
            
            // verify caregiver has access
            const hasAccess = await Caregiver.verifyCaregiverAccess(req.user.id, patientId);
            if (!hasAccess) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this patient'
                });
            }
            
            const updated = await Caregiver.updateAlertPreferences(req.user.id, patientId, preferences);
            
            if (updated) {
                res.status(200).json({
                    status: 'success',
                    message: 'Alert preferences updated successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to update alert preferences'
                });
            }
        } catch (error) {
            console.error('Error updating alert preferences:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update alert preferences',
                error: error.message
            });
        }
    }
}

module.exports = new CaregiverController();