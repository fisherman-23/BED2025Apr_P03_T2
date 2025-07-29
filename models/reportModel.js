const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");
/**
 * Creates a report for a review and deactivates the reported review removing it from display.
 * 
 * @param {Object} reportData - The data for the report.
 * @param {number} reportData.reviewId - The ID of the review being reported.
 * @param {number} reportData.userId - The ID of the user reporting the review.
 * @param {string} reportData.reason - The reason for reporting the review.
 * @returns {Promise<boolean>} - Returns true if the report was created successfully, false otherwise.
 * @throws Will throw if the database query fails.
 */
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