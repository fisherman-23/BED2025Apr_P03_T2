const sql = require("mssql");
const dbConfig = require("../dbConfig");
const jwt = require("jsonwebtoken");

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

async function checkIfBookmarked(userId, facilityId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT BookmarkId
            FROM Bookmarks
            WHERE userId = @userId AND facilityId = @facilityId
        `;
        const result = await connection.request()
            .input("userId", sql.Int, userId)
            .input("facilityId", sql.Int, facilityId)
            .query(query);
        const isBookmarked = result.recordset.length > 0;
        const bookmarkId = isBookmarked ? result.recordset[0].BookmarkId : null;
        return { isBookmarked, bookmarkId };
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
    deleteBookmark,
};