const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");
/**
 * Retrieves all bookmarked facilities for a user.
 *
 * @function getBookmarkedFacilities
 * @param {number} userId - The ID of the user.
 * @returns {Array} - An array of bookmarked facilities.
 * @throws Will throw if the database query fails.
 */
async function getBookmarkedFacilities(userId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT f.*, b.bookmarkId
            FROM Facilities f
            JOIN Bookmarks b ON f.facilityId = b.facilityId
            WHERE b.userId = @userId
        `;
        const result = await connection.request()
            .input("userId", sql.Int, userId)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error("Error fetching bookmarked facilities:", error);
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
 * Checks if a facility is bookmarked by a user.
 *
 * @function checkIfBookmarked
 * @param {number} userId - The ID of the user.
 * @param {number} facilityId - The ID of the facility.
 * @returns {Object} - An object containing bookmark information, including `isBookmarked`, `bookmarkId`, and `notes`.
 * @throws Will throw if the database query fails.
 */
async function checkIfBookmarked(userId, facilityId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT bookmarkId, note
            FROM Bookmarks
            WHERE userId = @userId AND facilityId = @facilityId
        `;
        const result = await connection.request()
            .input("userId", sql.Int, userId)
            .input("facilityId", sql.Int, facilityId)
            .query(query);
        const isBookmarked = result.recordset.length > 0;
        const bookmarkId = isBookmarked ? result.recordset[0].bookmarkId : null;
        const notes = isBookmarked ? result.recordset[0].note : null;
        return { isBookmarked, bookmarkId, notes};
    } catch (error) {
        console.error("Error checking if facility is bookmarked:", error);
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
 * Saves a bookmark for a user.
 *
 * @function saveBookmark
 * @param {Object} bookmarkData - The data for the bookmark.
 * @param {number} bookmarkData.userId - The ID of the user.
 * @param {number} bookmarkData.facilityId - The ID of the facility.
 * @param {string} bookmarkData.locationName - The name of the location.
 * @param {string} bookmarkData.note - The note for the bookmark.
 * @returns {number} - The ID of the created bookmark.
 * @throws Will throw if the database query fails.
 */
async function saveBookmark(bookmarkData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Bookmarks (userId, facilityId, locationName, note)
            OUTPUT INSERTED.bookmarkId
            VALUES (@userId, @facilityId, @locationName, @note)
        `;
        const result = await connection.request()
            .input("userId", sql.Int, bookmarkData.userId)
            .input("facilityId", sql.Int, bookmarkData.facilityId)
            .input("locationName", sql.NVarChar, bookmarkData.locationName)
            .input("note", sql.NVarChar, bookmarkData.note)
            .query(query);
            return result.recordset[0].bookmarkId;
    } catch (error) {
        console.error("Error saving bookmark:", error);
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
 * Updates an existing bookmark.
 *
 * @function updateBookmark
 * @param {number} bookmarkId - The ID of the bookmark to update.
 * @param {Object} bookmarkData - The updated data for the bookmark.
 * @param {string} bookmarkData.locationName - The updated location name for the bookmark.
 * @param {string} bookmarkData.note - The updated note for the bookmark.
 * @returns {boolean} - True if the bookmark was updated successfully, false otherwise.
 * @throws Will throw if the database query fails.
 */
async function updateBookmark(bookmarkId, bookmarkData) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE Bookmarks
            SET note = @note,
                locationName = @locationName
            WHERE bookmarkId = @bookmarkId
        `;
        const result = await connection.request()
            .input("bookmarkId", sql.Int, bookmarkId)
            .input("note", sql.NVarChar, bookmarkData.note)
            .input("locationName", sql.NVarChar, bookmarkData.locationName)
            .query(query);
        if (result.rowsAffected[0] === 0) {
              throw new Error("Bookmark not found");
            };
            return true;
    } catch (error) {
        console.error("Error updating bookmark:", error);
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
 * Deletes a bookmark.
 *
 * @function deleteBookmark
 * @param {number} bookmarkId - The ID of the bookmark to delete.
 * @returns {boolean} - True if the bookmark was deleted successfully, false otherwise.
 * @throws Will throw if the database query fails.
 */
async function deleteBookmark(bookmarkId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            DELETE FROM Bookmarks
            WHERE bookmarkId = @bookmarkId
        `;
        const result = await connection.request()
            .input("bookmarkId", sql.Int, bookmarkId)
            .query(query);
        if (result.rowsAffected[0] === 0) {
            throw new Error("Bookmark not found");
        }
    } catch (error) {
        console.error("Error deleting bookmark:", error);
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
    getBookmarkedFacilities,
    checkIfBookmarked,
    saveBookmark,
    updateBookmark,
    deleteBookmark,
};