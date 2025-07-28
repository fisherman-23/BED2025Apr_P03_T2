const reviewModel = require("../models/reportModel.js");

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