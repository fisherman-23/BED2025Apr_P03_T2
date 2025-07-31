/**
 * Medication Validation Middleware
 * Validates medication-related requests with comprehensive error handling
 * Ensures data integrity for medication management system
 */

/**
 * Validates medication data for creation and updates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
const validateMedicationData = (req, res, next) => {
    const { medicationName, dosage, frequency, timing, prescribedBy, startDate, endDate, category } = req.body;
    const errors = [];

    // Medication name validation
    if (!medicationName || typeof medicationName !== 'string' || medicationName.trim().length === 0) {
        errors.push('Medication name is required and must be a valid string');
    } else if (medicationName.length > 255) {
        errors.push('Medication name must not exceed 255 characters');
    }

    // Dosage validation
    if (!dosage || typeof dosage !== 'string' || dosage.trim().length === 0) {
        errors.push('Dosage is required and must be a valid string');
    } else if (dosage.length > 100) {
        errors.push('Dosage must not exceed 100 characters');
    }

    // Frequency validation
    const validFrequencies = ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed'];
    if (!frequency || !validFrequencies.includes(frequency)) {
        errors.push('Valid frequency is required. Options: ' + validFrequencies.join(', '));
    }

    // Timing validation
    if (!timing || typeof timing !== 'string') {
        errors.push('Timing is required and must be a valid time string');
    } else {
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timing)) {
            errors.push('Timing must be in HH:MM format (e.g., 08:30)');
        }
    }

    // Prescribing doctor validation
    if (!prescribedBy || typeof prescribedBy !== 'string' || prescribedBy.trim().length === 0) {
        errors.push('Prescribing doctor is required');
    } else if (prescribedBy.length > 255) {
        errors.push('Prescribing doctor name must not exceed 255 characters');
    }

    // Date validations
    if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            errors.push('Invalid start date format');
        }
    }

    if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
            errors.push('Invalid end date format');
        }
        
        if (startDate && !isNaN(new Date(startDate).getTime())) {
            if (new Date(endDate) <= new Date(startDate)) {
                errors.push('End date must be after start date');
            }
        }
    }

    // Category validation (optional)
    if (category && typeof category !== 'string') {
        errors.push('Category must be a string');
    } else if (category && category.length > 100) {
        errors.push('Category must not exceed 100 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
    }

    next();
};

/**
 * Validates medication ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateMedicationId = (req, res, next) => {
    const { medicationId } = req.params;

    if (!medicationId || isNaN(parseInt(medicationId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid medication ID'
        });
    }

    req.medicationId = parseInt(medicationId);
    next();
};

/**
 * Validates medication update data (allows partial updates)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateMedicationUpdate = (req, res, next) => {
    const updateData = req.body;
    const errors = [];

    // Check if at least one field is provided for update
    const allowedFields = ['medicationName', 'dosage', 'frequency', 'timing', 'startDate', 'endDate', 'instructions', 'prescribedBy', 'category', 'active'];
    const providedFields = Object.keys(updateData).filter(field => allowedFields.includes(field));
    
    if (providedFields.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'At least one field must be provided for update',
            allowedFields
        });
    }

    // Validate each provided field
    if (updateData.medicationName !== undefined) {
        if (!updateData.medicationName || typeof updateData.medicationName !== 'string' || updateData.medicationName.trim().length === 0) {
            errors.push('Medication name must be a valid string');
        } else if (updateData.medicationName.length > 255) {
            errors.push('Medication name must not exceed 255 characters');
        }
    }

    if (updateData.dosage !== undefined) {
        if (!updateData.dosage || typeof updateData.dosage !== 'string' || updateData.dosage.trim().length === 0) {
            errors.push('Dosage must be a valid string');
        } else if (updateData.dosage.length > 100) {
            errors.push('Dosage must not exceed 100 characters');
        }
    }

    if (updateData.frequency !== undefined) {
        const validFrequencies = ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed'];
        if (!validFrequencies.includes(updateData.frequency)) {
            errors.push('Valid frequency is required. Options: ' + validFrequencies.join(', '));
        }
    }

    if (updateData.timing !== undefined) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!updateData.timing || !timeRegex.test(updateData.timing)) {
            errors.push('Timing must be in HH:MM format');
        }
    }

    if (updateData.prescribedBy !== undefined) {
        if (!updateData.prescribedBy || typeof updateData.prescribedBy !== 'string' || updateData.prescribedBy.trim().length === 0) {
            errors.push('Prescribing doctor is required');
        } else if (updateData.prescribedBy.length > 255) {
            errors.push('Prescribing doctor name must not exceed 255 characters');
        }
    }

    // Date validations
    if (updateData.startDate !== undefined) {
        const start = new Date(updateData.startDate);
        if (isNaN(start.getTime())) {
            errors.push('Invalid start date format');
        }
    }

    if (updateData.endDate !== undefined) {
        const end = new Date(updateData.endDate);
        if (isNaN(end.getTime())) {
            errors.push('Invalid end date format');
        }
    }

    if (updateData.active !== undefined) {
        if (typeof updateData.active !== 'boolean') {
            errors.push('Active status must be a boolean value');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
    }

    next();
};

/**
 * Validates mark as taken request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateMarkAsTaken = (req, res, next) => {
    const { takenAt, notes } = req.body;
    const errors = [];

    // Validate taken time (optional, defaults to current time)
    if (takenAt) {
        const takenTime = new Date(takenAt);
        if (isNaN(takenTime.getTime())) {
            errors.push('Invalid taken time format');
        } else if (takenTime > new Date()) {
            errors.push('Taken time cannot be in the future');
        }
    }

    // Validate notes (optional)
    if (notes && typeof notes !== 'string') {
        errors.push('Notes must be a string');
    } else if (notes && notes.length > 500) {
        errors.push('Notes must not exceed 500 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
    }

    next();
};

/**
 * Validates reminder request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateReminderRequest = (req, res, next) => {
    const { hours, limit } = req.query;
    const errors = [];

    // Validate hours parameter
    if (hours) {
        const hoursNum = parseInt(hours);
        if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) { // Max 1 week
            errors.push('Hours must be between 1 and 168 (1 week)');
        }
    }

    // Validate limit parameter
    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            errors.push('Limit must be between 1 and 100');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
    }

    next();
};

/**
 * Validates analytics request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateAnalyticsRequest = (req, res, next) => {
    const { period, startDate, endDate, medicationId } = req.query;
    const errors = [];

    // Validate period parameter
    if (period) {
        const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!validPeriods.includes(period)) {
            errors.push('Period must be one of: ' + validPeriods.join(', '));
        }
    }

    // Validate date range if provided
    if (startDate || endDate) {
        if (startDate && isNaN(new Date(startDate).getTime())) {
            errors.push('Invalid start date format');
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
            errors.push('Invalid end date format');
        }
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            errors.push('Start date must be before end date');
        }
    }

    // Validate medication ID if provided
    if (medicationId && isNaN(parseInt(medicationId))) {
        errors.push('Medication ID must be a valid number');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
    }

    next();
};

module.exports = {
    validateMedicationData,
    validateMedicationId,
    validateMedicationUpdate,
    validateMarkAsTaken,
    validateReminderRequest,
    validateAnalyticsRequest
};