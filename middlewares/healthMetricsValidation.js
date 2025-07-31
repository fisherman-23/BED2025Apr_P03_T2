/**
 * Health Metrics Validation Middleware
 * Validates health tracking and metrics requests
 * Ensures data integrity for health monitoring system
 */

/**
 * Validates health metric recording data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateHealthMetric = (req, res, next) => {
    const { metricType, value, unit, notes, recordedAt } = req.body;
    const errors = [];

    // Metric type validation
    const validMetricTypes = ['blood_pressure', 'weight', 'blood_sugar', 'heart_rate', 'temperature', 'cholesterol', 'bmi'];
    if (!metricType || !validMetricTypes.includes(metricType)) {
        errors.push('Valid metric type is required. Options: ' + validMetricTypes.join(', '));
    }

    // Value validation
    if (value === undefined || value === null) {
        errors.push('Metric value is required');
    } else if (isNaN(parseFloat(value))) {
        errors.push('Metric value must be a valid number');
    } else {
        const numValue = parseFloat(value);
        
        // Specific validation based on metric type
        switch (metricType) {
            case 'blood_pressure':
                // Expecting format like "120/80" or separate systolic value
                if (typeof value === 'string' && value.includes('/')) {
                    const parts = value.split('/');
                    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
                        errors.push('Blood pressure must be in format "120/80"');
                    } else {
                        const systolic = parseInt(parts[0]);
                        const diastolic = parseInt(parts[1]);
                        if (systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) {
                            errors.push('Blood pressure values are out of valid range');
                        }
                    }
                } else if (numValue < 50 || numValue > 300) {
                    errors.push('Blood pressure value is out of valid range (50-300)');
                }
                break;
            case 'weight':
                if (numValue < 20 || numValue > 300) {
                    errors.push('Weight must be between 20 and 300 kg');
                }
                break;
            case 'blood_sugar':
                if (numValue < 20 || numValue > 600) {
                    errors.push('Blood sugar must be between 20 and 600 mg/dL');
                }
                break;
            case 'heart_rate':
                if (numValue < 30 || numValue > 250) {
                    errors.push('Heart rate must be between 30 and 250 bpm');
                }
                break;
            case 'temperature':
                if (numValue < 30 || numValue > 45) {
                    errors.push('Temperature must be between 30 and 45°C');
                }
                break;
            case 'cholesterol':
                if (numValue < 100 || numValue > 500) {
                    errors.push('Cholesterol must be between 100 and 500 mg/dL');
                }
                break;
            case 'bmi':
                if (numValue < 10 || numValue > 60) {
                    errors.push('BMI must be between 10 and 60');
                }
                break;
        }
    }

    // Unit validation
    if (unit && typeof unit !== 'string') {
        errors.push('Unit must be a string');
    } else if (unit && unit.length > 20) {
        errors.push('Unit must not exceed 20 characters');
    }

    // Notes validation
    if (notes && typeof notes !== 'string') {
        errors.push('Notes must be a string');
    } else if (notes && notes.length > 500) {
        errors.push('Notes must not exceed 500 characters');
    }

    // Recorded time validation
    if (recordedAt) {
        const recordedTime = new Date(recordedAt);
        if (isNaN(recordedTime.getTime())) {
            errors.push('Invalid recorded time format');
        } else if (recordedTime > new Date()) {
            errors.push('Recorded time cannot be in the future');
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
 * Validates health metrics retrieval parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateHealthMetricsQuery = (req, res, next) => {
    const { metricType, startDate, endDate, limit } = req.query;
    const errors = [];

    // Metric type validation (optional filter)
    if (metricType) {
        const validMetricTypes = ['blood_pressure', 'weight', 'blood_sugar', 'heart_rate', 'temperature', 'cholesterol', 'bmi'];
        if (!validMetricTypes.includes(metricType)) {
            errors.push('Invalid metric type. Options: ' + validMetricTypes.join(', '));
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

    // Limit validation
    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            errors.push('Limit must be between 1 and 1000');
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
 * Validates adherence report generation parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateAdherenceReportParams = (req, res, next) => {
    const { period, format, includeCharts } = req.query;
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

    // Include charts validation
    if (includeCharts && !['true', 'false'].includes(includeCharts.toLowerCase())) {
        errors.push('Include charts must be true or false');
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
 * Validates health analytics request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateHealthAnalyticsParams = (req, res, next) => {
    const { timeframe, includeComparisons, metricTypes } = req.query;
    const errors = [];

    // Timeframe validation
    if (timeframe) {
        const validTimeframes = ['7days', '30days', '90days', '1year'];
        if (!validTimeframes.includes(timeframe)) {
            errors.push('Timeframe must be one of: ' + validTimeframes.join(', '));
        }
    }

    // Include comparisons validation
    if (includeComparisons && !['true', 'false'].includes(includeComparisons.toLowerCase())) {
        errors.push('Include comparisons must be true or false');
    }

    // Metric types validation (comma-separated list)
    if (metricTypes) {
        const validMetricTypes = ['blood_pressure', 'weight', 'blood_sugar', 'heart_rate', 'temperature', 'cholesterol', 'bmi'];
        const requestedTypes = metricTypes.split(',').map(type => type.trim());
        
        for (const type of requestedTypes) {
            if (!validMetricTypes.includes(type)) {
                errors.push(`Invalid metric type: ${type}. Valid options: ` + validMetricTypes.join(', '));
                break;
            }
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
 * Validates health dashboard request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateHealthDashboardParams = (req, res, next) => {
    const { includeRecentMetrics, includeTrends, daysBack } = req.query;
    const errors = [];

    // Include recent metrics validation
    if (includeRecentMetrics && !['true', 'false'].includes(includeRecentMetrics.toLowerCase())) {
        errors.push('Include recent metrics must be true or false');
    }

    // Include trends validation
    if (includeTrends && !['true', 'false'].includes(includeTrends.toLowerCase())) {
        errors.push('Include trends must be true or false');
    }

    // Days back validation
    if (daysBack) {
        const daysNum = parseInt(daysBack);
        if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
            errors.push('Days back must be between 1 and 365');
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
    validateHealthMetric,
    validateHealthMetricsQuery,
    validateAdherenceReportParams,
    validateHealthAnalyticsParams,
    validateHealthDashboardParams
};