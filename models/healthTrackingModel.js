const sql = require('mssql');
const dbConfig = require('../dbConfig');

// health tracking model for managing health metrics and compliance
class HealthTracking {
    constructor(metricId, userId, metricType, value, unit, notes, recordedAt) {
        this.metricId = metricId;
        this.userId = userId;
        this.metricType = metricType;
        this.value = value;
        this.unit = unit;
        this.notes = notes;
        this.recordedAt = recordedAt;
    }

    // creates a new health metric entry
    static async createHealthMetric(metricData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO HealthMetrics (userId, metricType, value, unit, notes, recordedAt)
            OUTPUT INSERTED.*
            VALUES (@userId, @metricType, @value, @unit, @notes, @recordedAt)
        `;

        const request = connection.request();
        request.input('userId', metricData.userId);
        request.input('metricType', metricData.metricType);
        request.input('value', metricData.value);
        request.input('unit', metricData.unit);
        request.input('notes', metricData.notes);
        request.input('recordedAt', metricData.recordedAt || new Date());

        const result = await request.query(sqlQuery);
        connection.close();

        return new HealthTracking(
            result.recordset[0].metricId,
            result.recordset[0].userId,
            result.recordset[0].metricType,
            result.recordset[0].value,
            result.recordset[0].unit,
            result.recordset[0].notes,
            result.recordset[0].recordedAt
        );
    }

    // gets health metrics for a user with filtering
    static async getHealthMetricsByUserId(userId, options = {}) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `
            SELECT * FROM HealthMetrics 
            WHERE userId = @userId
        `;

        const request = connection.request();
        request.input('userId', userId);

        if (options.metricType) {
            sqlQuery += ` AND metricType = @metricType`;
            request.input('metricType', options.metricType);
        }

        if (options.startDate) {
            sqlQuery += ` AND recordedAt >= @startDate`;
            request.input('startDate', options.startDate);
        }

        if (options.endDate) {
            sqlQuery += ` AND recordedAt <= @endDate`;
            request.input('endDate', options.endDate);
        }

        sqlQuery += ` ORDER BY recordedAt DESC`;

        if (options.limit) {
            sqlQuery = `SELECT TOP (@limit) * FROM (${sqlQuery}) AS subquery ORDER BY recordedAt DESC`;
            request.input('limit', options.limit);
        }

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(metric => new HealthTracking(
            metric.metricId,
            metric.userId,
            metric.metricType,
            metric.value,
            metric.unit,
            metric.notes,
            metric.recordedAt
        ));
    }

    // gets a specific health metric by ID
    static async getHealthMetricById(metricId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM HealthMetrics WHERE metricId = @metricId
        `;

        const request = connection.request();
        request.input('metricId', metricId);

        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length === 0) {
            return null;
        }

        const metric = result.recordset[0];
        return new HealthTracking(
            metric.metricId,
            metric.userId,
            metric.metricType,
            metric.value,
            metric.unit,
            metric.notes,
            metric.recordedAt
        );
    }

    // updates a health metric
    static async updateHealthMetric(metricId, updateData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE HealthMetrics
            SET metricType = @metricType, value = @value, unit = @unit, 
                notes = @notes, recordedAt = @recordedAt
            WHERE metricId = @metricId
        `;

        const request = connection.request();
        request.input('metricId', metricId);
        request.input('metricType', updateData.metricType);
        request.input('value', updateData.value);
        request.input('unit', updateData.unit);
        request.input('notes', updateData.notes);
        request.input('recordedAt', updateData.recordedAt);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // deletes a health metric
    static async deleteHealthMetric(metricId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            DELETE FROM HealthMetrics WHERE metricId = @metricId
        `;

        const request = connection.request();
        request.input('metricId', metricId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // gets medication compliance data for charts
    static async getMedicationCompliance(userId, period = 'week') {
        const connection = await sql.connect(dbConfig);
        
        let dateFilter = '';
        switch (period) {
            case 'day':
                dateFilter = 'WHERE ml.takenAt >= CAST(GETDATE() AS DATE)';
                break;
            case 'week':
                dateFilter = 'WHERE ml.takenAt >= DATEADD(DAY, -7, GETDATE())';
                break;
            case 'month':
                dateFilter = 'WHERE ml.takenAt >= DATEADD(MONTH, -1, GETDATE())';
                break;
        }

        const sqlQuery = `
            WITH MedicationSchedule AS (
                SELECT m.medicationId, m.name, m.timing, m.frequency,
                       CAST(GETDATE() AS DATE) as scheduleDate
                FROM Medications m
                WHERE m.userId = @userId AND m.active = 1
            ),
            ComplianceData AS (
                SELECT 
                    ms.medicationId,
                    ms.name,
                    COUNT(CASE WHEN ml.logId IS NOT NULL THEN 1 END) as takenCount,
                    COUNT(*) as scheduledCount,
                    CAST(COUNT(CASE WHEN ml.logId IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as complianceRate
                FROM MedicationSchedule ms
                LEFT JOIN MedicationLogs ml ON ms.medicationId = ml.medicationId 
                    AND CAST(ml.takenAt AS DATE) = ms.scheduleDate
                ${dateFilter}
                GROUP BY ms.medicationId, ms.name
            )
            SELECT 
                medicationId,
                name,
                takenCount,
                scheduledCount,
                complianceRate,
                CASE 
                    WHEN complianceRate >= 80 THEN 'high'
                    WHEN complianceRate >= 60 THEN 'medium'
                    ELSE 'low'
                END as complianceLevel
            FROM ComplianceData
            ORDER BY complianceRate DESC
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // gets health dashboard overview
    static async getHealthDashboard(userId) {
        const connection = await sql.connect(dbConfig);
        
        try {
            // get overall medication compliance
            const complianceQuery = `
                SELECT 
                    AVG(CAST(complianceRate AS FLOAT)) as overallCompliance
                FROM (
                    SELECT 
                        m.medicationId,
                        COUNT(CASE WHEN ml.logId IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as complianceRate
                    FROM Medications m
                    LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
                        AND ml.takenAt >= DATEADD(DAY, -7, GETDATE())
                    WHERE m.userId = @userId AND m.active = 1
                    GROUP BY m.medicationId
                ) as compliance
            `;

            // get recent health metrics
            const metricsQuery = `
                SELECT TOP 5 metricType, value, unit, recordedAt
                FROM HealthMetrics
                WHERE userId = @userId
                ORDER BY recordedAt DESC
            `;

            // get upcoming medications
            const upcomingQuery = `
                SELECT TOP 3 m.name, m.dosage, m.timing, m.instructions
                FROM Medications m
                WHERE m.userId = @userId AND m.active = 1
                ORDER BY m.timing
            `;

            const request = connection.request();
            request.input('userId', userId);

            const complianceResult = await request.query(complianceQuery);
            const metricsResult = await request.query(metricsQuery);
            const upcomingResult = await request.query(upcomingQuery);

            connection.close();

            return {
                overallCompliance: Math.round(complianceResult.recordset[0]?.overallCompliance || 0),
                recentMetrics: metricsResult.recordset,
                upcomingMedications: upcomingResult.recordset,
                lastUpdated: new Date()
            };

        } catch (error) {
            connection.close();
            throw error;
        }
    }

    // gets health trends analysis
    static async getHealthTrends(userId, period = 'month') {
        const connection = await sql.connect(dbConfig);
        
        let dateFilter = '';
        switch (period) {
            case 'week':
                dateFilter = 'WHERE recordedAt >= DATEADD(DAY, -7, GETDATE())';
                break;
            case 'month':
                dateFilter = 'WHERE recordedAt >= DATEADD(MONTH, -1, GETDATE())';
                break;
            case 'quarter':
                dateFilter = 'WHERE recordedAt >= DATEADD(MONTH, -3, GETDATE())';
                break;
        }

        const sqlQuery = `
            SELECT 
                metricType,
                AVG(CAST(value AS FLOAT)) as avgValue,
                MIN(CAST(value AS FLOAT)) as minValue,
                MAX(CAST(value AS FLOAT)) as maxValue,
                COUNT(*) as recordCount,
                CAST(recordedAt AS DATE) as recordDate
            FROM HealthMetrics
            WHERE userId = @userId
            ${dateFilter}
            GROUP BY metricType, CAST(recordedAt AS DATE)
            ORDER BY recordDate DESC, metricType
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // generates comprehensive health report
    static async generateHealthReport(userId, options = {}) {
        const connection = await sql.connect(dbConfig);
        
        try {
            const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = options.endDate || new Date();

            // get medication compliance
            const compliance = await this.getMedicationCompliance(userId, 'month');
            
            // get health metrics
            const metrics = await this.getHealthMetricsByUserId(userId, {
                startDate,
                endDate,
                limit: 100
            });

            // get missed medications
            const missedQuery = `
                SELECT m.name, COUNT(*) as missedCount
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                WHERE m.userId = @userId 
                    AND m.active = 1
                    AND ml.logId IS NULL
                    AND m.createdAt BETWEEN @startDate AND @endDate
                GROUP BY m.name
                ORDER BY missedCount DESC
            `;

            const request = connection.request();
            request.input('userId', userId);
            request.input('startDate', startDate);
            request.input('endDate', endDate);

            const missedResult = await request.query(missedQuery);
            connection.close();

            return {
                reportId: `HR_${userId}_${Date.now()}`,
                generatedAt: new Date(),
                period: { startDate, endDate },
                compliance: {
                    overall: compliance.reduce((acc, med) => acc + med.complianceRate, 0) / compliance.length || 0,
                    byMedication: compliance
                },
                healthMetrics: metrics,
                missedMedications: missedResult.recordset,
                summary: {
                    totalMedications: compliance.length,
                    highCompliance: compliance.filter(med => med.complianceLevel === 'high').length,
                    concerningTrends: missedResult.recordset.filter(med => med.missedCount >= 3).length
                }
            };

        } catch (error) {
            connection.close();
            throw error;
        }
    }

    // gets caregiver dashboard data
    static async getCaregiverDashboard(patientUserId) {
        const connection = await sql.connect(dbConfig);
        
        try {
            // get patient info
            const patientQuery = `
                SELECT u.email, u.firstName, u.lastName
                FROM Users u
                WHERE u.ID = @patientUserId
            `;

            // get real-time compliance
            const complianceData = await this.getMedicationCompliance(patientUserId, 'week');
            
            // get recent alerts
            const alertsQuery = `
                SELECT TOP 10 alertType, message, triggeredAt
                FROM AlertHistory
                WHERE userId = @patientUserId
                ORDER BY triggeredAt DESC
            `;

            const request = connection.request();
            request.input('patientUserId', patientUserId);

            const patientResult = await request.query(patientQuery);
            const alertsResult = await request.query(alertsQuery);

            connection.close();

            return {
                patient: patientResult.recordset[0],
                compliance: complianceData,
                recentAlerts: alertsResult.recordset,
                lastUpdated: new Date()
            };

        } catch (error) {
            connection.close();
            throw error;
        }
    }
}

module.exports = HealthTracking;