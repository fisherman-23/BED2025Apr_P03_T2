const sql = require('mssql');
const dbConfig = require('../dbConfig');

// caregiver model for managing caregiver-patient relationships and monitoring
class Caregiver {
    constructor(relationshipId, caregiverId, patientId, relationship, permissions, createdAt, isActive) {
        this.relationshipId = relationshipId;
        this.caregiverId = caregiverId;
        this.patientId = patientId;
        this.relationship = relationship;
        this.permissions = permissions;
        this.createdAt = createdAt;
        this.isActive = isActive;
    }

    // creates a new caregiver-patient relationship
    static async createCaregiverRelationship(relationshipData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO CaregiverRelationships (caregiverId, patientId, relationship, permissions)
            OUTPUT INSERTED.*
            VALUES (@caregiverId, @patientId, @relationship, @permissions)
        `;

        const request = connection.request();
        request.input('caregiverId', relationshipData.caregiverId);
        request.input('patientId', relationshipData.patientId);
        request.input('relationship', relationshipData.relationship);
        request.input('permissions', JSON.stringify(relationshipData.permissions || {}));

        const result = await request.query(sqlQuery);
        connection.close();

        return new Caregiver(
            result.recordset[0].relationshipId,
            result.recordset[0].caregiverId,
            result.recordset[0].patientId,
            result.recordset[0].relationship,
            JSON.parse(result.recordset[0].permissions || '{}'),
            result.recordset[0].createdAt,
            result.recordset[0].isActive
        );
    }

    // gets all patients for a caregiver
    static async getPatientsByCaregiverId(caregiverId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT cr.*, u.firstName, u.lastName, u.email, u.phoneNumber
            FROM CaregiverRelationships cr
            INNER JOIN Users u ON cr.patientId = u.ID
            WHERE cr.caregiverId = @caregiverId AND cr.isActive = 1
            ORDER BY cr.createdAt DESC
        `;

        const request = connection.request();
        request.input('caregiverId', caregiverId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(row => ({
            relationshipId: row.relationshipId,
            patientId: row.patientId,
            relationship: row.relationship,
            permissions: JSON.parse(row.permissions || '{}'),
            patient: {
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phoneNumber: row.phoneNumber
            },
            createdAt: row.createdAt
        }));
    }

    // verifies if caregiver has access to patient
    static async verifyCaregiverAccess(caregiverId, patientId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT COUNT(*) as accessCount
            FROM CaregiverRelationships
            WHERE caregiverId = @caregiverId AND patientId = @patientId AND isActive = 1
        `;

        const request = connection.request();
        request.input('caregiverId', caregiverId);
        request.input('patientId', patientId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset[0].accessCount > 0;
    }

    // gets comprehensive patient monitoring dashboard
    static async getPatientMonitoringDashboard(patientId) {
        const connection = await sql.connect(dbConfig);
        
        try {
            // get patient basic info
            const patientQuery = `
                SELECT u.firstName, u.lastName, u.email, u.phoneNumber
                FROM Users u
                WHERE u.ID = @patientId
            `;

            // get today's medication compliance
            const todayComplianceQuery = `
                SELECT 
                    m.medicationId,
                    m.name,
                    m.dosage,
                    m.timing,
                    CASE WHEN ml.logId IS NOT NULL THEN 'taken' ELSE 'pending' END as status,
                    ml.takenAt
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
                    AND CAST(ml.takenAt AS DATE) = CAST(GETDATE() AS DATE)
                WHERE m.userId = @patientId AND m.active = 1
                ORDER BY m.timing
            `;

            // get weekly compliance summary
            const weeklyComplianceQuery = `
                SELECT 
                    CAST(AVG(CASE WHEN ml.logId IS NOT NULL THEN 100.0 ELSE 0.0 END) AS DECIMAL(5,2)) as weeklyCompliance,
                    COUNT(DISTINCT m.medicationId) as totalMedications,
                    COUNT(ml.logId) as medicationsTaken
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
                    AND ml.takenAt >= DATEADD(DAY, -7, GETDATE())
                WHERE m.userId = @patientId AND m.active = 1
            `;

            // get recent alerts
            const alertsQuery = `
                SELECT TOP 5 alertType, message, triggeredAt, acknowledged
                FROM AlertHistory
                WHERE userId = @patientId
                ORDER BY triggeredAt DESC
            `;

            const request = connection.request();
            request.input('patientId', patientId);

            const patientResult = await request.query(patientQuery);
            const todayResult = await request.query(todayComplianceQuery);
            const weeklyResult = await request.query(weeklyComplianceQuery);
            const alertsResult = await request.query(alertsQuery);

            connection.close();

            return {
                patient: patientResult.recordset[0],
                todaysMedications: todayResult.recordset,
                weeklyCompliance: weeklyResult.recordset[0],
                recentAlerts: alertsResult.recordset,
                lastUpdated: new Date()
            };

        } catch (error) {
            connection.close();
            throw error;
        }
    }

    // gets medication alerts for caregiver
    static async getMedicationAlerts(patientId, status = 'active') {
        const connection = await sql.connect(dbConfig);
        
        let statusFilter = '';
        if (status === 'active') {
            statusFilter = 'AND acknowledged = 0';
        } else if (status === 'acknowledged') {
            statusFilter = 'AND acknowledged = 1';
        }

        const sqlQuery = `
            SELECT ah.*, m.name as medicationName
            FROM AlertHistory ah
            LEFT JOIN Medications m ON ah.medicationId = m.medicationId
            WHERE ah.userId = @patientId
            ${statusFilter}
            ORDER BY ah.triggeredAt DESC
        `;

        const request = connection.request();
        request.input('patientId', patientId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // adds a caregiver note
    static async addCaregiverNote(noteData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO CaregiverNotes (caregiverId, patientId, noteType, content, visibility)
            OUTPUT INSERTED.*
            VALUES (@caregiverId, @patientId, @noteType, @content, @visibility)
        `;

        const request = connection.request();
        request.input('caregiverId', noteData.caregiverId);
        request.input('patientId', noteData.patientId);
        request.input('noteType', noteData.noteType || 'general');
        request.input('content', noteData.content);
        request.input('visibility', noteData.visibility || 'private');

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset[0];
    }

    // gets caregiver notes for a patient
    static async getCaregiverNotes(patientId, caregiverId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT cn.*, u.firstName, u.lastName
            FROM CaregiverNotes cn
            INNER JOIN Users u ON cn.caregiverId = u.ID
            WHERE cn.patientId = @patientId AND cn.caregiverId = @caregiverId
            ORDER BY cn.createdAt DESC
        `;

        const request = connection.request();
        request.input('patientId', patientId);
        request.input('caregiverId', caregiverId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // acknowledges an alert
    static async acknowledgeAlert(alertId, caregiverId, notes = '') {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE AlertHistory
            SET acknowledged = 1, acknowledgedBy = @caregiverId, 
                acknowledgedAt = GETDATE(), acknowledgeNotes = @notes
            WHERE alertId = @alertId
        `;

        const request = connection.request();
        request.input('alertId', alertId);
        request.input('caregiverId', caregiverId);
        request.input('notes', notes);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // generates weekly adherence report
    static async generateWeeklyReport(patientId) {
        const connection = await sql.connect(dbConfig);
        
        try {
            // get weekly medication compliance
            const complianceQuery = `
                SELECT 
                    m.name,
                    m.dosage,
                    COUNT(CASE WHEN ml.logId IS NOT NULL THEN 1 END) as takenCount,
                    7 as scheduledCount,
                    CAST(COUNT(CASE WHEN ml.logId IS NOT NULL THEN 1 END) * 100.0 / 7 AS DECIMAL(5,2)) as complianceRate
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
                    AND ml.takenAt >= DATEADD(DAY, -7, GETDATE())
                WHERE m.userId = @patientId AND m.active = 1
                GROUP BY m.medicationId, m.name, m.dosage
                ORDER BY complianceRate DESC
            `;

            // get health metrics trends
            const healthTrendsQuery = `
                SELECT 
                    metricType,
                    AVG(CAST(value AS FLOAT)) as avgValue,
                    MIN(CAST(value AS FLOAT)) as minValue,
                    MAX(CAST(value AS FLOAT)) as maxValue,
                    COUNT(*) as recordCount
                FROM HealthMetrics
                WHERE userId = @patientId 
                    AND recordedAt >= DATEADD(DAY, -7, GETDATE())
                GROUP BY metricType
            `;

            // get alert summary
            const alertSummaryQuery = `
                SELECT 
                    alertType,
                    COUNT(*) as alertCount,
                    COUNT(CASE WHEN acknowledged = 1 THEN 1 END) as acknowledgedCount
                FROM AlertHistory
                WHERE userId = @patientId 
                    AND triggeredAt >= DATEADD(DAY, -7, GETDATE())
                GROUP BY alertType
            `;

            const request = connection.request();
            request.input('patientId', patientId);

            const complianceResult = await request.query(complianceQuery);
            const healthResult = await request.query(healthTrendsQuery);
            const alertResult = await request.query(alertSummaryQuery);

            connection.close();

            return {
                reportId: `WR_${patientId}_${Date.now()}`,
                generatedAt: new Date(),
                weekPeriod: {
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    endDate: new Date()
                },
                medicationCompliance: complianceResult.recordset,
                healthTrends: healthResult.recordset,
                alertSummary: alertResult.recordset,
                overallCompliance: complianceResult.recordset.reduce((acc, med) => acc + med.complianceRate, 0) / complianceResult.recordset.length || 0
            };

        } catch (error) {
            connection.close();
            throw error;
        }
    }

    // updates alert preferences for caregiver
    static async updateAlertPreferences(caregiverId, patientId, preferences) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE CaregiverRelationships
            SET alertPreferences = @preferences, updatedAt = GETDATE()
            WHERE caregiverId = @caregiverId AND patientId = @patientId
        `;

        const request = connection.request();
        request.input('caregiverId', caregiverId);
        request.input('patientId', patientId);
        request.input('preferences', JSON.stringify(preferences));

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // checks for medication adherence issues and triggers caregiver alerts
    static async checkAndAlertCaregivers(patientId) {
        const connection = await sql.connect(dbConfig);
        
        try {
            // get missed medications
            const missedQuery = `
                SELECT m.*, 
                       DATEDIFF(MINUTE, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME), GETDATE()) as minutesLate
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
                    AND CAST(ml.takenAt AS DATE) = CAST(GETDATE() AS DATE)
                WHERE m.userId = @patientId 
                    AND m.active = 1
                    AND ml.logId IS NULL
                    AND DATEDIFF(MINUTE, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME), GETDATE()) > 120
            `;

            // get caregivers for this patient
            const caregiversQuery = `
                SELECT cr.caregiverId, cr.alertPreferences, u.email, u.phoneNumber
                FROM CaregiverRelationships cr
                INNER JOIN Users u ON cr.caregiverId = u.ID
                WHERE cr.patientId = @patientId AND cr.isActive = 1
            `;

            const request = connection.request();
            request.input('patientId', patientId);

            const missedResult = await request.query(missedQuery);
            const caregiversResult = await request.query(caregiversQuery);

            if (missedResult.recordset.length > 0 && caregiversResult.recordset.length > 0) {
                // create alert entry
                const medicationNames = missedResult.recordset.map(med => med.name).join(', ');
                
                const alertQuery = `
                    INSERT INTO AlertHistory (userId, alertType, message, severity, triggeredAt)
                    OUTPUT INSERTED.*
                    VALUES (@patientId, 'missed_medication', @message, 'high', GETDATE())
                `;

                const alertRequest = connection.request();
                alertRequest.input('patientId', patientId);
                alertRequest.input('message', `Medications missed for more than 2 hours: ${medicationNames}`);

                const alertResult = await alertRequest.query(alertQuery);
                
                // notify caregivers (implementation would depend on notification service)
                console.log(`Alert triggered for patient ${patientId}: ${medicationNames}`);
            }

            connection.close();

            return {
                missedMedications: missedResult.recordset,
                caregiversNotified: caregiversResult.recordset.length
            };

        } catch (error) {
            connection.close();
            throw error;
        }
    }
}

module.exports = Caregiver;