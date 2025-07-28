const HealthDashboard = require('../models/healthDashboardModel');
const Medication = require('../models/medicationModel');
const { validateHealthMetrics } = require('../utils/validators');
const reportService = require('../services/reportService');

class HealthDashboardController {
    // creates a new health metric entry
    async createHealthMetrics(req, res) {
        try {
            const metricsData = req.body;
            metricsData.userId = req.user.id;
            
            // validate input data
            const { error } = validateHealthMetrics(metricsData);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    details: error.details[0].message
                });
            }
            
            // check for reasonable health values
            if (!this.isValidHealthMetrics(metricsData)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Health metrics values are outside normal ranges. Please verify and try again.'
                });
            }
            
            const newMetrics = await HealthDashboard.createHealthMetrics(metricsData);
            
            // check if values indicate concerning trends
            const concerns = await this.checkHealthConcerns(req.user.id, metricsData);
            
            res.status(201).json({
                status: 'success',
                message: 'Health metrics recorded successfully',
                data: { 
                    metrics: newMetrics,
                    concerns: concerns
                }
            });
        } catch (error) {
            console.error('Error creating health metrics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to record health metrics',
                error: error.message
            });
        }
    }

    // gets health metrics for the user with date range
    async getUserHealthMetrics(req, res) {
        try {
            const { startDate, endDate, period = 'month' } = req.query;
            
            let start, end;
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            } else {
                // default to last month
                end = new Date();
                start = new Date();
                switch (period) {
                    case 'week':
                        start.setDate(start.getDate() - 7);
                        break;
                    case 'month':
                        start.setMonth(start.getMonth() - 1);
                        break;
                    case 'quarter':
                        start.setMonth(start.getMonth() - 3);
                        break;
                    default:
                        start.setMonth(start.getMonth() - 1);
                }
            }
            
            const metrics = await HealthDashboard.getHealthMetricsByUserId(req.user.id, start, end);
            const trends = await this.calculateHealthTrends(metrics);
            const compliance = await this.getMedicationComplianceData(req.user.id, start, end);
            
            res.status(200).json({
                status: 'success',
                data: { 
                    metrics,
                    trends,
                    compliance,
                    period: { start, end },
                    summary: this.generateHealthSummary(metrics, compliance)
                }
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

    // gets dashboard overview with latest metrics and trends
    async getDashboardOverview(req, res) {
        try {
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            // get recent metrics
            const recentMetrics = await HealthDashboard.getHealthMetricsByUserId(req.user.id, lastMonth, today);
            const latestMetrics = recentMetrics[recentMetrics.length - 1] || null;
            
            // get medication compliance
            const medicationCompliance = await this.getMedicationComplianceData(req.user.id, lastMonth, today);
            
            // get health trends
            const trends = await this.calculateHealthTrends(recentMetrics);
            
            // get alerts and concerns
            const concerns = latestMetrics ? await this.checkHealthConcerns(req.user.id, latestMetrics) : [];
            
            // get upcoming medication reminders
            const upcomingMeds = await Medication.getUpcomingReminders(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: {
                    latestMetrics,
                    medicationCompliance,
                    trends,
                    concerns,
                    upcomingMedications: upcomingMeds.slice(0, 5), // next 5 medications
                    chartData: {
                        complianceChart: this.formatComplianceChartData(medicationCompliance),
                        healthTrendsChart: this.formatHealthTrendsChartData(recentMetrics),
                        bloodPressureChart: this.formatBloodPressureChartData(recentMetrics)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve dashboard overview',
                error: error.message
            });
        }
    }

    // updates health metrics entry
    async updateHealthMetrics(req, res) {
        try {
            const metricId = req.params.id;
            const updateData = req.body;
            
            // check if metric exists and belongs to user
            const existingMetric = await HealthDashboard.getHealthMetricById(metricId);
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
            
            // validate update data
            const { error } = validateHealthMetrics(updateData, true);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    details: error.details[0].message
                });
            }
            
            // check for reasonable health values
            if (!this.isValidHealthMetrics(updateData)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Health metrics values are outside normal ranges. Please verify and try again.'
                });
            }
            
            const updated = await HealthDashboard.updateHealthMetrics(metricId, updateData);
            
            if (updated) {
                res.status(200).json({
                    status: 'success',
                    message: 'Health metrics updated successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to update health metrics'
                });
            }
        } catch (error) {
            console.error('Error updating health metrics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update health metrics',
                error: error.message
            });
        }
    }

    // deletes health metrics entry
    async deleteHealthMetrics(req, res) {
        try {
            const metricId = req.params.id;
            
            // check if metric exists and belongs to user
            const existingMetric = await HealthDashboard.getHealthMetricById(metricId);
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
            
            const deleted = await HealthDashboard.deleteHealthMetrics(metricId);
            
            if (deleted) {
                res.status(200).json({
                    status: 'success',
                    message: 'Health metrics deleted successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to delete health metrics'
                });
            }
        } catch (error) {
            console.error('Error deleting health metrics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete health metrics',
                error: error.message
            });
        }
    }

    // generates health report with charts (PDF)
    async generateHealthReport(req, res) {
        try {
            const { startDate, endDate, includeCharts = true, reportType = 'comprehensive' } = req.body;
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // get data for report
            const healthMetrics = await HealthDashboard.getHealthMetricsByUserId(req.user.id, start, end);
            const medicationCompliance = await this.getMedicationComplianceData(req.user.id, start, end);
            const trends = await this.calculateHealthTrends(healthMetrics);
            
            // generate PDF report
            const reportData = {
                user: req.user,
                period: { start, end },
                healthMetrics,
                medicationCompliance,
                trends,
                reportType,
                includeCharts
            };
            
            const reportPath = await reportService.generateHealthReport(reportData);
            
            res.status(200).json({
                status: 'success',
                message: 'Health report generated successfully',
                data: {
                    reportPath,
                    downloadUrl: `/api/reports/download/${reportPath.split('/').pop()}`
                }
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

    // gets health statistics for analytics
    async getHealthStatistics(req, res) {
        try {
            const { period = 'month' } = req.query;
            
            const stats = await HealthDashboard.getHealthStatistics(req.user.id, period);
            
            res.status(200).json({
                status: 'success',
                data: { statistics: stats }
            });
        } catch (error) {
            console.error('Error fetching health statistics:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve health statistics',
                error: error.message
            });
        }
    }

    // gets medication compliance data for charts
    async getMedicationComplianceData(userId, startDate, endDate) {
        try {
            const medications = await Medication.getMedicationsByUserId(userId);
            const complianceData = [];
            
            for (const med of medications.filter(m => m.active)) {
                const logs = await Medication.getMedicationLogs(med.medicationId, startDate, endDate);
                const totalDoses = logs.length;
                const takenDoses = logs.filter(log => !log.missed).length;
                const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses * 100) : 0;
                
                complianceData.push({
                    medicationName: med.name,
                    adherenceRate: Math.round(adherenceRate * 10) / 10,
                    totalDoses,
                    takenDoses,
                    missedDoses: totalDoses - takenDoses,
                    category: med.category
                });
            }
            
            return complianceData;
        } catch (error) {
            console.error('Error getting medication compliance data:', error);
            return [];
        }
    }

    // calculates health trends from metrics data
    async calculateHealthTrends(metrics) {
        if (metrics.length < 2) {
            return { message: 'Not enough data for trend analysis' };
        }
        
        const trends = {
            bloodPressure: this.calculateTrend(metrics, 'bloodPressureSystolic'),
            heartRate: this.calculateTrend(metrics, 'heartRate'),
            weight: this.calculateTrend(metrics, 'weight'),
            bloodSugar: this.calculateTrend(metrics, 'bloodSugar')
        };
        
        return trends;
    }

    // helper method to calculate trend for a specific metric
    calculateTrend(metrics, field) {
        const validMetrics = metrics.filter(m => m[field] !== null && m[field] !== undefined);
        
        if (validMetrics.length < 2) {
            return { trend: 'insufficient_data', message: 'Not enough data' };
        }
        
        const first = validMetrics[0][field];
        const last = validMetrics[validMetrics.length - 1][field];
        const change = last - first;
        const percentChange = (change / first) * 100;
        
        let trend;
        let color;
        if (Math.abs(percentChange) < 2) {
            trend = 'stable';
            color = 'green';
        } else if (percentChange > 0) {
            trend = field === 'weight' || field.includes('bloodPressure') || field === 'bloodSugar' ? 'increasing' : 'improving';
            color = field === 'weight' || field.includes('bloodPressure') || field === 'bloodSugar' ? 'red' : 'green';
        } else {
            trend = field === 'weight' || field.includes('bloodPressure') || field === 'bloodSugar' ? 'decreasing' : 'declining';
            color = field === 'weight' || field.includes('bloodPressure') || field === 'bloodSugar' ? 'green' : 'red';
        }
        
        return {
            trend,
            color,
            change: Math.round(change * 10) / 10,
            percentChange: Math.round(percentChange * 10) / 10,
            current: last,
            previous: first
        };
    }

    // checks health values for concerns
    async checkHealthConcerns(userId, metrics) {
        const concerns = [];
        
        // blood pressure concerns
        if (metrics.bloodPressureSystolic && metrics.bloodPressureDiastolic) {
            if (metrics.bloodPressureSystolic > 140 || metrics.bloodPressureDiastolic > 90) {
                concerns.push({
                    type: 'high_blood_pressure',
                    severity: 'high',
                    message: 'Blood pressure reading is elevated. Consider consulting your doctor.',
                    value: `${metrics.bloodPressureSystolic}/${metrics.bloodPressureDiastolic}`,
                    color: 'red'
                });
            } else if (metrics.bloodPressureSystolic < 90 || metrics.bloodPressureDiastolic < 60) {
                concerns.push({
                    type: 'low_blood_pressure',
                    severity: 'medium',
                    message: 'Blood pressure reading is low. Monitor for symptoms like dizziness.',
                    value: `${metrics.bloodPressureSystolic}/${metrics.bloodPressureDiastolic}`,
                    color: 'yellow'
                });
            }
        }
        
        // heart rate concerns
        if (metrics.heartRate) {
            if (metrics.heartRate > 100) {
                concerns.push({
                    type: 'high_heart_rate',
                    severity: 'medium',
                    message: 'Heart rate is elevated. Ensure you were resting when measured.',
                    value: `${metrics.heartRate} bpm`,
                    color: 'orange'
                });
            } else if (metrics.heartRate < 60) {
                concerns.push({
                    type: 'low_heart_rate',
                    severity: 'medium',
                    message: 'Heart rate is low. This might be normal if you are very fit.',
                    value: `${metrics.heartRate} bpm`,
                    color: 'yellow'
                });
            }
        }
        
        // blood sugar concerns
        if (metrics.bloodSugar) {
            if (metrics.bloodSugar > 140) {
                concerns.push({
                    type: 'high_blood_sugar',
                    severity: 'high',
                    message: 'Blood sugar is elevated. Check with your doctor about diabetes management.',
                    value: `${metrics.bloodSugar} mg/dL`,
                    color: 'red'
                });
            } else if (metrics.bloodSugar < 70) {
                concerns.push({
                    type: 'low_blood_sugar',
                    severity: 'high',
                    message: 'Blood sugar is low. Have some glucose tablets or juice if feeling symptoms.',
                    value: `${metrics.bloodSugar} mg/dL`,
                    color: 'red'
                });
            }
        }
        
        return concerns;
    }

    // validates health metric values are within reasonable ranges
    isValidHealthMetrics(metrics) {
        if (metrics.bloodPressureSystolic && (metrics.bloodPressureSystolic < 50 || metrics.bloodPressureSystolic > 250)) {
            return false;
        }
        if (metrics.bloodPressureDiastolic && (metrics.bloodPressureDiastolic < 30 || metrics.bloodPressureDiastolic > 150)) {
            return false;
        }
        if (metrics.heartRate && (metrics.heartRate < 30 || metrics.heartRate > 200)) {
            return false;
        }
        if (metrics.weight && (metrics.weight < 20 || metrics.weight > 300)) {
            return false;
        }
        if (metrics.bloodSugar && (metrics.bloodSugar < 30 || metrics.bloodSugar > 500)) {
            return false;
        }
        return true;
    }

    // generates health summary from metrics and compliance data
    generateHealthSummary(metrics, compliance) {
        const summary = {
            totalReadings: metrics.length,
            averageCompliance: compliance.length > 0 ? 
                compliance.reduce((sum, med) => sum + med.adherenceRate, 0) / compliance.length : 0,
            healthScore: 0,
            recommendations: []
        };
        
        // calculate health score (0-100)
        let scoreFactors = [];
        
        if (metrics.length > 0) {
            const latest = metrics[metrics.length - 1];
            
            // blood pressure score
            if (latest.bloodPressureSystolic && latest.bloodPressureDiastolic) {
                if (latest.bloodPressureSystolic <= 120 && latest.bloodPressureDiastolic <= 80) {
                    scoreFactors.push(100);
                } else if (latest.bloodPressureSystolic <= 140 && latest.bloodPressureDiastolic <= 90) {
                    scoreFactors.push(70);
                } else {
                    scoreFactors.push(40);
                }
            }
            
            // medication compliance score
            if (summary.averageCompliance >= 90) {
                scoreFactors.push(100);
                summary.recommendations.push("Excellent medication adherence! Keep it up.");
            } else if (summary.averageCompliance >= 80) {
                scoreFactors.push(80);
                summary.recommendations.push("Good medication adherence. Try to improve consistency.");
            } else {
                scoreFactors.push(50);
                summary.recommendations.push("Medication adherence needs improvement. Consider setting more reminders.");
            }
        }
        
        summary.healthScore = scoreFactors.length > 0 ? 
            Math.round(scoreFactors.reduce((sum, score) => sum + score, 0) / scoreFactors.length) : 0;
        
        // add general recommendations
        if (metrics.length < 7) {
            summary.recommendations.push("Record health metrics more regularly for better tracking.");
        }
        
        return summary;
    }

    // formats compliance data for chart.js
    formatComplianceChartData(compliance) {
        return {
            labels: compliance.map(med => med.medicationName),
            datasets: [{
                label: 'Adherence Rate (%)',
                data: compliance.map(med => med.adherenceRate),
                backgroundColor: compliance.map(med => {
                    if (med.adherenceRate >= 90) return '#D7E961'; // green
                    if (med.adherenceRate >= 80) return '#C1E3F4'; // light blue
                    return '#ff6b6b'; // red for poor compliance
                }),
                borderColor: '#7161E9', // purple
                borderWidth: 2
            }]
        };
    }

    // formats health trends data for chart.js
    formatHealthTrendsChartData(metrics) {
        const dates = metrics.map(m => new Date(m.metricDate).toLocaleDateString());
        
        return {
            labels: dates,
            datasets: [
                {
                    label: 'Blood Pressure (Systolic)',
                    data: metrics.map(m => m.bloodPressureSystolic),
                    borderColor: '#7161E9',
                    backgroundColor: 'rgba(113, 97, 233, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Heart Rate',
                    data: metrics.map(m => m.heartRate),
                    borderColor: '#78B5D3',
                    backgroundColor: 'rgba(120, 181, 211, 0.1)',
                    tension: 0.1
                }
            ]
        };
    }

    // formats blood pressure data for chart.js
    formatBloodPressureChartData(metrics) {
        const dates = metrics.map(m => new Date(m.metricDate).toLocaleDateString());
        
        return {
            labels: dates,
            datasets: [
                {
                    label: 'Systolic',
                    data: metrics.map(m => m.bloodPressureSystolic),
                    borderColor: '#D7E961',
                    backgroundColor: 'rgba(215, 233, 97, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Diastolic',
                    data: metrics.map(m => m.bloodPressureDiastolic),
                    borderColor: '#78B5D3',
                    backgroundColor: 'rgba(120, 181, 211, 0.1)',
                    tension: 0.1
                }
            ]
        };
    }
}

module.exports = new HealthDashboardController();