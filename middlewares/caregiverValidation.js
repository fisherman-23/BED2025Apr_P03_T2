const validateCaregiverRelationship = (req, res, next) => {
    const { patientEmail, relationship, accessLevel } = req.body;
    const errors = [];

    // patient email validation
    if (!patientEmail || typeof patientEmail !== 'string') {
        errors.push('Patient email is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientEmail)) {
            errors.push('Valid patient email address is required');
        }
    }

    // relationship validation
    const validRelationships = ['spouse', 'child', 'parent', 'sibling', 'relative', 'friend', 'caregiver', 'guardian', 'healthcare_provider'];
    if (!relationship || !validRelationships.includes(relationship)) {
        errors.push('Valid relationship type is required. Options: ' + validRelationships.join(', '));
    }

    // access level validation
    const validAccessLevels = ['monitoring', 'alerts', 'full'];
    if (accessLevel && !validAccessLevels.includes(accessLevel)) {
        errors.push('Invalid access level. Options: ' + validAccessLevels.join(', '));
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

const validatePatientId = (req, res, next) => {
    const { patientId } = req.params;

    if (!patientId || isNaN(parseInt(patientId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid patient ID'
        });
    }

    next();
};

const validateCaregiverDashboardRequest = (req, res, next) => {
    const { period, includeDetails } = req.query;
    const errors = [];

    // validate period if provided
    if (period) {
        const validPeriods = ['daily', 'weekly', 'monthly'];
        if (!validPeriods.includes(period)) {
            errors.push('Invalid period. Options: ' + validPeriods.join(', '));
        }
    }

    // validate includeDetails if provided
    if (includeDetails && !['true', 'false'].includes(includeDetails)) {
        errors.push('includeDetails must be true or false');
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

const validateAdherenceReportRequest = (req, res, next) => {
    const { period, format, startDate, endDate } = req.query;
    const errors = [];

    // validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly'];
    if (period && !validPeriods.includes(period)) {
        errors.push('Invalid period. Options: ' + validPeriods.join(', '));
    }

    // validate format
    const validFormats = ['json', 'pdf'];
    if (format && !validFormats.includes(format)) {
        errors.push('Invalid format. Options: ' + validFormats.join(', '));
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

const validateMissedMedicationAlert = (req, res, next) => {
    const { patientId, medicationId, alertLevel, customMessage } = req.body;
    const errors = [];

    // patient ID validation
    if (!patientId || isNaN(parseInt(patientId))) {
        errors.push('Valid patient ID is required');
    }

    // medication ID validation (optional for general alerts)
    if (medicationId && isNaN(parseInt(medicationId))) {
        errors.push('Invalid medication ID format');
    }

    // alert level validation
    if (alertLevel !== undefined) {
        if (!Number.isInteger(alertLevel) || alertLevel < 1 || alertLevel > 5) {
            errors.push('Alert level must be an integer between 1 and 5');
        }
    }

    // custom message validation
    if (customMessage && (typeof customMessage !== 'string' || customMessage.length > 500)) {
        errors.push('Custom message must be a string with maximum 500 characters');
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

const validateCaregiverPreferences = (req, res, next) => {
    const { 
        emailNotifications, 
        smsNotifications, 
        alertThreshold, 
        quietHours,
        preferredLanguage,
        timezone
    } = req.body;
    const errors = [];

    // notifications validation
    if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
        errors.push('Email notifications setting must be boolean');
    }

    if (smsNotifications !== undefined && typeof smsNotifications !== 'boolean') {
        errors.push('SMS notifications setting must be boolean');
    }

    // alert threshold validation
    if (alertThreshold !== undefined) {
        if (!Number.isInteger(alertThreshold) || alertThreshold < 0 || alertThreshold > 24) {
            errors.push('Alert threshold must be an integer between 0 and 24 hours');
        }
    }

    // quiet hours validation
    if (quietHours) {
        if (typeof quietHours !== 'object' || !quietHours.start || !quietHours.end) {
            errors.push('Quiet hours must include start and end times');
        } else {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(quietHours.start) || !timeRegex.test(quietHours.end)) {
                errors.push('Quiet hours must be in HH:MM format');
            }
        }
    }

    // preferred language validation
    if (preferredLanguage) {
        const validLanguages = ['en', 'zh', 'ms', 'ta'];
        if (!validLanguages.includes(preferredLanguage)) {
            errors.push('Invalid language. Options: ' + validLanguages.join(', '));
        }
    }

    // timezone validation
    if (timezone && typeof timezone !== 'string') {
        errors.push('Timezone must be a valid string');
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

const validateAlertResponse = (req, res, next) => {
    const { alertId } = req.params;
    const { response, notes } = req.body;

    const errors = [];

    // alert ID validation
    if (!alertId || isNaN(parseInt(alertId))) {
        errors.push('Invalid alert ID');
    }

    // response validation
    const validResponses = ['acknowledged', 'resolved', 'escalated', 'false_alarm'];
    if (!response || !validResponses.includes(response)) {
        errors.push('Valid response is required. Options: ' + validResponses.join(', '));
    }

    // notes validation (optional)
    if (notes && (typeof notes !== 'string' || notes.length > 1000)) {
        errors.push('Notes must be a string with maximum 1000 characters');
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

const validateCaregiverPermissions = (accessLevel) => {
    return (req, res, next) => {
        const requiredLevels = {
            'monitoring': ['monitoring', 'alerts', 'full'],
            'alerts': ['alerts', 'full'],
            'full': ['full']
        };
        next();
    };
};

module.exports = {
    validateCaregiverRelationship,
    validatePatientId,
    validateCaregiverDashboardRequest,
    validateAdherenceReportRequest,
    validateMissedMedicationAlert,
    validateCaregiverPreferences,
    validateAlertResponse,
    validateCaregiverPermissions
};