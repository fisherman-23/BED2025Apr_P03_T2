const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");

async function getReviewsByFacilityId(facilityId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT r.*, u.name AS UserName, u.ProfilePicture
            FROM Reviews r
            JOIN Users u ON r.userId = u.id
            WHERE r.facilityId = @FacilityId AND r.IsActive = 1
            ORDER BY r.createdAt DESC
        `;
        const result = await connection.request()
            .input("FacilityId", sql.Int, facilityId)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error("Error fetching reviews:", error);
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

async function createReview(reviewData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Reviews (FacilityId, UserId, Rating, Comment, CreatedAt, lastModified)
            VALUES (@FacilityId, @UserId, @Rating, @Comment, GETDATE(), GETDATE())
        `;
        const request = connection.request();
        request.input("FacilityId", sql.Int, reviewData.FacilityId);
        request.input("UserId", sql.Int, reviewData.UserId);
        request.input("Rating", sql.Int, reviewData.Rating);
        request.input("Comment", sql.NVarChar, reviewData.Comment);
        const result = await request.query(query);
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error("Error adding review:", error);
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

async function updateReview(reviewId, reviewData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE Reviews
            SET Rating = @Rating, Comment = @Comment, lastModified = GETDATE()
            WHERE ReviewId = @ReviewId AND UserId = @UserId
        `;
        const request = connection.request();
        request.input("ReviewId", sql.Int, reviewId);
        request.input("UserId", sql.Int, reviewData.UserId);
        request.input("Rating", sql.Int, reviewData.Rating);
        request.input("Comment", sql.NVarChar, reviewData.Comment);
        const result = await request.query(query);
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error("Error updating review:", error);
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

async function deleteReview(reviewId, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            DELETE FROM Reviews
            WHERE ReviewId = @ReviewId AND UserId = @UserId
        `;
        const request = connection.request();
        request.input("ReviewId", sql.Int, reviewId);
        request.input("UserId", sql.Int, userId);
        const result = await request.query(query);
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error("Error deleting review:", error);
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
    getReviewsByFacilityId,
    createReview,
    updateReview,
    deleteReview,
}