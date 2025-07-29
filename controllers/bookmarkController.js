const bookmarkModel = require('../models/bookmarkModel.js');
/**
 * Retrieves all bookmarked facilities for the authenticated user.
 *
 * @async
 * @function getBookmarkedFacilities
 * @param {Object} req - Express request object, requires `req.user.id` from the middleware.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with bookmarks or 404 if no bookmarks found, 500 on error.
 */
async function getBookmarkedFacilities(req, res) {
    try {
        const bookmarks = await bookmarkModel.getBookmarkedFacilities(req.user.id);
        if (!bookmarks){
            return res.status(404).json({ error: "No bookmarks found for this user" });
        }
        res.status(200).json(bookmarks);
    } catch (error) {
        console.error("Error in getBookmarkedFacilities:", error);
        res.status(500).json({ error: "Error fetching bookmarked facilities" });
    }
}
/**
 * Checks if a facility is bookmarked by the user.
 *
 * @async
 * @function checkIfBookmarked
 * @param {Object} req - Express request object, requires `req.user.id` and `req.params.facilityId`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with bookmark status or 500 on error.
 */
async function checkIfBookmarked(req, res) {
    try {
        const { isBookmarked, bookmarkId, notes } = await bookmarkModel.checkIfBookmarked(req.user.id, req.params.facilityId);
        res.status(200).json({ isBookmarked, bookmarkId, notes });
    } catch (error) {
        console.error("Error in checkIfBookmarked:", error);
        res.status(500).json({ error: "Error checking bookmark status" });
    }
}
/**
 * Saves a bookmark for the authenticated user.
 *
 * @async
 * @function saveBookmark
 * @param {Object} req - Express request object, requires `req.user.id` from the middleware.
 * @param {Object} res - Express response object.
 * @returns {Object} 201 Created with bookmark ID or 500 on error.
 */
async function saveBookmark(req, res) {
    try {
        const { bookmarkId } = await bookmarkModel.saveBookmark({ ...req.body, userId: req.user.id });
        res.status(201).json({ message: "Bookmark saved successfully", bookmarkId });
    } catch (error) {
        console.error("Error in saveBookmark:", error);
        res.status(500).json({ error: "Error saving bookmark" });
    }
}
/**
 * Updates an existing bookmark for the authenticated user with new data.
 *
 * @async
 * @function updateBookmark
 * @param {Object} req - Express request object, requires `req.params.bookmarkId` and `req.body` with updated data.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with success message or 404 if bookmark not found, 500 on error.
 */
async function updateBookmark(req, res) {
    try {
        const updatedBookmark = await bookmarkModel.updateBookmark(req.params.bookmarkId, req.body);
        if (!updatedBookmark) {
            return res.status(404).json({ error: "Bookmark not found" });
        }
        res.status(200).json({ message: "Bookmark updated successfully" });
    } catch (error) {
        console.error("Error in updateBookmark:", error);
        res.status(500).json({ error: "Error updating bookmark" });
    }
}
/**
 * Deletes a bookmark for the authenticated user.
 *
 * @async
 * @function deleteBookmark
 * @param {Object} req - Express request object, requires `req.params.bookmarkId`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with success message or 404 if bookmark not found, 500 on error.
 */
async function deleteBookmark(req, res) {
    try {
        await bookmarkModel.deleteBookmark(req.params.bookmarkId);
        res.status(200).json({ message: "Bookmark deleted successfully" });
    } catch (error) {
        console.error("Error in deleteBookmark:", error);
        res.status(500).json({ error: "Error deleting bookmark" });
    }
}

module.exports = {
    getBookmarkedFacilities,
    checkIfBookmarked,
    saveBookmark,
    updateBookmark,
    deleteBookmark
};