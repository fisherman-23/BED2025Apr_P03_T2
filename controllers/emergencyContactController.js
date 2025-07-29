const EmergencyContact = require('../models/emergencyContactModel');

class EmergencyContactController {
    // creates a new emergency contact
    async createEmergencyContact(req, res) {
        try {
            const contactData = req.body;
            contactData.userId = req.user.id; // from JWT token
            
            const newContact = await EmergencyContact.createEmergencyContact(contactData);
            
            res.status(201).json({
                status: 'success',
                message: 'Emergency contact added successfully',
                data: { contact: newContact }
            });
        } catch (error) {
            console.error('Error creating emergency contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to add emergency contact',
                error: error.message
            });
        }
    }

    // gets all emergency contacts for the current user
    async getUserEmergencyContacts(req, res) {
        try {
            const contacts = await EmergencyContact.getContactsByUserId(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { contacts }
            });
        } catch (error) {
            console.error('Error fetching emergency contacts:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve emergency contacts',
                error: error.message
            });
        }
    }

    // gets a specific emergency contact by ID
    async getEmergencyContactById(req, res) {
        try {
            const contactId = req.params.id;
            const contact = await EmergencyContact.getContactById(contactId);
            
            if (!contact) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Emergency contact not found'
                });
            }

            if (contact.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this emergency contact'
                });
            }
            
            res.status(200).json({
                status: 'success',
                data: { contact }
            });
        } catch (error) {
            console.error('Error fetching emergency contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve emergency contact',
                error: error.message
            });
        }
    }

    // updates an existing emergency contact
    async updateEmergencyContact(req, res) {
        try {
            const contactId = req.params.id;
            const updateData = req.body;
            
            // check if contact exists and belongs to user
            const existingContact = await EmergencyContact.getContactById(contactId);
            if (!existingContact) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Emergency contact not found'
                });
            }

            if (existingContact.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this emergency contact'
                });
            }
            
            const updated = await EmergencyContact.updateEmergencyContact(contactId, updateData);
            
            if (updated) {
                const updatedContact = await EmergencyContact.getContactById(contactId);
                res.status(200).json({
                    status: 'success',
                    message: 'Emergency contact updated successfully',
                    data: { contact: updatedContact }
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to update emergency contact'
                });
            }
        } catch (error) {
            console.error('Error updating emergency contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update emergency contact',
                error: error.message
            });
        }
    }

    // deletes an emergency contact
    async deleteEmergencyContact(req, res) {
        try {
            const contactId = req.params.id;
            
            // check if contact exists and belongs to user
            const existingContact = await EmergencyContact.getContactById(contactId);
            if (!existingContact) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Emergency contact not found'
                });
            }

            if (existingContact.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this emergency contact'
                });
            }
            
            const deleted = await EmergencyContact.deleteEmergencyContact(contactId);
            
            if (deleted) {
                res.status(200).json({
                    status: 'success',
                    message: 'Emergency contact deleted successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to delete emergency contact'
                });
            }
        } catch (error) {
            console.error('Error deleting emergency contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete emergency contact',
                error: error.message
            });
        }
    }

    // triggers emergency alert to all contacts
    async triggerEmergencyAlert(req, res) {
        try {
            const { medicationId, alertType, message } = req.body;
            
            const result = await EmergencyContact.triggerAlert(req.user.id, {
                medicationId,
                alertType,
                message
            });
            
            res.status(200).json({
                status: 'success',
                message: 'Emergency alert sent successfully',
                data: result
            });
        } catch (error) {
            console.error('Error triggering emergency alert:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to send emergency alert',
                error: error.message
            });
        }
    }

    // gets alert history for user
    async getAlertHistory(req, res) {
        try {
            const history = await EmergencyContact.getAlertHistory(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { history }
            });
        } catch (error) {
            console.error('Error fetching alert history:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve alert history',
                error: error.message
            });
        }
    }
}

module.exports = new EmergencyContactController();