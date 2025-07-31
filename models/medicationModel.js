const sql = require('mssql');
const dbConfig = require('../dbConfig');

/**
 * Medication Model - handles medication data operations
 * Manages medication records, adherence tracking, and drug interactions
 * Provides database operations for medication management system
 */
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

    /**
     * Creates a new medication record in the database
     * @param {Object} medicationData - Medication data to insert
     * @returns {Medication} New medication instance
     */
    static async createMedication(medicationData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO Medications (userId, name, dosage, frequency, timing, startDate, endDate, instructions, prescribedBy, qrCode, category)
            OUTPUT INSERTED.*
            VALUES (@userId, @name, @dosage, @frequency, @timing, @startDate, @endDate, @instructions, @prescribedBy, @qrCode, @category)
        `;

        const request = connection.request();
        request.input('userId', medicationData.userId);
        request.input('name', medicationData.medicationName || medicationData.name);
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

    /**
     * Gets all medications for a specific user
     * @param {number} userId - User ID
     * @returns {Array} Array of medication records
     */
    static async getMedicationsByUserId(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                m.*,
                -- Calculate next reminder time based on frequency
                CASE 
                    WHEN m.frequency = 'once_daily' THEN 
                        CASE 
                            WHEN CAST(GETDATE() AS TIME) < CAST(m.timing AS TIME) 
                            THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME)
                            ELSE DATEADD(day, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME))
                        END
                    WHEN m.frequency = 'twice_daily' THEN 
                        CASE 
                            WHEN CAST(GETDATE() AS TIME) < CAST('08:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('08:00:00' AS TIME)
                            WHEN CAST(GETDATE() AS TIME) < CAST('20:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('20:00:00' AS TIME)
                            ELSE DATEADD(day, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('08:00:00' AS TIME))
                        END
                    WHEN m.frequency = 'three_times_daily' THEN 
                        CASE 
                            WHEN CAST(GETDATE() AS TIME) < CAST('08:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('08:00:00' AS TIME)
                            WHEN CAST(GETDATE() AS TIME) < CAST('14:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('14:00:00' AS TIME)
                            WHEN CAST(GETDATE() AS TIME) < CAST('20:00:00' AS TIME) THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('20:00:00' AS TIME)
                            ELSE DATEADD(day, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('08:00:00' AS TIME))
                        END
                    ELSE CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME)
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

    /**
     * Gets a specific medication by ID
     * @param {number} medicationId - Medication ID
     * @returns {Object|null} Medication record or null if not found
     */
    static async getMedicationById(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                m.*,
                -- Include compliance and conflict information
                CASE WHEN dc.conflictId IS NOT NULL THEN 1 ELSE 0 END as has_conflicts
            FROM Medications m
            LEFT JOIN DrugConflicts dc ON m.medicationId = dc.medicationId AND dc.resolved = 0
            WHERE m.medicationId = @medicationId
        `;

        const request = connection.request();
        request.input('medicationId', medicationId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.length > 0 ? result.recordset[0] : null;
    }

    /**
     * Updates a medication record
     * @param {number} medicationId - Medication ID
     * @param {Object} medicationData - Updated medication data
     * @returns {boolean} True if update successful
     */
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
        request.input('name', medicationData.medicationName || medicationData.name);
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

    /**
     * Soft deletes a medication record (sets active to false)
     * @param {number} medicationId - Medication ID
     * @returns {boolean} True if deletion successful
     */
    static async deleteMedication(medicationId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `UPDATE Medications SET active = 0, updatedAt = GETDATE() WHERE medicationId = @medicationId`;

        const request = connection.request();
        request.input('medicationId', medicationId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    /**
     * Gets all doctors for appointment booking
     * @returns {Array} Array of doctor records
     */
    static async getAllDoctors() {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `SELECT * FROM Doctors ORDER BY name`;
        
        const result = await connection.request().query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /**
     * Searches doctors by specialty and location
     * @param {string} specialty - Doctor specialty filter
     * @param {string} location - Location filter
     * @returns {Array} Array of filtered doctor records
     */
    static async searchDoctors(specialty, location) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `SELECT * FROM Doctors WHERE 1=1`;
        const request = connection.request();

        if (specialty) {
            sqlQuery += ` AND LOWER(specialty) LIKE LOWER(@specialty)`;
            request.input('specialty', `%${specialty}%`);
        }

        if (location) {
            sqlQuery += ` AND LOWER(location) LIKE LOWER(@location)`;
            request.input('location', `%${location}%`);
        }

        sqlQuery += ` ORDER BY rating DESC, name`;

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /**
     * Gets doctor availability for scheduling
     * @param {number} doctorId - Doctor ID
     * @param {string} date - Specific date (optional)
     * @returns {Array} Array of availability slots
     */
    static async getDoctorAvailability(doctorId, date) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `
            SELECT 
                da.availabilityId,
                da.doctorId,
                da.day_of_week,
                da.start_time,
                da.end_time,
                da.is_available,
                d.name as doctorName,
                d.specialty
            FROM DoctorAvailability da
            JOIN Doctors d ON da.doctorId = d.doctorId
            WHERE da.doctorId = @doctorId AND da.is_available = 1
        `;
        
        const request = connection.request();
        request.input('doctorId', doctorId);
        
        if (date) {
            // Filter by specific day of week if date provided
            sqlQuery += ` AND da.day_of_week = DATENAME(WEEKDAY, @date)`;
            request.input('date', date);
        }
        
        sqlQuery += ` ORDER BY da.start_time`;

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /**
     * Checks for drug interactions with existing medications
     * @param {number} userId - User ID
     * @param {string} newMedicationName - New medication name to check
     * @returns {Array} Array of potential drug interactions
     */
    static async checkDrugInteractions(userId, newMedicationName) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT DISTINCT
                m.name as existingMedication,
                di.severity,
                di.description,
                di.drug1,
                di.drug2
            FROM Medications m
            INNER JOIN DrugInteractions di ON 
                (LOWER(m.name) = LOWER(di.drug1) AND LOWER(@newMedicationName) = LOWER(di.drug2)) OR
                (LOWER(m.name) = LOWER(di.drug2) AND LOWER(@newMedicationName) = LOWER(di.drug1))
            WHERE m.userId = @userId AND m.active = 1
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('newMedicationName', newMedicationName);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /**
     * Gets medication adherence statistics for a user
     * @param {number} userId - User ID
     * @param {number} medicationId - Specific medication ID (optional)
     * @param {number} days - Number of days to look back (default 30)
     * @returns {Array} Array of adherence statistics
     */
    static async getAdherenceStats(userId, medicationId = null, days = 30) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `
            SELECT 
                m.medicationId,
                m.name as medicationName,
                COUNT(ml.logId) as totalDoses,
                COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
                ROUND(
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / 
                    NULLIF(COUNT(ml.logId), 0), 2
                ) as adherenceRate
            FROM Medications m
            LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                AND ml.scheduledTime >= DATEADD(DAY, -@days, GETDATE())
            WHERE m.userId = @userId AND m.active = 1
        `;
        
        const request = connection.request();
        request.input('userId', userId);
        request.input('days', days);
        
        if (medicationId) {
            sqlQuery += ` AND m.medicationId = @medicationId`;
            request.input('medicationId', medicationId);
        }
        
        sqlQuery += ` GROUP BY m.medicationId, m.name ORDER BY adherenceRate DESC`;

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /**
     * Gets upcoming medication reminders for a user
     * @param {number} userId - User ID
     * @param {number} hours - Hours ahead to look (default 24)
     * @returns {Array} Array of upcoming reminders
     */
    static async getUpcomingReminders(userId, hours = 24) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                ml.logId,
                ml.medicationId,
                ml.scheduledTime,
                m.name as medicationName,
                m.dosage,
                m.instructions,
                m.frequency,
                DATEDIFF(MINUTE, GETDATE(), ml.scheduledTime) as minutesUntilDose
            FROM MedicationLogs ml
            JOIN Medications m ON ml.medicationId = m.medicationId
            WHERE m.userId = @userId 
                AND m.active = 1
                AND ml.taken = 0 
                AND ml.scheduledTime BETWEEN GETDATE() AND DATEADD(HOUR, @hours, GETDATE())
            ORDER BY ml.scheduledTime ASC
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('hours', hours);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }
}

module.exports = Medication;