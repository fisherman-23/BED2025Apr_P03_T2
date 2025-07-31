const validateEmergencyContactData = (req, res, next) => {
    const { 
        contactName, 
        relationship, 
        phoneNumber, 
        email, 
        priority, 
        alertDelayHours,
        isActive
    } = req.body;
    
    const errors = [];

    // contact name validation
    if (!contactName || typeof contactName !== 'string' || contactName.trim().length < 2) {
        errors.push('Contact name is required and must be at least 2 characters long');
    } else if (contactName.length > 100) {
        errors.push('Contact name must not exceed 100 characters');
    }

    // relationship validation
    const validRelationships = [
        'spouse', 'child', 'parent', 'sibling', 'relative', 'friend', 
        'neighbor', 'caregiver', 'doctor', 'nurse', 'social_worker'
    ];
    if (!relationship || !validRelationships.includes(relationship)) {
        errors.push('Valid relationship is required. Options: ' + validRelationships.join(', '));
    }

    // phone number validation
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        errors.push('Phone number is required');
    } else {
        // singapore phone number validation (supports +65 format and local format)
        const phoneRegex = /^(\+65)?[689]\d{7}$/;
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        if (!phoneRegex.test(cleanPhone)) {
            errors.push('Invalid Singapore phone number format. Use format: +6591234567 or 91234567');
        }
    }

    // email validation (optional)
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof email !== 'string' || !emailRegex.test(email)) {
            errors.push('Invalid email format');
        } else if (email.length > 255) {
            errors.push('Email must not exceed 255 characters');
        }
    }

    // priority validation
    if (priority !== undefined) {
        if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
            errors.push('Priority must be an integer between 1 and 5 (1 = highest priority)');
        }
    }

    // alert delay validation
    if (alertDelayHours !== undefined) {
        if (!Number.isInteger(alertDelayHours) || alertDelayHours < 0 || alertDelayHours > 72) {
            errors.push('Alert delay must be an integer between 0 and 72 hours');
        }
    }

    // active status validation
    if (isActive !== undefined && typeof isActive !== 'boolean') {
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

/**
 * Validates contact ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateContactId = (req, res, next) => {
    const { contactId } = req.params;

    if (!contactId || isNaN(parseInt(contactId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid contact ID'
        });
    }

    next();
};

/**
 * Validates emergency contact update data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateEmergencyContactUpdate = (req, res, next) => {
    const updateData = req.body;
    const errors = [];

    // check if at least one field is provided for update
    const allowedFields = ['contactName', 'relationship', 'phoneNumber', 'email', 'priority', 'alertDelayHours', 'isActive'];
    const providedFields = Object.keys(updateData).filter(field => allowedFields.includes(field));
    
    if (providedFields.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'At least one field must be provided for update',
            allowedFields
        });
    }

    // validate provided fields
    if (updateData.contactName) {
        if (typeof updateData.contactName !== 'string' || updateData.contactName.trim().length < 2) {
            errors.push('Contact name must be at least 2 characters long');
        } else if (updateData.contactName.length > 100) {
            errors.push('Contact name must not exceed 100 characters');
        }
    }

    if (updateData.relationship) {
        const validRelationships = [
            'spouse', 'child', 'parent', 'sibling', 'relative', 'friend', 
            'neighbor', 'caregiver', 'doctor', 'nurse', 'social_worker'
        ];
        if (!validRelationships.includes(updateData.relationship)) {
            errors.push('Valid relationship is required. Options: ' + validRelationships.join(', '));
        }
    }

    if (updateData.phoneNumber) {
        const phoneRegex = /^(\+65)?[689]\d{7}$/;
        const cleanPhone = updateData.phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        if (!phoneRegex.test(cleanPhone)) {
            errors.push('Invalid Singapore phone number format. Use format: +6591234567 or 91234567');
        }
    }

    if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof updateData.email !== 'string' || !emailRegex.test(updateData.email)) {
            errors.push('Invalid email format');
        } else if (updateData.email.length > 255) {
            errors.push('Email must not exceed 255 characters');
        }
    }

    if (updateData.priority !== undefined) {
        if (!Number.isInteger(updateData.priority) || updateData.priority < 1 || updateData.priority > 5) {
            errors.push('Priority must be an integer between 1 and 5');
        }
    }

    if (updateData.alertDelayHours !== undefined) {
        if (!Number.isInteger(updateData.alertDelayHours) || updateData.alertDelayHours < 0 || updateData.alertDelayHours > 72) {
            errors.push('Alert delay must be an integer between 0 and 72 hours');
        }
    }

    if (updateData.isActive !== undefined && typeof updateData.isActive !== 'boolean') {
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

/**
 * Validates emergency alert trigger data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateEmergencyAlert = (req, res, next) => {
    const { medicationId, alertLevel, customMessage } = req.body;
    const errors = [];

    // medication ID validation
    if (!medicationId || isNaN(parseInt(medicationId))) {
        errors.push('Valid medication ID is required');
    }

    // alert level validation
    if (alertLevel !== undefined) {
        if (!Number.isInteger(alertLevel) || alertLevel < 1 || alertLevel > 5) {
            errors.push('Alert level must be an integer between 1 and 5 (1 = immediate, 5 = lowest priority)');
        }
    }

    // custom message validation
    if (customMessage) {
        if (typeof customMessage !== 'string') {
            errors.push('Custom message must be a string');
        } else if (customMessage.length > 500) {
            errors.push('Custom message must not exceed 500 characters');
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
 * Validates alert history request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateAlertHistoryRequest = (req, res, next) => {
    const { limit, startDate, endDate, alertType, status } = req.query;
    const errors = [];

    // limit validation
    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            errors.push('Limit must be an integer between 1 and 1000');
        }
    }

    // date range validation
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

    // alert type validation
    if (alertType) {
        const validAlertTypes = ['medication_missed', 'emergency', 'health_concern', 'system_alert'];
        if (!validAlertTypes.includes(alertType)) {
            errors.push('Invalid alert type. Options: ' + validAlertTypes.join(', '));
        }
    }

    // status validation
    if (status) {
        const validStatuses = ['sent', 'delivered', 'failed', 'acknowledged'];
        if (!validStatuses.includes(status)) {
            errors.push('Invalid status. Options: ' + validStatuses.join(', '));
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
    validateEmergencyContactData,
    validateContactId,
    validateEmergencyContactUpdate,
    validateEmergencyAlert,
    validateAlertHistoryRequest
};