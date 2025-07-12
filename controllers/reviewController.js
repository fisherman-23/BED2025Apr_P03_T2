const reviewModel = require("../models/reviewModel.js");

async function getReviewsByFacilityId(req, res) {
    try {
        const facilityId = parseInt(req.params.facilityId, 10);
        if (isNaN(facilityId)) {
            return res.status(400).json({ error: "Invalid facility ID" });
        }
        const reviews = await reviewModel.getReviewsByFacilityId(facilityId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error in getReviewsByFacilityId:", error);
        res.status(500).json({ error: "Error fetching reviews" });
    }
}

async function addReview(req, res) {
    try {
        const { facilityId, rating, comment } = req.body;
        const userId = req.user.id;

        if (!facilityId || !rating || !comment) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const reviewData = {
            FacilityId: facilityId,
            UserId: userId,
            Rating: rating,
            Comment: comment
        };

        const success = await reviewModel.addReview(reviewData);
        if (success) {
            res.status(201).json({ message: "Review added successfully" });
        } else {
            res.status(500).json({ error: "Failed to add review" });
        }
    } catch (error) {
        console.error("Error in addReview:", error);
        res.status(500).json({ error: "Error adding review" });
    }
}

async function updateReview(req, res) {
    try {
        const reviewId = parseInt(req.params.id, 10);
        const { rating, comment } = req.body;
        const userId = req.user.id; // Assuming user ID is stored in req.user after authentication

        if (isNaN(reviewId) || !rating || !comment) {
            return res.status(400).json({ error: "Invalid input" });
        }

        const reviewData = {
            UserId: userId,
            Rating: rating,
            Comment: comment
        };

        const success = await reviewModel.updateReview(reviewId, reviewData);
        if (success) {
            res.status(200).json({ message: "Review updated successfully" });
        } else {
            res.status(500).json({ error: "Failed to update review" });
        }
    } catch (error) {
        console.error("Error in updateReview:", error);
        res.status(500).json({ error: "Error updating review" });
    }
}

async function deleteReview(req, res) {
    try {
        const reviewId = parseInt(req.params.id, 10);
        const userId = req.user.id; // Assuming user ID is stored in req.user after authentication
        if (isNaN(reviewId)) {
            return res.status(400).json({ error: "Invalid review ID" });
        }

        const success = await reviewModel.deleteReview(reviewId, userId);
        if (success) {
            res.status(200).json({ message: "Review deleted successfully" });
        } else {
            res.status(500).json({ error: "Failed to delete review" });
        }
    } catch (error) {
        console.error("Error in deleteReview:", error);
        res.status(500).json({ error: "Error deleting review" });
    }
}

async function createReport(req, res) {
    try {
        const { reviewId, reason } = req.body;
        const userId = req.user.id;

        if (!reviewId || isNaN(reviewId)) {
            return res.status(400).json({ error: "Invalid review ID" });
        }
        const reportData = {
            ReviewId: reviewId,
            UserId: userId,
            Reason: reason
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
    getReviewsByFacilityId,
    addReview,
    updateReview,
    deleteReview,
    createReport
};
