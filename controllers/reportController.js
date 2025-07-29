const reviewModel = require("../models/reportModel.js");
/**
 * Creates a report for a review.
 *
 * @async
 * @function createReport
 * @param {Object} req - Express request object, requires `req.body.reviewId` and `req.body.reason`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with success message or 500 on error.
 */
async function createReport(req, res) {
    try {
        console.log("Creating report for review ID:", req.body.reviewId);
        const reportData = {
            reviewId: req.body.reviewId,
            userId: req.user.id,
            reason: req.body.reason
        };
        const success = await reviewModel.createReport(reportData);
        if (success) {
            res.status(200).json({ message: "Review reported successfully" });
        } else {
            res.status(500).json({ error: "Failed to report review" });
        }
    } catch (error) {
        console.error("Error in reportReview:", error);
        res.status(500).json({ error: "Error reporting review" });
    }
}

module.exports = {
    createReport
};