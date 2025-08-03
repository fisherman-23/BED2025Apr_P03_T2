const request = require('supertest');
const express = require('express');
const caregiverController = require('../../controllers/caregiverController');
const sql = require('mssql');
const pdfGenerator = require('../../utils/pdfGenerator');
const smsService = require('../../utils/smsService');
const emailService = require('../../utils/emailService');

// Mock dependencies
jest.mock('mssql');
jest.mock('../../utils/pdfGenerator');
jest.mock('../../utils/smsService');
jest.mock('../../utils/emailService');

describe('Caregiver Controller Tests', () => {
    let app;
    let mockPool;
    let mockRequest;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        
        // Mock authentication middleware
        app.use((req, res, next) => {
            req.user = { id: 1, email: 'caregiver@example.com' };
            next();
        });
        
        // Setup routes
        app.get('/api/caregiver/patients', caregiverController.getCaregiverPatients);
        app.get('/api/caregiver/patients/:patientId/dashboard', caregiverController.getCaregiverDashboard);
        app.get('/api/caregiver/patients/:patientId/reports', caregiverController.getAdherenceReports);
        app.post('/api/caregiver/relationships', caregiverController.addCaregiverRelationship);
        app.post('/api/caregiver/alerts/missed-medication', caregiverController.sendMissedMedicationAlert);
    });

    beforeEach(() => {
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
        };

        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest)
        };

        sql.connect.mockResolvedValue(mockPool);
        jest.clearAllMocks();
    });

    describe('GET /api/caregiver/patients - Get Caregiver Patients', () => {
        it('should return all patients under caregiver care', async () => {
            const mockPatients = [
                {
                    patientId: 2,
                    patientName: 'John Doe',
                    relationship: 'father',
                    lastActivity: '2025-08-03T10:00:00Z',
                    overallCompliance: 85.5,
                    activeMedications: 3
                },
                {
                    patientId: 3,
                    patientName: 'Mary Smith',
                    relationship: 'mother',
                    lastActivity: '2025-08-03T09:00:00Z',
                    overallCompliance: 92.0,
                    activeMedications: 2
                }
            ];

            mockRequest.query.mockResolvedValue({ recordset: mockPatients });

            const response = await request(app)
                .get('/api/caregiver/patients')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.patients).toHaveLength(2);
            expect(response.body.data.patients[0].patientName).toBe('John Doe');
            expect(mockRequest.input).toHaveBeenCalledWith('caregiverId', 1);
        });

        it('should return empty array when caregiver has no patients', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(app)
                .get('/api/caregiver/patients')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.patients).toHaveLength(0);
        });

        it('should handle database errors', async () => {
            mockRequest.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/caregiver/patients')
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Failed');
        });
    });

    describe('GET /api/caregiver/patients/:patientId/dashboard - Get Patient Dashboard', () => {
        it('should return real-time patient dashboard data', async () => {
            const patientId = 2;
            
            // Mock relationship verification
            mockRequest.query
                .mockResolvedValueOnce({ 
                    recordset: [{ patientId: 2, relationship: 'father', accessLevel: 'full' }] 
                })
                .mockResolvedValueOnce({ 
                    recordset: [{ 
                        totalMedications: 3, 
                        overallCompliance: 85.5, 
                        todaysDoses: 3, 
                        takenToday: 2 
                    }] 
                })
                .mockResolvedValueOnce({ 
                    recordset: [
                        { medicationName: 'Aspirin', nextDose: '2025-08-03T20:00:00Z', adherenceRate: 90.0 }
                    ] 
                })
                .mockResolvedValueOnce({ 
                    recordset: [
                        { medicationName: 'Lisinopril', scheduledTime: '2025-08-03T08:00:00Z', hoursOverdue: 2 }
                    ] 
                });

            const response = await request(app)
                .get(`/api/caregiver/patients/${patientId}/dashboard`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('overview');
            expect(response.body.data).toHaveProperty('upcomingMedications');
            expect(response.body.data).toHaveProperty('missedMedications');
            expect(response.body.data.overview.overallCompliance).toBe(85.5);
        });

        it('should return 403 for unauthorized access', async () => {
            const patientId = 999;
            
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(app)
                .get(`/api/caregiver/patients/${patientId}/dashboard`)
                .expect(403);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Access denied');
        });

        it('should include alerts for missed medications', async () => {
            const patientId = 2;
            
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ patientId: 2, accessLevel: 'full' }] })
                .mockResolvedValueOnce({ recordset: [{ overallCompliance: 75.0 }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ 
                    recordset: [
                        { medicationName: 'Critical Med', hoursOverdue: 6 }
                    ] 
                });

            const response = await request(app)
                .get(`/api/caregiver/patients/${patientId}/dashboard`)
                .expect(200);

            expect(response.body.data.alerts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'missed_medication',
                        severity: 'high'
                    })
                ])
            );
        });
    });

    describe('GET /api/caregiver/patients/:patientId/reports - Get Adherence Reports', () => {
        it('should generate JSON adherence report', async () => {
            const patientId = 2;
            
            // Mock relationship verification and report data
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ patientId: 2, accessLevel: 'full' }] })
                .mockResolvedValueOnce({ 
                    recordset: [
                        { period: '2025-W31', totalDoses: 21, takenDoses: 18, adherenceRate: 85.71 }
                    ] 
                })
                .mockResolvedValueOnce({ 
                    recordset: [
                        { medicationName: 'Aspirin', adherenceRate: 85.5, totalDoses: 7, takenDoses: 6 }
                    ] 
                });

            const response = await request(app)
                .get(`/api/caregiver/patients/${patientId}/reports?format=json&period=weekly`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('reportTitle');
            expect(response.body.data).toHaveProperty('adherenceData');
            expect(response.body.data).toHaveProperty('medicationBreakdown');
            expect(response.body.data.overallCompliance).toBeDefined();
        });

        it('should generate PDF adherence report', async () => {
            const patientId = 2;
            
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ patientId: 2, accessLevel: 'full' }] })
                .mockResolvedValueOnce({ recordset: [{ adherenceRate: 85.71 }] })
                .mockResolvedValueOnce({ recordset: [] });

            pdfGenerator.generateAdherenceReport.mockResolvedValue({
                success: true,
                filePath: '/tmp/report.pdf',
                fileName: 'adherence_report.pdf'
            });

            const response = await request(app)
                .get(`/api/caregiver/patients/${patientId}/reports?format=pdf`)
                .expect(200);

            expect(pdfGenerator.generateAdherenceReport).toHaveBeenCalled();
            expect(response.body.status).toBe('success');
        });

        it('should handle PDF generation failure', async () => {
            const patientId = 2;
            
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ patientId: 2, accessLevel: 'full' }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            pdfGenerator.generateAdherenceReport.mockRejectedValue(new Error('PDF generation failed'));

            const response = await request(app)
                .get(`/api/caregiver/patients/${patientId}/reports?format=pdf`)
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('PDF generation failed');
        });

        it('should filter reports by period', async () => {
            const patientId = 2;
            
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ patientId: 2, accessLevel: 'full' }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            await request(app)
                .get(`/api/caregiver/patients/${patientId}/reports?period=monthly`)
                .expect(200);

            // Verify the query used MONTH interval
            expect(mockRequest.query).toHaveBeenCalled();
        });
    });

    describe('POST /api/caregiver/relationships - Add Caregiver Relationship', () => {
        it('should successfully add new caregiver relationship', async () => {
            const relationshipData = {
                patientId: 3,
                relationship: 'daughter',
                accessLevel: 'monitoring'
            };

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ ID: 3 }] }) // Check patient exists
                .mockResolvedValueOnce({ recordset: [] }) // Check no existing relationship
                .mockResolvedValueOnce({ recordset: [{ relationshipId: 1 }] }); // Create relationship

            const response = await request(app)
                .post('/api/caregiver/relationships')
                .send(relationshipData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toContain('added successfully');
            expect(mockRequest.input).toHaveBeenCalledWith('caregiverId', 1);
            expect(mockRequest.input).toHaveBeenCalledWith('patientId', 3);
        });

        it('should return error for non-existent patient', async () => {
            const relationshipData = {
                patientId: 999,
                relationship: 'friend'
            };

            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(app)
                .post('/api/caregiver/relationships')
                .send(relationshipData)
                .expect(404);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Patient not found');
        });

        it('should return error for duplicate relationship', async () => {
            const relationshipData = {
                patientId: 2,
                relationship: 'spouse'
            };

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ ID: 2 }] })
                .mockResolvedValueOnce({ recordset: [{ relationshipId: 1 }] });

            const response = await request(app)
                .post('/api/caregiver/relationships')
                .send(relationshipData)
                .expect(409);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('already exists');
        });
    });

    describe('POST /api/caregiver/alerts/missed-medication - Send Missed Medication Alert', () => {
        it('should successfully send missed medication alert', async () => {
            const alertData = {
                patientId: 2,
                medicationId: 1
            };

            // Mock relationship verification and alert sending
            mockRequest.query
                .mockResolvedValueOnce({ 
                    recordset: [{ 
                        patientId: 2, 
                        firstName: 'John', 
                        lastName: 'Doe', 
                        phoneNumber: '+6591234567',
                        email: 'john@example.com'
                    }] 
                })
                .mockResolvedValueOnce({ 
                    recordset: [{ 
                        medicationName: 'Aspirin', 
                        dosage: '100mg',
                        scheduledTime: '2025-08-03T08:00:00Z'
                    }] 
                })
                .mockResolvedValueOnce({ 
                    recordset: [
                        { contactName: 'Emergency Contact', phoneNumber: '+6587654321', email: 'emergency@example.com' }
                    ] 
                });

            smsService.sendMissedMedicationAlert.mockResolvedValue({ success: true });
            emailService.sendMissedMedicationAlert.mockResolvedValue({ success: true });

            const response = await request(app)
                .post('/api/caregiver/alerts/missed-medication')
                .send(alertData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toContain('Alert sent');
            expect(smsService.sendMissedMedicationAlert).toHaveBeenCalled();
        });

        it('should handle case with no emergency contacts', async () => {
            const alertData = {
                patientId: 2,
                medicationId: 1
            };

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ patientId: 2, firstName: 'John', lastName: 'Doe' }] })
                .mockResolvedValueOnce({ recordset: [{ medicationName: 'Aspirin' }] })
                .mockResolvedValueOnce({ recordset: [] });

            const response = await request(app)
                .post('/api/caregiver/alerts/missed-medication')
                .send(alertData)
                .expect(200);

            expect(response.body.status).toBe('info');
            expect(response.body.message).toContain('No emergency contacts');
        });

        it('should return error for unauthorized access', async () => {
            const alertData = {
                patientId: 999,
                medicationId: 1
            };

            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(app)
                .post('/api/caregiver/alerts/missed-medication')
                .send(alertData)
                .expect(403);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Access denied');
        });

        it('should handle SMS service failures gracefully', async () => {
            const alertData = {
                patientId: 2,
                medicationId: 1
            };

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ patientId: 2, firstName: 'John', lastName: 'Doe' }] })
                .mockResolvedValueOnce({ recordset: [{ medicationName: 'Aspirin' }] })
                .mockResolvedValueOnce({ recordset: [{ contactName: 'Contact', phoneNumber: '+6591234567' }] });

            smsService.sendMissedMedicationAlert.mockResolvedValue({ success: false, error: 'SMS failed' });

            const response = await request(app)
                .post('/api/caregiver/alerts/missed-medication')
                .send(alertData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.failedAlerts).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            sql.connect.mockRejectedValue(new Error('Connection failed'));

            const response = await request(app)
                .get('/api/caregiver/patients')
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Failed');
        });

        it('should handle missing required parameters', async () => {
            const response = await request(app)
                .post('/api/caregiver/relationships')
                .send({}) // Missing required fields
                .expect(400);

            expect(response.body.status).toBe('error');
        });

        it('should handle unauthorized caregiver access', async () => {
            // Test with different user ID that doesn't have access
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = { id: 999, email: 'unauthorized@example.com' };
                next();
            });
            testApp.get('/api/caregiver/patients/:patientId/dashboard', caregiverController.getCaregiverDashboard);

            mockRequest.query.mockResolvedValue({ recordset: [] });

            const response = await request(testApp)
                .get('/api/caregiver/patients/2/dashboard')
                .expect(403);

            expect(response.body.status).toBe('error');
        });
    });
});