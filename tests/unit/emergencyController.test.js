const request = require('supertest');
const express = require('express');
const emergencyContactsController = require('../../controllers/emergencyContactController');
const smsService = require('../../utils/smsService');
const emailService = require('../../utils/emailService');

// Mock dependencies
jest.mock('mssql');
jest.mock('../../dbConfig');
jest.mock('../../utils/smsService');
jest.mock('../../utils/emailService');

describe('Emergency Contacts Controller Tests', () => {
    let app;
    let mockPool;
    let mockRequest;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        
        // Mock authentication middleware
        app.use((req, res, next) => {
            req.user = { id: 1, email: 'user@example.com' };
            next();
        });
        
        // Setup routes
        app.get('/api/emergency-contacts', emergencyContactsController.getEmergencyContacts);
        app.post('/api/emergency-contacts', emergencyContactsController.addEmergencyContact);
        app.put('/api/emergency-contacts/:contactId', emergencyContactsController.updateEmergencyContact);
        app.delete('/api/emergency-contacts/:contactId', emergencyContactsController.deleteEmergencyContact);
        app.post('/api/emergency-contacts/test-alert/:contactId', emergencyContactsController.testEmergencyAlert);
        app.get('/api/emergency-contacts/alerts/history', emergencyContactsController.getEmergencyAlertHistory);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup SQL mocks
        const sql = require('mssql');
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
        };
        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest)
        };
        sql.connect.mockResolvedValue(mockPool);
    });

    describe('GET /api/emergency-contacts - Get Emergency Contacts', () => {
        it('should retrieve all emergency contacts for user', async () => {
            const mockContacts = [
                {
                    contactId: 1,
                    contactName: 'John Doe',
                    relationship: 'son',
                    phoneNumber: '+6591234567',
                    email: 'john@example.com',
                    priority: 1,
                    isActive: true,
                    alertDelayHours: 0
                },
                {
                    contactId: 2,
                    contactName: 'Jane Smith',
                    relationship: 'daughter',
                    phoneNumber: '+6598765432',
                    email: 'jane@example.com',
                    priority: 2,
                    isActive: true,
                    alertDelayHours: 2
                }
            ];

            mockRequest.query.mockResolvedValue({ recordset: mockContacts });

            const response = await request(app)
                .get('/api/emergency-contacts')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.contacts).toEqual(mockContacts);
            expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.any(Object), 1);
        });

        it('should handle user with no emergency contacts', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(app)
                .get('/api/emergency-contacts')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.contacts).toEqual([]);
            expect(response.body.message).toBe('No emergency contacts found');
        });
    });

    describe('POST /api/emergency-contacts - Add Emergency Contact', () => {
        it('should successfully add new emergency contact', async () => {
            const contactData = {
                contactName: 'Emergency Contact',
                relationship: 'friend',
                phoneNumber: '+6591234567',
                email: 'emergency@example.com',
                priority: 1,
                alertDelayHours: 0
            };

            const mockNewContact = {
                contactId: 1,
                ...contactData,
                userId: 1,
                isActive: true
            };

            mockRequest.query.mockResolvedValue({ recordset: [mockNewContact] });

            const response = await request(app)
                .post('/api/emergency-contacts')
                .send(contactData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Emergency contact added successfully');
            expect(response.body.data.contact).toEqual(mockNewContact);
        });

        it('should validate required fields', async () => {
            const invalidData = {
                contactName: '', // Empty name
                relationship: 'invalid_relationship',
                phoneNumber: 'invalid_phone'
            };

            const response = await request(app)
                .post('/api/emergency-contacts')
                .send(invalidData)
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeInstanceOf(Array);
        });

        it('should validate Singapore phone number format', async () => {
            const invalidData = {
                contactName: 'Test Contact',
                relationship: 'friend',
                phoneNumber: '1234567890', // Invalid Singapore format
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/api/emergency-contacts')
                .send(invalidData)
                .expect(400);

            expect(response.body.errors).toContain('Invalid Singapore phone number format. Use format: +6591234567 or 91234567');
        });
    });

    describe('PUT /api/emergency-contacts/:contactId - Update Emergency Contact', () => {
        it('should successfully update emergency contact', async () => {
            const updateData = {
                phoneNumber: '+6598765432',
                alertDelayHours: 1
            };

            const mockUpdatedContact = {
                contactId: 1,
                contactName: 'Updated Contact',
                phoneNumber: '+6598765432',
                alertDelayHours: 1
            };

            mockRequest.query.mockResolvedValue({ recordset: [mockUpdatedContact] });

            const response = await request(app)
                .put('/api/emergency-contacts/1')
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Emergency contact updated successfully');
        });

        it('should return error for non-existent contact', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(app)
                .put('/api/emergency-contacts/999')
                .send({ phoneNumber: '+6591234567' })
                .expect(404);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Emergency contact not found');
        });
    });

    describe('DELETE /api/emergency-contacts/:contactId - Delete Emergency Contact', () => {
        it('should successfully delete emergency contact', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const response = await request(app)
                .delete('/api/emergency-contacts/1')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Emergency contact deleted successfully');
        });

        it('should return error for non-existent contact', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

            const response = await request(app)
                .delete('/api/emergency-contacts/999')
                .expect(404);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Emergency contact not found');
        });
    });

    describe('POST /api/emergency-contacts/test-alert/:contactId - Test Emergency Alert', () => {
        it('should successfully send test alert via SMS', async () => {
            const mockContact = {
                contactId: 1,
                contactName: 'Test Contact',
                phoneNumber: '+6591234567',
                email: 'test@example.com'
            };

            mockRequest.query.mockResolvedValue({ recordset: [mockContact] });
            smsService.sendSMS.mockResolvedValue({ success: true, sid: 'test_sid' });

            const response = await request(app)
                .post('/api/emergency-contacts/test-alert/1')
                .send({ method: 'sms' })
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Test alert sent successfully');
            expect(smsService.sendSMS).toHaveBeenCalledWith(
                mockContact.phoneNumber,
                expect.stringContaining('This is a test alert')
            );
        });

        it('should successfully send test alert via email', async () => {
            const mockContact = {
                contactId: 1,
                contactName: 'Test Contact',
                phoneNumber: '+6591234567',
                email: 'test@example.com'
            };

            mockRequest.query.mockResolvedValue({ recordset: [mockContact] });
            emailService.sendEmail.mockResolvedValue({ success: true, messageId: 'test_msg' });

            const response = await request(app)
                .post('/api/emergency-contacts/test-alert/1')
                .send({ method: 'email' })
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(emailService.sendEmail).toHaveBeenCalled();
        });

        it('should handle SMS service failures', async () => {
            const mockContact = {
                contactId: 1,
                phoneNumber: '+6591234567'
            };

            mockRequest.query.mockResolvedValue({ recordset: [mockContact] });
            smsService.sendSMS.mockResolvedValue({ success: false, error: 'SMS service unavailable' });

            const response = await request(app)
                .post('/api/emergency-contacts/test-alert/1')
                .send({ method: 'sms' })
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to send test alert');
        });
    });

    describe('GET /api/emergency-contacts/alerts/history - Get Alert History', () => {
        it('should retrieve alert history with pagination', async () => {
            const mockAlerts = [
                {
                    alertId: 1,
                    alertType: 'medication_missed',
                    alertMessage: 'Medication reminder',
                    sentVia: 'sms',
                    deliveryStatus: 'delivered',
                    sentAt: '2025-08-01T10:00:00Z'
                }
            ];

            mockRequest.query.mockResolvedValue({ recordset: mockAlerts });

            const response = await request(app)
                .get('/api/emergency-contacts/alerts/history?limit=10')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.alerts).toEqual(mockAlerts);
        });

        it('should handle query parameters for filtering', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(app)
                .get('/api/emergency-contacts/alerts/history?alertType=medication_missed&status=delivered')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(mockRequest.input).toHaveBeenCalledWith('alertType', expect.any(Object), 'medication_missed');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle database connection failures', async () => {
            const sql = require('mssql');
            sql.connect.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/api/emergency-contacts')
                .expect(500);

            expect(response.body.status).toBe('error');
        });

        it('should validate contact ID parameters', async () => {
            const response = await request(app)
                .put('/api/emergency-contacts/invalid_id')
                .send({ phoneNumber: '+6591234567' })
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Invalid contact ID');
        });

        it('should handle empty update data', async () => {
            const response = await request(app)
                .put('/api/emergency-contacts/1')
                .send({}) // Empty update
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('At least one field must be provided for update');
        });
    });
});