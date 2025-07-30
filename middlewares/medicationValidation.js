const validateMedicationData = (req, res, next) => {
    const { name, dosage, frequency, timing, startDate } = req.body;
    const errors = [];

    // medication name validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Medication name is required and must be at least 2 characters long');
    }

    // dosage validation
    if (!dosage || typeof dosage !== 'string' || dosage.trim().length < 1) {
        errors.push('Dosage is required (e.g., "10mg", "1 tablet")');
    }

    // frequency validation
    const validFrequencies = ['once daily', 'twice daily', 'three times daily', 'four times daily', 'every 2 hours', 'every 4 hours', 'every 6 hours', 'every 8 hours', 'every 12 hours', 'as needed', 'weekly', 'monthly'];
    if (!frequency || !validFrequencies.some(f => f.toLowerCase() === frequency.toLowerCase())) {
        errors.push('Invalid frequency. Must be one of: ' + validFrequencies.join(', '));
    }

    // timing validation (should be in HH:MM format or multiple times separated by commas)
    if (!timing || typeof timing !== 'string') {
        errors.push('Timing is required (e.g., "08:00" or "08:00,20:00")');
    } else {
        const times = timing.split(',');
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        for (let time of times) {
            if (!timeRegex.test(time.trim())) {
                errors.push('Invalid time format. Use HH:MM format (e.g., "08:00")');
                break;
            }
        }
    }

    // start date validation
    if (!startDate) {
        errors.push('Start date is required');
    } else {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            errors.push('Invalid start date format');
        }
    }

    // end date validation (optional but if provided must be valid)
    if (req.body.endDate) {
        const end = new Date(req.body.endDate);
        const start = new Date(startDate);
        if (isNaN(end.getTime())) {
            errors.push('Invalid end date format');
        } else if (end <= start) {
            errors.push('End date must be after start date');
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

const validateMedicationId = (req, res, next) => {
    const { medicationId } = req.params;
    
    if (!medicationId || isNaN(parseInt(medicationId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid medication ID'
        });
    }

    next();
};

const validateMedicationUpdate = (req, res, next) => {
    const updateData = req.body;
    const errors = [];

    // check if at least one field is provided for update
    const allowedFields = ['name', 'dosage', 'frequency', 'timing', 'instructions', 'prescribedBy', 'active', 'endDate'];
    const providedFields = Object.keys(updateData).filter(field => allowedFields.includes(field));
    
    if (providedFields.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'At least one field must be provided for update',
            allowedFields
        });
    }

    // validate provided fields
    if (updateData.name && (typeof updateData.name !== 'string' || updateData.name.trim().length < 2)) {
        errors.push('Medication name must be at least 2 characters long');
    }

    if (updateData.dosage && (typeof updateData.dosage !== 'string' || updateData.dosage.trim().length < 1)) {
        errors.push('Dosage cannot be empty');
    }

    if (updateData.frequency) {
        const validFrequencies = ['once daily', 'twice daily', 'three times daily', 'four times daily', 'every 2 hours', 'every 4 hours', 'every 6 hours', 'every 8 hours', 'every 12 hours', 'as needed', 'weekly', 'monthly'];
        if (!validFrequencies.some(f => f.toLowerCase() === updateData.frequency.toLowerCase())) {
            errors.push('Invalid frequency. Must be one of: ' + validFrequencies.join(', '));
        }
    }

    if (updateData.timing) {
        const times = updateData.timing.split(',');
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        for (let time of times) {
            if (!timeRegex.test(time.trim())) {
                errors.push('Invalid time format. Use HH:MM format (e.g., "08:00")');
                break;
            }
        }
    }

    if (updateData.endDate) {
        const end = new Date(updateData.endDate);
        if (isNaN(end.getTime())) {
            errors.push('Invalid end date format');
        }
    }

    if (updateData.active !== undefined && typeof updateData.active !== 'boolean') {
        errors.push('Active status must be boolean (true/false)');
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

const validateMarkAsTaken = (req, res, next) => {
    const { logId } = req.params;
    const { notes } = req.body;

    if (!logId || isNaN(parseInt(logId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid medication log ID'
        });
    }

    // notes are optional but if provided should be reasonable length
    if (notes && (typeof notes !== 'string' || notes.length > 500)) {
        return res.status(400).json({
            status: 'error',
            message: 'Notes must be a string with maximum 500 characters'
        });
    }

    next();
};

const validateReminderRequest = (req, res, next) => {
    const { medicationId, reminderTime } = req.body;
    const errors = [];

    if (!medicationId || isNaN(parseInt(medicationId))) {
        errors.push('Valid medication ID is required');
    }

    if (reminderTime) {
        const reminderDate = new Date(reminderTime);
        if (isNaN(reminderDate.getTime())) {
            errors.push('Invalid reminder time format');
        } else if (reminderDate <= new Date()) {
            errors.push('Reminder time must be in the future');
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

const validateAnalyticsRequest = (req, res, next) => {
    const { period, startDate, endDate } = req.query;
    const errors = [];

    // validate period if provided
    if (period) {
        const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
        if (!validPeriods.includes(period)) {
            errors.push('Invalid period. Must be one of: ' + validPeriods.join(', '));
        }
    }

    // validate date range if provided
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