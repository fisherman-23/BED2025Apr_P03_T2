const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDF Generator Utility
 * Generates PDF reports for medication adherence and health metrics
 * Provides professional formatting for sharing with doctors and caregivers
 */
class PDFGenerator {
    constructor() {
        this.companyName = 'CircleAge - Senior Care Platform';
        this.colors = {
            primary: '#4F46E5',
            secondary: '#10B981', 
            danger: '#EF4444',
            warning: '#F59E0B',
            text: '#374151',
            light: '#F9FAFB'
        };
    }

    /**
     * Generates medication adherence report PDF
     * @param {Object} reportData - adherence report data
     * @param {string} outputPath - output file path
     * @returns {Promise<string>} - path to generated PDF
     */
    async generateAdherenceReport(reportData, outputPath = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = outputPath || `adherence_report_${Date.now()}.pdf`;
                const stream = fs.createWriteStream(filename);
                
                doc.pipe(stream);

                // Header
                this.addHeader(doc, 'Medication Adherence Report');
                
                // Patient Information
                this.addPatientInfo(doc, reportData.patientInfo);
                
                // Summary Statistics
                this.addSummaryStats(doc, reportData.summary);
                
                // Medications List with Adherence
                this.addMedicationsList(doc, reportData.medications);
                
                // Charts and Graphs (text-based for simplicity)
                this.addAdherenceTrends(doc, reportData.trends);
                
                // Recommendations
                this.addRecommendations(doc, reportData.recommendations);
                
                // Footer
                this.addFooter(doc);
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve(filename);
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generates health metrics report PDF
     * @param {Object} healthData - health metrics data
     * @param {string} outputPath - output file path
     * @returns {Promise<string>} - path to generated PDF
     */
    async generateHealthMetricsReport(healthData, outputPath = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = outputPath || `health_metrics_${Date.now()}.pdf`;
                const stream = fs.createWriteStream(filename);
                
                doc.pipe(stream);

                // Header
                this.addHeader(doc, 'Health Metrics Report');
                
                // Patient Information
                this.addPatientInfo(doc, healthData.patientInfo);
                
                // Health Metrics Summary
                this.addHealthMetricsSummary(doc, healthData.metrics);
                
                // Trends Analysis
                this.addHealthTrends(doc, healthData.trends);
                
                // Alert History
                if (healthData.alerts) {
                    this.addAlertHistory(doc, healthData.alerts);
                }
                
                // Footer
                this.addFooter(doc);
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve(filename);
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Adds header to PDF document
     * @param {PDFDocument} doc - PDF document
     * @param {string} title - report title
     */
    addHeader(doc, title) {
        doc.fontSize(20)
           .fillColor(this.colors.primary)
           .text(this.companyName, 50, 50);
           
        doc.fontSize(16)
           .fillColor(this.colors.text)
           .text(title, 50, 80);
           
        doc.fontSize(12)
           .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 110);
           
        // Add line separator
        doc.strokeColor(this.colors.primary)
           .lineWidth(2)
           .moveTo(50, 130)
           .lineTo(550, 130)
           .stroke();
           
        doc.moveDown(2);
    }

    /**
     * Adds patient information section
     * @param {PDFDocument} doc - PDF document
     * @param {Object} patientInfo - patient information
     */
    addPatientInfo(doc, patientInfo) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Patient Information', 50, doc.y);
           
        doc.fontSize(12)
           .fillColor(this.colors.text)
           .text(`Name: ${patientInfo.firstName} ${patientInfo.lastName}`, 50, doc.y + 10)
           .text(`Email: ${patientInfo.email}`, 50, doc.y + 5)
           .text(`Phone: ${patientInfo.phoneNumber}`, 50, doc.y + 5)
           .text(`Date of Birth: ${new Date(patientInfo.dateOfBirth).toLocaleDateString()}`, 50, doc.y + 5);
           
        doc.moveDown(1.5);
    }

    /**
     * Adds summary statistics
     * @param {PDFDocument} doc - PDF document
     * @param {Object} summary - summary statistics
     */
    addSummaryStats(doc, summary) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Summary Statistics', 50, doc.y);
           
        doc.fontSize(12)
           .fillColor(this.colors.text)
           .text(`Overall Adherence Rate: ${summary.overallAdherence}%`, 50, doc.y + 10)
           .text(`Total Medications: ${summary.totalMedications}`, 50, doc.y + 5)
           .text(`Active Medications: ${summary.activeMedications}`, 50, doc.y + 5)
           .text(`Doses Taken: ${summary.dosesTaken}/${summary.totalDoses}`, 50, doc.y + 5)
           .text(`Missed Doses: ${summary.missedDoses}`, 50, doc.y + 5)
           .text(`Report Period: ${summary.reportPeriod}`, 50, doc.y + 5);
           
        doc.moveDown(1.5);
    }

    /**
     * Adds medications list with adherence rates
     * @param {PDFDocument} doc - PDF document
     * @param {Array} medications - medications data
     */
    addMedicationsList(doc, medications) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Medication Details', 50, doc.y);
           
        doc.moveDown(0.5);
        
        medications.forEach((med, index) => {
            const adherenceColor = med.adherenceRate >= 80 ? this.colors.secondary : 
                                 med.adherenceRate >= 60 ? this.colors.warning : this.colors.danger;
            
            doc.fontSize(12)
               .fillColor(this.colors.text)
               .text(`${index + 1}. ${med.medicationName}`, 50, doc.y + 10)
               .text(`   Dosage: ${med.dosage}`, 70, doc.y + 5)
               .text(`   Frequency: ${med.frequency}`, 70, doc.y + 5)
               .text(`   Prescribed by: ${med.prescribedBy}`, 70, doc.y + 5);
               
            doc.fillColor(adherenceColor)
               .text(`   Adherence Rate: ${med.adherenceRate}% (${med.takenDoses}/${med.totalDoses})`, 70, doc.y + 5);
               
            if (med.lastMissed) {
                doc.fillColor(this.colors.danger)
                   .text(`   Last Missed: ${new Date(med.lastMissed).toLocaleDateString()}`, 70, doc.y + 5);
            }
            
            doc.moveDown(0.5);
        });
        
        doc.moveDown(1);
    }

    /**
     * Adds adherence trends section
     * @param {PDFDocument} doc - PDF document
     * @param {Object} trends - trends data
     */
    addAdherenceTrends(doc, trends) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Adherence Trends', 50, doc.y);
           
        doc.fontSize(12)
           .fillColor(this.colors.text)
           .text(`Weekly Average: ${trends.weeklyAverage}%`, 50, doc.y + 10)
           .text(`Monthly Average: ${trends.monthlyAverage}%`, 50, doc.y + 5)
           .text(`Best Week: ${trends.bestWeek}% (Week of ${trends.bestWeekDate})`, 50, doc.y + 5)
           .text(`Worst Week: ${trends.worstWeek}% (Week of ${trends.worstWeekDate})`, 50, doc.y + 5);
           
        if (trends.improvements) {
            doc.fillColor(this.colors.secondary)
               .text(`Improvement Trend: ${trends.improvements}`, 50, doc.y + 5);
        }
        
        doc.moveDown(1.5);
    }

    /**
     * Adds recommendations section
     * @param {PDFDocument} doc - PDF document
     * @param {Array} recommendations - recommendations list
     */
    addRecommendations(doc, recommendations) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Recommendations', 50, doc.y);
           
        doc.fontSize(12)
           .fillColor(this.colors.text);
           
        recommendations.forEach((rec, index) => {
            const priority = rec.priority || 'medium';
            const priorityColor = priority === 'high' ? this.colors.danger :
                                priority === 'medium' ? this.colors.warning : this.colors.text;
            
            doc.fillColor(priorityColor)
               .text(`${index + 1}. [${priority.toUpperCase()}] ${rec.title}`, 50, doc.y + 10);
               
            doc.fillColor(this.colors.text)
               .text(`   ${rec.description}`, 70, doc.y + 5);
        });
        
        doc.moveDown(1.5);
    }

    /**
     * Adds health metrics summary
     * @param {PDFDocument} doc - PDF document
     * @param {Object} metrics - health metrics data
     */
    addHealthMetricsSummary(doc, metrics) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Recent Health Metrics', 50, doc.y);
           
        Object.keys(metrics).forEach(metricType => {
            const metric = metrics[metricType];
            if (metric.latest) {
                doc.fontSize(12)
                   .fillColor(this.colors.text)
                   .text(`${this.formatMetricName(metricType)}:`, 50, doc.y + 10)
                   .text(`   Latest: ${metric.latest.value} ${metric.latest.unit || ''}`, 70, doc.y + 5)
                   .text(`   Date: ${new Date(metric.latest.recordedAt).toLocaleDateString()}`, 70, doc.y + 5);
                   
                if (metric.trend) {
                    const trendColor = metric.trend === 'improving' ? this.colors.secondary :
                                     metric.trend === 'worsening' ? this.colors.danger : this.colors.text;
                    doc.fillColor(trendColor)
                       .text(`   Trend: ${metric.trend}`, 70, doc.y + 5);
                }
            }
        });
        
        doc.moveDown(1.5);
    }

    /**
     * Adds health trends analysis
     * @param {PDFDocument} doc - PDF document
     * @param {Object} trends - health trends data
     */
    addHealthTrends(doc, trends) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Health Trends Analysis', 50, doc.y);
           
        doc.fontSize(12)
           .fillColor(this.colors.text);
           
        if (trends.bloodPressure) {
            doc.text('Blood Pressure Trend:', 50, doc.y + 10)
               .text(`   Average: ${trends.bloodPressure.average}`, 70, doc.y + 5)
               .text(`   Range: ${trends.bloodPressure.min} - ${trends.bloodPressure.max}`, 70, doc.y + 5);
        }
        
        if (trends.weight) {
            doc.text('Weight Trend:', 50, doc.y + 10)
               .text(`   Current: ${trends.weight.current} kg`, 70, doc.y + 5)
               .text(`   Change: ${trends.weight.change > 0 ? '+' : ''}${trends.weight.change} kg`, 70, doc.y + 5);
        }
        
        doc.moveDown(1.5);
    }

    /**
     * Adds alert history section
     * @param {PDFDocument} doc - PDF document
     * @param {Array} alerts - alert history
     */
    addAlertHistory(doc, alerts) {
        doc.fontSize(14)
           .fillColor(this.colors.primary)
           .text('Recent Alerts', 50, doc.y);
           
        doc.fontSize(10)
           .fillColor(this.colors.text);
           
        alerts.slice(0, 10).forEach(alert => {
            const alertColor = alert.severity === 'critical' ? this.colors.danger :
                             alert.severity === 'warning' ? this.colors.warning : this.colors.text;
            
            doc.fillColor(alertColor)
               .text(`${new Date(alert.sentAt).toLocaleDateString()} - ${alert.alertType}: ${alert.alertMessage}`, 50, doc.y + 8);
        });
        
        doc.moveDown(1);
    }

    /**
     * Adds footer to PDF document
     * @param {PDFDocument} doc - PDF document
     */
    addFooter(doc) {
        const pageHeight = doc.page.height;
        
        doc.fontSize(10)
           .fillColor(this.colors.text)
           .text('This report is generated automatically by CircleAge platform.', 50, pageHeight - 80)
           .text('For medical decisions, please consult with your healthcare provider.', 50, pageHeight - 65)
           .text(`Report ID: RPT-${Date.now()}`, 50, pageHeight - 50);
           
        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(10)
               .fillColor(this.colors.text)
               .text(`Page ${i + 1} of ${pages.count}`, 500, pageHeight - 50);
        }
    }

    /**
     * Formats metric type names for display
     * @param {string} metricType - raw metric type
     * @returns {string} - formatted name
     */
    formatMetricName(metricType) {
        const names = {
            'blood_pressure': 'Blood Pressure',
            'weight': 'Weight',
            'blood_sugar': 'Blood Sugar',
            'heart_rate': 'Heart Rate',
            'temperature': 'Temperature',
            'cholesterol': 'Cholesterol',
            'bmi': 'BMI'
        };
        
        return names[metricType] || metricType.replace('_', ' ').toUpperCase();
    }

    /**
     * Generates caregiver dashboard PDF report
     * @param {Object} dashboardData - caregiver dashboard data
     * @param {string} outputPath - output file path
     * @returns {Promise<string>} - path to generated PDF
     */
    async generateCaregiverReport(dashboardData, outputPath = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = outputPath || `caregiver_report_${Date.now()}.pdf`;
                const stream = fs.createWriteStream(filename);
                
                doc.pipe(stream);

                // Header
                this.addHeader(doc, 'Caregiver Monitoring Report');
                
                // Caregiver Information
                doc.fontSize(14)
                   .fillColor(this.colors.primary)
                   .text('Caregiver Information', 50, doc.y);
                   
                doc.fontSize(12)
                   .fillColor(this.colors.text)
                   .text(`Caregiver: ${dashboardData.caregiverInfo.name}`, 50, doc.y + 10)
                   .text(`Patients Under Care: ${dashboardData.patients.length}`, 50, doc.y + 5);
                
                doc.moveDown(1);
                
                // Patients Overview
                dashboardData.patients.forEach(patient => {
                    doc.fontSize(13)
                       .fillColor(this.colors.primary)
                       .text(`Patient: ${patient.firstName} ${patient.lastName}`, 50, doc.y + 10);
                       
                    doc.fontSize(12)
                       .fillColor(this.colors.text)
                       .text(`Overall Compliance: ${patient.overallCompliance}%`, 70, doc.y + 5)
                       .text(`Active Medications: ${patient.activeMedications}`, 70, doc.y + 5)
                       .text(`Recent Alerts: ${patient.recentAlerts}`, 70, doc.y + 5);
                       
                    if (patient.lastMissedMedication) {
                        doc.fillColor(this.colors.danger)
                           .text(`Last Missed: ${patient.lastMissedMedication}`, 70, doc.y + 5);
                    }
                    
                    doc.moveDown(0.5);
                });
                
                // Footer
                this.addFooter(doc);
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve(filename);
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Cleans up generated PDF files (optional cleanup utility)
     * @param {string} filePath - path to PDF file
     */
    async cleanupPDF(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`PDF file cleaned up: ${filePath}`);
            }
        } catch (error) {
            console.error('Error cleaning up PDF:', error);
        }
    }

    /**
     * Gets PDF file as buffer for direct response
     * @param {Object} reportData - report data
     * @param {string} reportType - type of report ('adherence', 'health', 'caregiver')
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generatePDFBuffer(reportData, reportType = 'adherence') {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks = [];
                
                doc.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                doc.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
                
                // Generate content based on report type
                switch (reportType) {
                    case 'adherence':
                        this.addHeader(doc, 'Medication Adherence Report');
                        this.addPatientInfo(doc, reportData.patientInfo);
                        this.addSummaryStats(doc, reportData.summary);
                        this.addMedicationsList(doc, reportData.medications);
                        break;
                    case 'health':
                        this.addHeader(doc, 'Health Metrics Report');
                        this.addPatientInfo(doc, reportData.patientInfo);
                        this.addHealthMetricsSummary(doc, reportData.metrics);
                        break;
                    case 'caregiver':
                        this.addHeader(doc, 'Caregiver Monitoring Report');
                        // Add caregiver-specific content
                        break;
                    default:
                        throw new Error('Invalid report type');
                }
                
                this.addFooter(doc);
                doc.end();
                
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new PDFGenerator();