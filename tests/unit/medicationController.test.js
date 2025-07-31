const request = require('supertest');
const express = require('express');
const medicationController = require('../controllers/medicationController');
const Medication = require('../models/medicationModel');

// Mock the medication model
jest.mock('../models/medicationModel');

describe('Medication Controller Tests', () => {
    let app;
    let authToken;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        
        // Mock authentication middleware
        app.use((req, res, next) => {
            req.user = { id: 1, email: 'test@example.com' };
            next();
        });
        
        // Setup routes
        app.post('/api/medications', medicationController.createMedication);
        app.get('/api/medications', medicationController.getUserMedications);
        app.put('/api/medications/:medicationId', medicationController.updateMedication);
        app.delete('/api/medications/:medicationId', medicationController.deleteMedication);
        app.post('/api/medications/:medicationId/mark-taken', medicationController.markMedicationTaken);
        app.get('/api/medications/reminders/upcoming', medicationController.getUpcomingReminders);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/medications - Create Medication', () => {
        it('should successfully create a new medication', async () => {
            const medicationData = {
                medicationName: 'Aspirin',
                dosage: '100mg',
                frequency: 'once_daily',
                timing: '08:00',
                prescribedBy: 'Dr. Smith',
                startDate: '2025-08-01',
                instructions: 'Take with food'
            };

            const mockMedication = {
                medicationId: 1,
                ...medicationData,
                userId: 1
            };

            Medication.createMedication.mockResolvedValue(mockMedication);

            const response = await request(app)
                .post('/api/medications')
                .send(medicationData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Medication added successfully with schedule created');
            expect(response.body.data.medication).toEqual(mockMedication);
            expect(Medication.createMedication).toHaveBeenCalledWith({
                ...medicationData,
                userId: 1
            });
        });

        it('should return error for missing required fields', async () => {
            const invalidData = {
                medicationName: 'Aspirin'
                // Missing required fields
            };

            const response = await request(app)
                .post('/api/medications')
                .send(invalidData)
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeInstanceOf(Array);
        });

        it('should handle database errors gracefully', async () => {
            const medicationData = {
                medicationName: 'Aspirin',
                dosage: '100mg',
                frequency: 'once_daily',
                timing: '08:00',
                prescribedBy: 'Dr. Smith'
            };

            Medication.createMedication.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/medications')
                .send(medicationData)
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to add medication');
        });
    });

    describe('GET /api/medications - Get User Medications', () => {
        it('should retrieve all medications for authenticated user', async () => {
            const mockMedications = [
                {
                    medicationId: 1,
                    medicationName: 'Aspirin',
                    dosage: '100mg',
                    frequency: 'once_daily',
                    adherenceRate: 85
                },
                {
                    medicationId: 2,
                    medicationName: 'Metformin',
                    dosage: '500mg',
                    frequency: 'twice_daily',
                    adherenceRate: 92
                }
            ];

            Medication.getUserMedications.mockResolvedValue(mockMedications);

            const response = await request(app)
                .get('/api/medications')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.medications).toEqual(mockMedications);
            expect(Medication.getUserMedications).toHaveBeenCalledWith(1);
        });

        it('should handle empty medication list', async () => {
            Medication.getUserMedications.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/medications')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.medications).toEqual([]);
        });
    });

    describe('PUT /api/medications/:medicationId - Update Medication', () => {
        it('should successfully update medication', async () => {
            const updateData = {
                dosage: '200mg',
                timing: '09:00'
            };

            const mockUpdatedMedication = {
                medicationId: 1,
                medicationName: 'Aspirin',
                dosage: '200mg',
                timing: '09:00'
            };

            Medication.updateMedication.mockResolvedValue(mockUpdatedMedication);

            const response = await request(app)
                .put('/api/medications/1')
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Medication updated successfully');
            expect(Medication.updateMedication).toHaveBeenCalledWith(1, updateData);
        });

        it('should return error for invalid medication ID', async () => {
            const response = await request(app)
                .put('/api/medications/invalid')
                .send({ dosage: '200mg' })
                .expect(400);

            expect(response.body.status).toBe('error');
        });
    });

    describe('DELETE /api/medications/:medicationId - Delete Medication', () => {
        it('should successfully delete medication', async () => {
            Medication.deleteMedication.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/medications/1')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Medication deleted successfully');
            expect(Medication.deleteMedication).toHaveBeenCalledWith(1);
        });

        it('should return error for non-existent medication', async () => {
            Medication.deleteMedication.mockResolvedValue(false);

            const response = await request(app)
                .delete('/api/medications/999')
                .expect(404);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Medication not found');
        });
    });

    describe('POST /api/medications/:medicationId/mark-taken - Mark as Taken', () => {
        it('should successfully mark medication as taken', async () => {
            const takenData = {
                takenAt: '2025-08-01T08:00:00Z',
                notes: 'Taken with breakfast'
            };

            Medication.markMedicationTaken.mockResolvedValue({
                logId: 1,
                taken: true,
                takenAt: takenData.takenAt
            });

            const response = await request(app)
                .post('/api/medications/1/mark-taken')
                .send(takenData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Medication marked as taken');
        });

        it('should handle missing medication log', async () => {
            Medication.markMedicationTaken.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/medications/1/mark-taken')
                .send({})
                .expect(404);

            expect(response.body.status).toBe('error');
        });
    });

    describe('GET /api/medications/reminders/upcoming - Get Upcoming Reminders', () => {
        it('should retrieve upcoming reminders', async () => {
            const mockReminders = [
                {
                    medicationId: 1,
                    medicationName: 'Aspirin',
                    dosage: '100mg',
                    scheduledTime: '2025-08-01T08:00:00Z',
                    timeUntil: '2 hours'
                }
            ];

            Medication.getUpcomingReminders.mockResolvedValue(mockReminders);

            const response = await request(app)
                .get('/api/medications/reminders/upcoming')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.reminders).toEqual(mockReminders);
        });

        it('should handle query parameters', async () => {
            Medication.getUpcomingReminders.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/medications/reminders/upcoming?hours=24&limit=10')
                .expect(200);

            expect(Medication.getUpcomingReminders).toHaveBeenCalledWith(1, 24, 10);
        });
    });

    describe('Error Handling', () => {
        it('should handle unexpected errors gracefully', async () => {
            Medication.getUserMedications.mockRejectedValue(new Error('Unexpected database error'));

            const response = await request(app)
                .get('/api/medications')
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to retrieve medications');
        });
    });

    describe('Validation Tests', () => {
        it('should validate medication frequency', async () => {
            const invalidData = {
                medicationName: 'Aspirin',
                dosage: '100mg',
                frequency: 'invalid_frequency',
                timing: '08:00',
                prescribedBy: 'Dr. Smith'
            };

            const response = await request(app)
                .post('/api/medications')
                .send(invalidData)
                .expect(400);

            expect(response.body.errors).toContain('Valid frequency is required');
        });

        it('should validate timing format', async () => {
            const invalidData = {
                medicationName: 'Aspirin',
                dosage: '100mg',
                frequency: 'once_daily',
                timing: 'invalid_time',
                prescribedBy: 'Dr. Smith'
            };

            const response = await request(app)
                .post('/api/medications')
                .send(invalidData)
                .expect(400);

            expect(response.body.errors).toContain('Timing is required');
        });
    });
});