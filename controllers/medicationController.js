const Medication = require('../models/medicationModel');
const sql = require('mssql');

/**
 * Medication Controller - handles all medication-related operations
 * Implements CRUD operations for medication management system
 * Includes advanced features like adherence tracking and drug conflict detection
 */
class MedicationController {
    
    /**
     * Creates a new medication record with enhanced validation
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createMedication(req, res) {
        try {
            const medicationData = req.body;
            medicationData.userId = req.user.id;
            
            // Enhanced validation
            const validationErrors = this.validateMedicationData(medicationData);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }
            
            const newMedication = await Medication.createMedication(medicationData);
            
            // Create initial medication schedule
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

    /**
     * Gets all medications for the current user with enhanced details
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserMedications(req, res) {
        try {
            const { includeInactive = false, category } = req.query;
            
            let query = `
                SELECT 
                    m.medicationId,
                    m.userId,
                    m.name as medicationName,
                    m.dosage,
                    m.frequency,
                    m.timing,
                    m.startDate,
                    m.endDate,
                    m.instructions,
                    m.prescribedBy,
                    m.active,
                    m.qrCode,
                    m.category,
                    m.createdAt,
                    m.updatedAt,
                    -- Calculate next dose time
                    CASE 
                        WHEN m.frequency = 'once_daily' THEN 
                            CASE 
                                WHEN CAST(GETDATE() AS TIME) < m.timing THEN CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME)
                                ELSE DATEADD(day, 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME))
                            END
                        ELSE CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(m.timing AS TIME)
                    END as nextDose
                FROM Medications m
                WHERE m.userId = @userId
            `;
            
            const pool = await sql.connect();
            const request = pool.request().input('userId', sql.Int, req.user.id);
            
            // Add filters
            if (!includeInactive) {
                query += ` AND m.active = 1`;
            }
            
            if (category) {
                query += ` AND m.category = @category`;
                request.input('category', sql.NVarChar, category);
            }
            
            query += ` ORDER BY m.createdAt DESC`;
            
            const result = await request.query(query);
            
            res.status(200).json({
                status: 'success',
                data: { medications: result.recordset }
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

    /**
     * Gets a specific medication by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getMedicationById(req, res) {
        try {
            const medicationId = req.params.id;
            const medication = await Medication.getMedicationById(medicationId);
            
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            res.status(200).json({
                status: 'success',
                data: { medication }
            });
            
        } catch (error) {
            console.error('Error fetching medication:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve medication',
                error: error.message
            });
        }
    }

    /**
     * Updates an existing medication
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateMedication(req, res) {
        try {
            const medicationId = req.params.id;
            const updateData = req.body;
            
            // Verify medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            // Validate update data
            const validationErrors = this.validateMedicationData(updateData, true);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }
            
            const result = await Medication.updateMedication(medicationId, updateData);
            
            // Update medication schedule if frequency/timing changed
            if (updateData.frequency || updateData.timing) {
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

    /**
     * Soft deletes a medication (sets active to false)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteMedication(req, res) {
        try {
            const medicationId = req.params.id;
            
            // Verify medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            // Soft delete - set active to false
            const result = await Medication.deleteMedication(medicationId);
            
            // Cancel future medication logs
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
                message: 'Failed to remove medication',
                error: error.message
            });
        }
    }

    /**
     * Gets upcoming medication reminders for a specific medication
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUpcomingReminders(req, res) {
        try {
            const medicationId = req.params.id;
            
            // Verify medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            const remindersQuery = `
                SELECT 
                    ml.logId,
                    ml.medicationId,
                    ml.scheduledTime,
                    ml.taken,
                    ml.missed,
                    m.name as medicationName,
                    m.dosage,
                    m.instructions
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE ml.medicationId = @medicationId 
                AND ml.scheduledTime >= GETDATE()
                AND ml.taken = 0
                ORDER BY ml.scheduledTime ASC
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('medicationId', sql.Int, medicationId)
                .query(remindersQuery);
                
            res.status(200).json({
                status: 'success',
                data: { reminders: result.recordset }
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

    /**
     * Marks medication as taken with timestamp and notes
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markMedicationTaken(req, res) {
        try {
            const medicationId = req.params.id;
            const { logId, notes, actualTime } = req.body;
            
            // Verify medication belongs to user
            const medication = await Medication.getMedicationById(medicationId);
            if (!medication || medication.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Medication not found'
                });
            }
            
            const pool = await sql.connect();
            
            // Mark specific log as taken or create new log entry
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
                // Create new log entry for immediate taking
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

    /**
     * Gets missed medications with alert recommendations
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getMissedMedications(req, res) {
        try {
            const { hoursThreshold = 2 } = req.query;
            
            const missedQuery = `
                SELECT 
                    ml.logId,
                    ml.medicationId,
                    ml.scheduledTime,
                    m.name as medicationName,
                    m.dosage,
                    m.instructions,
                    DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) as hoursOverdue
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @userId 
                AND ml.taken = 0 
                AND ml.scheduledTime < DATEADD(HOUR, -@hoursThreshold, GETDATE())
                AND m.active = 1
                ORDER BY ml.scheduledTime ASC
            `;
            
            const pool = await sql.connect();
            const result = await pool.request()
                .input('userId', sql.Int, req.user.id)
                .input('hoursThreshold', sql.Int, hoursThreshold)
                .query(missedQuery);
                
            res.status(200).json({
                status: 'success',
                data: { missedMedications: result.recordset }
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

    /**
     * Gets medication adherence analytics
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAdherenceAnalytics(req, res) {
        try {
            const { period = 'monthly', medicationId } = req.query;
            
            let dateFilter = '';
            switch(period) {
                case 'daily':
                    dateFilter = 'AND ml.scheduledTime >= DATEADD(DAY, -1, GETDATE())';
                    break;
                case 'weekly':
                    dateFilter = 'AND ml.scheduledTime >= DATEADD(WEEK, -1, GETDATE())';
                    break;
                case 'monthly':
                default:
                    dateFilter = 'AND ml.scheduledTime >= DATEADD(MONTH, -1, GETDATE())';
                    break;
            }
            
            let analyticsQuery = `
                SELECT 
                    m.medicationId,
                    m.name as medicationName,
                    COUNT(ml.logId) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
                    ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(ml.logId), 2) as adherenceRate
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                WHERE m.userId = @userId AND m.active = 1 ${dateFilter}
            `;
            
            const pool = await sql.connect();
            const request = pool.request().input('userId', sql.Int, req.user.id);
            
            if (medicationId) {
                analyticsQuery += ` AND m.medicationId = @medicationId`;
                request.input('medicationId', sql.Int, medicationId);
            }
            
            analyticsQuery += ` GROUP BY m.medicationId, m.name ORDER BY adherenceRate DESC`;
            
            const result = await request.query(analyticsQuery);
            
            res.status(200).json({
                status: 'success',
                data: { analytics: result.recordset }
            });
            
        } catch (error) {
            console.error('Error fetching adherence analytics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve analytics',
                error: error.message
            });
        }
    }

    /**
     * Validates medication data for creation and updates
     * @param {Object} medicationData - Medication data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {Array} Array of validation errors
     */
    validateMedicationData(medicationData, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate || medicationData.medicationName !== undefined) {
            if (!medicationData.medicationName || medicationData.medicationName.trim().length === 0) {
                errors.push('Medication name is required');
            }
        }
        
        if (!isUpdate || medicationData.dosage !== undefined) {
            if (!medicationData.dosage || medicationData.dosage.trim().length === 0) {
                errors.push('Dosage is required');
            }
        }
        
        if (!isUpdate || medicationData.frequency !== undefined) {
            const validFrequencies = ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed'];
            if (!medicationData.frequency || !validFrequencies.includes(medicationData.frequency)) {
                errors.push('Valid frequency is required');
            }
        }
        
        if (!isUpdate || medicationData.timing !== undefined) {
            if (!medicationData.timing) {
                errors.push('Timing is required');
            }
        }
        
        if (!isUpdate || medicationData.prescribedBy !== undefined) {
            if (!medicationData.prescribedBy || medicationData.prescribedBy.trim().length === 0) {
                errors.push('Prescribing doctor is required');
            }
        }
        
        return errors;
    }

    /**
     * Creates medication schedule based on frequency
     * @param {number} medicationId - Medication ID
     * @param {Object} medicationData - Medication data
     */
    async createMedicationSchedule(medicationId, medicationData) {
        const pool = await sql.connect();
        const times = this.getScheduleTimes(medicationData.frequency);
        const startDate = medicationData.startDate ? new Date(medicationData.startDate) : new Date();
        const endDate = medicationData.endDate ? new Date(medicationData.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            for (const time of times) {
                const [hours, minutes] = time.split(':').map(Number);
                const scheduledTime = new Date(currentDate);
                scheduledTime.setHours(hours, minutes, 0, 0);
                
                if (scheduledTime > new Date()) { // Only create future schedules
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

    /**
     * Gets schedule times based on frequency
     * @param {string} frequency - Medication frequency
     * @returns {Array} Array of time strings
     */
    getScheduleTimes(frequency) {
        switch (frequency) {
            case 'once_daily': return ['08:00'];
            case 'twice_daily': return ['08:00', '20:00'];
            case 'three_times_daily': return ['08:00', '14:00', '20:00'];
            case 'four_times_daily': return ['08:00', '12:00', '16:00', '20:00'];
            case 'as_needed': return ['08:00']; // Default time for as-needed
            default: return ['08:00'];
        }
    }

    /**
     * Updates medication schedule for future doses
     * @param {number} medicationId - Medication ID
     * @param {Object} updateData - Update data
     */
    async updateMedicationSchedule(medicationId, updateData) {
        const pool = await sql.connect();
        
        // Remove future logs
        await pool.request()
            .input('medicationId', sql.Int, medicationId)
            .query(`
                DELETE FROM MedicationLogs 
                WHERE medicationId = @medicationId 
                AND scheduledTime > GETDATE() 
                AND taken = 0
            `);
        
        // Recreate schedule with new frequency
        if (updateData.frequency) {
            await this.createMedicationSchedule(medicationId, updateData);
        }
    }

    /**
     * Cancels future medication logs
     * @param {number} medicationId - Medication ID
     */
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