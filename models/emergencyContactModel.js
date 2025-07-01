const sql = require('mssql');
const dbConfig = require('../dbConfig');

/* emergency contact model for managing emergency contact data */
class EmergencyContact {
    constructor(contactId, userId, name, relationship, phone, email, isPrimary, alertOnMissedMeds, alertThresholdHours) {
        this.contactId = contactId;
        this.userId = userId;
        this.name = name;
        this.relationship = relationship;
        this.phone = phone;
        this.email = email;
        this.isPrimary = isPrimary;
        this.alertOnMissedMeds = alertOnMissedMeds;
        this.alertThresholdHours = alertThresholdHours;
    }

    /* creates a new emergency contact */
    static async createEmergencyContact(contactData) {
        const connection = await sql.connect(dbConfig);
        
        // if this is primary contact, set others to non-primary
        if (contactData.isPrimary) {
            await connection.request()
                .input('userId', contactData.userId)
                .query('UPDATE EmergencyContacts SET isPrimary = 0 WHERE userId = @userId');
        }
        
        const sqlQuery = `
            INSERT INTO EmergencyContacts (userId, name, relationship, phone, email, isPrimary, alertOnMissedMeds, alertThresholdHours)
            OUTPUT INSERTED.*
            VALUES (@userId, @name, @relationship, @phone, @email, @isPrimary, @alertOnMissedMeds, @alertThresholdHours)
        `;

        const request = connection.request();
        request.input('userId', contactData.userId);
        request.input('name', contactData.name);
        request.input('relationship', contactData.relationship);
        request.input('phone', contactData.phone);
        request.input('email', contactData.email);
        request.input('isPrimary', contactData.isPrimary || false);
        request.input('alertOnMissedMeds', contactData.alertOnMissedMeds || true);
        request.input('alertThresholdHours', contactData.alertThresholdHours || 2);

        const result = await request.query(sqlQuery);
        connection.close();

        const row = result.recordset[0];
        return new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phone, row.email, row.isPrimary, row.alertOnMissedMeds,
            row.alertThresholdHours
        );
    }

    /* gets all emergency contacts for a user */
    static async getEmergencyContactsByUserId(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM EmergencyContacts 
            WHERE userId = @userId 
            ORDER BY isPrimary DESC, name ASC
        `;

        const request = connection.request();
        request.input('userId', userId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /* gets a specific emergency contact by ID */
    static async getEmergencyContactById(contactId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `SELECT * FROM EmergencyContacts WHERE contactId = @contactId`;

        const request = connection.request();
        request.input('contactId', contactId);
        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            return new EmergencyContact(
                row.contactId, row.userId, row.name, row.relationship,
                row.phone, row.email, row.isPrimary, row.alertOnMissedMeds,
                row.alertThresholdHours
            );
        }
        return null;
    }

    /* updates an emergency contact */
    static async updateEmergencyContact(contactId, contactData) {
        const connection = await sql.connect(dbConfig);
        
        // if setting as primary, unset other primary contacts for this user
        if (contactData.isPrimary) {
            const userQuery = `SELECT userId FROM EmergencyContacts WHERE contactId = @contactId`;
            const userRequest = connection.request();
            userRequest.input('contactId', contactId);
            const userResult = await userRequest.query(userQuery);
            
            if (userResult.recordset.length > 0) {
                const userId = userResult.recordset[0].userId;
                await connection.request()
                    .input('userId', userId)
                    .query('UPDATE EmergencyContacts SET isPrimary = 0 WHERE userId = @userId');
            }
        }
        
        const sqlQuery = `
            UPDATE EmergencyContacts 
            SET name = @name, relationship = @relationship, phone = @phone, 
                email = @email, isPrimary = @isPrimary, alertOnMissedMeds = @alertOnMissedMeds,
                alertThresholdHours = @alertThresholdHours, updatedAt = GETDATE()
            WHERE contactId = @contactId
        `;

        const request = connection.request();
        request.input('contactId', contactId);
        request.input('name', contactData.name);
        request.input('relationship', contactData.relationship);
        request.input('phone', contactData.phone);
        request.input('email', contactData.email);
        request.input('isPrimary', contactData.isPrimary);
        request.input('alertOnMissedMeds', contactData.alertOnMissedMeds);
        request.input('alertThresholdHours', contactData.alertThresholdHours);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    /* deletes an emergency contact */
    static async deleteEmergencyContact(contactId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `DELETE FROM EmergencyContacts WHERE contactId = @contactId`;

        const request = connection.request();
        request.input('contactId', contactId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }
}

module.exports = EmergencyContact;