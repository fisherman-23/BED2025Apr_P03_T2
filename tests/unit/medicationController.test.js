const request = require('supertest');
const app = require('../app');
const Medication = require('../models/medicationModel');

// mock the medication model
jest.mock('../models/medicationModel');

describe('Medication Controller', () => {
    let authToken;
    const mockUser = { id: 1, email: 'test@example.com' };

    beforeEach(() => {
        // reset all mocks
        jest.clearAllMocks();
        
        // mock JWT token
        authToken = 'mock-jwt-token';
    });

    describe('POST /api/medications', () => {
        test('should create a new medication successfully', async () => {
            const mockMedication = {
                medicationId: 1,
                userId: 1,
                name: 'Test Medication',
                dosage: '10mg',
                frequency: 'Once daily',
                timing: '08:00',
                startDate: '2024-01-01',
                category: 'Test'
            };

            const medicationData = {
                name: 'Test Medication',
                dosage: '10mg',
                frequency: 'Once daily',
                timing: '08:00',
                startDate: '2024-01-01',
                category: 'Test'
            };

            Medication.createMedication.mockResolvedValue(mockMedication);

            const response = await request(app)
                .post('/api/medications')
                .set('Cookie', [`token=${authToken}`])
                .send(medicationData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Medication created successfully');
            expect(response.body.medication).toEqual(mockMedication);
            expect(Medication.createMedication).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.id,
                    name: medicationData.name,
                    dosage: medicationData.dosage
                })
            );
        });

        test('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/medications')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'Test Medication'
                    // missing other required fields
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required fields');
        });

        test('should return 401 for unauthorized access', async () => {
            const response = await request(app)
                .post('/api/medications')
                .send({
                    name: 'Test Medication',
                    dosage: '10mg',
                    frequency: 'Once daily',
                    timing: '08:00',
                    startDate: '2024-01-01'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toContain('Access denied');
        });
    });

    describe('GET /api/medications', () => {
        test('should get all medications for user', async () => {
            const mockMedications = [
                {
                    medicationId: 1,
                    name: 'Medication 1',
                    dosage: '10mg',
                    complianceRate: 95
                },
                {
                    medicationId: 2,
                    name: 'Medication 2',
                    dosage: '5mg',
                    complianceRate: 88
                }
            ];

            Medication.getMedicationsByUserId.mockResolvedValue(mockMedications);

            const response = await request(app)
                .get('/api/medications')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Medications retrieved successfully');
            expect(response.body.medications).toEqual(mockMedications);
            expect(Medication.getMedicationsByUserId).toHaveBeenCalledWith(mockUser.id);
        });
    });

    describe('PUT /api/medications/:id', () => {
        test('should update a medication successfully', async () => {
            const medicationId = 1;
            const existingMedication = {
                medicationId,
                userId: mockUser.id,
                name: 'Old Name'
            };
            const updatedMedication = {
                medicationId,
                userId: mockUser.id,
                name: 'New Name'
            };
            const updateData = {
                name: 'New Name',
                dosage: '20mg',
                frequency: 'Twice daily',
                timing: '08:00,20:00'
            };

            Medication.getMedicationById.mockResolvedValue(existingMedication);
            Medication.updateMedication.mockResolvedValue(updatedMedication);

            const response = await request(app)
                .put(`/api/medications/${medicationId}`)
                .set('Cookie', [`token=${authToken}`])
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Medication updated successfully');
            expect(Medication.updateMedication).toHaveBeenCalledWith(
                medicationId,
                expect.objectContaining(updateData)
            );
        });

        test('should return 404 for non-existent medication', async () => {
            const medicationId = 999;
            Medication.getMedicationById.mockResolvedValue(null);

            const response = await request(app)
                .put(`/api/medications/${medicationId}`)
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'Test',
                    dosage: '10mg',
                    frequency: 'Once daily',
                    timing: '08:00'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Medication not found');
        });

        test('should return 403 for unauthorized medication access', async () => {
            const medicationId = 1;
            const otherUserMedication = {
                medicationId,
                userId: 999, // different user
                name: 'Test Medication'
            };

            Medication.getMedicationById.mockResolvedValue(otherUserMedication);

            const response = await request(app)
                .put(`/api/medications/${medicationId}`)
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'Test',
                    dosage: '10mg',
                    frequency: 'Once daily',
                    timing: '08:00'
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('POST /api/medications/:id/take', () => {
        test('should mark medication as taken successfully', async () => {
            const medicationId = 1;
            const medication = {
                medicationId,
                userId: mockUser.id,
                name: 'Test Medication'
            };

            Medication.getMedicationById.mockResolvedValue(medication);
            Medication.markMedicationTaken.mockResolvedValue(true);

            const response = await request(app)
                .post(`/api/medications/${medicationId}/take`)
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Medication marked as taken successfully');
            expect(Medication.markMedicationTaken).toHaveBeenCalledWith(medicationId);
        });
    });

    describe('DELETE /api/medications/:id', () => {
        test('should delete medication successfully', async () => {
            const medicationId = 1;
            const medication = {
                medicationId,
                userId: mockUser.id,
                name: 'Test Medication'
            };

            Medication.getMedicationById.mockResolvedValue(medication);
            Medication.deleteMedication.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/medications/${medicationId}`)
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Medication deleted successfully');
            expect(Medication.deleteMedication).toHaveBeenCalledWith(medicationId);
        });
    });
});