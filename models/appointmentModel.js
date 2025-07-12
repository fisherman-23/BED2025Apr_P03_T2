const sql = require('mssql');
const dbConfig = require('../dbConfig');

// appointment model for managing appointment data
class Appointment {
    constructor(appointmentId, userId, doctorId, appointmentDate, duration, reason, status, notes, reminderSent, followUpNeeded) {
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
    }

    // creates a new appointment
    static async createAppointment(appointmentData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO Appointments (userId, doctorId, appointmentDate, duration, reason, status, notes, followUpNeeded)
            OUTPUT INSERTED.*
            VALUES (@userId, @doctorId, @appointmentDate, @duration, @reason, @status, @notes, @followUpNeeded)
        `;

        const request = connection.request();
        request.input('userId', appointmentData.userId);
        request.input('doctorId', appointmentData.doctorId);
        request.input('appointmentDate', appointmentData.appointmentDate);
        request.input('duration', appointmentData.duration);
        request.input('reason', appointmentData.reason);
        request.input('status', appointmentData.status || 'scheduled');
        request.input('notes', appointmentData.notes);
        request.input('followUpNeeded', appointmentData.followUpNeeded || false);

        const result = await request.query(sqlQuery);
        connection.close();

        const row = result.recordset[0];
        return new Appointment(
            row.appointmentId, row.userId, row.doctorId,
            row.appointmentDate, row.duration, row.reason,
            row.status, row.notes, row.reminderSent, row.followUpNeeded
        );
    }

    // gets appointments for a user with doctor details
    static async getAppointmentsByUserId(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT a.*, d.name as doctorName, d.specialty, d.phone as doctorPhone,
                   d.email as doctorEmail, d.location, d.address, d.rating,
                   u.name as patient_name,
                   CASE 
                       WHEN a.appointmentDate < GETDATE() THEN 'past'
                       WHEN a.appointmentDate > GETDATE() THEN 'upcoming'
                       ELSE 'today'
                   END as appointment_status
            FROM Appointments a
            INNER JOIN Doctors d ON a.doctorId = d.doctorId
            INNER JOIN Users u ON a.userId = u.id
            WHERE a.userId = @userId
            ORDER BY a.appointmentDate DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // gets a specific appointment by ID
    static async getAppointmentById(appointmentId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT a.*, d.name as doctorName, d.specialty, d.phone as doctorPhone,
                   d.email as doctorEmail, d.location, d.address, d.rating
            FROM Appointments a
            INNER JOIN Doctors d ON a.doctorId = d.doctorId
            WHERE a.appointmentId = @appointmentId
        `;

        const request = connection.request();
        request.input('appointmentId', appointmentId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset.length > 0 ? result.recordset[0] : null;
    }

    // updates an appointment
    static async updateAppointment(appointmentId, appointmentData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE Appointments 
            SET appointmentDate = @appointmentDate, duration = @duration, 
                reason = @reason, status = @status, notes = @notes,
                followUpNeeded = @followUpNeeded, updatedAt = GETDATE()
            WHERE appointmentId = @appointmentId
        `;

        const request = connection.request();
        request.input('appointmentId', appointmentId);
        request.input('appointmentDate', appointmentData.appointmentDate);
        request.input('duration', appointmentData.duration);
        request.input('reason', appointmentData.reason);
        request.input('status', appointmentData.status);
        request.input('notes', appointmentData.notes);
        request.input('followUpNeeded', appointmentData.followUpNeeded);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // deletes an appointment
    static async deleteAppointment(appointmentId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `DELETE FROM Appointments WHERE appointmentId = @appointmentId`;

        const request = connection.request();
        request.input('appointmentId', appointmentId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    // gets all doctors for appointment booking
    static async getAllDoctors() {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `SELECT * FROM Doctors ORDER BY name`;
        
        const result = await connection.request().query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // searches doctors by specialty and location
    static async searchDoctors(specialty, location) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `SELECT * FROM Doctors WHERE 1=1`;
        const request = connection.request();

        if (specialty) {
            sqlQuery += ` AND LOWER(specialty) LIKE LOWER(@specialty)`;
            request.input('specialty', `%${specialty}%`);
        }

        if (location) {
            sqlQuery += ` AND LOWER(location) LIKE LOWER(@location)`;
            request.input('location', `%${location}%`);
        }

        sqlQuery += ` ORDER BY rating DESC, name`;

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // gets doctor availability
    static async getDoctorAvailability(doctorId, date) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT da.*, 
                   CASE WHEN a.appointmentId IS NOT NULL THEN 1 ELSE 0 END as is_booked
            FROM DoctorAvailability da
            LEFT JOIN Appointments a ON da.doctorId = a.doctorId 
                AND CAST(a.appointmentDate AS DATE) = CAST(@date AS DATE)
                AND CAST(a.appointmentDate AS TIME) = da.start_time
                AND a.status != 'cancelled'
            WHERE da.doctorId = @doctorId 
              AND da.day_of_week = DATENAME(WEEKDAY, @date)
            ORDER BY da.start_time
        `;

        const request = connection.request();
        request.input('doctorId', doctorId);
        request.input('date', date);
        
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // sends appointment reminder
    static async sendReminder(appointmentId) {
        const connection = await sql.connect(dbConfig);
        
        // update reminder sent status
        const updateQuery = `
            UPDATE Appointments 
            SET reminderSent = 1, updatedAt = GETDATE()
            WHERE appointmentId = @appointmentId
        `;

        const request = connection.request();
        request.input('appointmentId', appointmentId);
        await request.query(updateQuery);
        connection.close();

        // in a real implementation, this would integrate with SMS/Email service
        return { message: 'Reminder sent successfully' };
    }

    // gets directions using OneMap API
    static async getDirections(startLocation, endLocation) {
        try {
            // in a real implementation, this would call OneMap API
            // for now, returning mock data
            return {
                distance: '2.5 km',
                duration: '15 minutes',
                steps: [
                    'Head north on Current Street',
                    'Turn right onto Main Road',
                    'Continue for 1.2 km',
                    'Turn left onto Clinic Avenue',
                    'Destination will be on your right'
                ],
                transport_options: [
                    { mode: 'walking', duration: '30 minutes' },
                    { mode: 'bus', duration: '15 minutes', bus_number: '123' },
                    { mode: 'mrt', duration: '12 minutes', stations: 2 }
                ]
            };
        } catch (error) {
            console.error('Error getting directions:', error);
            throw new Error('Failed to get directions');
        }
    }

    // gets upcoming appointments for reminders
    static async getUpcomingAppointments(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT a.*, d.name as doctorName, d.specialty, d.location
            FROM Appointments a
            INNER JOIN Doctors d ON a.doctorId = d.doctorId
            WHERE a.userId = @userId 
              AND a.appointmentDate > GETDATE()
              AND a.appointmentDate <= DATEADD(day, 7, GETDATE())
              AND a.status = 'scheduled'
            ORDER BY a.appointmentDate ASC
        `;

        const request = connection.request();
        request.input('userId', userId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    // checks for appointment conflicts
    static async checkAppointmentConflicts(userId, appointmentDate, duration, excludeAppointmentId = null) {
        const connection = await sql.connect(dbConfig);
        
        let sqlQuery = `
            SELECT COUNT(*) as conflict_count
            FROM Appointments
            WHERE userId = @userId
              AND status != 'cancelled'
              AND (
                  (appointmentDate <= @appointmentDate AND DATEADD(minute, duration, appointmentDate) > @appointmentDate)
                  OR
                  (appointmentDate < @endTime AND DATEADD(minute, duration, appointmentDate) >= @endTime)
                  OR
                  (appointmentDate >= @appointmentDate AND appointmentDate < @endTime)
              )
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('appointmentDate', appointmentDate);
        request.input('endTime', new Date(new Date(appointmentDate).getTime() + duration * 60000));

        if (excludeAppointmentId) {
            sqlQuery += ` AND appointmentId != @excludeAppointmentId`;
            request.input('excludeAppointmentId', excludeAppointmentId);
        }

        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset[0].conflict_count > 0;
    }
}

module.exports = Appointment;