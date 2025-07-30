const sql = require('mssql');

class HealthMetricsController {
    // gets comprehensive health dashboard data for user
    async getHealthDashboard(req, res) {
        try {
            const pool = await sql.connect();
            
            // get overall medication compliance
            const complianceQuery = `
                SELECT 
                    COUNT(*) as totalDoses,
                    COUNT(CASE WHEN taken = 1 THEN 1 END) as takenDoses,
                    ROUND(COUNT(CASE WHEN taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as overallCompliance
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND ml.scheduledTime >= DATEADD(MONTH, -1, GETDATE())
            `;
            
            const complianceResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(complianceQuery);
                
            // get daily adherence for the last 30 days
            const dailyAdherenceQuery = `
                SELECT 
                    CAST(ml.scheduledTime as DATE) as date,
                    COUNT(*) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as dailyCompliance
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND ml.scheduledTime >= DATEADD(DAY, -30, GETDATE())
                GROUP BY CAST(ml.scheduledTime as DATE)
                ORDER BY date DESC
            `;
            
            const dailyResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(dailyAdherenceQuery);
                
            // get medication-specific adherence
            const medicationAdherenceQuery = `
                SELECT 
                    m.medicationName,
                    m.dosage,
                    m.frequency,
                    COUNT(*) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as adherenceRate
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                    AND ml.scheduledTime >= DATEADD(MONTH, -1, GETDATE())
                WHERE m.userId = @userId AND m.active = 1
                GROUP BY m.medicationId, m.medicationName, m.dosage, m.frequency
                ORDER BY adherenceRate ASC
            `;
            
            const medicationResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(medicationAdherenceQuery);
                
            // get recent missed medications
            const recentMissedQuery = `
                SELECT TOP 10
                    m.medicationName,
                    m.dosage,
                    ml.scheduledTime,
                    DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) as hoursOverdue
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND ml.taken = 0 
                AND ml.scheduledTime < GETDATE()
                ORDER BY ml.scheduledTime DESC
            `;
            
            const missedResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(recentMissedQuery);
                
            // get health trends (weekly averages for last 12 weeks)
            const trendsQuery = `
                SELECT 
                    DATEPART(YEAR, ml.scheduledTime) as year,
                    DATEPART(WEEK, ml.scheduledTime) as week,
                    COUNT(*) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as weeklyCompliance
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND ml.scheduledTime >= DATEADD(WEEK, -12, GETDATE())
                GROUP BY DATEPART(YEAR, ml.scheduledTime), DATEPART(WEEK, ml.scheduledTime)
                ORDER BY year DESC, week DESC
            `;
            
            const trendsResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(trendsQuery);
                
            const overallStats = complianceResult.recordset[0] || { 
                totalDoses: 0, 
                takenDoses: 0, 
                overallCompliance: 100 
            };
            
            res.status(200).json({
                status: 'success',
                data: {
                    overallStats,
                    dailyAdherence: dailyResult.recordset,
                    medicationAdherence: medicationResult.recordset,
                    recentMissed: missedResult.recordset,
                    weeklyTrends: trendsResult.recordset
                }
            });
            
        } catch (error) {
            console.error('Error fetching health dashboard:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve health dashboard data',
                error: error.message
            });
        }
    }

    // records a health metric entry
    async recordHealthMetric(req, res) {
        try {
            const {
                metricType, // 'blood_pressure', 'weight', 'blood_sugar', 'heart_rate', etc.
                value,
                unit,
                notes,
                recordedAt = new Date()
            } = req.body;
            
            if (!metricType || !value) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Metric type and value are required'
                });
            }
            
            const insertQuery = `
                INSERT INTO HealthMetrics (userId, metricType, value, unit, notes, recordedAt, createdAt)
                VALUES (@userId, @metricType, @value, @unit, @notes, @recordedAt, GETDATE());
                SELECT SCOPE_IDENTITY() as metricId;
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('metricType', sql.NVarChar, metricType)
                .input('value', sql.Decimal(10, 2), parseFloat(value))
                .input('unit', sql.NVarChar, unit || null)
                .input('notes', sql.NVarChar, notes || null)
                .input('recordedAt', sql.DateTime, new Date(recordedAt))
                .query(insertQuery);
                
            res.status(201).json({
                status: 'success',
                message: 'Health metric recorded successfully',
                data: {
                    metricId: result.recordset[0].metricId,
                    metricType,
                    value: parseFloat(value),
                    unit,
                    recordedAt
                }
            });
            
        } catch (error) {
            console.error('Error recording health metric:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to record health metric',
                error: error.message
            });
        }
    }

    // gets health metrics history for user
    async getHealthMetrics(req, res) {
        try {
            const { metricType, startDate, endDate, limit = 100 } = req.query;
            
            let whereClause = 'WHERE userId = @userId';
            const inputs = [
                { name: 'userId', type: sql.Int, value: req.user.id },
                { name: 'limit', type: sql.Int, value: parseInt(limit) }
            ];
            
            if (metricType) {
                whereClause += ' AND metricType = @metricType';
                inputs.push({ name: 'metricType', type: sql.NVarChar, value: metricType });
            }
            
            if (startDate) {
                whereClause += ' AND recordedAt >= @startDate';
                inputs.push({ name: 'startDate', type: sql.DateTime, value: new Date(startDate) });
            }
            
            if (endDate) {
                whereClause += ' AND recordedAt <= @endDate';
                inputs.push({ name: 'endDate', type: sql.DateTime, value: new Date(endDate) });
            }
            
            const metricsQuery = `
                SELECT TOP (@limit)
                    metricId,
                    metricType,
                    value,
                    unit,
                    notes,
                    recordedAt,
                    createdAt
                FROM HealthMetrics
                ${whereClause}
                ORDER BY recordedAt DESC, createdAt DESC
            `;
            
            const pool = await sql.connect();
            let request = pool.request();
            
            inputs.forEach(input => {
                request = request.input(input.name, input.type, input.value);
            });
            
            const result = await request.query(metricsQuery);
            
            res.status(200).json({
                status: 'success',
                data: { metrics: result.recordset }
            });
            
        } catch (error) {
            console.error('Error fetching health metrics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve health metrics',
                error: error.message
            });
        }
    }

    // generates medication adherence report for specified period
    async generateAdherenceReport(req, res) {
        try {
            const { period = 'monthly', format = 'json' } = req.query; // weekly, monthly, quarterly
            
            let dateInterval, reportTitle;
            switch (period) {
                case 'weekly':
                    dateInterval = 'WEEK';
                    reportTitle = 'Weekly Medication Adherence Report';
                    break;
                case 'quarterly':
                    dateInterval = 'QUARTER';
                    reportTitle = 'Quarterly Medication Adherence Report';
                    break;
                default:
                    dateInterval = 'MONTH';
                    reportTitle = 'Monthly Medication Adherence Report';
            }
            
            const pool = await sql.connect();
            
            // get user info
            const userQuery = `
                SELECT firstName, lastName, email FROM Users WHERE userId = @userId
            `;
            
            const userResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(userQuery);
                
            const user = userResult.recordset[0];
            
            // get adherence summary
            const summaryQuery = `
                SELECT 
                    COUNT(DISTINCT m.medicationId) as totalMedications,
                    COUNT(*) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as overallAdherence
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                    AND ml.scheduledTime >= DATEADD(${dateInterval}, -1, GETDATE())
                WHERE m.userId = @userId AND m.active = 1
            `;
            
            const summaryResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(summaryQuery);
                
            // get detailed medication breakdown
            const detailQuery = `
                SELECT 
                    m.medicationName,
                    m.dosage,
                    m.frequency,
                    COUNT(*) as scheduledDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as adherenceRate
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                    AND ml.scheduledTime >= DATEADD(${dateInterval}, -1, GETDATE())
                WHERE m.userId = @userId AND m.active = 1
                GROUP BY m.medicationId, m.medicationName, m.dosage, m.frequency
                ORDER BY adherenceRate ASC
            `;
            
            const detailResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(detailQuery);
                
            // get missed medication patterns
            const patternsQuery = `
                SELECT 
                    DATENAME(WEEKDAY, ml.scheduledTime) as dayOfWeek,
                    DATEPART(HOUR, ml.scheduledTime) as hourOfDay,
                    COUNT(*) as missedCount
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND ml.taken = 0 
                AND ml.scheduledTime >= DATEADD(${dateInterval}, -1, GETDATE())
                AND ml.scheduledTime < GETDATE()
                GROUP BY DATENAME(WEEKDAY, ml.scheduledTime), DATEPART(HOUR, ml.scheduledTime)
                ORDER BY missedCount DESC
            `;
            
            const patternsResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(patternsQuery);
                
            const reportData = {
                reportTitle,
                generatedAt: new Date().toISOString(),
                period,
                user: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email
                },
                summary: summaryResult.recordset[0],
                medicationDetails: detailResult.recordset,
                missedPatterns: patternsResult.recordset
            };
            
            if (format === 'pdf') {
                // generate PDF using libraries like puppeteer or pdfkit
                res.status(200).json({
                    status: 'success',
                    message: 'PDF report generation not implemented yet',
                    data: { ...reportData, format: 'pdf' }
                });
            } else {
                res.status(200).json({
                    status: 'success',
                    data: reportData
                });
            }
            
        } catch (error) {
            console.error('Error generating adherence report:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate adherence report',
                error: error.message
            });
        }
    }

    // gets medication adherence analytics and insights
    async getAdherenceAnalytics(req, res) {
        try {
            const pool = await sql.connect();
            
            // calculate adherence streaks
            const streakQuery = `
                WITH DailyAdherence AS (
                    SELECT 
                        CAST(ml.scheduledTime as DATE) as date,
                        CASE WHEN COUNT(CASE WHEN ml.taken = 0 THEN 1 END) = 0 THEN 1 ELSE 0 END as perfectDay
                    FROM MedicationLogs ml
                    JOIN Medications m ON ml.medicationId = m.medicationId
                    WHERE m.userId = @userId 
                    AND ml.scheduledTime >= DATEADD(DAY, -90, GETDATE())
                    GROUP BY CAST(ml.scheduledTime as DATE)
                ),
                Streaks AS (
                    SELECT 
                        date,
                        perfectDay,
                        ROW_NUMBER() OVER (ORDER BY date) - ROW_NUMBER() OVER (PARTITION BY perfectDay ORDER BY date) as grp
                    FROM DailyAdherence
                )
                SELECT 
                    MAX(CASE WHEN perfectDay = 1 THEN COUNT(*) ELSE 0 END) as longestStreak,
                    COUNT(CASE WHEN perfectDay = 1 THEN 1 END) as perfectDays,
                    COUNT(*) as totalDays
                FROM Streaks
                GROUP BY grp, perfectDay
            `;
            
            const streakResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(streakQuery);
                
            // get time-of-day adherence patterns
            const timePatternQuery = `
                SELECT 
                    CASE 
                        WHEN DATEPART(HOUR, ml.scheduledTime) BETWEEN 6 AND 11 THEN 'Morning'
                        WHEN DATEPART(HOUR, ml.scheduledTime) BETWEEN 12 AND 17 THEN 'Afternoon'
                        WHEN DATEPART(HOUR, ml.scheduledTime) BETWEEN 18 AND 21 THEN 'Evening'
                        ELSE 'Night'
                    END as timeOfDay,
                    COUNT(*) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as adherenceRate
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND ml.scheduledTime >= DATEADD(MONTH, -3, GETDATE())
                GROUP BY 
                    CASE 
                        WHEN DATEPART(HOUR, ml.scheduledTime) BETWEEN 6 AND 11 THEN 'Morning'
                        WHEN DATEPART(HOUR, ml.scheduledTime) BETWEEN 12 AND 17 THEN 'Afternoon'
                        WHEN DATEPART(HOUR, ml.scheduledTime) BETWEEN 18 AND 21 THEN 'Evening'
                        ELSE 'Night'
                    END
                ORDER BY adherenceRate DESC
            `;
            
            const timePatternResult = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .query(timePatternQuery);
                
            // get improvement suggestions based on patterns
            const suggestions = [];
            
            // analyze time patterns
            const timePatterns = timePatternResult.recordset;
            if (timePatterns.length > 0) {
                const worstTime = timePatterns[timePatterns.length - 1];
                if (worstTime.adherenceRate < 80) {
                    suggestions.push({
                        type: 'timing',
                        priority: 'high',
                        message: `Consider setting additional reminders for ${worstTime.timeOfDay.toLowerCase()} medications. Your adherence rate is ${worstTime.adherenceRate}% during this time.`
                    });
                }
            }
            
            const streakData = streakResult.recordset[0] || { longestStreak: 0, perfectDays: 0, totalDays: 0 };
            
            res.status(200).json({
                status: 'success',
                data: {
                    streakAnalysis: streakData,
                    timePatterns: timePatterns,
                    suggestions: suggestions,
                    generatedAt: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error fetching adherence analytics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve adherence analytics',
                error: error.message
            });
        }
    }
}

module.exports = new HealthMetricsController();