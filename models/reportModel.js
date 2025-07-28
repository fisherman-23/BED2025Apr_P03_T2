const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");

async function createReport(reportData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Reports (ReviewId, UserId, CreatedAt, Reason)
            VALUES (@ReviewId, @UserId, GETDATE(), @Reason)
            UPDATE Reviews
            SET isActive = 0
            WHERE ReviewId = @ReviewId
        `;
        const request = connection.request();
        request.input("ReviewId", sql.Int, reportData.reviewId);
        request.input("UserId", sql.Int, reportData.userId);
        request.input("Reason", sql.NVarChar, reportData.reason);
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