const sql = require('mssql');
const dbConfig = require('../dbConfig');

/* appointment model for managing appointment data */
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

    /* creates a new appointment */
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

    /* gets appointments for a user with doctor details */
    static async getAppointmentsByUserId(userId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT a.*, d.name as doctorName, d.specialty, d.phone as doctorPhone, 
                   d.email as doctorEmail, d.location, d.address, d.rating
            FROM Appointments a
            INNER JOIN Doctors d ON a.doctorId = d.doctorId
            WHERE a.userId = @userId
            ORDER BY a.appointmentDate ASC
        `;

        const request = connection.request();
        request.input('userId', userId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /* gets a specific appointment by ID */
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

    /* updates an appointment */
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

    /* deletes an appointment */
    static async deleteAppointment(appointmentId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `DELETE FROM Appointments WHERE appointmentId = @appointmentId`;

        const request = connection.request();
        request.input('appointmentId', appointmentId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    /* gets all doctors for appointment booking */
    static async getAllDoctors() {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `SELECT * FROM Doctors ORDER BY name`;
        
        const result = await connection.request().query(sqlQuery);
        connection.close();

        return result.recordset;
    }
}

module.exports = Appointment;