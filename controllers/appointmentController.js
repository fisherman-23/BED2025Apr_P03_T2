const Appointment = require('../models/appointmentModel');

class AppointmentController {
    // creates a new appointment
    async createAppointment(req, res) {
        try {
            const appointmentData = req.body;
            appointmentData.userId = req.user.id; // from JWT token
            
            const newAppointment = await Appointment.createAppointment(appointmentData);
            
            res.status(201).json({
                status: 'success',
                message: 'Appointment booked successfully',
                data: { appointment: newAppointment }
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to book appointment',
                error: error.message
            });
        }
    }

    // gets all appointments for the current user
    async getUserAppointments(req, res) {
        try {
            const appointments = await Appointment.getAppointmentsByUserId(req.user.id);
            
            res.status(200).json({
                status: 'success',
                data: { appointments }
            });
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve appointments',
                error: error.message
            });
        }
    }

    // gets a specific appointment by ID
    async getAppointmentById(req, res) {
        try {
            const appointmentId = req.params.id;
            const appointment = await Appointment.getAppointmentById(appointmentId);
            
            if (!appointment) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Appointment not found'
                });
            }

            // check if appointment belongs to current user
            if (appointment.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this appointment'
                });
            }
            
            res.status(200).json({
                status: 'success',
                data: { appointment }
            });
        } catch (error) {
            console.error('Error fetching appointment:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve appointment',
                error: error.message
            });
        }
    }

    // updates an appointment
    async updateAppointment(req, res) {
        try {
            const appointmentId = req.params.id;
            const updateData = req.body;
            
            // first check if appointment exists and belongs to user
            const existingAppointment = await Appointment.getAppointmentById(appointmentId);
            if (!existingAppointment) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Appointment not found'
                });
            }

            if (existingAppointment.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this appointment'
                });
            }
            
            const updated = await Appointment.updateAppointment(appointmentId, updateData);
            
            if (updated) {
                res.status(200).json({
                    status: 'success',
                    message: 'Appointment updated successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to update appointment'
                });
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update appointment',
                error: error.message
            });
        }
    }

    // deletes an appointment
    async deleteAppointment(req, res) {
        try {
            const appointmentId = req.params.id;
            
            // first check if appointment exists and belongs to user
            const existingAppointment = await Appointment.getAppointmentById(appointmentId);
            if (!existingAppointment) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Appointment not found'
                });
            }

            if (existingAppointment.userId !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied to this appointment'
                });
            }
            
            const deleted = await Appointment.deleteAppointment(appointmentId);
            
            if (deleted) {
                res.status(200).json({
                    status: 'success',
                    message: 'Appointment cancelled successfully'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Failed to cancel appointment'
                });
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to cancel appointment',
                error: error.message
            });
        }
    }

    // gets all available doctors
    async getAllDoctors(req, res) {
        try {
            const doctors = await Appointment.getAllDoctors();
            
            res.status(200).json({
                status: 'success',
                data: { doctors }
            });
        } catch (error) {
            console.error('Error fetching doctors:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve doctors',
                error: error.message
            });
        }
    }

    // searches doctors by specialty and location
    async searchDoctors(req, res) {
        try {
            const { specialty, location } = req.query;
            
            const doctors = await Appointment.searchDoctors(specialty, location);
            
            res.status(200).json({
                status: 'success',
                data: { doctors }
            });
        } catch (error) {
            console.error('Error searching doctors:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to search doctors',
                error: error.message
            });
        }
    }

    // gets doctor availability for appointment booking
    async getDoctorAvailability(req, res) {
        try {
            const doctorId = req.params.doctorId;
            const { date } = req.query;
            
            const availability = await Appointment.getDoctorAvailability(doctorId, date);
            
            res.status(200).json({
                status: 'success',
                data: { availability }
            });
        } catch (error) {
            console.error('Error fetching doctor availability:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve doctor availability',
                error: error.message
            });
        }
    }

    // sends appointment reminders
    async sendAppointmentReminder(req, res) {
        try {
            const appointmentId = req.params.id;
            
            // check if appointment belongs to user
            const appointment = await Appointment.getAppointmentById(appointmentId);
            if (!appointment || appointment.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Appointment not found'
                });
            }
            
            const result = await Appointment.sendReminder(appointmentId);
            
            res.status(200).json({
                status: 'success',
                message: 'Reminder sent successfully',
                data: result
            });
        } catch (error) {
            console.error('Error sending reminder:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to send reminder',
                error: error.message
            });
        }
    }

    // gets directions to clinic using OneMap API
    async getDirections(req, res) {
        try {
            const appointmentId = req.params.id;
            const { currentLocation } = req.body;
            
            // check if appointment belongs to user
            const appointment = await Appointment.getAppointmentById(appointmentId);
            if (!appointment || appointment.userId !== req.user.id) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Appointment not found'
                });
            }
            
            const directions = await Appointment.getDirections(currentLocation, appointment.address);
            
            res.status(200).json({
                status: 'success',
                data: { directions }
            });
        } catch (error) {
            console.error('Error getting directions:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get directions',
                error: error.message
            });
        }
    }
}

module.exports = new AppointmentController();