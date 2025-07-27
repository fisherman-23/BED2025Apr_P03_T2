const sql = require('mssql');
const dbConfig = require('../dbConfig');

// emergency contact model for managing emergency contact data
class EmergencyContact {
    constructor(contactId, userId, name, relationship, phoneNumber, email, isPrimary, alertPreferences, alertTiming, isActive, verificationStatus) {
        this.contactId = contactId;
        this.userId = userId;
        this.name = name;
        this.relationship = relationship;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.isPrimary = isPrimary;
        this.alertPreferences = alertPreferences;
        this.alertTiming = alertTiming;
        this.isActive = isActive;
        this.verificationStatus = verificationStatus;
    }

    // creates a new emergency contact record
    static async createEmergencyContact(contactData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO EmergencyContacts (userId, name, relationship, phoneNumber, email, isPrimary, alertPreferences, alertTiming, verificationStatus)
            OUTPUT INSERTED.*
            VALUES (@userId, @name, @relationship, @phoneNumber, @email, @isPrimary, @alertPreferences, @alertTiming, @verificationStatus)
        `;

        const request = connection.request();
        request.input('userId', contactData.userId);
        request.input('name', contactData.name);
        request.input('relationship', contactData.relationship);
        request.input('phoneNumber', contactData.phoneNumber);
        request.input('email', contactData.email);
        request.input('isPrimary', contactData.isPrimary || false);
        request.input('alertPreferences', contactData.alertPreferences || '{"medication": true, "appointment": true, "emergency": true}');
        request.input('alertTiming', contactData.alertTiming || 'immediate');
        request.input('verificationStatus', 'pending');

        const result = await request.query(sqlQuery);
        connection.close();

        const row = result.recordset[0];
        return new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phoneNumber, row.email, row.isPrimary, row.alertPreferences,
            row.alertTiming, row.isActive, row.verificationStatus
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

        return result.recordset.map(row => new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phoneNumber, row.email, row.isPrimary, row.alertPreferences,
            row.alertTiming, row.isActive, row.verificationStatus
        ));
    }

    // gets a specific emergency contact by ID
    static async getContactById(contactId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM EmergencyContacts 
            WHERE contactId = @contactId
        `;

        const request = connection.request();
        request.input('contactId', contactId);

        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length === 0) {
            return null;
        }

        const row = result.recordset[0];
        return new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phoneNumber, row.email, row.isPrimary, row.alertPreferences,
            row.alertTiming, row.isActive, row.verificationStatus
        );
    }

    // updates an emergency contact record
    static async updateEmergencyContact(contactId, updateData) {
        const connection = await sql.connect(dbConfig);
        
        // build dynamic update query based on provided fields
        const updateFields = [];
        const request = connection.request();
        
        if (updateData.name !== undefined) {
            updateFields.push('name = @name');
            request.input('name', updateData.name);
        }
        if (updateData.relationship !== undefined) {
            updateFields.push('relationship = @relationship');
            request.input('relationship', updateData.relationship);
        }
        if (updateData.phoneNumber !== undefined) {
            updateFields.push('phoneNumber = @phoneNumber');
            request.input('phoneNumber', updateData.phoneNumber);
        }
        if (updateData.email !== undefined) {
            updateFields.push('email = @email');
            request.input('email', updateData.email);
        }
        if (updateData.isPrimary !== undefined) {
            updateFields.push('isPrimary = @isPrimary');
            request.input('isPrimary', updateData.isPrimary);
        }
        if (updateData.alertPreferences !== undefined) {
            updateFields.push('alertPreferences = @alertPreferences');
            request.input('alertPreferences', updateData.alertPreferences);
        }
        if (updateData.alertTiming !== undefined) {
            updateFields.push('alertTiming = @alertTiming');
            request.input('alertTiming', updateData.alertTiming);
        }
        if (updateData.isActive !== undefined) {
            updateFields.push('isActive = @isActive');
            request.input('isActive', updateData.isActive);
        }
        if (updateData.verificationStatus !== undefined) {
            updateFields.push('verificationStatus = @verificationStatus');
            request.input('verificationStatus', updateData.verificationStatus);
        }
        
        updateFields.push('updatedAt = GETDATE()');
        
        const sqlQuery = `
            UPDATE EmergencyContacts 
            SET ${updateFields.join(', ')}
            WHERE contactId = @contactId
        `;

        request.input('contactId', contactId);
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

    // clears primary status for all contacts of a user (before setting new primary)
    static async clearPrimaryContact(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE EmergencyContacts 
            SET isPrimary = 0, updatedAt = GETDATE()
            WHERE userId = @userId AND isPrimary = 1
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0];
    }

    // gets verified contacts for a user (for sending alerts)
    static async getVerifiedContactsForUser(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM EmergencyContacts 
            WHERE userId = @userId 
            AND isActive = 1 
            AND verificationStatus = 'verified'
            ORDER BY isPrimary DESC, alertTiming ASC
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(row => new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phoneNumber, row.email, row.isPrimary, row.alertPreferences,
            row.alertTiming, row.isActive, row.verificationStatus
        ));
    }

    // gets contacts that should receive specific type of alert
    static async getContactsForAlertType(userId, alertType) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM EmergencyContacts 
            WHERE userId = @userId 
            AND isActive = 1 
            AND verificationStatus = 'verified'
            AND JSON_VALUE(alertPreferences, '$.${alertType}') = 'true'
            ORDER BY isPrimary DESC, 
                     CASE alertTiming 
                         WHEN 'immediate' THEN 1 
                         WHEN '30min' THEN 2 
                         WHEN '1hour' THEN 3 
                         WHEN '2hour' THEN 4 
                         ELSE 5 
                     END
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(row => new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phoneNumber, row.email, row.isPrimary, row.alertPreferences,
            row.alertTiming, row.isActive, row.verificationStatus
        ));
    }

    // gets primary contact for a user
    static async getPrimaryContact(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT TOP 1 * FROM EmergencyContacts 
            WHERE userId = @userId AND isPrimary = 1 AND isActive = 1
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length === 0) {
            return null;
        }

        const row = result.recordset[0];
        return new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phoneNumber, row.email, row.isPrimary, row.alertPreferences,
            row.alertTiming, row.isActive, row.verificationStatus
        );
    }

    // gets contact statistics for a user
    static async getContactStatistics(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                COUNT(*) as total_contacts,
                COUNT(CASE WHEN isPrimary = 1 THEN 1 END) as primary_contacts,
                COUNT(CASE WHEN verificationStatus = 'verified' THEN 1 END) as verified_contacts,
                COUNT(CASE WHEN verificationStatus = 'pending' THEN 1 END) as pending_contacts,
                COUNT(CASE WHEN verificationStatus = 'failed' THEN 1 END) as failed_contacts,
                COUNT(CASE WHEN isActive = 1 THEN 1 END) as active_contacts,
                relationship,
                COUNT(*) as count_by_relationship
            FROM EmergencyContacts 
            WHERE userId = @userId
            GROUP BY relationship
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // searches contacts by name or relationship
    static async searchContacts(userId, searchTerm) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM EmergencyContacts 
            WHERE userId = @userId 
            AND isActive = 1
            AND (name LIKE @searchTerm OR relationship LIKE @searchTerm)
            ORDER BY isPrimary DESC, name ASC
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('searchTerm', `%${searchTerm}%`);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(row => new EmergencyContact(
            row.contactId, row.userId, row.name, row.relationship,
            row.phoneNumber, row.email, row.isPrimary, row.alertPreferences,
            row.alertTiming, row.isActive, row.verificationStatus
        ));
    }

    // bulk update verification status (useful for batch operations)
    static async bulkUpdateVerificationStatus(contactIds, status) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE EmergencyContacts 
            SET verificationStatus = @status, updatedAt = GETDATE()
            WHERE contactId IN (${contactIds.map((_, index) => `@id${index}`).join(',')})
        `;

        const request = connection.request();
        request.input('status', status);
        
        contactIds.forEach((id, index) => {
            request.input(`id${index}`, id);
        });

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0];
    }

    // gets recent contact activity (for admin/monitoring purposes)
    static async getRecentContactActivity(userId, days = 7) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                ec.*,
                ca.alertType,
                ca.alertMessage,
                ca.sentAt,
                ca.isRead,
                ca.isResolved
            FROM EmergencyContacts ec
            LEFT JOIN CaregiverAlerts ca ON ec.contactId = ca.caregiverId
                AND ca.sentAt >= DATEADD(DAY, -@days, GETDATE())
            WHERE ec.userId = @userId AND ec.isActive = 1
            ORDER BY ca.sentAt DESC, ec.isPrimary DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('days', days);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }
}

module.exports = EmergencyContact;