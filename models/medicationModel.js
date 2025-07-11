const sql = require('mssql');
const dbConfig = require('../dbConfig');

// medication model for managing medication data
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

    // creates a new medication record
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

    // gets all medications for a user
    static async getMedicationsByUserId(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT m.*, u.name as patient_name,
                   COALESCE(ml.compliance_rate, 0) as compliance_rate,
                   COALESCE(ml.missed_doses, 0) as missed_doses,
                   ml.next_dose,
                   CASE WHEN dc.conflictId IS NOT NULL THEN 1 ELSE 0 END as drug_conflicts
            FROM Medications m
            INNER JOIN Users u ON m.userId = u.id
            LEFT JOIN (
                SELECT medication_id,
                       ROUND(
                           (CAST(COUNT(CASE WHEN missed = 0 THEN 1 END) AS FLOAT) / 
                            NULLIF(COUNT(*), 0)) * 100, 0
                       ) as compliance_rate,
                       COUNT(CASE WHEN missed = 1 THEN 1 END) as missed_doses,
                       MIN(CASE WHEN missed = 0 AND taken_at > GETDATE() THEN taken_at END) as next_dose
                FROM MedicationLogs
                WHERE taken_at >= DATEADD(MONTH, -1, GETDATE())
                GROUP BY medication_id
            ) ml ON m.medicationId = ml.medication_id
            LEFT JOIN DrugConflicts dc ON m.medicationId = dc.medicationId
            WHERE m.userId = @userId AND m.active = 1
            ORDER BY m.createdAt DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // gets a specific medication by ID
    static async getMedicationById(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT m.*, u.name as patient_name,
                   COALESCE(ml.compliance_rate, 0) as compliance_rate,
                   COALESCE(ml.missed_doses, 0) as missed_doses,
                   ml.next_dose,
                   CASE WHEN dc.conflictId IS NOT NULL THEN 1 ELSE 0 END as drug_conflicts
            FROM Medications m
            INNER JOIN Users u ON m.userId = u.id
            LEFT JOIN (
                SELECT medication_id,
                       ROUND(
                           (CAST(COUNT(CASE WHEN missed = 0 THEN 1 END) AS FLOAT) / 
                            NULLIF(COUNT(*), 0)) * 100, 0
                       ) as compliance_rate,
                       COUNT(CASE WHEN missed = 1 THEN 1 END) as missed_doses,
                       MIN(CASE WHEN missed = 0 AND taken_at > GETDATE() THEN taken_at END) as next_dose
                FROM MedicationLogs
                WHERE taken_at >= DATEADD(MONTH, -1, GETDATE())
                GROUP BY medication_id
            ) ml ON m.medicationId = ml.medication_id
            LEFT JOIN DrugConflicts dc ON m.medicationId = dc.medicationId
            WHERE m.medicationId = @medicationId
        `;

        const request = connection.request();
        request.input('medicationId', medicationId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.length > 0 ? result.recordset[0] : null;
    }

    // updates a medication record
    static async updateMedication(medicationId, medicationData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE Medications 
            SET name = @name, dosage = @dosage, frequency = @frequency, 
                timing = @timing, startDate = @startDate, endDate = @endDate,
                instructions = @instructions, prescribedBy = @prescribedBy,
                category = @category, updatedAt = GETDATE()
            WHERE medicationId = @medicationId
        `;

        const request = connection.request();
        request.input('medicationId', medicationId);
        request.input('name', medicationData.name);
        request.input('dosage', medicationData.dosage);
        request.input('frequency', medicationData.frequency);
        request.input('timing', medicationData.timing);
        request.input('startDate', medicationData.startDate);
        request.input('endDate', medicationData.endDate);
        request.input('instructions', medicationData.instructions);
        request.input('prescribedBy', medicationData.prescribedBy);
        request.input('category', medicationData.category);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // deletes a medication record
    static async deleteMedication(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `UPDATE Medications SET active = 0 WHERE medicationId = @medicationId`;

        const request = connection.request();
        request.input('medicationId', medicationId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // marks medication as taken
    static async markAsTaken(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO MedicationLogs (medication_id, taken_at, missed)
            VALUES (@medicationId, GETDATE(), 0)
        `;

        const request = connection.request();
        request.input('medicationId', medicationId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // gets upcoming medication reminders
    static async getUpcomingReminders(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT m.medicationId, m.name, m.dosage, m.timing, m.instructions,
                   CASE 
                       WHEN m.frequency = 'Once daily' THEN DATEADD(day, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME))
                       WHEN m.frequency = 'Twice daily' THEN 
                           CASE 
                               WHEN CAST(GETDATE() AS TIME) < CAST('12:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('12:00:00' AS TIME)
                               ELSE DATEADD(day, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME))
                           END
                       WHEN m.frequency = 'Three times daily' THEN
                           CASE 
                               WHEN CAST(GETDATE() AS TIME) < CAST('08:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('08:00:00' AS TIME)
                               WHEN CAST(GETDATE() AS TIME) < CAST('14:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('14:00:00' AS TIME)
                               WHEN CAST(GETDATE() AS TIME) < CAST('20:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('20:00:00' AS TIME)
                               ELSE DATEADD(day, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('08:00:00' AS TIME))
                           END
                   END as next_reminder
            FROM Medications m
            WHERE m.userId = @userId AND m.active = 1
              AND (m.endDate IS NULL OR m.endDate > GETDATE())
            ORDER BY next_reminder ASC
        `;

        const request = connection.request();
        request.input('userId', userId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // checks for drug interactions
    static async checkDrugInteractions(userId, newMedicationName) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT m.name, dc.severity, dc.description
            FROM Medications m
            INNER JOIN DrugInteractions di ON LOWER(m.name) = LOWER(di.drug1) OR LOWER(m.name) = LOWER(di.drug2)
            LEFT JOIN DrugConflicts dc ON m.medicationId = dc.medicationId
            WHERE m.userId = @userId AND m.active = 1
              AND (LOWER(di.drug1) = LOWER(@newMedicationName) OR LOWER(di.drug2) = LOWER(@newMedicationName))
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('newMedicationName', newMedicationName);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }
}

module.exports = Medication;