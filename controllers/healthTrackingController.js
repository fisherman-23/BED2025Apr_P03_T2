const HealthTracking = require('../models/healthTrackingModel');

class HealthTrackingController {
    // creates a new health metric entry
    async createHealthMetric(req, res) {
        try {
            const metricData = req.body;
            metricData.userId = req.user.id; // from JWT token
            
            const newMetric = await HealthTracking.createHealthMetric(metricData);
            
            res.status(201).json({
                status: 'success',
                message: 'Health metric added successfully',
                data: { metric: newMetric }
            });
        } catch (error) {
            console.error('Error creating health metric:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to add health metric',
                error: error.message
            });
        }
    }

    // gets health metrics for the current user
    async getUserHealthMetrics(req, res) {
        try {
            const { metricType, startDate, endDate, limit } = req.query;
            
            const metrics = await HealthTracking.getHealthMetricsByUserId(req.user.id, {
                metricType,
                startDate,
                endDate,
                limit: limit ? parseInt(limit) : 30
            });
            
            res.status(200).json({
                status: 'success',
                data: { metrics }
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

    // gets medication compliance data for charts
    async getMedicationCompliance(req, res) {
        try {
            const { period = 'week' } = req.query; // 'day', 'week', 'month'
            
            const compliance = await HealthTracking.getMedicationCompliance(req.user.id, period);
            
            res.status(200).json({
                status: 'success',
                data: { compliance }
            });
        } catch (error) {
            console.error('Error fetching medication compliance:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve medication compliance',
                error: error.message
            });
        }
    }

    // gets health dashboard overview
    async getHealthDashboard(req, res) {
        try {
            const dashboardData = await HealthTracking.getHealthDashboard(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: dashboardData
            });
        } catch (error) {
            console.error('Error fetching health dashboard:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve health dashboard',
                error: error.message
            });
        }
    }

    // generates health trend analysis
    async getHealthTrends(req, res) {
        try {
            const { period = 'month' } = req.query;
            
            const trends = await HealthTracking.getHealthTrends(req.user.id, period);
            
            res.status(200).json({
                status: 'success',
                data: { trends }
            });
        } catch (error) {
            console.error('Error fetching health trends:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve health trends',
                error: error.message
            });
        }
    }

    // updates a health metric entry
    async updateHealthMetric(req, res) {
        try {
            const metricId = req.params.id;
            const updateData = req.body;
            
            // check if metric belongs to user
            const existingMetric = await HealthTracking.getHealthMetricById(metricId);
            if (!existingMetric) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Health metric not found'
                });
            }

            if (existingMetric.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this health metric'
                });
            }
            
            const updated = await HealthTracking.updateHealthMetric(metricId, updateData);
            
            if (updated) {
                const updatedMetric = await HealthTracking.getHealthMetricById(metricId);
                res.status(200).json({
                    status: 'success',
                    message: 'Health metric updated successfully',
                    data: { metric: updatedMetric }
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to update health metric'
                });
            }
        } catch (error) {
            console.error('Error updating health metric:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update health metric',
                error: error.message
            });
        }
    }

    // deletes a health metric entry
    async deleteHealthMetric(req, res) {
        try {
            const metricId = req.params.id;
            
            // check if metric exists and belongs to user
            const existingMetric = await HealthTracking.getHealthMetricById(metricId);
            if (!existingMetric) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Health metric not found'
                });
            }

            if (existingMetric.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this health metric'
                });
            }
            
            const deleted = await HealthTracking.deleteHealthMetric(metricId);
            
            if (deleted) {
                res.status(200).json({
                    status: 'success',
                    message: 'Health metric deleted successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to delete health metric'
                });
            }
        } catch (error) {
            console.error('Error deleting health metric:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete health metric',
                error: error.message
            });
        }
    }

    // generates PDF health report
    async generateHealthReport(req, res) {
        try {
            const { startDate, endDate, includeCharts = true } = req.query;
            
            const reportData = await HealthTracking.generateHealthReport(req.user.id, {
                startDate,
                endDate,
                includeCharts: includeCharts === 'true'
            });
            
            res.status(200).json({
                status: 'success',
                message: 'Health report generated successfully',
                data: reportData
            });
        } catch (error) {
            console.error('Error generating health report:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate health report',
                error: error.message
            });
        }
    }

    // gets caregiver monitoring dashboard data
    async getCaregiverDashboard(req, res) {
        try {
            const { patientUserId } = req.params;
            
            // verify caregiver has access (this would need proper relationship checking in production)
            const dashboardData = await HealthTracking.getCaregiverDashboard(patientUserId);
            
            res.status(200).json({
                status: 'success',
                data: dashboardData
            });
        } catch (error) {
            console.error('Error fetching caregiver dashboard:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve caregiver dashboard',
                error: error.message
            });
        }
    }
}

module.exports = new HealthTrackingController();