/**
 * Caregiver Validation Middleware
 * Validates caregiver-related requests for monitoring system
 * Ensures proper access control and data validation for caregiver features
 */

/**
 * Validates caregiver relationship creation data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateCaregiverRelationship = (req, res, next) => {
    const { patientEmail, relationship, accessLevel } = req.body;
    const errors = [];

    // Patient email validation
    if (!patientEmail || typeof patientEmail !== 'string') {
        errors.push('Patient email is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientEmail)) {
            errors.push('Invalid email format');
        }
    }

    // Relationship validation
    const validRelationships = ['spouse', 'child', 'parent', 'sibling', 'relative', 'friend', 'neighbor', 'caregiver', 'doctor', 'nurse', 'social_worker'];
    if (!relationship || !validRelationships.includes(relationship)) {
        errors.push('Valid relationship is required. Options: ' + validRelationships.join(', '));
    }

    // Access level validation
    const validAccessLevels = ['monitoring', 'alerts', 'full'];
    if (accessLevel && !validAccessLevels.includes(accessLevel)) {
        errors.push('Valid access level required. Options: ' + validAccessLevels.join(', '));
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
 * Validates patient ID parameter for caregiver access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validatePatientId = (req, res, next) => {
    const { patientId } = req.params;

    if (!patientId || isNaN(parseInt(patientId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid patient ID'
        });
    }

    req.patientId = parseInt(patientId);
    next();
};

/**
 * Validates missed medication alert request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateMissedMedicationAlert = (req, res, next) => {
    const { patientId, medicationId, alertLevel, customMessage } = req.body;
    const errors = [];

    // Patient ID validation
    if (!patientId || isNaN(parseInt(patientId))) {
        errors.push('Valid patient ID is required');
    }

    // Medication ID validation (optional)
    if (medicationId && isNaN(parseInt(medicationId))) {
        errors.push('Medication ID must be a valid number');
    }

    // Alert level validation
    if (alertLevel !== undefined) {
        if (!Number.isInteger(alertLevel) || alertLevel < 1 || alertLevel > 5) {
            errors.push('Alert level must be an integer between 1 and 5 (1 = immediate, 5 = lowest priority)');
        }
    }

    // Custom message validation
    if (customMessage && typeof customMessage !== 'string') {
        errors.push('Custom message must be a string');
    } else if (customMessage && customMessage.length > 500) {
        errors.push('Custom message must not exceed 500 characters');
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
 * Validates caregiver dashboard request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateDashboardRequest = (req, res, next) => {
    const { period, includeDetails } = req.query;
    const errors = [];

    // Period validation
    if (period) {
        const validPeriods = ['daily', 'weekly', 'monthly'];
        if (!validPeriods.includes(period)) {
            errors.push('Period must be one of: ' + validPeriods.join(', '));
        }
    }

    // Include details validation
    if (includeDetails && !['true', 'false'].includes(includeDetails.toLowerCase())) {
        errors.push('Include details must be true or false');
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
 * Validates adherence report request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateAdherenceReportRequest = (req, res, next) => {
    const { period, format, startDate, endDate } = req.query;
    const errors = [];

    // Period validation
    if (period) {
        const validPeriods = ['weekly', 'monthly', 'quarterly'];
        if (!validPeriods.includes(period)) {
            errors.push('Period must be one of: ' + validPeriods.join(', '));
        }
    }

    // Format validation
    if (format) {
        const validFormats = ['json', 'pdf'];
        if (!validFormats.includes(format)) {
            errors.push('Format must be one of: ' + validFormats.join(', '));
        }
    }

    // Date range validation
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

/**
 * Validates relationship update data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateRelationshipUpdate = (req, res, next) => {
    const { relationship, accessLevel } = req.body;
    const errors = [];

    // Check if at least one field is provided
    if (!relationship && !accessLevel) {
        return res.status(400).json({
            status: 'error',
            message: 'At least one field (relationship or accessLevel) must be provided for update'
        });
    }

    // Relationship validation
    if (relationship) {
        const validRelationships = ['spouse', 'child', 'parent', 'sibling', 'relative', 'friend', 'neighbor', 'caregiver', 'doctor', 'nurse', 'social_worker'];
        if (!validRelationships.includes(relationship)) {
            errors.push('Valid relationship is required. Options: ' + validRelationships.join(', '));
        }
    }

    // Access level validation
    if (accessLevel) {
        const validAccessLevels = ['monitoring', 'alerts', 'full'];
        if (!validAccessLevels.includes(accessLevel)) {
            errors.push('Valid access level required. Options: ' + validAccessLevels.join(', '));
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
    validateCaregiverRelationship,
    validatePatientId,
    validateMissedMedicationAlert,
    validateDashboardRequest,
    validateAdherenceReportRequest,
    validateRelationshipUpdate
};