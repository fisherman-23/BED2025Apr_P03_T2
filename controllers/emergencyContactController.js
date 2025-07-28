const EmergencyContact = require('../models/emergencyContactModel');
const { validateEmergencyContact } = require('../utils/validators');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');

class EmergencyContactController {
    // creates a new emergency contact
    async createEmergencyContact(req, res) {
        try {
            const contactData = req.body;
            contactData.userId = req.user.id;
            
            // validate input data
            const { error } = validateEmergencyContact(contactData);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    details: error.details[0].message
                });
            }
            
            // if setting as primary, ensure no other primary contact exists
            if (contactData.isPrimary) {
                await EmergencyContact.clearPrimaryContact(contactData.userId);
            }
            
            // verify phone number format (singapore format)
            if (!this.isValidSingaporePhone(contactData.phoneNumber)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid Singapore phone number format. Use +65-XXXX-XXXX format.'
                });
            }
            
            const newContact = await EmergencyContact.createEmergencyContact(contactData);
            
            // send verification SMS/email to new contact
            if (contactData.phoneNumber) {
                await this.sendVerificationSMS(newContact);
            }
            if (contactData.email) {
                await this.sendVerificationEmail(newContact);
            }
            
            res.status(201).json({
                status: 'success',
                message: 'Emergency contact added successfully. Verification messages sent.',
                data: { contact: newContact }
            });
        } catch (error) {
            console.error('Error creating emergency contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to create emergency contact',
                error: error.message
            });
        }
    }

    // gets all emergency contacts for the user
    async getUserEmergencyContacts(req, res) {
        try {
            const contacts = await EmergencyContact.getContactsByUserId(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { 
                    contacts,
                    total: contacts.length,
                    primaryContact: contacts.find(c => c.isPrimary) || null
                }
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

            // check if contact belongs to current user
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

    // updates an emergency contact
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
            
            // validate update data
            const { error } = validateEmergencyContact(updateData, true); // partial validation for updates
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    details: error.details[0].message
                });
            }
            
            // if setting as primary, clear other primary contacts
            if (updateData.isPrimary && !existingContact.isPrimary) {
                await EmergencyContact.clearPrimaryContact(existingContact.userId);
            }
            
            // verify phone number format if being updated
            if (updateData.phoneNumber && !this.isValidSingaporePhone(updateData.phoneNumber)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid Singapore phone number format. Use +65-XXXX-XXXX format.'
                });
            }
            
            const updated = await EmergencyContact.updateEmergencyContact(contactId, updateData);
            
            if (updated) {
                // if phone or email changed, send new verification
                if (updateData.phoneNumber && updateData.phoneNumber !== existingContact.phoneNumber) {
                    const updatedContact = await EmergencyContact.getContactById(contactId);
                    await this.sendVerificationSMS(updatedContact);
                }
                if (updateData.email && updateData.email !== existingContact.email) {
                    const updatedContact = await EmergencyContact.getContactById(contactId);
                    await this.sendVerificationEmail(updatedContact);
                }
                
                res.status(200).json({
                    status: 'success',
                    message: 'Emergency contact updated successfully'
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

    // sets a contact as primary (only one primary per user)
    async setPrimaryContact(req, res) {
        try {
            const contactId = req.params.id;
            
            // verify contact belongs to user
            const contact = await EmergencyContact.getContactById(contactId);
            if (!contact || contact.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Emergency contact not found'
                });
            }
            
            // clear existing primary and set new one
            await EmergencyContact.clearPrimaryContact(req.user.id);
            await EmergencyContact.updateEmergencyContact(contactId, { isPrimary: true });
            
            res.status(200).json({
                status: 'success',
                message: 'Primary contact updated successfully'
            });
        } catch (error) {
            console.error('Error setting primary contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to set primary contact',
                error: error.message
            });
        }
    }

    // verifies a contact (when they respond to verification)
    async verifyContact(req, res) {
        try {
            const { contactId, verificationCode } = req.body;
            
            const contact = await EmergencyContact.getContactById(contactId);
            if (!contact) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Contact not found'
                });
            }
            
            // simple verification, in production, store and verify actual codes
            if (verificationCode === '1234') { // demo code
                await EmergencyContact.updateEmergencyContact(contactId, { 
                    verificationStatus: 'verified' 
                });
                
                res.status(200).json({
                    status: 'success',
                    message: 'Contact verified successfully'
                });
            } else {
                await EmergencyContact.updateEmergencyContact(contactId, { 
                    verificationStatus: 'failed' 
                });
                
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid verification code'
                });
            }
        } catch (error) {
            console.error('Error verifying contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to verify contact',
                error: error.message
            });
        }
    }

    // sends test alert to emergency contacts
    async sendTestAlert(req, res) {
        try {
            const { message, alertType = 'test' } = req.body;
            
            const contacts = await EmergencyContact.getContactsByUserId(req.user.id);
            const activeContacts = contacts.filter(c => c.isActive && c.verificationStatus === 'verified');
            
            if (activeContacts.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No verified emergency contacts found'
                });
            }
            
            const results = [];
            for (const contact of activeContacts) {
                try {
                    // send SMS
                    if (contact.phoneNumber) {
                        await smsService.sendSMS(
                            contact.phoneNumber,
                            `TEST ALERT from SilverYears: ${message} - This is a test message.`
                        );
                        results.push({ contact: contact.name, method: 'SMS', status: 'sent' });
                    }
                    
                    // send email
                    if (contact.email) {
                        await emailService.sendEmail(
                            contact.email,
                            'SilverYears Test Alert',
                            `Test alert for ${contact.name}: ${message}`
                        );
                        results.push({ contact: contact.name, method: 'Email', status: 'sent' });
                    }
                } catch (error) {
                    results.push({ contact: contact.name, status: 'failed', error: error.message });
                }
            }
            
            res.status(200).json({
                status: 'success',
                message: 'Test alerts sent',
                data: { results }
            });
        } catch (error) {
            console.error('Error sending test alert:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to send test alert',
                error: error.message
            });
        }
    }

    // helper method to validate singapore phone numbers
    isValidSingaporePhone(phone) {
        // singapore phone number format: +65-XXXX-XXXX or +65XXXXXXXX
        const singaporePhoneRegex = /^\+65[-\s]?[689]\d{3}[-\s]?\d{4}$/;
        return singaporePhoneRegex.test(phone);
    }

    // helper method to send verification SMS
    async sendVerificationSMS(contact) {
        try {
            const message = `Hello ${contact.name}, you've been added as an emergency contact for SilverYears medication management. Reply with 1234 to verify. If this wasn't you, please ignore this message.`;
            await smsService.sendSMS(contact.phoneNumber, message);
        } catch (error) {
            console.error('Failed to send verification SMS:', error);
            // don't throw error, just log it
        }
    }

    // helper method to send verification email
    async sendVerificationEmail(contact) {
        try {
            const subject = 'SilverYears Emergency Contact Verification';
            const message = `
                <h2>Emergency Contact Verification</h2>
                <p>Hello ${contact.name},</p>
                <p>You've been added as an emergency contact for SilverYears medication management system.</p>
                <p>To verify this contact, please use the verification code: <strong>1234</strong></p>
                <p>If you didn't expect this message, please ignore it.</p>
                <br>
                <p>Best regards,<br>SilverYears Team</p>
            `;
            await emailService.sendEmail(contact.email, subject, message);
        } catch (error) {
            console.error('Failed to send verification email:', error);
            // don't throw error, just log it
        }
    }

    // gets emergency contact statistics for dashboard
    async getContactStatistics(req, res) {
        try {
            const contacts = await EmergencyContact.getContactsByUserId(req.user.id);
            
            const stats = {
                total: contacts.length,
                verified: contacts.filter(c => c.verificationStatus === 'verified').length,
                pending: contacts.filter(c => c.verificationStatus === 'pending').length,
                failed: contacts.filter(c => c.verificationStatus === 'failed').length,
                active: contacts.filter(c => c.isActive).length,
                primary: contacts.find(c => c.isPrimary) ? 1 : 0,
                byRelationship: this.groupByRelationship(contacts),
                alertPreferences: this.summarizeAlertPreferences(contacts)
            };
            
            res.status(200).json({
                status: 'success',
                data: { statistics: stats }
            });
        } catch (error) {
            console.error('Error getting contact statistics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve contact statistics',
                error: error.message
            });
        }
    }

    // helper method to group contacts by relationship
    groupByRelationship(contacts) {
        return contacts.reduce((acc, contact) => {
            acc[contact.relationship] = (acc[contact.relationship] || 0) + 1;
            return acc;
        }, {});
    }

    // helper method to summarize alert preferences
    summarizeAlertPreferences(contacts) {
        const summary = {
            medication: 0,
            appointment: 0,
            emergency: 0
        };
        
        contacts.forEach(contact => {
            try {
                const prefs = JSON.parse(contact.alertPreferences || '{}');
                if (prefs.medication) summary.medication++;
                if (prefs.appointment) summary.appointment++;
                if (prefs.emergency) summary.emergency++;
            } catch (error) {
                // ignore parsing errors
            }
        });
        
        return summary;
    }
}

module.exports = new EmergencyContactController();