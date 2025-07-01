const request = require('supertest');
const jwt = require('jsonwebtoken');

// mock dependencies before importing the app
jest.mock('../config/database');
jest.mock('../services/notificationService');
jest.mock('../services/qrService');

const app = require('../app');
const mockDb = require('../config/database');
const mockNotificationService = require('../services/notificationService');
const mockQrService = require('../services/qrService');

describe('Medication Controller - CircleAge Module 1', () => {
    let authToken;
    let testUserId = 1;

    beforeAll(() => {
        // create a valid JWT token for testing
        authToken = jwt.sign(
            { userId: testUserId, role: 'user', email: 'test@email.com' },
            process.env.JWT_SECRET || '8a565d60e466634f84990a3c51807971d1ed386c4ec14c4a9c3ed7fa145dfe75',
            { expiresIn: '1h' }
        );

        // mock QR service
        mockQrService.generateQRCode = jest.fn().mockResolvedValue('data:image/png;base64,mockedqrcode');
    });

    beforeEach(() => {
        // reset mock data before each test
        mockDb.mockData = {
            medications: [],
            appointments: [],
            emergencyContacts: [],
            healthRecords: []
        };
        mockNotificationService.clearNotifications();
        jest.clearAllMocks();
    });

    describe('POST /api/medications', () => {
        test('should create new medication successfully with QR code', async () => {
            const medicationData = {
                userId: testUserId,
                name: 'Aspirin',
                dosage: '100mg',
                frequency: 'Once daily',
                timing: '08:00',
                startDate: '2025-07-01',
                instructions: 'Take with food to avoid stomach upset',
                prescribedBy: 'Dr. John Smith',
                category: 'Heart Health'
            };

            const response = await request(app)
                .post('/api/medications')
                .set('Cookie', [`jwt=${authToken}`]) // cookie-based auth
                .send(medicationData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.medication.name).toBe('Aspirin');
            expect(response.body.data.medication.dosage).toBe('100mg');
            expect(response.body.data.qrCodeImage).toBeDefined();
            expect(mockQrService.generateQRCode).toHaveBeenCalledTimes(1);
            expect(mockNotificationService.notifyMedicationAdded).toHaveBeenCalledWith(
                testUserId, 
                expect.objectContaining({ name: 'Aspirin' })
            );
        });

        test('should return validation error for missing required fields', async () => {
            const invalidData = {
                userId: testUserId,
                name: '', // invalid: empty name
                dosage: '10mg'
                // missing required fields
            };

            const response = await request(app)
                .post('/api/medications')
                .set('Cookie', [`jwt=${authToken}`])
                .send(invalidData)
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeDefined();
        });

        test('should return 401 without authentication cookie', async () => {
            const medicationData = {
                userId: testUserId,
                name: 'Test Medication',
                dosage: '10mg'
            };

            const response = await request(app)
                .post('/api/medications')
                .send(medicationData)
                .expect(401);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Access token is required for this operation');
        });

        test('should return 403 with invalid JWT token', async () => {
            const medicationData = {
                userId: testUserId,
                name: 'Test Medication',
                dosage: '10mg'
            };

            const response = await request(app)
                .post('/api/medications')
                .set('Cookie', ['jwt=invalid_token'])
                .send(medicationData)
                .expect(403);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Invalid or expired token');
        });
    });

    describe('GET /api/medications/user/:userId', () => {
        beforeEach(async () => {
            // add test medications to mock database
            await mockDb.executeQuery('INSERT INTO Medications', {
                user_id: testUserId,
                name: 'Lisinopril',
                dosage: '10mg',
                frequency: 'Once daily',
                timing: '08:00',
                category: 'Heart Health',
                active: 1
            });

            await mockDb.executeQuery('INSERT INTO Medications', {
                user_id: testUserId,
                name: 'Metformin',
                dosage: '500mg',
                frequency: 'Twice daily',
                timing: '08:00,20:00',
                category: 'Diabetes',
                active: 1
            });
        });

        test('should retrieve all medications for user', async () => {
            const response = await request(app)
                .get(`/api/medications/user/${testUserId}`)
                .set('Cookie', [`jwt=${authToken}`])
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.medications).toBeDefined();
            expect(Array.isArray(response.body.data.medications)).toBe(true);
            expect(response.body.data.medications.length).toBe(2);
            expect(response.body.data.count).toBe(2);
        });

        test('should filter medications by category', async () => {
            const response = await request(app)
                .get(`/api/medications/user/${testUserId}?category=Heart Health`)
                .set('Cookie', [`jwt=${authToken}`])
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.medications.length).toBe(1);
            expect(response.body.data.medications[0].category).toBe('Heart Health');
        });

        test('should filter active medications only', async () => {
            // add inactive medication
            await mockDb.executeQuery('INSERT INTO Medications', {
                user_id: testUserId,
                name: 'Inactive Med',
                dosage: '5mg',
                active: 0
            });

            const response = await request(app)
                .get(`/api/medications/user/${testUserId}?active=true`)
                .set('Cookie', [`jwt=${authToken}`])
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.medications.length).toBe(2); // only active ones
        });
    });

    describe('POST /api/medications/:medicationId/take', () => {
        let testMedicationId;

        beforeEach(async () => {
            const result = await mockDb.executeQuery('INSERT INTO Medications', {
                user_id: testUserId,
                name: 'Test Medication',
                dosage: '10mg'
            });
            testMedicationId = result.recordset[0].medication_id;
        });

        test('should mark medication as taken successfully', async () => {
            const response = await request(app)
                .post(`/api/medications/${testMedicationId}/take`)
                .set('Cookie', [`jwt=${authToken}`])
                .send({ notes: 'Taken with breakfast as prescribed' })
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Medication marked as taken');
            expect(response.body.data.medicationId).toBe(testMedicationId);
            expect(response.body.data.notes).toBe('Taken with breakfast as prescribed');
        });

        test('should mark medication as taken without notes', async () => {
            const response = await request(app)
                .post(`/api/medications/${testMedicationId}/take`)
                .set('Cookie', [`jwt=${authToken}`])
                .send({})
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.notes).toBe('');
        });
    });

    describe('PUT /api/medications/:medicationId', () => {
        let testMedicationId;

        beforeEach(async () => {
            const result = await mockDb.executeQuery('INSERT INTO Medications', {
                user_id: testUserId,
                name: 'Test Medication',
                dosage: '10mg',
                instructions: 'Original instructions'
            });
            testMedicationId = result.recordset[0].medication_id;
        });

        test('should update medication successfully', async () => {
            const updateData = {
                dosage: '20mg',
                instructions: 'Updated instructions - take with dinner'
            };

            const response = await request(app)
                .put(`/api/medications/${testMedicationId}`)
                .set('Cookie', [`jwt=${authToken}`])
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.medication.dosage).toBe('20mg');
            expect(response.body.data.medication.instructions).toBe('Updated instructions - take with dinner');
        });

        test('should return 400 when no fields to update', async () => {
            const response = await request(app)
                .put(`/api/medications/${testMedicationId}`)
                .set('Cookie', [`jwt=${authToken}`])
                .send({})
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('No valid fields to update');
        });
    });

    describe('DELETE /api/medications/:medicationId', () => {
        let testMedicationId;

        beforeEach(async () => {
            const result = await mockDb.executeQuery('INSERT INTO Medications', {
                user_id: testUserId,
                name: 'Test Medication To Delete',
                dosage: '10mg'
            });
            testMedicationId = result.recordset[0].medication_id;
        });

        test('should soft delete medication successfully', async () => {
            const response = await request(app)
                .delete(`/api/medications/${testMedicationId}`)
                .set('Cookie', [`jwt=${authToken}`])
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toContain('has been removed');
            expect(mockNotificationService.notifyMedicationRemoved).toHaveBeenCalledWith(
                testUserId,
                'Test Medication To Delete'
            );
        });
    });

    describe('GET /api/medications/user/:userId/adherence-report', () => {
        test('should generate adherence report', async () => {
            const response = await request(app)
                .get(`/api/medications/user/${testUserId}/adherence-report`)
                .set('Cookie', [`jwt=${authToken}`])
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.adherenceReport).toBeDefined();
            expect(response.body.data.period).toBeDefined();
        });

        test('should generate adherence report with date filters', async () => {
            const response = await request(app)
                .get(`/api/medications/user/${testUserId}/adherence-report?startDate=2025-06-01&endDate=2025-07-01`)
                .set('Cookie', [`jwt=${authToken}`])
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.period.startDate).toBe('2025-06-01');
            expect(response.body.data.period.endDate).toBe('2025-07-01');
        });
    });
});