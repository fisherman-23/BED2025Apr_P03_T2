const request = require('supertest');
const app = require('../app');
const HealthData = require('../models/healthDataModel');

// mock the health data model
jest.mock('../models/healthDataModel');

describe('Health Data Controller', () => {
    let authToken;
    const mockUser = { id: 1, email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        authToken = 'mock-jwt-token';
    });

    describe('POST /api/health-data', () => {
        test('should create a new health data record successfully', async () => {
            const mockHealthData = {
                healthId: 1,
                userId: 1,
                recordDate: '2024-07-01',
                bloodPressureSystolic: 120,
                bloodPressureDiastolic: 80,
                weight: 70.5,
                bloodSugar: 95,
                notes: 'Feeling good today',
                complianceScore: 95
            };

            const healthDataInput = {
                recordDate: '2024-07-01',
                bloodPressureSystolic: 120,
                bloodPressureDiastolic: 80,
                weight: 70.5,
                bloodSugar: 95,
                notes: 'Feeling good today',
                complianceScore: 95
            };

            HealthData.createHealthData.mockResolvedValue(mockHealthData);

            const response = await request(app)
                .post('/api/health-data')
                .set('Cookie', [`token=${authToken}`])
                .send(healthDataInput);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Health data created successfully');
            expect(response.body.healthData).toEqual(mockHealthData);
            expect(HealthData.createHealthData).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.id,
                    recordDate: healthDataInput.recordDate,
                    bloodPressureSystolic: healthDataInput.bloodPressureSystolic
                })
            );
        });

        test('should return 400 for missing record date', async () => {
            const response = await request(app)
                .post('/api/health-data')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    bloodPressureSystolic: 120
                    // missing recordDate
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required field: recordDate');
        });

        test('should return 400 for invalid blood pressure values', async () => {
            const response = await request(app)
                .post('/api/health-data')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    recordDate: '2024-07-01',
                    bloodPressureSystolic: 400, // invalid value
                    bloodPressureDiastolic: 80
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid systolic blood pressure value');
        });

        test('should return 400 for invalid weight value', async () => {
            const response = await request(app)
                .post('/api/health-data')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    recordDate: '2024-07-01',
                    weight: 500 // invalid weight
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid weight value');
        });

        test('should return 400 for invalid compliance score', async () => {
            const response = await request(app)
                .post('/api/health-data')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    recordDate: '2024-07-01',
                    complianceScore: 150 // invalid score
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid compliance score');
        });
    });

    describe('GET /api/health-data', () => {
        test('should get health data for user with default limit', async () => {
            const mockHealthData = [
                {
                    healthId: 1,
                    recordDate: '2024-07-01',
                    bloodPressureSystolic: 120,
                    bloodPressureDiastolic: 80,
                    complianceScore: 95
                },
                {
                    healthId: 2,
                    recordDate: '2024-06-30',
                    bloodPressureSystolic: 118,
                    bloodPressureDiastolic: 78,
                    complianceScore: 90
                }
            ];

            HealthData.getHealthDataByUserId.mockResolvedValue(mockHealthData);

            const response = await request(app)
                .get('/api/health-data')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Health data retrieved successfully');
            expect(response.body.healthData).toEqual(mockHealthData);
            expect(HealthData.getHealthDataByUserId).toHaveBeenCalledWith(mockUser.id, 30);
        });

        test('should get health data with custom limit', async () => {
            const mockHealthData = [];
            HealthData.getHealthDataByUserId.mockResolvedValue(mockHealthData);

            const response = await request(app)
                .get('/api/health-data?limit=10')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(HealthData.getHealthDataByUserId).toHaveBeenCalledWith(mockUser.id, 10);
        });

        test('should return 400 for invalid limit', async () => {
            const response = await request(app)
                .get('/api/health-data?limit=150')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Limit must be between 1 and 100');
        });
    });

    describe('GET /api/health-data/statistics', () => {
        test('should get health statistics for user', async () => {
            const mockStatistics = {
                avgSystolic: 125.5,
                avgDiastolic: 82.3,
                avgWeight: 71.2,
                avgBloodSugar: 98.7,
                avgCompliance: 92.5,
                recordCount: 15
            };

            HealthData.getHealthStatistics.mockResolvedValue(mockStatistics);

            const response = await request(app)
                .get('/api/health-data/statistics')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Health statistics retrieved successfully');
            expect(response.body.statistics).toEqual({
                ...mockStatistics,
                period: '30 days'
            });
            expect(HealthData.getHealthStatistics).toHaveBeenCalledWith(mockUser.id, 30);
        });

        test('should get health statistics with custom period', async () => {
            const mockStatistics = {
                avgSystolic: 120.0,
                avgDiastolic: 80.0,
                avgCompliance: 95.0,
                recordCount: 7
            };

            HealthData.getHealthStatistics.mockResolvedValue(mockStatistics);

            const response = await request(app)
                .get('/api/health-data/statistics?days=7')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.statistics.period).toBe('7 days');
            expect(HealthData.getHealthStatistics).toHaveBeenCalledWith(mockUser.id, 7);
        });

        test('should return 400 for invalid days parameter', async () => {
            const response = await request(app)
                .get('/api/health-data/statistics?days=400')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Days must be between 1 and 365');
        });
    });

    describe('PUT /api/health-data/:id', () => {
        test('should update health data successfully', async () => {
            const healthId = 1;
            const existingHealthData = {
                healthId,
                userId: mockUser.id,
                recordDate: '2024-07-01',
                bloodPressureSystolic: 120,
                bloodPressureDiastolic: 80
            };

            const updateData = {
                recordDate: '2024-07-01',
                bloodPressureSystolic: 125,
                bloodPressureDiastolic: 82,
                weight: 71.0,
                notes: 'Updated notes',
                complianceScore: 90
            };

            HealthData.getHealthDataById.mockResolvedValue(existingHealthData);
            HealthData.updateHealthData.mockResolvedValue(true);
            HealthData.getHealthDataById.mockResolvedValueOnce(existingHealthData)
                .mockResolvedValueOnce({ ...existingHealthData, ...updateData });

            const response = await request(app)
                .put(`/api/health-data/${healthId}`)
                .set('Cookie', [`token=${authToken}`])
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Health data updated successfully');
            expect(HealthData.updateHealthData).toHaveBeenCalledWith(
                healthId,
                expect.objectContaining(updateData)
            );
        });
    });

    describe('DELETE /api/health-data/:id', () => {
        test('should delete health data successfully', async () => {
            const healthId = 1;
            const healthData = {
                healthId,
                userId: mockUser.id,
                recordDate: '2024-07-01'
            };

            HealthData.getHealthDataById.mockResolvedValue(healthData);
            HealthData.deleteHealthData.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/health-data/${healthId}`)
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Health data deleted successfully');
            expect(HealthData.deleteHealthData).toHaveBeenCalledWith(healthId);
        });
    });
});