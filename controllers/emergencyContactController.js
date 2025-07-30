const sql = require('mssql');

class EmergencyContactsController {
    // creates a new emergency contact for the user
    async createEmergencyContact(req, res) {
        try {
            const {
                contactName,
                relationship,
                phoneNumber,
                email,
                priority = 1,
                alertDelayHours = 0,
                isActive = true
            } = req.body;
            
            // validate required fields
            if (!contactName || !relationship || !phoneNumber) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Contact name, relationship, and phone number are required'
                });
            }
            
            const insertQuery = `
                INSERT INTO EmergencyContacts 
                (userId, contactName, relationship, phoneNumber, email, priority, alertDelayHours, isActive, createdAt)
                VALUES (@userId, @contactName, @relationship, @phoneNumber, @email, @priority, @alertDelayHours, @isActive, GETDATE());
                SELECT SCOPE_IDENTITY() as contactId;
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('contactName', sql.NVarChar, contactName)
                .input('relationship', sql.NVarChar, relationship)
                .input('phoneNumber', sql.NVarChar, phoneNumber)
                .input('email', sql.NVarChar, email || null)
                .input('priority', sql.Int, priority)
                .input('alertDelayHours', sql.Int, alertDelayHours)
                .input('isActive', sql.Bit, isActive)
                .query(insertQuery);
                
            res.status(201).json({
                status: 'success',
                message: 'Emergency contact added successfully',
                data: {
                    contactId: result.recordset[0].contactId,
                    contactName,
                    relationship,
                    phoneNumber,
                    email,
                    priority,
                    alertDelayHours
                }
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

    // gets all emergency contacts for the user
    async getUserEmergencyContacts(req, res) {
        try {
            const contactsQuery = `
                SELECT 
                    contactId,
                    contactName,
                    relationship,
                    phoneNumber,
                    email,
                    priority,
                    alertDelayHours,
                    isActive,
                    createdAt,
                    lastAlertSent
                FROM EmergencyContacts
                WHERE userId = @userId
                ORDER BY priority ASC, contactName ASC
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(contactsQuery);
                
            res.status(200).json({
                status: 'success',
                data: { contacts: result.recordset }
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

    // updates an existing emergency contact
    async updateEmergencyContact(req, res) {
        try {
            const { contactId } = req.params;
            const {
                contactName,
                relationship,
                phoneNumber,
                email,
                priority,
                alertDelayHours,
                isActive
            } = req.body;
            
            // check if contact belongs to user
            const checkQuery = `
                SELECT 1 FROM EmergencyContacts 
                WHERE contactId = @contactId AND userId = @userId
            `;
            
            const pool = await sql.connect();
            const checkResult = await pool.request()
                .input('contactId', sql.Int, contactId)
                .input('userId', sql.Int, req.user.id)
                .query(checkQuery);
                
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Emergency contact not found'
                });
            }
            
            const updateQuery = `
                UPDATE EmergencyContacts SET
                    contactName = @contactName,
                    relationship = @relationship,
                    phoneNumber = @phoneNumber,
                    email = @email,
                    priority = @priority,
                    alertDelayHours = @alertDelayHours,
                    isActive = @isActive,
                    updatedAt = GETDATE()
                WHERE contactId = @contactId AND userId = @userId
            `;
            
            await pool.request()
                .input('contactId', sql.Int, contactId)
                .input('userId', sql.Int, req.user.id)
                .input('contactName', sql.NVarChar, contactName)
                .input('relationship', sql.NVarChar, relationship)
                .input('phoneNumber', sql.NVarChar, phoneNumber)
                .input('email', sql.NVarChar, email || null)
                .input('priority', sql.Int, priority)
                .input('alertDelayHours', sql.Int, alertDelayHours)
                .input('isActive', sql.Bit, isActive)
                .query(updateQuery);
                
            res.status(200).json({
                status: 'success',
                message: 'Emergency contact updated successfully'
            });
            
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
            const { contactId } = req.params;
            
            const deleteQuery = `
                DELETE FROM EmergencyContacts 
                WHERE contactId = @contactId AND userId = @userId
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('contactId', sql.Int, contactId)
                .input('userId', sql.Int, req.user.id)
                .query(deleteQuery);
                
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Emergency contact not found'
                });
            }
            
            res.status(200).json({
                status: 'success',
                message: 'Emergency contact deleted successfully'
            });
            
        } catch (error) {
            console.error('Error deleting emergency contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete emergency contact',
                error: error.message
            });
        }
    }

    // triggers emergency alerts for missed medications
    async triggerEmergencyAlert(req, res) {
        try {
            const { medicationId, alertLevel = 1 } = req.body;
            
            // get medication details
            const medicationQuery = `
                SELECT m.*, u.firstName, u.lastName
                FROM Medications m
                JOIN Users u ON m.userId = u.userId
                WHERE m.medicationId = @medicationId AND m.userId = @userId
            `;
            
            const pool = await sql.connect();
            const medicationResult = await pool.request()
                .input('medicationId', sql.Int, medicationId)
                .input('userId', sql.Int, req.user.id)
                .query(medicationQuery);
                
            if (medicationResult.recordset.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            const medication = medicationResult.recordset[0];
            
            // get emergency contacts based on alert level
            const contactsQuery = `
                SELECT * FROM EmergencyContacts
                WHERE userId = @userId 
                AND isActive = 1 
                AND priority <= @alertLevel
                AND (lastAlertSent IS NULL OR DATEDIFF(HOUR, lastAlertSent, GETDATE()) >= alertDelayHours)
                ORDER BY priority ASC
            `;
            
            const contactsResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('alertLevel', sql.Int, alertLevel)
                .query(contactsQuery);
                
            const contacts = contactsResult.recordset;
            
            if (contacts.length === 0) {
                return res.status(200).json({
                    status: 'info',
                    message: 'No emergency contacts available for this alert level or delay period not met'
                });
            }
            
            // send alerts to contacts
            const alertPromises = contacts.map(async (contact) => {
                const alertMessage = `MEDICATION EMERGENCY: ${medication.firstName} ${medication.lastName} has missed their ${medication.medicationName} (${medication.dosage}). This is a priority ${alertLevel} alert. Please check on them immediately.`;
                
                // log alert in database
                const logAlertQuery = `
                    INSERT INTO EmergencyAlerts (userId, contactId, medicationId, alertLevel, alertMessage, sentAt)
                    VALUES (@userId, @contactId, @medicationId, @alertLevel, @alertMessage, GETDATE())
                `;
                
                await pool.request()
                    .input('userId', sql.Int, req.user.id)
                    .input('contactId', sql.Int, contact.contactId)
                    .input('medicationId', sql.Int, medicationId)
                    .input('alertLevel', sql.Int, alertLevel)
                    .input('alertMessage', sql.NVarChar, alertMessage)
                    .query(logAlertQuery);
                    
                // update last alert sent time
                const updateContactQuery = `
                    UPDATE EmergencyContacts 
                    SET lastAlertSent = GETDATE() 
                    WHERE contactId = @contactId
                `;
                
                await pool.request()
                    .input('contactId', sql.Int, contact.contactId)
                    .query(updateContactQuery);
                    
                console.log(`Alert sent to ${contact.contactName} (${contact.phoneNumber}): ${alertMessage}`);
                
                return {
                    contactName: contact.contactName,
                    phoneNumber: contact.phoneNumber,
                    relationship: contact.relationship,
                    alertSent: true
                };
            });
            
            const results = await Promise.all(alertPromises);
            
            res.status(200).json({
                status: 'success',
                message: `Emergency alerts sent to ${results.length} contact(s)`,
                data: {
                    alertLevel,
                    medication: {
                        name: medication.medicationName,
                        dosage: medication.dosage
                    },
                    alertsSent: results
                }
            });
            
        } catch (error) {
            console.error('Error triggering emergency alert:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to trigger emergency alert',
                error: error.message
            });
        }
    }

    // gets emergency alert history
    async getEmergencyAlertHistory(req, res) {
        try {
            const { limit = 50 } = req.query;
            
            const historyQuery = `
                SELECT TOP (@limit)
                    ea.alertId,
                    ea.alertLevel,
                    ea.alertMessage,
                    ea.sentAt,
                    ec.contactName,
                    ec.relationship,
                    ec.phoneNumber,
                    m.medicationName,
                    m.dosage
                FROM EmergencyAlerts ea
                JOIN EmergencyContacts ec ON ea.contactId = ec.contactId
                JOIN Medications m ON ea.medicationId = m.medicationId
                WHERE ea.userId = @userId
                ORDER BY ea.sentAt DESC
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('limit', sql.Int, parseInt(limit))
                .query(historyQuery);
                
            res.status(200).json({
                status: 'success',
                data: { alertHistory: result.recordset }
            });
            
        } catch (error) {
            console.error('Error fetching emergency alert history:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve alert history',
                error: error.message
            });
        }
    }

    // tests emergency contact notification (sends test message)
    async testEmergencyContact(req, res) {
        try {
            const { contactId } = req.params;
            
            // get contact details
            const contactQuery = `
                SELECT ec.*, u.firstName, u.lastName
                FROM EmergencyContacts ec
                JOIN Users u ON ec.userId = u.userId
                WHERE ec.contactId = @contactId AND ec.userId = @userId
            `;
            
            const pool = await sql.connect();
            const contactResult = await pool.request()
                .input('contactId', sql.Int, contactId)
                .input('userId', sql.Int, req.user.id)
                .query(contactQuery);
                
            if (contactResult.recordset.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Emergency contact not found'
                });
            }
            
            const contact = contactResult.recordset[0];
            const testMessage = `TEST ALERT: This is a test message from the Senior Care medication management system for ${contact.firstName} ${contact.lastName}. Your contact information is working correctly.`;
            
            // log test alert
            const logTestQuery = `
                INSERT INTO EmergencyAlerts (userId, contactId, medicationId, alertLevel, alertMessage, sentAt)
                VALUES (@userId, @contactId, NULL, 0, @alertMessage, GETDATE())
            `;
            
            await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('contactId', sql.Int, contactId)
                .input('alertMessage', sql.NVarChar, testMessage)
                .query(logTestQuery);
                
            console.log(`Test alert sent to ${contact.contactName} (${contact.phoneNumber}): ${testMessage}`);
            
            res.status(200).json({
                status: 'success',
                message: 'Test alert sent successfully',
                data: {
                    contactName: contact.contactName,
                    phoneNumber: contact.phoneNumber,
                    testMessage
                }
            });
            
        } catch (error) {
            console.error('Error sending test emergency contact:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to send test alert',
                error: error.message
            });
        }
    }
}

module.exports = new EmergencyContactsController();