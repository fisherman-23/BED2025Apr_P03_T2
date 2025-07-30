const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    constructor() {
        this.primaryColor = '#7161E9';
        this.secondaryColor = '#D7E961';
        this.accentColor = '#78B5D3';
        this.lightColor = '#C1E3F4';
    }

    /**
     * Generates medication adherence report PDF
     * @param {Object} reportData - adherence report data
     * @param {string} outputPath - optional output file path
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateAdherenceReport(reportData, outputPath = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                // collect PDF data
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    
                    // save to file if path provided
                    if (outputPath) {
                        fs.writeFileSync(outputPath, pdfData);
                    }
                    
                    resolve(pdfData);
                });

                // generate report content
                this.addAdherenceReportHeader(doc, reportData);
                this.addPatientInfo(doc, reportData);
                this.addAdherenceSummary(doc, reportData);
                this.addMedicationDetails(doc, reportData);
                this.addAdherenceChart(doc, reportData);
                this.addRecommendations(doc, reportData);
                this.addFooter(doc);

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generates health metrics report PDF
     * @param {Object} healthData - health metrics data
     * @param {string} outputPath - optional output file path
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateHealthReport(healthData, outputPath = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    
                    if (outputPath) {
                        fs.writeFileSync(outputPath, pdfData);
                    }
                    
                    resolve(pdfData);
                });

                // generate health report content
                this.addHealthReportHeader(doc, healthData);
                this.addPatientInfo(doc, healthData);
                this.addHealthMetricsSummary(doc, healthData);
                this.addHealthTrends(doc, healthData);
                this.addHealthInsights(doc, healthData);
                this.addFooter(doc);

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generates comprehensive patient report PDF
     * @param {Object} patientData - complete patient data
     * @param {string} outputPath - optional output file path
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateComprehensiveReport(patientData, outputPath = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    
                    if (outputPath) {
                        fs.writeFileSync(outputPath, pdfData);
                    }
                    
                    resolve(pdfData);
                });

                // generate comprehensive report
                this.addComprehensiveHeader(doc, patientData);
                this.addPatientInfo(doc, patientData);
                
                // medication section
                if (patientData.medicationData) {
                    this.addSectionHeader(doc, 'Medication Adherence');
                    this.addAdherenceSummary(doc, patientData.medicationData);
                    this.addMedicationDetails(doc, patientData.medicationData);
                }

                // health metrics section
                if (patientData.healthData) {
                    this.addSectionHeader(doc, 'Health Metrics');
                    this.addHealthMetricsSummary(doc, patientData.healthData);
                    this.addHealthTrends(doc, patientData.healthData);
                }

                // appointments section
                if (patientData.appointmentData) {
                    this.addSectionHeader(doc, 'Appointments');
                    this.addAppointmentSummary(doc, patientData.appointmentData);
                }

                this.addFooter(doc);
                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    // Header generators
    /**
     * Adds adherence report header
     * @private
     */
    addAdherenceReportHeader(doc, reportData) {
        // header background
        doc.rect(0, 0, doc.page.width, 100)
           .fill(this.primaryColor);

        // title
        doc.fillColor('white')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('Medication Adherence Report', 50, 30);

        // date
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString('en-SG')}`, 50, 60);

        doc.moveDown(3);
        doc.fillColor('black');
    }

    /**
     * Adds health report header
     * @private
     */
    addHealthReportHeader(doc, healthData) {
        doc.rect(0, 0, doc.page.width, 100)
           .fill(this.accentColor);

        doc.fillColor('white')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('Health Metrics Report', 50, 30);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString('en-SG')}`, 50, 60);

        doc.moveDown(3);
        doc.fillColor('black');
    }

    /**
     * Adds comprehensive report header
     * @private
     */
    addComprehensiveHeader(doc, patientData) {
        doc.rect(0, 0, doc.page.width, 100)
           .fill(this.secondaryColor);

        doc.fillColor('black')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('Comprehensive Health Report', 50, 30);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString('en-SG')}`, 50, 60);

        doc.moveDown(3);
    }

    /**
     * Adds patient information section
     * @private
     */
    addPatientInfo(doc, data) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Patient Information', { underline: true });

        doc.moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Name: ${data.patientName || 'N/A'}`)
           .text(`Email: ${data.patientEmail || 'N/A'}`)
           .text(`Report Period: ${data.reportPeriod || 'Last 30 days'}`)
           .text(`Report Date: ${new Date().toLocaleDateString('en-SG')}`);

        doc.moveDown(1);
    }

    /**
     * Adds adherence summary section
     * @private
     */
    addAdherenceSummary(doc, reportData) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Adherence Summary', { underline: true });

        doc.moveDown(0.5);

        // overall adherence
        const adherenceColor = this.getAdherenceColor(reportData.overallAdherence);
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(adherenceColor)
           .text(`Overall Adherence: ${reportData.overallAdherence || 0}%`);

        doc.fillColor('black')
           .fontSize(12)
           .font('Helvetica');

        // statistics
        const stats = [
            `Total Medications: ${reportData.totalMedications || 0}`,
            `Total Doses Scheduled: ${reportData.totalDoses || 0}`,
            `Doses Taken: ${reportData.takenDoses || 0}`,
            `Missed Doses: ${reportData.missedDoses || 0}`,
            `Adherence Rating: ${this.getAdherenceRating(reportData.overallAdherence)}`
        ];

        stats.forEach(stat => {
            doc.text(stat);
        });

        doc.moveDown(1);
    }

    /**
     * Adds medication details section
     * @private
     */
    addMedicationDetails(doc, reportData) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Medication Details', { underline: true });

        doc.moveDown(0.5);

        if (reportData.medications && reportData.medications.length > 0) {
            reportData.medications.forEach((med, index) => {
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text(`${index + 1}. ${med.medicationName}`);

                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`   Dosage: ${med.dosage}`)
                   .text(`   Frequency: ${med.frequency}`)
                   .text(`   Adherence: ${med.adherenceRate || 0}%`)
                   .text(`   Category: ${med.category || 'General'}`);

                if (med.notes) {
                    doc.text(`   Notes: ${med.notes}`);
                }

                doc.moveDown(0.5);
            });
        } else {
            doc.fontSize(12)
               .font('Helvetica')
               .text('No medication data available.');
        }

        doc.moveDown(1);
    }

    /**
     * Adds simple adherence chart representation
     * @private
     */
    addAdherenceChart(doc, reportData) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Adherence Trend', { underline: true });

        doc.moveDown(0.5);

        if (reportData.adherenceTrend && reportData.adherenceTrend.length > 0) {
            // simple bar chart representation
            const chartWidth = 400;
            const chartHeight = 150;
            const startX = 80;
            const startY = doc.y + 20;

            // draw chart background
            doc.rect(startX, startY, chartWidth, chartHeight)
               .stroke();

            // draw bars
            const barWidth = chartWidth / reportData.adherenceTrend.length;
            
            reportData.adherenceTrend.forEach((dataPoint, index) => {
                const barHeight = (dataPoint.adherence / 100) * chartHeight;
                const barX = startX + (index * barWidth);
                const barY = startY + chartHeight - barHeight;

                // color based on adherence level
                const barColor = this.getAdherenceColor(dataPoint.adherence);
                doc.rect(barX + 2, barY, barWidth - 4, barHeight)
                   .fill(barColor);

                // add label
                doc.fillColor('black')
                   .fontSize(8)
                   .text(dataPoint.period || `Week ${index + 1}`, barX, startY + chartHeight + 5, {
                       width: barWidth,
                       align: 'center'
                   });
            });

            doc.y = startY + chartHeight + 30;
        } else {
            doc.fontSize(12)
               .font('Helvetica')
               .text('No trend data available.');
        }

        doc.moveDown(1);
    }

    /**
     * Adds health metrics summary
     * @private
     */
    addHealthMetricsSummary(doc, healthData) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Health Metrics Summary', { underline: true });

        doc.moveDown(0.5);

        if (healthData.metrics && healthData.metrics.length > 0) {
            healthData.metrics.forEach(metric => {
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text(metric.type.replace('_', ' ').toUpperCase());

                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`   Latest Value: ${metric.latestValue} ${metric.unit || ''}`)
                   .text(`   Average: ${metric.average} ${metric.unit || ''}`)
                   .text(`   Range: ${metric.min} - ${metric.max} ${metric.unit || ''}`)
                   .text(`   Status: ${metric.status || 'Normal'}`);

                doc.moveDown(0.5);
            });
        } else {
            doc.fontSize(12)
               .font('Helvetica')
               .text('No health metrics data available.');
        }

        doc.moveDown(1);
    }

    /**
     * Adds health trends section
     * @private
     */
    addHealthTrends(doc, healthData) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Health Trends', { underline: true });

        doc.moveDown(0.5);

        if (healthData.trends && Object.keys(healthData.trends).length > 0) {
            Object.entries(healthData.trends).forEach(([metricType, trend]) => {
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text(metricType.replace('_', ' ').toUpperCase());

                const trendIcon = trend.direction === 'up' ? '↗' : 
                                trend.direction === 'down' ? '↘' : '→';
                
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`   Trend: ${trendIcon} ${trend.description || 'Stable'}`)
                   .text(`   Change: ${trend.change || '0'}% over period`);

                doc.moveDown(0.5);
            });
        } else {
            doc.fontSize(12)
               .font('Helvetica')
               .text('No trend data available.');
        }

        doc.moveDown(1);
    }

    /**
     * Adds health insights and recommendations
     * @private
     */
    addHealthInsights(doc, healthData) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Health Insights', { underline: true });

        doc.moveDown(0.5);

        if (healthData.insights && healthData.insights.length > 0) {
            healthData.insights.forEach((insight, index) => {
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`${index + 1}. ${insight}`);
            });
        } else {
            const defaultInsights = [
                'Continue taking medications as prescribed',
                'Regular monitoring shows stable health metrics',
                'Maintain current lifestyle and medication routine'
            ];

            defaultInsights.forEach((insight, index) => {
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`${index + 1}. ${insight}`);
            });
        }

        doc.moveDown(1);
    }

    /**
     * Adds recommendations section
     * @private
     */
    addRecommendations(doc, reportData) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Recommendations', { underline: true });

        doc.moveDown(0.5);

        const adherence = reportData.overallAdherence || 0;
        let recommendations = [];

        if (adherence >= 90) {
            recommendations = [
                'Excellent medication adherence! Continue current routine.',
                'Consider sharing success strategies with others.',
                'Maintain regular check-ups with healthcare provider.'
            ];
        } else if (adherence >= 70) {
            recommendations = [
                'Good adherence with room for improvement.',
                'Consider setting more frequent reminders.',
                'Discuss any barriers with healthcare provider.',
                'Review medication timing and routine.'
            ];
        } else {
            recommendations = [
                'Low adherence requires immediate attention.',
                'Schedule urgent consultation with healthcare provider.',
                'Consider pill organizer or automated dispensing system.',
                'Involve family members or caregivers for support.',
                'Review medication side effects and concerns.'
            ];
        }

        recommendations.forEach((rec, index) => {
            doc.fontSize(12)
               .font('Helvetica')
               .text(`${index + 1}. ${rec}`);
        });

        doc.moveDown(1);
    }

    /**
     * Adds appointment summary section
     * @private
     */
    addAppointmentSummary(doc, appointmentData) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Recent Appointments');

        doc.moveDown(0.5);

        if (appointmentData.appointments && appointmentData.appointments.length > 0) {
            appointmentData.appointments.forEach(apt => {
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`Date: ${new Date(apt.appointmentDate).toLocaleDateString('en-SG')}`)
                   .text(`Doctor: ${apt.doctorName}`)
                   .text(`Specialty: ${apt.specialty}`)
                   .text(`Status: ${apt.status}`)
                   .text(`Notes: ${apt.notes || 'No notes'}`);

                doc.moveDown(0.5);
            });
        } else {
            doc.fontSize(12)
               .font('Helvetica')
               .text('No recent appointments.');
        }

        doc.moveDown(1);
    }

    /**
     * Adds section header
     * @private
     */
    addSectionHeader(doc, title) {
        // add page break if needed
        if (doc.y > 650) {
            doc.addPage();
        }

        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor(this.primaryColor)
           .text(title, { underline: true });

        doc.fillColor('black');
        doc.moveDown(1);
    }

    /**
     * Adds footer to the document
     * @private
     */
    addFooter(doc) {
        const pages = doc.bufferedPageRange();
        
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            
            // footer line
            doc.moveTo(50, doc.page.height - 50)
               .lineTo(doc.page.width - 50, doc.page.height - 50)
               .stroke();

            // footer text
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('gray')
               .text(
                   'CircleAge - Your Health Companion | Generated automatically',
                   50,
                   doc.page.height - 40,
                   { align: 'left' }
               );

            // page number
            doc.text(
                `Page ${i + 1} of ${pages.count}`,
                50,
                doc.page.height - 40,
                { align: 'right' }
            );
        }
    }

    // Utility methods
    /**
     * Gets color based on adherence percentage
     * @private
     */
    getAdherenceColor(adherence) {
        if (adherence >= 90) return '#10b981'; // green
        if (adherence >= 70) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    }

    /**
     * Gets adherence rating text
     * @private
     */
    getAdherenceRating(adherence) {
        if (adherence >= 90) return 'Excellent';
        if (adherence >= 80) return 'Good';
        if (adherence >= 70) return 'Fair';
        if (adherence >= 60) return 'Poor';
        return 'Critical';
    }

    /**
     * Generates quick summary report
     * @param {Object} summaryData - summary data
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateQuickSummary(summaryData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    resolve(Buffer.concat(buffers));
                });

                // quick summary header
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .fillColor(this.primaryColor)
                   .text('Quick Health Summary', { align: 'center' });

                doc.moveDown(1);
                doc.fillColor('black');

                // patient info
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text(`Patient: ${summaryData.patientName}`);

                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`Date: ${new Date().toLocaleDateString('en-SG')}`);

                doc.moveDown(1);

                // key metrics
                const metrics = [
                    `Medication Adherence: ${summaryData.adherence || 0}%`,
                    `Active Medications: ${summaryData.activeMedications || 0}`,
                    `Upcoming Appointments: ${summaryData.upcomingAppointments || 0}`,
                    `Last Health Check: ${summaryData.lastHealthCheck || 'N/A'}`
                ];

                metrics.forEach(metric => {
                    doc.text(`• ${metric}`);
                });

                doc.moveDown(1);

                // status
                const status = summaryData.adherence >= 80 ? 'Good' : 
                              summaryData.adherence >= 60 ? 'Needs Attention' : 'Critical';
                
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .fillColor(this.getAdherenceColor(summaryData.adherence))
                   .text(`Overall Status: ${status}`);

                this.addFooter(doc);
                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new PDFGenerator();