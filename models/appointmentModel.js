const sql = require('mssql');
const dbConfig = require('../dbConfig');

/**
 * Appointment Model - handles appointment data operations
 * Manages appointment bookings, doctor search, and availability
 * Integrates with OneMap API for location services
 */
class Appointment {
    constructor(appointmentId, userId, doctorId, appointmentDate, duration, reason, status, notes, reminderSent, followUpNeeded, createdAt, updatedAt) {
        this.appointmentId = appointmentId;
        this.userId = userId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.duration = duration;
        this.reason = reason;
        this.status = status;
        this.notes = notes;
        this.reminderSent = reminderSent;
        this.followUpNeeded = followUpNeeded;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Creates a new appointment record
     * @param {Object} appointmentData - appointment data to insert
     * @returns {Promise<Appointment>} New appointment instance
     */
    static async createAppointment(appointmentData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO Appointments (userId, doctorId, appointmentDate, duration, reason, status, notes, followUpNeeded)
            OUTPUT INSERTED.*
            VALUES (@userId, @doctorId, @appointmentDate, @duration, @reason, @status, @notes, @followUpNeeded)
        `;
        
        const request = connection.request();
        request.input('userId', sql.Int, appointmentData.userId);
        request.input('doctorId', sql.Int, appointmentData.doctorId);
        request.input('appointmentDate', sql.DateTime2, new Date(appointmentData.appointmentDate));
        request.input('duration', sql.Int, appointmentData.duration || 30);
        request.input('reason', sql.NVarChar(500), appointmentData.reason);
        request.input('status', sql.NVarChar(50), appointmentData.status || 'scheduled');
        request.input('notes', sql.NVarChar(sql.MAX), appointmentData.notes || null);
        request.input('followUpNeeded', sql.Bit, appointmentData.followUpNeeded || false);
        
        const result = await request.query(sqlQuery);
        const newAppointment = result.recordset[0];
        
        return new Appointment(
            newAppointment.appointmentId,
            newAppointment.userId,
            newAppointment.doctorId,
            newAppointment.appointmentDate,
            newAppointment.duration,
            newAppointment.reason,
            newAppointment.status,
            newAppointment.notes,
            newAppointment.reminderSent,
            newAppointment.followUpNeeded,
            newAppointment.createdAt,
            newAppointment.updatedAt
        );
    }

    /**
     * Gets all appointments for a specific user
     * @param {number} userId - user ID
     * @param {string} status - filter by appointment status (optional)
     * @returns {Promise<Array>} Array of appointments with doctor details
     */
    static async getUserAppointments(userId, status = null) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `
            SELECT 
                a.*,
                d.name as doctorName,
                d.specialty,
                d.phone as doctorPhone,
                d.email as doctorEmail,
                d.location as clinicLocation,
                d.address as clinicAddress,
                d.rating as doctorRating
            FROM Appointments a
            INNER JOIN Doctors d ON a.doctorId = d.doctorId
            WHERE a.userId = @userId
        `;
        
        if (status) {
            sqlQuery += ` AND a.status = @status`;
        }
        
        sqlQuery += ` ORDER BY a.appointmentDate ASC`;
        
        const request = connection.request();
        request.input('userId', sql.Int, userId);
        if (status) {
            request.input('status', sql.NVarChar(50), status);
        }
        
        const result = await request.query(sqlQuery);
        return result.recordset;
    }

    /**
     * Gets upcoming appointments for a user
     * @param {number} userId - user ID
     * @returns {Promise<Array>} Array of upcoming appointments
     */
    static async getUpcomingAppointments(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                a.*,
                d.name as doctorName,
                d.specialty,
                d.phone as doctorPhone,
                d.location as clinicLocation,
                d.address as clinicAddress
            FROM Appointments a
            INNER JOIN Doctors d ON a.doctorId = d.doctorId
            WHERE a.userId = @userId 
            AND a.appointmentDate >= GETDATE()
            AND a.status = 'scheduled'
            ORDER BY a.appointmentDate ASC
        `;
        
        const request = connection.request();
        request.input('userId', sql.Int, userId);
        
        const result = await request.query(sqlQuery);
        return result.recordset;
    }

    /**
     * Updates an existing appointment
     * @param {number} appointmentId - appointment ID
     * @param {Object} updateData - data to update
     * @returns {Promise<Appointment>} Updated appointment
     */
    static async updateAppointment(appointmentId, updateData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE Appointments 
            SET appointmentDate = COALESCE(@appointmentDate, appointmentDate),
                duration = COALESCE(@duration, duration),
                reason = COALESCE(@reason, reason),
                status = COALESCE(@status, status),
                notes = COALESCE(@notes, notes),
                followUpNeeded = COALESCE(@followUpNeeded, followUpNeeded),
                updatedAt = GETDATE()
            OUTPUT INSERTED.*
            WHERE appointmentId = @appointmentId
        `;
        
        const request = connection.request();
        request.input('appointmentId', sql.Int, appointmentId);
        request.input('appointmentDate', sql.DateTime2, updateData.appointmentDate ? new Date(updateData.appointmentDate) : null);
        request.input('duration', sql.Int, updateData.duration || null);
        request.input('reason', sql.NVarChar(500), updateData.reason || null);
        request.input('status', sql.NVarChar(50), updateData.status || null);
        request.input('notes', sql.NVarChar(sql.MAX), updateData.notes || null);
        request.input('followUpNeeded', sql.Bit, updateData.followUpNeeded || null);
        
        const result = await request.query(sqlQuery);
        const updatedAppointment = result.recordset[0];
        
        if (!updatedAppointment) {
            throw new Error('Appointment not found or update failed');
        }
        
        return updatedAppointment;
    }

    /**
     * Soft deletes an appointment (marks as cancelled)
     * @param {number} appointmentId - appointment ID
     * @returns {Promise<boolean>} Success status
     */
    static async deleteAppointment(appointmentId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE Appointments 
            SET status = 'cancelled', updatedAt = GETDATE()
            WHERE appointmentId = @appointmentId
        `;
        
        const request = connection.request();
        request.input('appointmentId', sql.Int, appointmentId);
        
        const result = await request.query(sqlQuery);
        return result.rowsAffected[0] > 0;
    }

    /**
     * Searches doctors by specialty and location
     * @param {string} specialty - doctor specialty (optional)
     * @param {string} location - clinic location (optional)
     * @returns {Promise<Array>} Array of doctors
     */
    static async searchDoctors(specialty = null, location = null) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `
            SELECT 
                doctorId,
                name,
                specialty,
                phone,
                email,
                location,
                address,
                rating,
                availability_notes
            FROM Doctors
            WHERE 1=1
        `;
        
        const request = connection.request();
        
        if (specialty) {
            sqlQuery += ` AND specialty LIKE @specialty`;
            request.input('specialty', sql.NVarChar(255), `%${specialty}%`);
        }
        
        if (location) {
            sqlQuery += ` AND location LIKE @location`;
            request.input('location', sql.NVarChar(255), `%${location}%`);
        }
        
        sqlQuery += ` ORDER BY rating DESC, name ASC`;
        
        const result = await request.query(sqlQuery);
        return result.recordset;
    }

    /**
     * Gets doctor availability for a specific doctor
     * @param {number} doctorId - doctor ID
     * @returns {Promise<Array>} Array of availability slots
     */
    static async getDoctorAvailability(doctorId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                availabilityId,
                day_of_week,
                start_time,
                end_time,
                is_available
            FROM DoctorAvailability
            WHERE doctorId = @doctorId AND is_available = 1
            ORDER BY 
                CASE day_of_week
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    WHEN 'Saturday' THEN 6
                    WHEN 'Sunday' THEN 7
                END,
                start_time
        `;
        
        const request = connection.request();
        request.input('doctorId', sql.Int, doctorId);
        
        const result = await request.query(sqlQuery);
        return result.recordset;
    }

    /**
     * Gets doctor details by ID
     * @param {number} doctorId - doctor ID
     * @returns {Promise<Object>} Doctor details
     */
    static async getDoctorById(doctorId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT *
            FROM Doctors
            WHERE doctorId = @doctorId
        `;
        
        const request = connection.request();
        request.input('doctorId', sql.Int, doctorId);
        
        const result = await request.query(sqlQuery);
        return result.recordset[0];
    }

    /**
     * Checks for appointment conflicts (double booking prevention)
     * @param {number} doctorId - doctor ID
     * @param {Date} appointmentDate - proposed appointment date/time
     * @param {number} duration - appointment duration in minutes
     * @param {number} excludeAppointmentId - appointment ID to exclude (for updates)
     * @returns {Promise<boolean>} True if conflict exists
     */
    static async checkAppointmentConflict(doctorId, appointmentDate, duration = 30, excludeAppointmentId = null) {
        const connection = await sql.connect(dbConfig);
        
        const endTime = new Date(appointmentDate.getTime() + duration * 60000);
        
        let sqlQuery = `
            SELECT COUNT(*) as conflictCount
            FROM Appointments
            WHERE doctorId = @doctorId
            AND status = 'scheduled'
            AND (
                (appointmentDate < @endTime AND DATEADD(MINUTE, duration, appointmentDate) > @startTime)
            )
        `;
        
        if (excludeAppointmentId) {
            sqlQuery += ` AND appointmentId != @excludeAppointmentId`;
        }
        
        const request = connection.request();
        request.input('doctorId', sql.Int, doctorId);
        request.input('startTime', sql.DateTime2, appointmentDate);
        request.input('endTime', sql.DateTime2, endTime);
        
        if (excludeAppointmentId) {
            request.input('excludeAppointmentId', sql.Int, excludeAppointmentId);
        }
        
        const result = await request.query(sqlQuery);
        return result.recordset[0].conflictCount > 0;
    }
}

module.exports = Appointment;