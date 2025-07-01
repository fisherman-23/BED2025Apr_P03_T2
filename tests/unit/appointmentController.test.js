const request = require('supertest');
const app = require('../app');
const Appointment = require('../models/appointmentModel');

// mock the appointment model
jest.mock('../models/appointmentModel');

describe('Appointment Controller', () => {
    let authToken;
    const mockUser = { id: 1, email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        authToken = 'mock-jwt-token';
    });

    describe('POST /api/appointments', () => {
        test('should create a new appointment successfully', async () => {
            const mockAppointment = {
                appointmentId: 1,
                userId: 1,
                doctorId: 1,
                appointmentDate: '2024-12-15T10:00:00.000Z',
                reason: 'Regular checkup'
            };

            const appointmentData = {
                doctorId: 1,
                appointmentDate: '2024-12-15T10:00:00.000Z',
                reason: 'Regular checkup',
                duration: '30 min'
            };

            Appointment.createAppointment.mockResolvedValue(mockAppointment);

            const response = await request(app)
                .post('/api/appointments')
                .set('Cookie', [`token=${authToken}`])
                .send(appointmentData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Appointment created successfully');
            expect(response.body.appointment).toEqual(mockAppointment);
            expect(Appointment.createAppointment).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.id,
                    doctorId: appointmentData.doctorId,
                    reason: appointmentData.reason
                })
            );
        });

        test('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/appointments')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    doctorId: 1
                    // missing appointmentDate and reason
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required fields');
        });

        test('should return 400 for appointment date in the past', async () => {
            const pastDate = new Date('2020-01-01T10:00:00.000Z');
            
            const response = await request(app)
                .post('/api/appointments')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    doctorId: 1,
                    appointmentDate: pastDate.toISOString(),
                    reason: 'Test appointment'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Appointment date must be in the future');
        });
    });

    describe('GET /api/appointments', () => {
        test('should get all appointments for user', async () => {
            const mockAppointments = [
                {
                    appointmentId: 1,
                    userId: 1,
                    doctorName: 'Dr. Smith',
                    specialty: 'Cardiologist',
                    appointmentDate: '2024-12-15T10:00:00.000Z',
                    reason: 'Regular checkup'
                }
            ];

            Appointment.getAppointmentsByUserId.mockResolvedValue(mockAppointments);

            const response = await request(app)
                .get('/api/appointments')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Appointments retrieved successfully');
            expect(response.body.appointments).toEqual(mockAppointments);
            expect(Appointment.getAppointmentsByUserId).toHaveBeenCalledWith(mockUser.id);
        });
    });

    describe('GET /api/appointments/doctors/all', () => {
        test('should get all doctors', async () => {
            const mockDoctors = [
                {
                    doctorId: 1,
                    name: 'Dr. Smith',
                    specialty: 'Cardiologist',
                    rating: 4.9
                },
                {
                    doctorId: 2,
                    name: 'Dr. Johnson',
                    specialty: 'Family Medicine',
                    rating: 4.7
                }
            ];

            Appointment.getAllDoctors.mockResolvedValue(mockDoctors);

            const response = await request(app)
                .get('/api/appointments/doctors/all')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Doctors retrieved successfully');
            expect(response.body.doctors).toEqual(mockDoctors);
        });
    });

    describe('PUT /api/appointments/:id', () => {
        test('should update appointment successfully', async () => {
            const appointmentId = 1;
            const existingAppointment = {
                appointmentId,
                userId: mockUser.id,
                doctorId: 1,
                appointmentDate: '2024-12-15T10:00:00.000Z',
                reason: 'Old reason',
                status: 'scheduled'
            };

            const updateData = {
                appointmentDate: '2024-12-16T11:00:00.000Z',
                reason: 'Updated reason',
                duration: '45 min',
                status: 'scheduled'
            };

            Appointment.getAppointmentById.mockResolvedValue(existingAppointment);
            Appointment.updateAppointment.mockResolvedValue(true);
            Appointment.getAppointmentById.mockResolvedValueOnce(existingAppointment)
                .mockResolvedValueOnce({ ...existingAppointment, ...updateData });

            const response = await request(app)
                .put(`/api/appointments/${appointmentId}`)
                .set('Cookie', [`token=${authToken}`])
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Appointment updated successfully');
            expect(Appointment.updateAppointment).toHaveBeenCalledWith(
                appointmentId,
                expect.objectContaining(updateData)
            );
        });
    });

    describe('DELETE /api/appointments/:id', () => {
        test('should delete appointment successfully', async () => {
            const appointmentId = 1;
            const appointment = {
                appointmentId,
                userId: mockUser.id,
                reason: 'Test appointment'
            };

            Appointment.getAppointmentById.mockResolvedValue(appointment);
            Appointment.deleteAppointment.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/appointments/${appointmentId}`)
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Appointment deleted successfully');
            expect(Appointment.deleteAppointment).toHaveBeenCalledWith(appointmentId);
        });
    });
});