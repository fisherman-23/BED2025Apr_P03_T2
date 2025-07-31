const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // initialize email transporter with environment variables
        this.transporter = null;
        this.mockMode = false;
        
        this.initializeTransporter();
    }

    /**
     * Initializes email transporter based on environment configuration
     * @private
     */
    initializeTransporter() {
        try {
            // check for email service configuration
            if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                console.warn('Email service credentials not configured. Email service will use mock mode.');
                this.mockMode = true;
                return;
            }

            // create transporter based on service type
            const service = process.env.EMAIL_SERVICE.toLowerCase();
            
            if (service === 'gmail') {
                this.transporter = nodemailer.createTransporter({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS // use app password for Gmail
                    }
                });
            } else if (service === 'outlook') {
                this.transporter = nodemailer.createTransporter({
                    service: 'hotmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
            } else if (service === 'smtp') {
                // custom SMTP configuration
                this.transporter = nodemailer.createTransporter({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
            } else {
                throw new Error('Unsupported email service');
            }

            // verify transporter configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('Email transporter verification failed:', error);
                    this.mockMode = true;
                } else {
                    console.log('Email service ready');
                }
            });

        } catch (error) {
            console.error('Error initializing email transporter:', error);
            this.mockMode = true;
        }
    }

    /**
     * Sends appointment confirmation email
     * @param {string} recipientEmail - recipient email address
     * @param {Object} appointmentData - appointment details
     * @returns {Promise<Object>} - email delivery result
     */
    async sendAppointmentConfirmation(recipientEmail, appointmentData) {
        try {
            const subject = `Appointment Confirmation - ${appointmentData.doctorName}`;
            const htmlContent = this.generateAppointmentConfirmationHTML(appointmentData);
            const textContent = this.generateAppointmentConfirmationText(appointmentData);

            if (this.mockMode) {
                console.log(`[MOCK EMAIL] To: ${recipientEmail}`);
                console.log(`Subject: ${subject}`);
                console.log(`Content: ${textContent}`);
                return {
                    success: true,
                    messageId: 'mock_' + Date.now(),
                    mockMode: true
                };
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipientEmail,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };

        } catch (error) {
            console.error('Error sending appointment confirmation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sends appointment reminder email
     * @param {string} recipientEmail - recipient email address
     * @param {Object} appointmentData - appointment details
     * @returns {Promise<Object>} - email delivery result
     */
    async sendAppointmentReminder(recipientEmail, appointmentData) {
        try {
            const subject = `Reminder: Appointment Tomorrow - ${appointmentData.doctorName}`;
            const htmlContent = this.generateAppointmentReminderHTML(appointmentData);
            const textContent = this.generateAppointmentReminderText(appointmentData);

            if (this.mockMode) {
                console.log(`[MOCK EMAIL] Reminder to: ${recipientEmail}`);
                console.log(`Subject: ${subject}`);
                return {
                    success: true,
                    messageId: 'mock_reminder_' + Date.now(),
                    mockMode: true
                };
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipientEmail,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };

        } catch (error) {
            console.error('Error sending appointment reminder:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sends medication adherence report to caregiver
     * @param {string} recipientEmail - caregiver email
     * @param {Object} reportData - adherence report data
     * @param {Buffer} pdfAttachment - optional PDF attachment
     * @returns {Promise<Object>} - email delivery result
     */
    async sendAdherenceReport(recipientEmail, reportData, pdfAttachment = null) {
        try {
            const subject = `Medication Adherence Report - ${reportData.patientName}`;
            const htmlContent = this.generateAdherenceReportHTML(reportData);
            const textContent = this.generateAdherenceReportText(reportData);

            if (this.mockMode) {
                console.log(`[MOCK EMAIL] Adherence report to: ${recipientEmail}`);
                console.log(`Subject: ${subject}`);
                console.log(`Attachment: ${pdfAttachment ? 'PDF Included' : 'No attachment'}`);
                return {
                    success: true,
                    messageId: 'mock_report_' + Date.now(),
                    mockMode: true
                };
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipientEmail,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            // add PDF attachment if provided
            if (pdfAttachment) {
                mailOptions.attachments = [{
                    filename: `medication-report-${reportData.patientName}-${new Date().toISOString().split('T')[0]}.pdf`,
                    content: pdfAttachment,
                    contentType: 'application/pdf'
                }];
            }

            const result = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };

        } catch (error) {
            console.error('Error sending adherence report:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sends emergency alert email to emergency contacts
     * @param {string} recipientEmail - emergency contact email
     * @param {Object} alertData - emergency alert details
     * @returns {Promise<Object>} - email delivery result
     */
    async sendEmergencyAlert(recipientEmail, alertData) {
        try {
            const subject = `⚠️ URGENT: Medication Alert - ${alertData.patientName}`;
            const htmlContent = this.generateEmergencyAlertHTML(alertData);
            const textContent = this.generateEmergencyAlertText(alertData);

            if (this.mockMode) {
                console.log(`[MOCK EMAIL] Emergency alert to: ${recipientEmail}`);
                console.log(`Subject: ${subject}`);
                return {
                    success: true,
                    messageId: 'mock_emergency_' + Date.now(),
                    mockMode: true
                };
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipientEmail,
                subject: subject,
                text: textContent,
                html: htmlContent,
                priority: 'high'
            };

            const result = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };

        } catch (error) {
            console.error('Error sending emergency alert:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validates email address format
     * @param {string} email - email address to validate
     * @returns {boolean} - true if valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // HTML template generators
    /**
     * Generates HTML for appointment confirmation
     * @private
     */
    generateAppointmentConfirmationHTML(appointmentData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #D7E961 0%, #78B5D3 100%); color: #000; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .details { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
                .footer { text-align: center; padding: 15px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏥 Appointment Confirmed</h1>
                </div>
                <div class="content">
                    <p>Dear ${appointmentData.patientName || 'Patient'},</p>
                    <p>Your appointment has been successfully confirmed!</p>
                    
                    <div class="details">
                        <h3>Appointment Details:</h3>
                        <p><strong>Doctor:</strong> ${appointmentData.doctorName}</p>
                        <p><strong>Specialty:</strong> ${appointmentData.specialty || 'General Practice'}</p>
                        <p><strong>Date & Time:</strong> ${new Date(appointmentData.appointmentDate).toLocaleString('en-SG')}</p>
                        <p><strong>Duration:</strong> ${appointmentData.duration || 30} minutes</p>
                        <p><strong>Reason:</strong> ${appointmentData.reason}</p>
                        <p><strong>Location:</strong> ${appointmentData.address}</p>
                    </div>
                    
                    <p><strong>Preparation Notes:</strong></p>
                    <p>${appointmentData.notes || 'Please arrive 15 minutes early for registration.'}</p>
                    
                    <p>If you need to reschedule or cancel, please contact the clinic at least 24 hours in advance.</p>
                </div>
                <div class="footer">
                    <p>CircleAge - Your Health Companion</p>
                </div>
            </div>
        </body>
        </html>`;
    }

    /**
     * Generates text for appointment confirmation
     * @private
     */
    generateAppointmentConfirmationText(appointmentData) {
        return `
APPOINTMENT CONFIRMED

Dear ${appointmentData.patientName || 'Patient'},

Your appointment has been successfully confirmed!

APPOINTMENT DETAILS:
Doctor: ${appointmentData.doctorName}
Specialty: ${appointmentData.specialty || 'General Practice'}
Date & Time: ${new Date(appointmentData.appointmentDate).toLocaleString('en-SG')}
Duration: ${appointmentData.duration || 30} minutes
Reason: ${appointmentData.reason}
Location: ${appointmentData.address}

Preparation Notes:
${appointmentData.notes || 'Please arrive 15 minutes early for registration.'}

If you need to reschedule or cancel, please contact the clinic at least 24 hours in advance.

CircleAge - Your Health Companion
        `;
    }

    /**
     * Generates HTML for appointment reminder
     * @private
     */
    generateAppointmentReminderHTML(appointmentData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #7161E9 0%, #D7E961 100%); color: #000; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .reminder { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 8px; }
                .details { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Appointment Reminder</h1>
                </div>
                <div class="content">
                    <div class="reminder">
                        <h3>Your appointment is tomorrow!</h3>
                        <p>Don't forget about your upcoming medical appointment.</p>
                    </div>
                    
                    <div class="details">
                        <h3>Appointment Details:</h3>
                        <p><strong>Doctor:</strong> ${appointmentData.doctorName}</p>
                        <p><strong>Date & Time:</strong> ${new Date(appointmentData.appointmentDate).toLocaleString('en-SG')}</p>
                        <p><strong>Location:</strong> ${appointmentData.address}</p>
                    </div>
                    
                    <p><strong>Reminders:</strong></p>
                    <ul>
                        <li>Arrive 15 minutes early</li>
                        <li>Bring your IC and any referral letters</li>
                        <li>Bring your current medications list</li>
                        <li>Prepare any questions you want to ask</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>`;
    }

    /**
     * Generates text for appointment reminder
     * @private
     */
    generateAppointmentReminderText(appointmentData) {
        return `
APPOINTMENT REMINDER

Your appointment is tomorrow!

APPOINTMENT DETAILS:
Doctor: ${appointmentData.doctorName}
Date & Time: ${new Date(appointmentData.appointmentDate).toLocaleString('en-SG')}
Location: ${appointmentData.address}

REMINDERS:
- Arrive 15 minutes early
- Bring your IC and any referral letters
- Bring your current medications list
- Prepare any questions you want to ask

CircleAge - Your Health Companion
        `;
    }

    /**
     * Generates HTML for adherence report
     * @private
     */
    generateAdherenceReportHTML(reportData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #78B5D3 0%, #C1E3F4 100%); color: #000; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .stats { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
                .good { color: #10b981; font-weight: bold; }
                .warning { color: #f59e0b; font-weight: bold; }
                .poor { color: #ef4444; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Medication Adherence Report</h1>
                    <p>Patient: ${reportData.patientName}</p>
                </div>
                <div class="content">
                    <div class="stats">
                        <h3>Overall Adherence: <span class="${reportData.overallAdherence >= 90 ? 'good' : reportData.overallAdherence >= 70 ? 'warning' : 'poor'}">${reportData.overallAdherence}%</span></h3>
                        <p>Report Period: ${reportData.reportPeriod || 'Last 30 days'}</p>
                        <p>Total Medications: ${reportData.totalMedications || 0}</p>
                        <p>Missed Doses: ${reportData.missedDoses || 0}</p>
                    </div>
                    
                    <p>This automated report shows ${reportData.patientName}'s medication adherence over the specified period.</p>
                    <p>Please review and discuss any concerns with the healthcare provider.</p>
                </div>
            </div>
        </body>
        </html>`;
    }

    /**
     * Generates text for adherence report
     * @private
     */
    generateAdherenceReportText(reportData) {
        return `
MEDICATION ADHERENCE REPORT

Patient: ${reportData.patientName}
Overall Adherence: ${reportData.overallAdherence}%
Report Period: ${reportData.reportPeriod || 'Last 30 days'}
Total Medications: ${reportData.totalMedications || 0}
Missed Doses: ${reportData.missedDoses || 0}

This automated report shows medication adherence over the specified period.
Please review and discuss any concerns with the healthcare provider.

CircleAge - Your Health Companion
        `;
    }

    /**
     * Generates HTML for emergency alert
     * @private
     */
    generateEmergencyAlertHTML(alertData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #fef2f2; border: 2px solid #f87171; }
                .alert { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ URGENT MEDICATION ALERT</h1>
                </div>
                <div class="content">
                    <div class="alert">
                        <h3>Patient: ${alertData.patientName}</h3>
                        <p><strong>Alert:</strong> ${alertData.alertMessage}</p>
                        <p><strong>Time:</strong> ${new Date(alertData.alertTime || Date.now()).toLocaleString('en-SG')}</p>
                    </div>
                    
                    <p><strong>Action Required:</strong> Please check on ${alertData.patientName} immediately.</p>
                    <p>This is an automated alert from the CircleAge medication monitoring system.</p>
                </div>
            </div>
        </body>
        </html>`;
    }

    /**
     * Generates text for emergency alert
     * @private
     */
    generateEmergencyAlertText(alertData) {
        return `
⚠️ URGENT MEDICATION ALERT

Patient: ${alertData.patientName}
Alert: ${alertData.alertMessage}
Time: ${new Date(alertData.alertTime || Date.now()).toLocaleString('en-SG')}

ACTION REQUIRED: Please check on ${alertData.patientName} immediately.

This is an automated alert from the CircleAge medication monitoring system.

CircleAge - Your Health Companion
        `;
    }
}

module.exports = new EmailService();