const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");

async function createReport(reportData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Reports (reviewId, userId, createdAt, reason)
            VALUES (@reviewId, @userId, GETDATE(), @reason)
            UPDATE Reviews
            SET isActive = 0
            WHERE reviewId = @reviewId
        `;
        const request = connection.request();
        request.input("reviewId", sql.Int, reportData.reviewId);
        request.input("userId", sql.Int, reportData.userId);
        request.input("reason", sql.NVarChar, reportData.reason);
        const result = await request.query(query);
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error("Error reporting review:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}

module.exports = {
    createReport
};