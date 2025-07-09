const bookmarkModel = require('../models/bookmarkModel.js');

async function getBookmarkedFacilities(req, res) {
    try {
        const userId = req.user.id;
        const bookmarks = await bookmarkModel.getBookmarkedFacilities(userId);
        if (!bookmarks){
            return res.status(404).json({ error: "No bookmarks found for this user" });
        }
        res.status(200).json(bookmarks);
    } catch (error) {
        console.error("Error in getBookmarkedFacilities:", error);
        res.status(500).json({ error: "Error fetching bookmarked facilities" });
    }
}

async function checkIfBookmarked(req, res) {
    try {
        const userId = req.user.id;
        const facilityId = parseInt(req.params.facilityId, 10);
        if (isNaN(facilityId)) {
            return res.status(400).json({ error: "Invalid facility ID" });
        }
        const { isBookmarked, bookmarkId, notes } = await bookmarkModel.checkIfBookmarked(userId, facilityId);
        res.status(200).json({ isBookmarked, bookmarkId, notes });
    } catch (error) {
        console.error("Error in checkIfBookmarked:", error);
        res.status(500).json({ error: "Error checking bookmark status" });
    }
}

async function saveBookmark(req, res) {
    try {
        const userId = req.user.id;
        const { bookmarkId } = await bookmarkModel.saveBookmark({ ...req.body, userId });
        res.status(201).json({ message: "Bookmark saved successfully", bookmarkId });
    } catch (error) {
        console.error("Error in saveBookmark:", error);
        res.status(500).json({ error: "Error saving bookmark" });
    }
}

async function updateBookmark(req, res) {
    try {
        const bookmarkId = parseInt(req.params.bookmarkId, 10);
        if (isNaN(bookmarkId)) {
            return res.status(400).json({ error: "Invalid bookmark ID" });
        }
        const updatedBookmark = await bookmarkModel.updateBookmark(bookmarkId, req.body);
        if (!updatedBookmark) {
            return res.status(404).json({ error: "Bookmark not found" });
        }
        res.status(200).json({ message: "Bookmark updated successfully" });
    } catch (error) {
        console.error("Error in updateBookmark:", error);
        res.status(500).json({ error: "Error updating bookmark" });
    }
}

async function deleteBookmark(req, res) {
    try {
        const bookmarkId = parseInt(req.params.bookmarkId, 10);
        await bookmarkModel.deleteBookmark(bookmarkId);
        if (!bookmarkId) {
            return res.status(404).json({ error: "Bookmark not found" });
        }
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