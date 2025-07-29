const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");
/**
 * Retrieves all reviews for a specific facility.
 * 
 * @param {number} facilityId - The ID of the facility.
 * @returns {Promise<Object[]>} - Array of review objects for the facility.
 * @throws Will throw if the database query fails.
 */
async function getReviewsByFacilityId(facilityId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT r.*, u.name AS UserName, u.ProfilePicture
            FROM Reviews r
            JOIN Users u ON r.userId = u.id
            WHERE r.facilityId = @facilityId AND r.IsActive = 1
            ORDER BY r.createdAt DESC
        `;
        const result = await connection.request()
            .input("facilityId", sql.Int, facilityId)
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
/**
 * Creates a new review.
 * 
 * @param {Object} reviewData - The data for the review.
 * @param {number} reviewData.facilityId - The ID of the facility being reviewed.
 * @param {number} reviewData.userId - The ID of the user creating the review.
 * @param {number} reviewData.rating - The rating given in the review.
 * @param {string} reviewData.comment - The comment for the review.
 * @returns {Promise<boolean>} - Returns true if the review was created successfully, false otherwise.
 * @throws Will throw if the database query fails.
 */
async function createReview(reviewData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Reviews (facilityId, userId, rating, comment, createdAt, lastModified)
            VALUES (@facilityId, @userId, @rating, @comment, GETDATE(), GETDATE())
        `;
        const request = connection.request();
        request.input("facilityId", sql.Int, reviewData.facilityId);
        request.input("userId", sql.Int, reviewData.userId);
        request.input("rating", sql.Int, reviewData.rating);
        request.input("comment", sql.NVarChar, reviewData.comment);
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
/**
 * Updates an existing review.
 *
 * @param {number} reviewId - The ID of the review to update.
 * @param {Object} reviewData - The updated review data.
 * @param {number} reviewData.userId - The ID of the user updating the review.
 * @param {number} reviewData.rating - The updated rating for the review.
 * @param {string} reviewData.comment - The updated comment for the review.
 * @returns {Promise<boolean>} - Returns true if the review was updated successfully, false otherwise.
 * @throws Will throw if the database query fails.
 */
async function updateReview(reviewId, reviewData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE Reviews
            SET rating = @rating, comment = @comment, lastModified = GETDATE()
            WHERE reviewId = @reviewId AND userId = @userId
        `;
        const request = connection.request();
        request.input("reviewId", sql.Int, reviewId);
        request.input("userId", sql.Int, reviewData.userId);
        request.input("rating", sql.Int, reviewData.rating);
        request.input("comment", sql.NVarChar, reviewData.comment);
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
/**
 * Deletes a review.
 *
 * @param {number} reviewId - The ID of the review to delete.
 * @param {number} userId - The ID of the user deleting the review.
 * @returns {Promise<boolean>} - Returns true if the review was deleted successfully, false otherwise.
 * @throws Will throw if the database query fails.
 */
async function deleteReview(reviewId, userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            DELETE FROM Reviews
            WHERE reviewId = @reviewId AND userId = @userId
        `;
        const request = connection.request();
        request.input("reviewId", sql.Int, reviewId);
        request.input("userId", sql.Int, userId);
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