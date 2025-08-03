const Appointment = require('../models/appointmentModel');
const sql = require('mssql');

/**
 * Appointment Controller - handles appointment booking and management
 * Implements CRUD operations for appointment system
 * Includes doctor search, availability checking, and OneMap API integration
 */
class AppointmentController {
    
    /**
     * Creates a new appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createAppointment(req, res) {
        try {
            const appointmentData = req.body;
            appointmentData.userId = req.user.id; // From JWT token
            
            // Validate appointment data
            if (!appointmentData.doctorId || !appointmentData.appointmentDate || !appointmentData.reason) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Doctor ID, appointment date, and reason are required'
                });
            }
            
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

    /**
     * Gets all appointments for the current user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserAppointments(req, res) {
        try {
            const { status, upcoming } = req.query;
            
            let appointments;
            if (upcoming === 'true') {
                appointments = await Appointment.getUpcomingAppointments(req.user.id);
            } else {
                appointments = await Appointment.getAppointmentsByUserId(req.user.id, status);
            }
            
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

    /**
     * Gets a specific appointment by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
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

            // Check if appointment belongs to current user
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

    /**
     * Updates an appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateAppointment(req, res) {
        try {
            const appointmentId = req.params.id;
            const updateData = req.body;
            
            // First check if appointment exists and belongs to user
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

    /**
     * Cancels an appointment (same as deleteAppointment but with proper naming)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async cancelAppointment(req, res) {
        try {
            const appointmentId = req.params.id;
            
            // First check if appointment exists and belongs to user
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
            
            const cancelled = await Appointment.deleteAppointment(appointmentId);
            
            if (cancelled) {
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
            console.error('Error cancelling appointment:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to cancel appointment',
                error: error.message
            });
        }
    }

    /**
     * Alias for cancelAppointment to maintain backward compatibility
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteAppointment(req, res) {
        return this.cancelAppointment(req, res);
    }

    /**
     * Searches doctors by specialty and location
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
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

    /**
     * Gets doctor availability for appointment booking
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getDoctorAvailability(req, res) {
        try {
            const doctorId = req.params.id;
            const { date } = req.query;
            
            if (!doctorId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Doctor ID is required'
                });
            }
            
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

    /**
     * Gets all available doctors
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
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

    /**
     * Sends appointment reminder
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async sendAppointmentReminder(req, res) {
        try {
            const appointmentId = req.params.id;
            
            // Check if appointment belongs to user
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

    /**
     * Gets directions to clinic using OneMap API
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getDirections(req, res) {
        try {
            const appointmentId = req.params.id;
            const { currentLocation } = req.body;
            
            // Check if appointment belongs to user
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