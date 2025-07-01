const sql = require('mssql');
const dbConfig = require('../dbConfig');

/* health data model for managing health tracking data */
class HealthData {
    constructor(healthId, userId, recordDate, bloodPressureSystolic, bloodPressureDiastolic, weight, bloodSugar, notes, complianceScore) {
        this.healthId = healthId;
        this.userId = userId;
        this.recordDate = recordDate;
        this.bloodPressureSystolic = bloodPressureSystolic;
        this.bloodPressureDiastolic = bloodPressureDiastolic;
        this.weight = weight;
        this.bloodSugar = bloodSugar;
        this.notes = notes;
        this.complianceScore = complianceScore;
    }

    /* creates a new health data record */
    static async createHealthData(healthData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            INSERT INTO HealthData (userId, recordDate, bloodPressureSystolic, bloodPressureDiastolic, weight, bloodSugar, notes, complianceScore)
            OUTPUT INSERTED.*
            VALUES (@userId, @recordDate, @bloodPressureSystolic, @bloodPressureDiastolic, @weight, @bloodSugar, @notes, @complianceScore)
        `;

        const request = connection.request();
        request.input('userId', healthData.userId);
        request.input('recordDate', healthData.recordDate);
        request.input('bloodPressureSystolic', healthData.bloodPressureSystolic);
        request.input('bloodPressureDiastolic', healthData.bloodPressureDiastolic);
        request.input('weight', healthData.weight);
        request.input('bloodSugar', healthData.bloodSugar);
        request.input('notes', healthData.notes);
        request.input('complianceScore', healthData.complianceScore);

        const result = await request.query(sqlQuery);
        connection.close();

        const row = result.recordset[0];
        return new HealthData(
            row.healthId, row.userId, row.recordDate,
            row.bloodPressureSystolic, row.bloodPressureDiastolic,
            row.weight, row.bloodSugar, row.notes, row.complianceScore
        );
    }

    /* gets health data for a user */
    static async getHealthDataByUserId(userId, limit = 30) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT TOP (@limit) * FROM HealthData 
            WHERE userId = @userId 
            ORDER BY recordDate DESC
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('limit', limit);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset;
    }

    /* gets a specific health record by ID */
    static async getHealthDataById(healthId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `SELECT * FROM HealthData WHERE healthId = @healthId`;

        const request = connection.request();
        request.input('healthId', healthId);
        const result = await request.query(sqlQuery);
        connection.close();

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            return new HealthData(
                row.healthId, row.userId, row.recordDate,
                row.bloodPressureSystolic, row.bloodPressureDiastolic,
                row.weight, row.bloodSugar, row.notes, row.complianceScore
            );
        }
        return null;
    }

    /* updates a health data record */
    static async updateHealthData(healthId, healthData) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            UPDATE HealthData 
            SET recordDate = @recordDate, bloodPressureSystolic = @bloodPressureSystolic,
                bloodPressureDiastolic = @bloodPressureDiastolic, weight = @weight,
                bloodSugar = @bloodSugar, notes = @notes, complianceScore = @complianceScore
            WHERE healthId = @healthId
        `;

        const request = connection.request();
        request.input('healthId', healthId);
        request.input('recordDate', healthData.recordDate);
        request.input('bloodPressureSystolic', healthData.bloodPressureSystolic);
        request.input('bloodPressureDiastolic', healthData.bloodPressureDiastolic);
        request.input('weight', healthData.weight);
        request.input('bloodSugar', healthData.bloodSugar);
        request.input('notes', healthData.notes);
        request.input('complianceScore', healthData.complianceScore);

        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    /* deletes a health data record */
    static async deleteHealthData(healthId) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `DELETE FROM HealthData WHERE healthId = @healthId`;

        const request = connection.request();
        request.input('healthId', healthId);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.rowsAffected[0] > 0;
    }

    /* gets health data statistics for a user */
    static async getHealthStatistics(userId, days = 30) {
        const connection = await sql.connect(dbConfig);
        
        const sqlQuery = `
            SELECT 
                AVG(CAST(bloodPressureSystolic AS FLOAT)) as avgSystolic,
                AVG(CAST(bloodPressureDiastolic AS FLOAT)) as avgDiastolic,
                AVG(CAST(weight AS FLOAT)) as avgWeight,
                AVG(CAST(bloodSugar AS FLOAT)) as avgBloodSugar,
                AVG(CAST(complianceScore AS FLOAT)) as avgCompliance,
                COUNT(*) as recordCount
            FROM HealthData 
            WHERE userId = @userId 
            AND recordDate >= DATEADD(day, -@days, GETDATE())
        `;

        const request = connection.request();
        request.input('userId', userId);
        request.input('days', days);
        const result = await request.query(sqlQuery);
        connection.close();

        return result.recordset[0];
    }
}

module.exports = HealthData;