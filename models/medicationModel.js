const sql = require('mssql');
const dbConfig = require('../dbConfig');

/* medication model for managing medication data */
class Medication {
    constructor(medicationId, userId, name, dosage, frequency, timing, startDate, endDate, instructions, prescribedBy, active, qrCode, category) {
        this.medicationId = medicationId;
        this.userId = userId;
        this.name = name;
        this.dosage = dosage;
        this.frequency = frequency;
        this.timing = timing;
        this.startDate = startDate;
        this.endDate = endDate;
        this.instructions = instructions;
        this.prescribedBy = prescribedBy;
        this.active = active;
        this.qrCode = qrCode;
        this.category = category;
    }

    /* creates a new medication record */
    static async createMedication(medicationData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO Medications (userId, name, dosage, frequency, timing, startDate, endDate, instructions, prescribedBy, qrCode, category)
            OUTPUT INSERTED.*
            VALUES (@userId, @name, @dosage, @frequency, @timing, @startDate, @endDate, @instructions, @prescribedBy, @qrCode, @category)
        `;

        const request = connection.request();
        request.input('userId', medicationData.userId);
        request.input('name', medicationData.name);
        request.input('dosage', medicationData.dosage);
        request.input('frequency', medicationData.frequency);
        request.input('timing', medicationData.timing);
        request.input('startDate', medicationData.startDate);
        request.input('endDate', medicationData.endDate);
        request.input('instructions', medicationData.instructions);
        request.input('prescribedBy', medicationData.prescribedBy);
        request.input('qrCode', medicationData.qrCode);
        request.input('category', medicationData.category);

        const result = await request.query(sqlQuery);
        connection.close();

        return new Medication(
            result.recordset[0].medicationId,
            result.recordset[0].userId,
            result.recordset[0].name,
            result.recordset[0].dosage,
            result.recordset[0].frequency,
            result.recordset[0].timing,
            result.recordset[0].startDate,
            result.recordset[0].endDate,
            result.recordset[0].instructions,
            result.recordset[0].prescribedBy,
            result.recordset[0].active,
            result.recordset[0].qrCode,
            result.recordset[0].category
        );
    }

    /* gets all medications for a user */
    static async getMedicationsByUserId(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT m.*, 
                   CASE WHEN mt.lastTaken IS NULL THEN NULL ELSE mt.lastTaken END as lastTaken,
                   ISNULL(mt.missedCount, 0) as missedCount,
                   ISNULL(mt.takenCount, 0) as takenCount
            FROM Medications m
            LEFT JOIN (
                SELECT medicationId, 
                       MAX(takenAt) as lastTaken,
                       SUM(CASE WHEN missed = 1 THEN 1 ELSE 0 END) as missedCount,
                       SUM(CASE WHEN missed = 0 THEN 1 ELSE 0 END) as takenCount
                FROM MedicationTracking 
                GROUP BY medicationId
            ) mt ON m.medicationId = mt.medicationId
            WHERE m.userId = @userId AND m.active = 1
            ORDER BY m.createdAt DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(row => ({
            ...row,
            complianceRate: row.takenCount + row.missedCount > 0 
                ? Math.round((row.takenCount / (row.takenCount + row.missedCount)) * 100) 
                : 100
        }));
    }

    /* gets a specific medication by ID */
    static async getMedicationById(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `SELECT * FROM Medications WHERE medicationId = @medicationId`;
        
        const request = connection.request();
        request.input('medicationId', medicationId);
        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            return new Medication(
                row.medicationId, row.userId, row.name, row.dosage,
                row.frequency, row.timing, row.startDate, row.endDate,
                row.instructions, row.prescribedBy, row.active,
                row.qrCode, row.category
            );
        }
        return null;
    }

    /* updates a medication */
    static async updateMedication(medicationId, medicationData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE Medications 
            SET name = @name, dosage = @dosage, frequency = @frequency, 
                timing = @timing, instructions = @instructions, 
                prescribedBy = @prescribedBy, category = @category,
                updatedAt = GETDATE()
            OUTPUT INSERTED.*
            WHERE medicationId = @medicationId
        `;

        const request = connection.request();
        request.input('medicationId', medicationId);
        request.input('name', medicationData.name);
        request.input('dosage', medicationData.dosage);
        request.input('frequency', medicationData.frequency);
        request.input('timing', medicationData.timing);
        request.input('instructions', medicationData.instructions);
        request.input('prescribedBy', medicationData.prescribedBy);
        request.input('category', medicationData.category);

        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            return new Medication(
                row.medicationId, row.userId, row.name, row.dosage,
                row.frequency, row.timing, row.startDate, row.endDate,
                row.instructions, row.prescribedBy, row.active,
                row.qrCode, row.category
            );
        }
        return null;
    }

    /* marks a medication as taken */
    static async markMedicationTaken(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO MedicationTracking (medicationId, takenAt, missed)
            VALUES (@medicationId, GETDATE(), 0)
        `;

        const request = connection.request();
        request.input('medicationId', medicationId);
        await request.query(sqlQuery);
        connection.close();

        return true;
    }

    /* soft deletes a medication (sets active to false) */
    static async deleteMedication(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE Medications 
            SET active = 0, updatedAt = GETDATE()
            WHERE medicationId = @medicationId
        `;

        const request = connection.request();
        request.input('medicationId', medicationId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }
}

module.exports = Medication;