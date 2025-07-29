const sql = require('mssql');
const dbConfig = require('../dbConfig');
const twilio = require('twilio');

// emergency contact model for managing emergency contacts and alerts
class EmergencyContact {
    constructor(contactId, userId, name, relationship, phoneNumber, email, isPrimary, alertPreferences, isActive) {
        this.contactId = contactId;
        this.userId = userId;
        this.name = name;
        this.relationship = relationship;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.isPrimary = isPrimary;
        this.alertPreferences = alertPreferences;
        this.isActive = isActive;
    }

    // creates a new emergency contact
    static async createEmergencyContact(contactData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO EmergencyContacts (userId, name, relationship, phoneNumber, email, isPrimary, alertPreferences)
            OUTPUT INSERTED.*
            VALUES (@userId, @name, @relationship, @phoneNumber, @email, @isPrimary, @alertPreferences)
        `;

        const request = connection.request();
        request.input('userId', contactData.userId);
        request.input('name', contactData.name);
        request.input('relationship', contactData.relationship);
        request.input('phoneNumber', contactData.phoneNumber);
        request.input('email', contactData.email);
        request.input('isPrimary', contactData.isPrimary || false);
        request.input('alertPreferences', JSON.stringify(contactData.alertPreferences || {}));

        const result = await request.query(sqlQuery);
        connection.close();

        return new EmergencyContact(
            result.recordset[0].contactId,
            result.recordset[0].userId,
            result.recordset[0].name,
            result.recordset[0].relationship,
            result.recordset[0].phoneNumber,
            result.recordset[0].email,
            result.recordset[0].isPrimary,
            JSON.parse(result.recordset[0].alertPreferences || '{}'),
            result.recordset[0].isActive
        );
    }

    // gets all emergency contacts for a user
    static async getContactsByUserId(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM EmergencyContacts 
            WHERE userId = @userId AND isActive = 1
            ORDER BY isPrimary DESC, name ASC
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(contact => new EmergencyContact(
            contact.contactId,
            contact.userId,
            contact.name,
            contact.relationship,
            contact.phoneNumber,
            contact.email,
            contact.isPrimary,
            JSON.parse(contact.alertPreferences || '{}'),
            contact.isActive
        ));
    }

    // gets a specific emergency contact by ID
    static async getContactById(contactId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM EmergencyContacts WHERE contactId = @contactId AND isActive = 1
        `;

        const request = connection.request();
        request.input('contactId', contactId);

        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length === 0) {
            return null;
        }

        const contact = result.recordset[0];
        return new EmergencyContact(
            contact.contactId,
            contact.userId,
            contact.name,
            contact.relationship,
            contact.phoneNumber,
            contact.email,
            contact.isPrimary,
            JSON.parse(contact.alertPreferences || '{}'),
            contact.isActive
        );
    }

    // updates an emergency contact
    static async updateEmergencyContact(contactId, updateData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE EmergencyContacts
            SET name = @name, relationship = @relationship, phoneNumber = @phoneNumber, 
                email = @email, isPrimary = @isPrimary, alertPreferences = @alertPreferences,
                updatedAt = GETDATE()
            WHERE contactId = @contactId
        `;

        const request = connection.request();
        request.input('contactId', contactId);
        request.input('name', updateData.name);
        request.input('relationship', updateData.relationship);
        request.input('phoneNumber', updateData.phoneNumber);
        request.input('email', updateData.email);
        request.input('isPrimary', updateData.isPrimary || false);
        request.input('alertPreferences', JSON.stringify(updateData.alertPreferences || {}));

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // deletes an emergency contact (soft delete)
    static async deleteEmergencyContact(contactId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE EmergencyContacts 
            SET isActive = 0, updatedAt = GETDATE()
            WHERE contactId = @contactId
        `;

        const request = connection.request();
        request.input('contactId', contactId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // triggers alert to emergency contacts
    static async triggerAlert(userId, alertData) {
        const connection = await sql.connect(dbConfig);
        
        try {
            // get user's emergency contacts
            const contacts = await this.getContactsByUserId(userId);
            
            if (contacts.length === 0) {
                throw new Error('No emergency contacts found');
            }

            // log the alert
            const logQuery = `
                INSERT INTO AlertHistory (userId, alertType, message, contactsNotified, triggeredAt)
                OUTPUT INSERTED.*
                VALUES (@userId, @alertType, @message, @contactsNotified, GETDATE())
            `;

            const logRequest = connection.request();
            logRequest.input('userId', userId);
            logRequest.input('alertType', alertData.alertType);
            logRequest.input('message', alertData.message);
            logRequest.input('contactsNotified', contacts.length);

            const logResult = await logRequest.query(logQuery);

            // send SMS alerts using Twilio (if configured)
            const alertResults = [];
            for (const contact of contacts) {
                try {
                    const smsResult = await this.sendSMSAlert(contact, alertData);
                    alertResults.push({
                        contact: contact.name,
                        phone: contact.phoneNumber,
                        status: 'sent',
                        result: smsResult
                    });
                } catch (smsError) {
                    console.error(`Failed to send SMS to ${contact.name}:`, smsError);
                    alertResults.push({
                        contact: contact.name,
                        phone: contact.phoneNumber,
                        status: 'failed',
                        error: smsError.message
                    });
                }
            }

            connection.close();

            return {
                alertId: logResult.recordset[0].alertId,
                contactsNotified: contacts.length,
                results: alertResults
            };

        } catch (error) {
            connection.close();
            throw error;
        }
    }

    // sends SMS alert using Twilio
    static async sendSMSAlert(contact, alertData) {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.log('Twilio not configured - simulating SMS send');
            return { status: 'simulated', message: 'SMS would be sent in production' };
        }

        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const message = `CircleAge Alert: ${alertData.message}. Contact your family member immediately if needed.`;
        
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact.phoneNumber
        });

        return result;
    }

    // gets alert history for user
    static async getAlertHistory(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM AlertHistory 
            WHERE userId = @userId
            ORDER BY triggeredAt DESC
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // checks medication adherence and triggers alerts if needed
    static async checkMedicationAdherence(userId) {
        const connection = await sql.connect(dbConfig);
        
        try {
            // get missed medications in last 2 hours
            const missedQuery = `
                SELECT m.*, 
                       DATEDIFF(MINUTE, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME), GETDATE()) as minutesLate
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
                    AND CAST(ml.takenAt AS DATE) = CAST(GETDATE() AS DATE)
                WHERE m.userId = @userId 
                    AND m.active = 1
                    AND ml.logId IS NULL
                    AND DATEDIFF(MINUTE, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME), GETDATE()) > 120
            `;

            const request = connection.request();
            request.input('userId', userId);

            const result = await request.query(missedQuery);
            connection.close();

            if (result.recordset.length > 0) {
                // trigger alert for missed medications
                const medicationNames = result.recordset.map(med => med.name).join(', ');
                await this.triggerAlert(userId, {
                    alertType: 'missed_medication',
                    message: `Medications missed for more than 2 hours: ${medicationNames}`
                });
            }

            return result.recordset;

        } catch (error) {
            connection.close();
            throw error;
        }
    }
}

module.exports = EmergencyContact;