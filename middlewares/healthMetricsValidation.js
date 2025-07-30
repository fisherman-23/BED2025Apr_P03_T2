const validateHealthMetricData = (req, res, next) => {
    const { 
        metricType, 
        value, 
        unit, 
        notes, 
        recordedAt,
        systolic,
        diastolic
    } = req.body;
    
    const errors = [];

    // metric type validation
    const validMetricTypes = [
        'blood_pressure', 'weight', 'blood_sugar', 'heart_rate', 
        'temperature', 'oxygen_saturation', 'steps', 'sleep_hours',
        'pain_level', 'mood_score', 'medication_adherence'
    ];
    
    if (!metricType || !validMetricTypes.includes(metricType)) {
        errors.push('Valid metric type is required. Options: ' + validMetricTypes.join(', '));
    }

    // value validation based on metric type
    if (value === undefined || value === null) {
        if (metricType !== 'blood_pressure') { // blood pressure uses systolic/diastolic
            errors.push('Value is required for this metric type');
        }
    } else {
        if (typeof value !== 'number' || isNaN(value)) {
            errors.push('Value must be a valid number');
        } else {
            // validate value ranges based on metric type
            switch (metricType) {
                case 'weight':
                    if (value < 20 || value > 300) {
                        errors.push('Weight must be between 20 and 300 kg');
                    }
                    break;
                case 'blood_sugar':
                    if (value < 2 || value > 30) {
                        errors.push('Blood sugar must be between 2 and 30 mmol/L');
                    }
                    break;
                case 'heart_rate':
                    if (value < 30 || value > 220) {
                        errors.push('Heart rate must be between 30 and 220 bpm');
                    }
                    break;
                case 'temperature':
                    if (value < 35 || value > 42) {
                        errors.push('Temperature must be between 35 and 42 degrees Celsius');
                    }
                    break;
                case 'oxygen_saturation':
                    if (value < 70 || value > 100) {
                        errors.push('Oxygen saturation must be between 70 and 100%');
                    }
                    break;
                case 'steps':
                    if (value < 0 || value > 100000) {
                        errors.push('Steps must be between 0 and 100,000');
                    }
                    break;
                case 'sleep_hours':
                    if (value < 0 || value > 24) {
                        errors.push('Sleep hours must be between 0 and 24');
                    }
                    break;
                case 'pain_level':
                    if (value < 0 || value > 10) {
                        errors.push('Pain level must be between 0 and 10');
                    }
                    break;
                case 'mood_score':
                    if (value < 1 || value > 10) {
                        errors.push('Mood score must be between 1 and 10');
                    }
                    break;
                case 'medication_adherence':
                    if (value < 0 || value > 100) {
                        errors.push('Medication adherence must be between 0 and 100%');
                    }
                    break;
            }
        }
    }

    // blood pressure specific validation
    if (metricType === 'blood_pressure') {
        if (!systolic || !diastolic) {
            errors.push('Both systolic and diastolic values are required for blood pressure');
        } else {
            if (typeof systolic !== 'number' || typeof diastolic !== 'number') {
                errors.push('Systolic and diastolic values must be numbers');
            } else {
                if (systolic < 70 || systolic > 250) {
                    errors.push('Systolic pressure must be between 70 and 250 mmHg');
                }
                if (diastolic < 40 || diastolic > 150) {
                    errors.push('Diastolic pressure must be between 40 and 150 mmHg');
                }
                if (systolic <= diastolic) {
                    errors.push('Systolic pressure must be higher than diastolic pressure');
                }
            }
        }
    }

    // unit validation
    if (unit && typeof unit !== 'string') {
        errors.push('Unit must be a string');
    }

    // notes validation
    if (notes) {
        if (typeof notes !== 'string') {
            errors.push('Notes must be a string');
        } else if (notes.length > 1000) {
            errors.push('Notes must not exceed 1000 characters');
        }
    }

    // recorded time validation
    if (recordedAt) {
        const recordedDate = new Date(recordedAt);
        if (isNaN(recordedDate.getTime())) {
            errors.push('Invalid recorded time format');
        } else {
            // check if recorded time is not in the future
            if (recordedDate > new Date()) {
                errors.push('Recorded time cannot be in the future');
            }
            // check if recorded time is not too far in the past (1 year)
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            if (recordedDate < oneYearAgo) {
                errors.push('Recorded time cannot be more than 1 year ago');
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

const validateHealthMetricsQuery = (req, res, next) => {
    const { 
        metricType, 
        startDate, 
        endDate, 
        limit, 
        sortBy, 
        sortOrder 
    } = req.query;
    
    const errors = [];

    // metric type validation
    if (metricType) {
        const validMetricTypes = [
            'blood_pressure', 'weight', 'blood_sugar', 'heart_rate', 
            'temperature', 'oxygen_saturation', 'steps', 'sleep_hours',
            'pain_level', 'mood_score', 'medication_adherence'
        ];
        if (!validMetricTypes.includes(metricType)) {
            errors.push('Invalid metric type. Options: ' + validMetricTypes.join(', '));
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

    // limit validation
    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            errors.push('Limit must be an integer between 1 and 1000');
        }
    }

    // sort validation
    if (sortBy) {
        const validSortFields = ['recordedAt', 'metricType', 'value', 'createdAt'];
        if (!validSortFields.includes(sortBy)) {
            errors.push('Invalid sort field. Options: ' + validSortFields.join(', '));
        }
    }

    if (sortOrder) {
        const validSortOrders = ['asc', 'desc'];
        if (!validSortOrders.includes(sortOrder.toLowerCase())) {
            errors.push('Invalid sort order. Options: ' + validSortOrders.join(', '));
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

const validateMetricId = (req, res, next) => {
    const { metricId } = req.params;

    if (!metricId || isNaN(parseInt(metricId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid metric ID'
        });
    }

    next();
};

const validateHealthReportRequest = (req, res, next) => {
    const { period, format, includeCharts, metricTypes } = req.query;
    const errors = [];

    // period validation
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (period && !validPeriods.includes(period)) {
        errors.push('Invalid period. Options: ' + validPeriods.join(', '));
    }

    // format validation
    const validFormats = ['json', 'pdf', 'csv'];
    if (format && !validFormats.includes(format)) {
        errors.push('Invalid format. Options: ' + validFormats.join(', '));
    }

    // include charts validation
    if (includeCharts && !['true', 'false'].includes(includeCharts)) {
        errors.push('includeCharts must be true or false');
    }

    // metric types validation (comma-separated list)
    if (metricTypes) {
        const types = metricTypes.split(',').map(t => t.trim());
        const validMetricTypes = [
            'blood_pressure', 'weight', 'blood_sugar', 'heart_rate', 
            'temperature', 'oxygen_saturation', 'steps', 'sleep_hours',
            'pain_level', 'mood_score', 'medication_adherence'
        ];
        
        const invalidTypes = types.filter(type => !validMetricTypes.includes(type));
        if (invalidTypes.length > 0) {
            errors.push('Invalid metric types: ' + invalidTypes.join(', '));
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

const validateHealthAnalyticsRequest = (req, res, next) => {
    const { 
        analysisType, 
        timeRange, 
        correlationMetrics,
        includeProjections 
    } = req.query;
    
    const errors = [];

    // analysis type validation
    if (analysisType) {
        const validAnalysisTypes = ['trends', 'correlations', 'patterns', 'alerts', 'summary'];
        if (!validAnalysisTypes.includes(analysisType)) {
            errors.push('Invalid analysis type. Options: ' + validAnalysisTypes.join(', '));
        }
    }

    // time range validation
    if (timeRange) {
        const validTimeRanges = ['7days', '30days', '90days', '6months', '1year'];
        if (!validTimeRanges.includes(timeRange)) {
            errors.push('Invalid time range. Options: ' + validTimeRanges.join(', '));
        }
    }

    // correlation metrics validation
    if (correlationMetrics) {
        const metrics = correlationMetrics.split(',').map(m => m.trim());
        const validMetricTypes = [
            'blood_pressure', 'weight', 'blood_sugar', 'heart_rate', 
            'temperature', 'oxygen_saturation', 'steps', 'sleep_hours',
            'pain_level', 'mood_score', 'medication_adherence'
        ];
        
        const invalidMetrics = metrics.filter(metric => !validMetricTypes.includes(metric));
        if (invalidMetrics.length > 0) {
            errors.push('Invalid correlation metrics: ' + invalidMetrics.join(', '));
        }
        
        if (metrics.length < 2) {
            errors.push('At least 2 metrics required for correlation analysis');
        }
    }

    // include projections validation
    if (includeProjections && !['true', 'false'].includes(includeProjections)) {
        errors.push('includeProjections must be true or false');
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

const validateHealthGoalData = (req, res, next) => {
    const { 
        metricType, 
        targetValue, 
        targetOperator, 
        timeframe, 
        description 
    } = req.body;
    
    const errors = [];

    // metric type validation
    const validMetricTypes = [
        'weight', 'blood_sugar', 'heart_rate', 'steps', 'sleep_hours',
        'pain_level', 'mood_score', 'medication_adherence'
    ];
    
    if (!metricType || !validMetricTypes.includes(metricType)) {
        errors.push('Valid metric type is required. Options: ' + validMetricTypes.join(', '));
    }

    // target value validation
    if (targetValue === undefined || targetValue === null) {
        errors.push('Target value is required');
    } else if (typeof targetValue !== 'number' || isNaN(targetValue)) {
        errors.push('Target value must be a valid number');
    }

    // target operator validation
    const validOperators = ['greater_than', 'less_than', 'equal_to', 'between'];
    if (!targetOperator || !validOperators.includes(targetOperator)) {
        errors.push('Valid target operator is required. Options: ' + validOperators.join(', '));
    }

    // timeframe validation
    const validTimeframes = ['daily', 'weekly', 'monthly', 'quarterly'];
    if (!timeframe || !validTimeframes.includes(timeframe)) {
        errors.push('Valid timeframe is required. Options: ' + validTimeframes.join(', '));
    }

    // description validation
    if (description && (typeof description !== 'string' || description.length > 500)) {
        errors.push('Description must be a string with maximum 500 characters');
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
    validateHealthMetricData,
    validateHealthMetricsQuery,
    validateMetricId,
    validateHealthReportRequest,
    validateHealthAnalyticsRequest,
    validateHealthGoalData
};