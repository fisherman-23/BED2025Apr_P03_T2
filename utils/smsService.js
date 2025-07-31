const twilio = require('twilio');

class SMSService {
    constructor() {
        // initialize Twilio client with credentials from environment variables
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
        
        if (!this.accountSid || !this.authToken || !this.fromNumber) {
            console.warn('Twilio credentials not configured. SMS service will use mock mode.');
            this.mockMode = true;
        } else {
            this.client = twilio(this.accountSid, this.authToken);
            this.mockMode = false;
        }
    }

    /**
     * Sends SMS medication reminder to user
     * @param {string} phoneNumber - recipient phone number
     * @param {Object} medicationData - medication details
     * @returns {Promise<Object>} - SMS delivery result
     */
    async sendMedicationReminder(phoneNumber, medicationData) {
        try {
            const message = this.formatMedicationReminderMessage(medicationData);
            
            if (this.mockMode) {
                console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
                return {
                    success: true,
                    sid: 'mock_' + Date.now(),
                    status: 'delivered',
                    mockMode: true
                };
            }

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: this.formatPhoneNumber(phoneNumber)
            });

            return {
                success: true,
                sid: result.sid,
                status: result.status,
                dateCreated: result.dateCreated
            };

        } catch (error) {
            console.error('Error sending medication reminder SMS:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Sends pre-reminder SMS (15 minutes before dose)
     * @param {string} phoneNumber - recipient phone number
     * @param {Object} medicationData - medication details
     * @returns {Promise<Object>} - SMS delivery result
     */
    async sendPreReminder(phoneNumber, medicationData) {
        try {
            const message = `⏰ REMINDER: Take your ${medicationData.name} (${medicationData.dosage}) in 15 minutes. ${medicationData.instructions || ''} Reply TAKEN when completed.`;
            
            if (this.mockMode) {
                console.log(`[MOCK SMS] Pre-reminder to: ${phoneNumber}, Message: ${message}`);
                return {
                    success: true,
                    sid: 'mock_pre_' + Date.now(),
                    status: 'delivered',
                    mockMode: true
                };
            }

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: this.formatPhoneNumber(phoneNumber)
            });

            return {
                success: true,
                sid: result.sid,
                status: result.status,
                type: 'pre_reminder'
            };

        } catch (error) {
            console.error('Error sending pre-reminder SMS:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sends escalating reminder for missed medication
     * @param {string} phoneNumber - recipient phone number
     * @param {Object} medicationData - medication details
     * @param {number} escalationLevel - 1-4 (increasing urgency)
     * @returns {Promise<Object>} - SMS delivery result
     */
    async sendMissedMedicationAlert(phoneNumber, medicationData, escalationLevel = 1) {
        try {
            const message = this.formatMissedMedicationMessage(medicationData, escalationLevel);
            
            if (this.mockMode) {
                console.log(`[MOCK SMS] Missed med alert to: ${phoneNumber}, Level: ${escalationLevel}, Message: ${message}`);
                return {
                    success: true,
                    sid: 'mock_missed_' + Date.now(),
                    status: 'delivered',
                    mockMode: true,
                    escalationLevel
                };
            }

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: this.formatPhoneNumber(phoneNumber)
            });

            return {
                success: true,
                sid: result.sid,
                status: result.status,
                escalationLevel,
                type: 'missed_medication'
            };

        } catch (error) {
            console.error('Error sending missed medication alert:', error);
            return {
                success: false,
                error: error.message,
                escalationLevel
            };
        }
    }

    /**
     * Sends emergency alert to emergency contact
     * @param {string} phoneNumber - emergency contact phone number
     * @param {Object} emergencyData - emergency details
     * @returns {Promise<Object>} - SMS delivery result
     */
    async sendEmergencyAlert(phoneNumber, emergencyData) {
        try {
            const message = this.formatEmergencyMessage(emergencyData);
            
            if (this.mockMode) {
                console.log(`[MOCK SMS] Emergency alert to: ${phoneNumber}, Message: ${message}`);
                return {
                    success: true,
                    sid: 'mock_emergency_' + Date.now(),
                    status: 'delivered',
                    mockMode: true
                };
            }

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: this.formatPhoneNumber(phoneNumber)
            });

            return {
                success: true,
                sid: result.sid,
                status: result.status,
                type: 'emergency_alert'
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
     * Sends caregiver notification alert
     * @param {string} phoneNumber - caregiver phone number
     * @param {Object} alertData - alert details
     * @returns {Promise<Object>} - SMS delivery result
     */
    async sendCaregiverAlert(phoneNumber, alertData) {
        try {
            const message = this.formatCaregiverAlertMessage(alertData);
            
            if (this.mockMode) {
                console.log(`[MOCK SMS] Caregiver alert to: ${phoneNumber}, Message: ${message}`);
                return {
                    success: true,
                    sid: 'mock_caregiver_' + Date.now(),
                    status: 'delivered',
                    mockMode: true
                };
            }

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: this.formatPhoneNumber(phoneNumber)
            });

            return {
                success: true,
                sid: result.sid,
                status: result.status,
                type: 'caregiver_alert'
            };

        } catch (error) {
            console.error('Error sending caregiver alert:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Formats medication reminder message
     * @param {Object} medicationData - medication details
     * @returns {string} - formatted message
     */
    formatMedicationReminderMessage(medicationData) {
        let message = `💊 MEDICATION REMINDER: It's time to take your ${medicationData.name} (${medicationData.dosage}).`;
        
        if (medicationData.instructions) {
            message += ` ${medicationData.instructions}`;
        }
        
        message += ` Reply TAKEN when completed or SKIP if not taking today.`;
        
        return message;
    }

    /**
     * Formats missed medication alert message based on escalation level
     * @param {Object} medicationData - medication details
     * @param {number} escalationLevel - urgency level
     * @returns {string} - formatted message
     */
    formatMissedMedicationMessage(medicationData, escalationLevel) {
        const urgencyMarkers = ['⚠️', '⚠️⚠️', '🚨', '🚨🚨'];
        const urgencyTexts = [
            'MISSED DOSE',
            'IMPORTANT: MISSED DOSE',
            'URGENT: MEDICATION MISSED',
            'CRITICAL: PLEASE TAKE MEDICATION'
        ];

        const marker = urgencyMarkers[escalationLevel - 1] || '⚠️';
        const urgencyText = urgencyTexts[escalationLevel - 1] || 'MISSED DOSE';

        let message = `${marker} ${urgencyText}: You missed your ${medicationData.name} (${medicationData.dosage}).`;
        
        if (escalationLevel >= 3) {
            message += ` This medication is important for your health.`;
        }
        
        message += ` Please take it now if safe to do so, or contact your doctor. Reply TAKEN when completed.`;
        
        return message;
    }

    /**
     * Formats emergency alert message
     * @param {Object} emergencyData - emergency details
     * @returns {string} - formatted message
     */
    formatEmergencyMessage(emergencyData) {
        let message = `🚨 EMERGENCY ALERT: ${emergencyData.patientName} needs assistance.`;
        
        if (emergencyData.reason) {
            message += ` Reason: ${emergencyData.reason}.`;
        }
        
        if (emergencyData.location) {
            message += ` Location: ${emergencyData.location}.`;
        }
        
        if (emergencyData.patientPhone) {
            message += ` Contact them at ${emergencyData.patientPhone}.`;
        }
        
        message += ` This is an automated alert from Senior Care app.`;
        
        return message;
    }

    /**
     * Formats caregiver alert message
     * @param {Object} alertData - alert details
     * @returns {string} - formatted message
     */
    formatCaregiverAlertMessage(alertData) {
        let message = `📱 CAREGIVER ALERT: ${alertData.patientName}`;
        
        switch (alertData.type) {
            case 'medication_missed':
                message += ` has missed their ${alertData.medicationName} medication.`;
                break;
            case 'low_adherence':
                message += ` has low medication adherence (${alertData.adherenceRate}% this week).`;
                break;
            case 'health_concern':
                message += ` has reported concerning health metrics.`;
                break;
            default:
                message += ` requires attention.`;
        }
        
        message += ` Check the Senior Care app for more details.`;
        
        return message;
    }

    /**
     * Formats phone number for Singapore standards
     * @param {string} phoneNumber - input phone number
     * @returns {string} - formatted phone number
     */
    formatPhoneNumber(phoneNumber) {
        // remove all non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // handle Singapore phone numbers
        if (cleaned.startsWith('65')) {
            // already has country code
            return '+' + cleaned;
        } else if (cleaned.length === 8) {
            // local number, add country code
            return '+65' + cleaned;
        } else {
            // assume it's already formatted correctly
            return phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
        }
    }

    /**
     * Validates phone number format
     * @param {string} phoneNumber - phone number to validate
     * @returns {boolean} - true if valid
     */
    isValidPhoneNumber(phoneNumber) {
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Singapore phone number validation
        return (
            (cleaned.length === 8 && /^[689]/.test(cleaned)) || // local format
            (cleaned.length === 10 && cleaned.startsWith('65') && /^65[689]/.test(cleaned)) // with country code
        );
    }

    /**
     * Gets SMS delivery status
     * @param {string} messageSid - Twilio message SID
     * @returns {Promise<Object>} - delivery status
     */
    async getDeliveryStatus(messageSid) {
        if (this.mockMode) {
            return {
                sid: messageSid,
                status: 'delivered',
                mockMode: true
            };
        }

        try {
            const message = await this.client.messages(messageSid).fetch();
            return {
                sid: message.sid,
                status: message.status,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage,
                dateCreated: message.dateCreated,
                dateSent: message.dateSent
            };
        } catch (error) {
            console.error('Error fetching SMS status:', error);
            return {
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Sends bulk SMS messages
     * @param {Array} messages - array of message objects {phoneNumber, message}
     * @returns {Promise<Array>} - array of results
     */
    async sendBulkSMS(messages) {
        const results = [];
        
        for (const msg of messages) {
            try {
                const result = await this.sendSMS(msg.phoneNumber, msg.message);
                results.push({
                    phoneNumber: msg.phoneNumber,
                    ...result
                });
                
                // add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                results.push({
                    phoneNumber: msg.phoneNumber,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Generic SMS sending method
     * @param {string} phoneNumber - recipient phone number
     * @param {string} message - message content
     * @returns {Promise<Object>} - SMS delivery result
     */
    async sendSMS(phoneNumber, message) {
        try {
            if (!this.isValidPhoneNumber(phoneNumber)) {
                throw new Error('Invalid phone number format');
            }

            if (!message || message.length > 1600) {
                throw new Error('Message is required and must not exceed 1600 characters');
            }

            if (this.mockMode) {
                console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
                return {
                    success: true,
                    sid: 'mock_' + Date.now(),
                    status: 'delivered',
                    mockMode: true
                };
            }

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: this.formatPhoneNumber(phoneNumber)
            });

            return {
                success: true,
                sid: result.sid,
                status: result.status,
                dateCreated: result.dateCreated
            };

        } catch (error) {
            console.error('Error sending SMS:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }
}

module.exports = new SMSService();