const bookmarkModel = require('../models/bookmarkModel.js');

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

async function checkIfBookmarked(req, res) {
    try {
        const { isBookmarked, bookmarkId, notes } = await bookmarkModel.checkIfBookmarked(req.user.id, req.params.facilityId);
        res.status(200).json({ isBookmarked, bookmarkId, notes });
    } catch (error) {
        console.error("Error in checkIfBookmarked:", error);
        res.status(500).json({ error: "Error checking bookmark status" });
    }
}

async function saveBookmark(req, res) {
    try {
        const { bookmarkId } = await bookmarkModel.saveBookmark({ ...req.body, userId: req.user.id });
        res.status(201).json({ message: "Bookmark saved successfully", bookmarkId });
    } catch (error) {
        console.error("Error in saveBookmark:", error);
        res.status(500).json({ error: "Error saving bookmark" });
    }
}

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