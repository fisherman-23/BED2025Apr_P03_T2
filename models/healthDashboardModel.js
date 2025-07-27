const sql = require('mssql');
const dbConfig = require('../dbConfig');

// health dashboard model for managing health metrics data
class HealthDashboard {
    constructor(metricId, userId, metricDate, bloodPressureSystolic, bloodPressureDiastolic, heartRate, weight, bloodSugar, notes, recordedBy) {
        this.metricId = metricId;
        this.userId = userId;
        this.metricDate = metricDate;
        this.bloodPressureSystolic = bloodPressureSystolic;
        this.bloodPressureDiastolic = bloodPressureDiastolic;
        this.heartRate = heartRate;
        this.weight = weight;
        this.bloodSugar = bloodSugar;
        this.notes = notes;
        this.recordedBy = recordedBy;
    }

    // creates a new health metrics record
    static async createHealthMetrics(metricsData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO HealthMetrics (userId, metricDate, bloodPressureSystolic, bloodPressureDiastolic, heartRate, weight, bloodSugar, notes, recordedBy)
            OUTPUT INSERTED.*
            VALUES (@userId, @metricDate, @bloodPressureSystolic, @bloodPressureDiastolic, @heartRate, @weight, @bloodSugar, @notes, @recordedBy)
        `;

        const request = connection.request();
        request.input('userId', metricsData.userId);
        request.input('metricDate', metricsData.metricDate || new Date());
        request.input('bloodPressureSystolic', metricsData.bloodPressureSystolic);
        request.input('bloodPressureDiastolic', metricsData.bloodPressureDiastolic);
        request.input('heartRate', metricsData.heartRate);
        request.input('weight', metricsData.weight);
        request.input('bloodSugar', metricsData.bloodSugar);
        request.input('notes', metricsData.notes);
        request.input('recordedBy', metricsData.recordedBy || 'user');

        const result = await request.query(sqlQuery);
        connection.close();

        const row = result.recordset[0];
        return new HealthDashboard(
            row.metricId, row.userId, row.metricDate, row.bloodPressureSystolic,
            row.bloodPressureDiastolic, row.heartRate, row.weight, row.bloodSugar,
            row.notes, row.recordedBy
        );
    }

    // gets health metrics for a user within date range
    static async getHealthMetricsByUserId(userId, startDate, endDate) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM HealthMetrics 
            WHERE userId = @userId 
            AND metricDate BETWEEN @startDate AND @endDate
            ORDER BY metricDate DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('startDate', startDate);
        request.input('endDate', endDate);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(row => new HealthDashboard(
            row.metricId, row.userId, row.metricDate, row.bloodPressureSystolic,
            row.bloodPressureDiastolic, row.heartRate, row.weight, row.bloodSugar,
            row.notes, row.recordedBy
        ));
    }

    // gets a specific health metric by ID
    static async getHealthMetricById(metricId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT * FROM HealthMetrics 
            WHERE metricId = @metricId
        `;

        const request = connection.request();
        request.input('metricId', metricId);

        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length === 0) {
            return null;
        }

        const row = result.recordset[0];
        return new HealthDashboard(
            row.metricId, row.userId, row.metricDate, row.bloodPressureSystolic,
            row.bloodPressureDiastolic, row.heartRate, row.weight, row.bloodSugar,
            row.notes, row.recordedBy
        );
    }

    // updates a health metrics record
    static async updateHealthMetrics(metricId, updateData) {
        const connection = await sql.connect(dbConfig);
        
        // build dynamic update query based on provided fields
        const updateFields = [];
        const request = connection.request();
        
        if (updateData.metricDate !== undefined) {
            updateFields.push('metricDate = @metricDate');
            request.input('metricDate', updateData.metricDate);
        }
        if (updateData.bloodPressureSystolic !== undefined) {
            updateFields.push('bloodPressureSystolic = @bloodPressureSystolic');
            request.input('bloodPressureSystolic', updateData.bloodPressureSystolic);
        }
        if (updateData.bloodPressureDiastolic !== undefined) {
            updateFields.push('bloodPressureDiastolic = @bloodPressureDiastolic');
            request.input('bloodPressureDiastolic', updateData.bloodPressureDiastolic);
        }
        if (updateData.heartRate !== undefined) {
            updateFields.push('heartRate = @heartRate');
            request.input('heartRate', updateData.heartRate);
        }
        if (updateData.weight !== undefined) {
            updateFields.push('weight = @weight');
            request.input('weight', updateData.weight);
        }
        if (updateData.bloodSugar !== undefined) {
            updateFields.push('bloodSugar = @bloodSugar');
            request.input('bloodSugar', updateData.bloodSugar);
        }
        if (updateData.notes !== undefined) {
            updateFields.push('notes = @notes');
            request.input('notes', updateData.notes);
        }
        if (updateData.recordedBy !== undefined) {
            updateFields.push('recordedBy = @recordedBy');
            request.input('recordedBy', updateData.recordedBy);
        }
        
        if (updateFields.length === 0) {
            connection.close();
            return false;
        }
        
        const sqlQuery = `
            UPDATE HealthMetrics 
            SET ${updateFields.join(', ')}
            WHERE metricId = @metricId
        `;

        request.input('metricId', metricId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // deletes a health metrics record
    static async deleteHealthMetrics(metricId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            DELETE FROM HealthMetrics 
            WHERE metricId = @metricId
        `;

        const request = connection.request();
        request.input('metricId', metricId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // gets latest health metrics for a user
    static async getLatestHealthMetrics(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT TOP 1 * FROM HealthMetrics 
            WHERE userId = @userId 
            ORDER BY metricDate DESC, createdAt DESC
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length === 0) {
            return null;
        }

        const row = result.recordset[0];
        return new HealthDashboard(
            row.metricId, row.userId, row.metricDate, row.bloodPressureSystolic,
            row.bloodPressureDiastolic, row.heartRate, row.weight, row.bloodSugar,
            row.notes, row.recordedBy
        );
    }

    // gets health statistics for a user over a period
    static async getHealthStatistics(userId, period = 'month') {
        const connection = await sql.connect(dbConfig);
        
        let dateFilter;
        switch (period) {
            case 'week':
                dateFilter = "metricDate >= DATEADD(WEEK, -1, GETDATE())";
                break;
            case 'month':
                dateFilter = "metricDate >= DATEADD(MONTH, -1, GETDATE())";
                break;
            case 'quarter':
                dateFilter = "metricDate >= DATEADD(MONTH, -3, GETDATE())";
                break;
            case 'year':
                dateFilter = "metricDate >= DATEADD(YEAR, -1, GETDATE())";
                break;
            default:
                dateFilter = "metricDate >= DATEADD(MONTH, -1, GETDATE())";
        }
        
        const sqlQuery = `
            SELECT 
                COUNT(*) as total_readings,
                AVG(CAST(bloodPressureSystolic AS FLOAT)) as avg_systolic,
                AVG(CAST(bloodPressureDiastolic AS FLOAT)) as avg_diastolic,
                AVG(CAST(heartRate AS FLOAT)) as avg_heart_rate,
                AVG(CAST(weight AS FLOAT)) as avg_weight,
                AVG(CAST(bloodSugar AS FLOAT)) as avg_blood_sugar,
                MIN(bloodPressureSystolic) as min_systolic,
                MAX(bloodPressureSystolic) as max_systolic,
                MIN(bloodPressureDiastolic) as min_diastolic,
                MAX(bloodPressureDiastolic) as max_diastolic,
                MIN(heartRate) as min_heart_rate,
                MAX(heartRate) as max_heart_rate,
                MIN(weight) as min_weight,
                MAX(weight) as max_weight,
                MIN(bloodSugar) as min_blood_sugar,
                MAX(bloodSugar) as max_blood_sugar
            FROM HealthMetrics 
            WHERE userId = @userId AND ${dateFilter}
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset[0];
    }

    // gets health metrics grouped by date for charts
    static async getHealthMetricsForChart(userId, period = 'month', metricType = 'all') {
        const connection = await sql.connect(dbConfig);
        
        let dateFilter;
        let groupBy;
        switch (period) {
            case 'week':
                dateFilter = "metricDate >= DATEADD(WEEK, -1, GETDATE())";
                groupBy = "CAST(metricDate AS DATE)";
                break;
            case 'month':
                dateFilter = "metricDate >= DATEADD(MONTH, -1, GETDATE())";
                groupBy = "CAST(metricDate AS DATE)";
                break;
            case 'quarter':
                dateFilter = "metricDate >= DATEADD(MONTH, -3, GETDATE())";
                groupBy = "DATEPART(WEEK, metricDate), DATEPART(YEAR, metricDate)";
                break;
            case 'year':
                dateFilter = "metricDate >= DATEADD(YEAR, -1, GETDATE())";
                groupBy = "DATEPART(MONTH, metricDate), DATEPART(YEAR, metricDate)";
                break;
            default:
                dateFilter = "metricDate >= DATEADD(MONTH, -1, GETDATE())";
                groupBy = "CAST(metricDate AS DATE)";
        }
        
        let selectFields = "metricDate";
        if (metricType === 'all' || metricType === 'blood_pressure') {
            selectFields += ", AVG(CAST(bloodPressureSystolic AS FLOAT)) as avg_systolic, AVG(CAST(bloodPressureDiastolic AS FLOAT)) as avg_diastolic";
        }
        if (metricType === 'all' || metricType === 'heart_rate') {
            selectFields += ", AVG(CAST(heartRate AS FLOAT)) as avg_heart_rate";
        }
        if (metricType === 'all' || metricType === 'weight') {
            selectFields += ", AVG(CAST(weight AS FLOAT)) as avg_weight";
        }
        if (metricType === 'all' || metricType === 'blood_sugar') {
            selectFields += ", AVG(CAST(bloodSugar AS FLOAT)) as avg_blood_sugar";
        }
        
        const sqlQuery = `
            SELECT ${selectFields}
            FROM HealthMetrics 
            WHERE userId = @userId AND ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY metricDate ASC
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // gets health trends analysis
    static async getHealthTrends(userId, days = 30) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            WITH RecentMetrics AS (
                SELECT 
                    metricDate,
                    bloodPressureSystolic,
                    bloodPressureDiastolic,
                    heartRate,
                    weight,
                    bloodSugar,
                    ROW_NUMBER() OVER (ORDER BY metricDate DESC) as rn
                FROM HealthMetrics 
                WHERE userId = @userId 
                AND metricDate >= DATEADD(DAY, -@days, GETDATE())
                AND (bloodPressureSystolic IS NOT NULL OR heartRate IS NOT NULL OR weight IS NOT NULL OR bloodSugar IS NOT NULL)
            ),
            FirstLast AS (
                SELECT 
                    MAX(CASE WHEN rn = 1 THEN bloodPressureSystolic END) as latest_systolic,
                    MAX(CASE WHEN rn = 1 THEN bloodPressureDiastolic END) as latest_diastolic,
                    MAX(CASE WHEN rn = 1 THEN heartRate END) as latest_heart_rate,
                    MAX(CASE WHEN rn = 1 THEN weight END) as latest_weight,
                    MAX(CASE WHEN rn = 1 THEN bloodSugar END) as latest_blood_sugar,
                    MIN(CASE WHEN rn = (SELECT MAX(rn) FROM RecentMetrics) THEN bloodPressureSystolic END) as first_systolic,
                    MIN(CASE WHEN rn = (SELECT MAX(rn) FROM RecentMetrics) THEN bloodPressureDiastolic END) as first_diastolic,
                    MIN(CASE WHEN rn = (SELECT MAX(rn) FROM RecentMetrics) THEN heartRate END) as first_heart_rate,
                    MIN(CASE WHEN rn = (SELECT MAX(rn) FROM RecentMetrics) THEN weight END) as first_weight,
                    MIN(CASE WHEN rn = (SELECT MAX(rn) FROM RecentMetrics) THEN bloodSugar END) as first_blood_sugar
                FROM RecentMetrics
            )
            SELECT 
                latest_systolic,
                latest_diastolic,
                latest_heart_rate,
                latest_weight,
                latest_blood_sugar,
                first_systolic,
                first_diastolic,
                first_heart_rate,
                first_weight,
                first_blood_sugar,
                CASE 
                    WHEN latest_systolic IS NOT NULL AND first_systolic IS NOT NULL 
                    THEN latest_systolic - first_systolic 
                    ELSE NULL 
                END as systolic_change,
                CASE 
                    WHEN latest_diastolic IS NOT NULL AND first_diastolic IS NOT NULL 
                    THEN latest_diastolic - first_diastolic 
                    ELSE NULL 
                END as diastolic_change,
                CASE 
                    WHEN latest_heart_rate IS NOT NULL AND first_heart_rate IS NOT NULL 
                    THEN latest_heart_rate - first_heart_rate 
                    ELSE NULL 
                END as heart_rate_change,
                CASE 
                    WHEN latest_weight IS NOT NULL AND first_weight IS NOT NULL 
                    THEN latest_weight - first_weight 
                    ELSE NULL 
                END as weight_change,
                CASE 
                    WHEN latest_blood_sugar IS NOT NULL AND first_blood_sugar IS NOT NULL 
                    THEN latest_blood_sugar - first_blood_sugar 
                    ELSE NULL 
                END as blood_sugar_change
            FROM FirstLast
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('days', days);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset[0] || {};
    }

    // searches health metrics by date range and notes
    static async searchHealthMetrics(userId, searchCriteria) {
        const connection = await sql.connect(dbConfig);
        
        const conditions = ['userId = @userId'];
        const request = connection.request();
        request.input('userId', userId);
        
        if (searchCriteria.startDate) {
            conditions.push('metricDate >= @startDate');
            request.input('startDate', searchCriteria.startDate);
        }
        
        if (searchCriteria.endDate) {
            conditions.push('metricDate <= @endDate');
            request.input('endDate', searchCriteria.endDate);
        }
        
        if (searchCriteria.notes) {
            conditions.push('notes LIKE @notes');
            request.input('notes', `%${searchCriteria.notes}%`);
        }
        
        if (searchCriteria.recordedBy) {
            conditions.push('recordedBy = @recordedBy');
            request.input('recordedBy', searchCriteria.recordedBy);
        }
        
        if (searchCriteria.minSystolic) {
            conditions.push('bloodPressureSystolic >= @minSystolic');
            request.input('minSystolic', searchCriteria.minSystolic);
        }
        
        if (searchCriteria.maxSystolic) {
            conditions.push('bloodPressureSystolic <= @maxSystolic');
            request.input('maxSystolic', searchCriteria.maxSystolic);
        }
        
        const sqlQuery = `
            SELECT * FROM HealthMetrics 
            WHERE ${conditions.join(' AND ')}
            ORDER BY metricDate DESC
        `;

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.map(row => new HealthDashboard(
            row.metricId, row.userId, row.metricDate, row.bloodPressureSystolic,
            row.bloodPressureDiastolic, row.heartRate, row.weight, row.bloodSugar,
            row.notes, row.recordedBy
        ));
    }

    // gets health metrics with medication compliance correlation
    static async getHealthWithMedicationCompliance(userId, startDate, endDate) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                hm.*,
                COALESCE(
                    ROUND(
                        (CAST(COUNT(CASE WHEN ml.missed = 0 AND CAST(ml.taken_at AS DATE) = hm.metricDate THEN 1 END) AS FLOAT) / 
                         NULLIF(COUNT(CASE WHEN CAST(ml.taken_at AS DATE) = hm.metricDate THEN ml.logId END), 0)) * 100, 1
                    ), 0
                ) as daily_compliance_rate
            FROM HealthMetrics hm
            LEFT JOIN MedicationLogs ml ON CAST(ml.taken_at AS DATE) = hm.metricDate
                AND ml.medication_id IN (SELECT medicationId FROM Medications WHERE userId = hm.userId)
            WHERE hm.userId = @userId 
            AND hm.metricDate BETWEEN @startDate AND @endDate
            GROUP BY 
                hm.metricId, hm.userId, hm.metricDate, hm.bloodPressureSystolic, 
                hm.bloodPressureDiastolic, hm.heartRate, hm.weight, hm.bloodSugar, 
                hm.notes, hm.recordedBy, hm.createdAt
            ORDER BY hm.metricDate DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('startDate', startDate);
        request.input('endDate', endDate);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // gets health metrics summary for dashboard
    static async getHealthSummary(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            WITH LatestMetrics AS (
                SELECT TOP 1 *
                FROM HealthMetrics 
                WHERE userId = @userId 
                ORDER BY metricDate DESC, createdAt DESC
            ),
            WeeklyStats AS (
                SELECT 
                    AVG(CAST(bloodPressureSystolic AS FLOAT)) as avg_systolic_week,
                    AVG(CAST(bloodPressureDiastolic AS FLOAT)) as avg_diastolic_week,
                    AVG(CAST(heartRate AS FLOAT)) as avg_heart_rate_week,
                    COUNT(*) as readings_this_week
                FROM HealthMetrics 
                WHERE userId = @userId 
                AND metricDate >= DATEADD(WEEK, -1, GETDATE())
            ),
            MonthlyStats AS (
                SELECT 
                    AVG(CAST(bloodPressureSystolic AS FLOAT)) as avg_systolic_month,
                    AVG(CAST(bloodPressureDiastolic AS FLOAT)) as avg_diastolic_month,
                    AVG(CAST(heartRate AS FLOAT)) as avg_heart_rate_month,
                    COUNT(*) as readings_this_month
                FROM HealthMetrics 
                WHERE userId = @userId 
                AND metricDate >= DATEADD(MONTH, -1, GETDATE())
            )
            SELECT 
                lm.*,
                ws.avg_systolic_week,
                ws.avg_diastolic_week,
                ws.avg_heart_rate_week,
                ws.readings_this_week,
                ms.avg_systolic_month,
                ms.avg_diastolic_month,
                ms.avg_heart_rate_month,
                ms.readings_this_month
            FROM LatestMetrics lm
            CROSS JOIN WeeklyStats ws
            CROSS JOIN MonthlyStats ms
        `;

        const request = connection.request();
        request.input('userId', userId);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset[0] || {};
    }

    // bulk insert health metrics (for data import)
    static async bulkInsertHealthMetrics(userId, metricsArray) {
        const connection = await sql.connect(dbConfig);
        
        try {
            const table = new sql.Table('HealthMetrics');
            table.create = false;
            table.columns.add('userId', sql.Int, { nullable: false });
            table.columns.add('metricDate', sql.Date, { nullable: false });
            table.columns.add('bloodPressureSystolic', sql.Int, { nullable: true });
            table.columns.add('bloodPressureDiastolic', sql.Int, { nullable: true });
            table.columns.add('heartRate', sql.Int, { nullable: true });
            table.columns.add('weight', sql.Decimal(5, 2), { nullable: true });
            table.columns.add('bloodSugar', sql.Int, { nullable: true });
            table.columns.add('notes', sql.NVarChar(500), { nullable: true });
            table.columns.add('recordedBy', sql.NVarChar(100), { nullable: false });
            
            metricsArray.forEach(metric => {
                table.rows.add(
                    userId,
                    metric.metricDate,
                    metric.bloodPressureSystolic,
                    metric.bloodPressureDiastolic,
                    metric.heartRate,
                    metric.weight,
                    metric.bloodSugar,
                    metric.notes,
                    metric.recordedBy || 'bulk_import'
                );
            });
            
            const request = connection.request();
            await request.bulk(table);
            
            connection.close();
            return true;
        } catch (error) {
            connection.close();
            throw error;
        }
    }

    // gets abnormal readings for alerts
    static async getAbnormalReadings(userId, days = 7) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                metricId,
                metricDate,
                bloodPressureSystolic,
                bloodPressureDiastolic,
                heartRate,
                weight,
                bloodSugar,
                notes,
                CASE 
                    WHEN bloodPressureSystolic > 140 OR bloodPressureDiastolic > 90 THEN 'High Blood Pressure'
                    WHEN bloodPressureSystolic < 90 OR bloodPressureDiastolic < 60 THEN 'Low Blood Pressure'
                    WHEN heartRate > 100 THEN 'High Heart Rate'
                    WHEN heartRate < 60 THEN 'Low Heart Rate'
                    WHEN bloodSugar > 140 THEN 'High Blood Sugar'
                    WHEN bloodSugar < 70 THEN 'Low Blood Sugar'
                    ELSE 'Normal'
                END as alert_type,
                CASE 
                    WHEN bloodPressureSystolic > 180 OR bloodPressureDiastolic > 110 OR bloodSugar > 250 OR bloodSugar < 50 THEN 'critical'
                    WHEN bloodPressureSystolic > 140 OR bloodPressureDiastolic > 90 OR heartRate > 100 OR bloodSugar > 140 OR bloodSugar < 70 THEN 'high'
                    ELSE 'medium'
                END as severity
            FROM HealthMetrics 
            WHERE userId = @userId 
            AND metricDate >= DATEADD(DAY, -@days, GETDATE())
            AND (
                bloodPressureSystolic > 140 OR bloodPressureSystolic < 90 OR
                bloodPressureDiastolic > 90 OR bloodPressureDiastolic < 60 OR
                heartRate > 100 OR heartRate < 60 OR
                bloodSugar > 140 OR bloodSugar < 70
            )
            ORDER BY 
                CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
                metricDate DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('days', days);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // deletes old health metrics (for data retention management)
    static async deleteOldMetrics(userId, olderThanMonths = 24) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            DELETE FROM HealthMetrics 
            WHERE userId = @userId 
            AND metricDate < DATEADD(MONTH, -@months, GETDATE())
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('months', olderThanMonths);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0];
    }
}

module.exports = HealthDashboard;