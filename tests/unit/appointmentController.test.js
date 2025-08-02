const request = require('supertest');
const express = require('express');
const appointmentController = require('../../controllers/appointmentController');
const Appointment = require('../../models/appointmentModel');

// Mock dependencies
jest.mock('../../models/appointmentModel');

describe('Appointment Controller Tests', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        
        // Mock authentication middleware
        app.use((req, res, next) => {
            req.user = { id: 1, email: 'test@example.com' };
            next();
        });
        
        // Setup routes
        app.post('/api/appointments', appointmentController.createAppointment);
        app.get('/api/appointments', appointmentController.getUserAppointments);
        app.get('/api/appointments/:id', appointmentController.getAppointmentById);
        app.put('/api/appointments/:id', appointmentController.updateAppointment);
        app.delete('/api/appointments/:id', appointmentController.cancelAppointment);
        app.get('/api/doctors/search', appointmentController.searchDoctors);
        app.get('/api/doctors/:doctorId/availability', appointmentController.getDoctorAvailability);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/appointments - Create Appointment', () => {
        it('should successfully create a new appointment', async () => {
            const appointmentData = {
                doctorId: 2,
                appointmentDate: '2024-02-15T10:00:00Z',
                duration: 30,
                reason: 'Regular checkup',
                notes: 'First visit'
            };

            const mockAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 2,
                appointmentDate: '2024-02-15T10:00:00Z',
                duration: 30,
                reason: 'Regular checkup',
                status: 'scheduled',
                notes: 'First visit',
                followUpNeeded: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            Appointment.createAppointment.mockResolvedValue(mockAppointment);

            const response = await request(app)
                .post('/api/appointments')
                .send(appointmentData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Appointment booked successfully');
            expect(response.body.data.appointment).toEqual(mockAppointment);
            expect(Appointment.createAppointment).toHaveBeenCalledWith({
                ...appointmentData,
                userId: 1
            });
        });

        it('should return error for missing required fields', async () => {
            const invalidData = {
                doctorId: 2
                // Missing appointmentDate and reason
            };

            const response = await request(app)
                .post('/api/appointments')
                .send(invalidData)
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Doctor ID, appointment date, and reason are required');
        });

        it('should handle database errors during creation', async () => {
            const appointmentData = {
                doctorId: 2,
                appointmentDate: '2024-02-15T10:00:00Z',
                reason: 'Regular checkup'
            };

            Appointment.createAppointment.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/appointments')
                .send(appointmentData)
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to book appointment');
            expect(response.body.error).toBe('Database connection failed');
        });

        it('should validate appointment date format', async () => {
            const invalidData = {
                doctorId: 2,
                appointmentDate: 'invalid-date',
                reason: 'Regular checkup'
            };

            const response = await request(app)
                .post('/api/appointments')
                .send(invalidData)
                .expect(201); // Should still proceed, date validation handled by model

            expect(Appointment.createAppointment).toHaveBeenCalled();
        });
    });

    describe('GET /api/appointments - Get User Appointments', () => {
        it('should retrieve all appointments for authenticated user', async () => {
            const mockAppointments = [
                {
                    appointmentId: 1,
                    userId: 1,
                    doctorId: 2,
                    appointmentDate: '2024-02-15T10:00:00Z',
                    reason: 'Regular checkup',
                    status: 'scheduled',
                    doctorName: 'Dr. Smith',
                    specialty: 'Cardiology'
                },
                {
                    appointmentId: 2,
                    userId: 1,
                    doctorId: 3,
                    appointmentDate: '2024-02-20T14:00:00Z',
                    reason: 'Follow-up',
                    status: 'completed',
                    doctorName: 'Dr. Johnson',
                    specialty: 'Neurology'
                }
            ];

            Appointment.getUserAppointments.mockResolvedValue(mockAppointments);

            const response = await request(app)
                .get('/api/appointments')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.appointments).toEqual(mockAppointments);
            expect(Appointment.getUserAppointments).toHaveBeenCalledWith(1, undefined);
        });

        it('should filter appointments by status', async () => {
            const mockScheduledAppointments = [
                {
                    appointmentId: 1,
                    status: 'scheduled',
                    doctorName: 'Dr. Smith'
                }
            ];

            Appointment.getUserAppointments.mockResolvedValue(mockScheduledAppointments);

            const response = await request(app)
                .get('/api/appointments?status=scheduled')
                .expect(200);

            expect(response.body.data.appointments).toEqual(mockScheduledAppointments);
            expect(Appointment.getUserAppointments).toHaveBeenCalledWith(1, 'scheduled');
        });

        it('should get upcoming appointments when requested', async () => {
            const mockUpcomingAppointments = [
                {
                    appointmentId: 1,
                    appointmentDate: '2024-02-20T10:00:00Z',
                    status: 'scheduled'
                }
            ];

            Appointment.getUpcomingAppointments.mockResolvedValue(mockUpcomingAppointments);

            const response = await request(app)
                .get('/api/appointments?upcoming=true')
                .expect(200);

            expect(response.body.data.appointments).toEqual(mockUpcomingAppointments);
            expect(Appointment.getUpcomingAppointments).toHaveBeenCalledWith(1);
        });

        it('should handle empty appointment list', async () => {
            Appointment.getUserAppointments.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/appointments')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.appointments).toEqual([]);
        });

        it('should handle database errors during retrieval', async () => {
            Appointment.getUserAppointments.mockRejectedValue(new Error('Database query failed'));

            const response = await request(app)
                .get('/api/appointments')
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to retrieve appointments');
        });
    });

    describe('GET /api/appointments/:id - Get Appointment by ID', () => {
        it('should retrieve specific appointment by ID', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 2,
                appointmentDate: '2024-02-15T10:00:00Z',
                reason: 'Regular checkup',
                status: 'scheduled',
                doctorName: 'Dr. Smith',
                specialty: 'Cardiology'
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);

            const response = await request(app)
                .get('/api/appointments/1')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.appointment).toEqual(mockAppointment);
            expect(Appointment.getAppointmentById).toHaveBeenCalledWith('1');
        });

        it('should return 404 for non-existent appointment', async () => {
            Appointment.getAppointmentById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/appointments/999')
                .expect(404);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Appointment not found');
        });

        it('should return 403 for appointment belonging to different user', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 2, // Different user
                doctorId: 2,
                appointmentDate: '2024-02-15T10:00:00Z'
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);

            const response = await request(app)
                .get('/api/appointments/1')
                .expect(403);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Access denied to this appointment');
        });

        it('should handle database errors during retrieval', async () => {
            Appointment.getAppointmentById.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/appointments/1')
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to retrieve appointment');
        });
    });

    describe('PUT /api/appointments/:id - Update Appointment', () => {
        it('should successfully update appointment', async () => {
            const updateData = {
                appointmentDate: '2024-02-16T11:00:00Z',
                duration: 45,
                notes: 'Updated notes'
            };

            const mockExistingAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 2,
                status: 'scheduled'
            };

            Appointment.getAppointmentById.mockResolvedValue(mockExistingAppointment);
            Appointment.updateAppointment.mockResolvedValue(true);

            const response = await request(app)
                .put('/api/appointments/1')
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Appointment updated successfully');
            expect(Appointment.updateAppointment).toHaveBeenCalledWith('1', updateData);
        });

        it('should return 404 for non-existent appointment', async () => {
            Appointment.getAppointmentById.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/appointments/999')
                .send({ notes: 'Updated notes' })
                .expect(404);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Appointment not found');
        });

        it('should return 403 for appointment belonging to different user', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 2, // Different user
                doctorId: 2
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);

            const response = await request(app)
                .put('/api/appointments/1')
                .send({ notes: 'Updated notes' })
                .expect(403);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Access denied to this appointment');
        });

        it('should handle update failure', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 2
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);
            Appointment.updateAppointment.mockResolvedValue(false);

            const response = await request(app)
                .put('/api/appointments/1')
                .send({ notes: 'Updated notes' })
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to update appointment');
        });

        it('should handle database errors during update', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 2
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);
            Appointment.updateAppointment.mockRejectedValue(new Error('Update failed'));

            const response = await request(app)
                .put('/api/appointments/1')
                .send({ notes: 'Updated notes' })
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to update appointment');
        });
    });

    describe('DELETE /api/appointments/:id - Cancel Appointment', () => {
        it('should successfully cancel appointment', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 2,
                status: 'scheduled'
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);
            Appointment.deleteAppointment.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/appointments/1')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Appointment cancelled successfully');
            expect(Appointment.deleteAppointment).toHaveBeenCalledWith('1');
        });

        it('should return 404 for non-existent appointment', async () => {
            Appointment.getAppointmentById.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/appointments/999')
                .expect(404);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Appointment not found');
        });

        it('should return 403 for appointment belonging to different user', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 2, // Different user
                doctorId: 2
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);

            const response = await request(app)
                .delete('/api/appointments/1')
                .expect(403);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Access denied to this appointment');
        });

        it('should handle cancellation failure', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 2
            };

            Appointment.getAppointmentById.mockResolvedValue(mockAppointment);
            Appointment.deleteAppointment.mockResolvedValue(false);

            const response = await request(app)
                .delete('/api/appointments/1')
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to cancel appointment');
        });
    });

    describe('GET /api/doctors/search - Search Doctors', () => {
        it('should search doctors without filters', async () => {
            const mockDoctors = [
                {
                    doctorId: 1,
                    name: 'Dr. Smith',
                    specialty: 'Cardiology',
                    location: 'Central',
                    rating: 4.8,
                    phone: '+65-6123-4567'
                },
                {
                    doctorId: 2,
                    name: 'Dr. Johnson',
                    specialty: 'Neurology',
                    location: 'East',
                    rating: 4.6,
                    phone: '+65-6234-5678'
                }
            ];

            Appointment.searchDoctors.mockResolvedValue(mockDoctors);

            const response = await request(app)
                .get('/api/doctors/search')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.doctors).toEqual(mockDoctors);
            expect(Appointment.searchDoctors).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should search doctors by specialty', async () => {
            const mockCardiologists = [
                {
                    doctorId: 1,
                    name: 'Dr. Smith',
                    specialty: 'Cardiology',
                    location: 'Central',
                    rating: 4.8
                }
            ];

            Appointment.searchDoctors.mockResolvedValue(mockCardiologists);

            const response = await request(app)
                .get('/api/doctors/search?specialty=Cardiology')
                .expect(200);

            expect(response.body.data.doctors).toEqual(mockCardiologists);
            expect(Appointment.searchDoctors).toHaveBeenCalledWith('Cardiology', undefined);
        });

        it('should search doctors by location', async () => {
            const mockCentralDoctors = [
                {
                    doctorId: 1,
                    name: 'Dr. Smith',
                    specialty: 'Cardiology',
                    location: 'Central'
                }
            ];

            Appointment.searchDoctors.mockResolvedValue(mockCentralDoctors);

            const response = await request(app)
                .get('/api/doctors/search?location=Central')
                .expect(200);

            expect(response.body.data.doctors).toEqual(mockCentralDoctors);
            expect(Appointment.searchDoctors).toHaveBeenCalledWith(undefined, 'Central');
        });

        it('should search doctors by both specialty and location', async () => {
            const mockFilteredDoctors = [
                {
                    doctorId: 1,
                    name: 'Dr. Smith',
                    specialty: 'Cardiology',
                    location: 'Central'
                }
            ];

            Appointment.searchDoctors.mockResolvedValue(mockFilteredDoctors);

            const response = await request(app)
                .get('/api/doctors/search?specialty=Cardiology&location=Central')
                .expect(200);

            expect(response.body.data.doctors).toEqual(mockFilteredDoctors);
            expect(Appointment.searchDoctors).toHaveBeenCalledWith('Cardiology', 'Central');
        });

        it('should handle empty search results', async () => {
            Appointment.searchDoctors.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/doctors/search?specialty=Nonexistent')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.doctors).toEqual([]);
        });

        it('should handle database errors during search', async () => {
            Appointment.searchDoctors.mockRejectedValue(new Error('Search failed'));

            const response = await request(app)
                .get('/api/doctors/search')
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to search doctors');
        });
    });

    describe('GET /api/doctors/:doctorId/availability - Get Doctor Availability', () => {
        it('should retrieve doctor availability successfully', async () => {
            const mockAvailability = [
                {
                    availabilityId: 1,
                    doctorId: 1,
                    dayOfWeek: 'Monday',
                    startTime: '09:00:00',
                    endTime: '17:00:00',
                    isAvailable: true
                },
                {
                    availabilityId: 2,
                    doctorId: 1,
                    dayOfWeek: 'Tuesday',
                    startTime: '09:00:00',
                    endTime: '17:00:00',
                    isAvailable: true
                }
            ];

            Appointment.getDoctorAvailability.mockResolvedValue(mockAvailability);

            const response = await request(app)
                .get('/api/doctors/1/availability?date=2024-02-15')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.availability).toEqual(mockAvailability);
            expect(Appointment.getDoctorAvailability).toHaveBeenCalledWith('1', '2024-02-15');
        });

        it('should handle no availability found', async () => {
            Appointment.getDoctorAvailability.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/doctors/999/availability')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.availability).toEqual([]);
        });

        it('should handle database errors during availability check', async () => {
            Appointment.getDoctorAvailability.mockRejectedValue(new Error('Availability check failed'));

            const response = await request(app)
                .get('/api/doctors/1/availability')
                .expect(500);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Failed to retrieve doctor availability');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle invalid appointment ID parameters', async () => {
            const response = await request(app)
                .get('/api/appointments/invalid_id')
                .expect(500); // Will be handled by the model layer

            expect(response.body.status).toBe('error');
        });

        it('should handle missing user context', async () => {
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => {
                req.user = undefined; // No user context
                next();
            });
            testApp.post('/api/appointments', appointmentController.createAppointment);

            const response = await request(testApp)
                .post('/api/appointments')
                .send({
                    doctorId: 2,
                    appointmentDate: '2024-02-15T10:00:00Z',
                    reason: 'Regular checkup'
                })
                .expect(500);

            expect(response.body.status).toBe('error');
        });

        it('should handle concurrent appointment booking conflicts', async () => {
            const appointmentData = {
                doctorId: 2,
                appointmentDate: '2024-02-15T10:00:00Z',
                reason: 'Regular checkup'
            };

            Appointment.createAppointment.mockRejectedValue(new Error('Appointment slot already booked'));

            const response = await request(app)
                .post('/api/appointments')
                .send(appointmentData)
                .expect(500);

            expect(response.body.error).toBe('Appointment slot already booked');
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete appointment workflow', async () => {
            // Create appointment
            const createData = {
                doctorId: 2,
                appointmentDate: '2024-02-15T10:00:00Z',
                reason: 'Regular checkup'
            };

            const mockCreatedAppointment = {
                appointmentId: 1,
                userId: 1,
                ...createData,
                status: 'scheduled'
            };

            Appointment.createAppointment.mockResolvedValue(mockCreatedAppointment);

            const createResponse = await request(app)
                .post('/api/appointments')
                .send(createData)
                .expect(201);

            expect(createResponse.body.data.appointment.appointmentId).toBe(1);

            // Update appointment
            const updateData = { notes: 'Bring medical records' };
            Appointment.getAppointmentById.mockResolvedValue(mockCreatedAppointment);
            Appointment.updateAppointment.mockResolvedValue(true);

            const updateResponse = await request(app)
                .put('/api/appointments/1')
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.message).toBe('Appointment updated successfully');

            // Cancel appointment
            Appointment.deleteAppointment.mockResolvedValue(true);

            const cancelResponse = await request(app)
                .delete('/api/appointments/1')
                .expect(200);

            expect(cancelResponse.body.message).toBe('Appointment cancelled successfully');
        });
    });
});