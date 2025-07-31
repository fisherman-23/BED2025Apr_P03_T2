const Medication = require('../models/medicationModel');
const sql = require('mssql');

class MedicationController {
    // creates a new medication record with enhanced validation
    async createMedication(req, res) {
        try {
            const medicationData = req.body;
            medicationData.userId = req.user.id;
            
            // enhanced validation
            const validationErrors = this.validateMedicationData(medicationData);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }
            
            const newMedication = await Medication.createMedication(medicationData);
            
            // create initial medication schedule
            await this.createMedicationSchedule(newMedication.medicationId, medicationData);
            
            res.status(201).json({
                status: 'success',
                message: 'Medication added successfully with schedule created',
                data: { medication: newMedication }
            });
        } catch (error) {
            console.error('Error creating medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to add medication',
                error: error.message
            });
        }
    }

    // gets all medications for the current user with enhanced details
    async getUserMedications(req, res) {
        try {
            const { includeInactive = false, category } = req.query;
            
            let query = `
                SELECT 
                    m.*,
                    COUNT(ml.logId) as totalLogs,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenLogs,
                    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedLogs,
                    CASE 
                        WHEN COUNT(ml.logId) > 0 
                        THEN ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(ml.logId), 2)
                        ELSE 100
                    END as adherenceRate,
                    (SELECT TOP 1 scheduledTime FROM MedicationLogs 
                     WHERE medicationId = m.medicationId AND taken = 0 AND scheduledTime > GETDATE()
                     ORDER BY scheduledTime ASC) as nextDose
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId 
                    AND ml.scheduledTime >= DATEADD(MONTH, -1, GETDATE())
                WHERE m.userId = @userId
            `;
            
            const inputs = [{ name: 'userId', type: sql.Int, value: req.user.id }];
            
            if (!includeInactive) {
                query += ' AND m.active = 1';
            }
            
            if (category) {
                query += ' AND m.category = @category';
                inputs.push({ name: 'category', type: sql.NVarChar, value: category });
            }
            
            query += `
                GROUP BY m.medicationId, m.userId, m.medicationName, m.dosage, m.frequency, 
                         m.instructions, m.prescribingDoctor, m.startDate, m.endDate, 
                         m.category, m.active, m.createdAt, m.updatedAt
                ORDER BY m.createdAt DESC
            `;
            
            const pool = await sql.connect();
            let request = pool.request();
            
            inputs.forEach(input => {
                request = request.input(input.name, input.type, input.value);
            });
            
            const result = await request.query(query);
            
            res.status(200).json({
                status: 'success',
                data: { 
                    medications: result.recordset,
                    summary: {
                        total: result.recordset.length,
                        active: result.recordset.filter(m => m.active).length,
                        avgAdherence: result.recordset.length > 0 
                            ? Math.round(result.recordset.reduce((sum, m) => sum + m.adherenceRate, 0) / result.recordset.length)
                            : 100
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching medications:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve medications',
                error: error.message
            });
        }
    }

    // gets upcoming medication reminders with enhanced details
    async getUpcomingReminders(req, res) {
        try {
            const { hours = 24 } = req.query;
            
            const query = `
                SELECT 
                    ml.logId,
                    ml.medicationId,
                    ml.scheduledTime,
                    ml.taken,
                    m.medicationName,
                    m.dosage,
                    m.instructions,
                    m.category,
                    CASE 
                        WHEN ml.scheduledTime <= GETDATE() AND ml.taken = 0 THEN 'overdue'
                        WHEN ml.scheduledTime <= DATEADD(MINUTE, 30, GETDATE()) THEN 'due_soon'
                        ELSE 'upcoming'
                    END as status,
                    CASE 
                        WHEN ml.scheduledTime <= GETDATE() 
                        THEN DATEDIFF(MINUTE, ml.scheduledTime, GETDATE())
                        ELSE DATEDIFF(MINUTE, GETDATE(), ml.scheduledTime)
                    END as minutesFromNow
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND m.active = 1
                AND ml.scheduledTime BETWEEN DATEADD(HOUR, -2, GETDATE()) 
                    AND DATEADD(HOUR, @hours, GETDATE())
                AND (ml.taken = 0 OR ml.scheduledTime <= GETDATE())
                ORDER BY ml.scheduledTime ASC
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('hours', sql.Int, parseInt(hours))
                .query(query);
                
            // group reminders by status
            const reminders = result.recordset;
            const groupedReminders = {
                overdue: reminders.filter(r => r.status === 'overdue'),
                due_soon: reminders.filter(r => r.status === 'due_soon'),
                upcoming: reminders.filter(r => r.status === 'upcoming')
            };
            
            res.status(200).json({
                status: 'success',
                data: { 
                    reminders: groupedReminders,
                    total: reminders.length,
                    overdue_count: groupedReminders.overdue.length
                }
            });
        } catch (error) {
            console.error('Error fetching reminders:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve reminders',
                error: error.message
            });
        }
    }

    // marks medication as taken with timestamp and notes
    async markMedicationTaken(req, res) {
        try {
            const medicationId = req.params.id;
            const { logId, notes, actualTime } = req.body;
            
            // verify medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            const pool = await sql.connect();
            
            // mark specific log as taken or create new log entry
            if (logId) {
                const updateQuery = `
                    UPDATE MedicationLogs 
                    SET taken = 1, takenAt = @takenAt, notes = @notes, updatedAt = GETDATE()
                    WHERE logId = @logId AND medicationId = @medicationId
                `;
                
                await pool.request()
                    .input('logId', sql.Int, logId)
                    .input('medicationId', sql.Int, medicationId)
                    .input('takenAt', sql.DateTime, actualTime ? new Date(actualTime) : new Date())
                    .input('notes', sql.NVarChar, notes || null)
                    .query(updateQuery);
            } else {
                // create new log entry for immediate taking
                const insertQuery = `
                    INSERT INTO MedicationLogs (medicationId, scheduledTime, taken, takenAt, notes, createdAt)
                    VALUES (@medicationId, @scheduledTime, 1, @takenAt, @notes, GETDATE())
                `;
                
                await pool.request()
                    .input('medicationId', sql.Int, medicationId)
                    .input('scheduledTime', sql.DateTime, new Date())
                    .input('takenAt', sql.DateTime, actualTime ? new Date(actualTime) : new Date())
                    .input('notes', sql.NVarChar, notes || null)
                    .query(insertQuery);
            }
            
            // update adherence statistics
            await this.updateAdherenceStats(medicationId);
            
            res.status(200).json({
                status: 'success',
                message: 'Medication marked as taken successfully'
            });
        } catch (error) {
            console.error('Error marking medication as taken:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to mark medication as taken',
                error: error.message
            });
        }
    }

    // gets medication adherence analytics
    async getAdherenceAnalytics(req, res) {
        try {
            const { period = 'weekly', medicationId } = req.query;
            
            let dateInterval, groupByFormat;
            switch (period) {
                case 'daily':
                    dateInterval = 'DAY';
                    groupByFormat = 'YYYY-MM-DD';
                    break;
                case 'monthly':
                    dateInterval = 'MONTH';
                    groupByFormat = 'YYYY-MM';
                    break;
                default: // weekly
                    dateInterval = 'WEEK';
                    groupByFormat = 'YYYY-\\WW';
            }
            
            let whereClause = 'WHERE m.userId = @userId';
            const inputs = [{ name: 'userId', type: sql.Int, value: req.user.id }];
            
            if (medicationId) {
                whereClause += ' AND m.medicationId = @medicationId';
                inputs.push({ name: 'medicationId', type: sql.Int, value: parseInt(medicationId) });
            }
            
            const analyticsQuery = `
                SELECT 
                    FORMAT(ml.scheduledTime, '${groupByFormat}') as period,
                    COUNT(*) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as adherenceRate
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                ${whereClause}
                AND ml.scheduledTime >= DATEADD(${dateInterval}, -12, GETDATE())
                GROUP BY FORMAT(ml.scheduledTime, '${groupByFormat}')
                ORDER BY period DESC
            `;
            
            const pool = await sql.connect();
            let request = pool.request();
            
            inputs.forEach(input => {
                request = request.input(input.name, input.type, input.value);
            });
            
            const result = await request.query(analyticsQuery);
            
            // calculate trends
            const data = result.recordset;
            let trend = 'stable';
            if (data.length >= 2) {
                const recent = data[0].adherenceRate;
                const previous = data[1].adherenceRate;
                if (recent > previous + 5) trend = 'improving';
                else if (recent < previous - 5) trend = 'declining';
            }
            
            res.status(200).json({
                status: 'success',
                data: {
                    period,
                    analytics: data,
                    trend,
                    summary: {
                        avgAdherence: data.length > 0 
                            ? Math.round(data.reduce((sum, d) => sum + d.adherenceRate, 0) / data.length)
                            : 100,
                        totalPeriods: data.length
                    }
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

    // updates medication details
    async updateMedication(req, res) {
        try {
            const medicationId = req.params.id;
            const updateData = req.body;
            
            // verify medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            // validate update data
            const validationErrors = this.validateMedicationData(updateData, true);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }
            
            const result = await Medication.updateMedication(medicationId, updateData);
            
            // if schedule changed, update future logs
            if (updateData.frequency || updateData.times) {
                await this.updateMedicationSchedule(medicationId, updateData);
            }
            
            res.status(200).json({
                status: 'success',
                message: 'Medication updated successfully',
                data: result
            });
        } catch (error) {
            console.error('Error updating medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update medication',
                error: error.message
            });
        }
    }

    // soft deletes a medication
    async deleteMedication(req, res) {
        try {
            const medicationId = req.params.id;
            
            // verify medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            // soft delete - set active to false
            const result = await Medication.deleteMedication(medicationId);
            
            // cancel future medication logs
            await this.cancelFutureLogs(medicationId);
            
            res.status(200).json({
                status: 'success',
                message: 'Medication removed successfully',
                data: result
            });
        } catch (error) {
            console.error('Error deleting medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete medication',
                error: error.message
            });
        }
    }

    // gets missed medications with alert recommendations
    async getMissedMedications(req, res) {
        try {
            const { hoursThreshold = 2 } = req.query;
            
            const query = `
                SELECT 
                    ml.logId,
                    ml.medicationId,
                    ml.scheduledTime,
                    m.medicationName,
                    m.dosage,
                    m.instructions,
                    m.category,
                    DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) as hoursOverdue,
                    CASE 
                        WHEN DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) >= 24 THEN 'critical'
                        WHEN DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) >= 8 THEN 'high'
                        WHEN DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) >= 4 THEN 'medium'
                        ELSE 'low'
                    END as alertLevel
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND m.active = 1
                AND ml.taken = 0
                AND ml.scheduledTime < DATEADD(HOUR, -@hoursThreshold, GETDATE())
                ORDER BY ml.scheduledTime ASC
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('hoursThreshold', sql.Int, parseInt(hoursThreshold))
                .query(query);
                
            const missedMedications = result.recordset;
            
            // group by alert level
            const groupedByLevel = {
                critical: missedMedications.filter(m => m.alertLevel === 'critical'),
                high: missedMedications.filter(m => m.alertLevel === 'high'),
                medium: missedMedications.filter(m => m.alertLevel === 'medium'),
                low: missedMedications.filter(m => m.alertLevel === 'low')
            };
            
            res.status(200).json({
                status: 'success',
                data: {
                    missedMedications: groupedByLevel,
                    total: missedMedications.length,
                    shouldAlert: missedMedications.some(m => m.alertLevel === 'high' || m.alertLevel === 'critical')
                }
            });
        } catch (error) {
            console.error('Error fetching missed medications:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve missed medications',
                error: error.message
            });
        }
    }

    // helper methods
    // validates medication data
    validateMedicationData(data, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate) {
            if (!data.medicationName || data.medicationName.trim().length < 2) {
                errors.push('Medication name must be at least 2 characters long');
            }
            
            if (!data.dosage || data.dosage.trim().length < 1) {
                errors.push('Dosage is required');
            }
            
            if (!data.frequency || !['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed'].includes(data.frequency)) {
                errors.push('Valid frequency is required');
            }
        }
        
        if (data.endDate && data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
            errors.push('End date must be after start date');
        }
        
        return errors;
    }

    // creates medication schedule based on frequency
    async createMedicationSchedule(medicationId, medicationData) {
        const { frequency, startDate = new Date(), endDate } = medicationData;
        
        const times = this.getScheduleTimes(frequency);
        const pool = await sql.connect();
        
        const endDateTime = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDateTime) {
            for (const time of times) {
                const [hours, minutes] = time.split(':').map(Number);
                const scheduledTime = new Date(currentDate);
                scheduledTime.setHours(hours, minutes, 0, 0);
                
                if (scheduledTime > new Date()) { // only create future schedules
                    await pool.request()
                        .input('medicationId', sql.Int, medicationId)
                        .input('scheduledTime', sql.DateTime, scheduledTime)
                        .query(`
                            INSERT INTO MedicationLogs (medicationId, scheduledTime, taken, createdAt)
                            VALUES (@medicationId, @scheduledTime, 0, GETDATE())
                        `);
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // gets schedule times based on frequency
    getScheduleTimes(frequency) {
        switch (frequency) {
            case 'once_daily': return ['08:00'];
            case 'twice_daily': return ['08:00', '20:00'];
            case 'three_times_daily': return ['08:00', '14:00', '20:00'];
            case 'four_times_daily': return ['08:00', '12:00', '16:00', '20:00'];
            case 'as_needed': return ['08:00']; // default time for as-needed
            default: return ['08:00'];
        }
    }

    // updates adherence statistics for a medication
    async updateAdherenceStats(medicationId) {
        console.log(`Adherence stats updated for medication ${medicationId}`);
    }

    // updates medication schedule for future doses
    async updateMedicationSchedule(medicationId, updateData) {
        const pool = await sql.connect();
        
        // remove future logs
        await pool.request()
            .input('medicationId', sql.Int, medicationId)
            .query(`
                DELETE FROM MedicationLogs 
                WHERE medicationId = @medicationId 
                AND scheduledTime > GETDATE() 
                AND taken = 0
            `);
        
        // recreate schedule with new frequency
        if (updateData.frequency) {
            await this.createMedicationSchedule(medicationId, updateData);
        }
    }

    // cancels future medication logs
    async cancelFutureLogs(medicationId) {
        const pool = await sql.connect();
        
        await pool.request()
            .input('medicationId', sql.Int, medicationId)
            .query(`
                DELETE FROM MedicationLogs 
                WHERE medicationId = @medicationId 
                AND scheduledTime > GETDATE() 
                AND taken = 0
            `);
    }
}

module.exports = new MedicationController();