const reviewModel = require("../models/reviewModel.js");

async function getReviewsByFacilityId(req, res) {
    try {
        const reviews = await reviewModel.getReviewsByFacilityId(req.params.facilityId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error in getReviewsByFacilityId:", error);
        res.status(500).json({ error: "Error fetching reviews" });
    }
}

async function createReview(req, res) {
    try {
        const reviewData = {
            FacilityId: req.body.facilityId,
            UserId: req.user.id,
            Rating: req.body.rating,
            Comment: req.body.comment
        };

        const success = await reviewModel.createReview(reviewData);
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
        const reviewData = {
            UserId: req.user.id,
            Rating: req.body.rating,
            Comment: req.body.comment
        };

        const success = await reviewModel.updateReview(req.params.id, reviewData);
        if (success) {
            res.status(200).json({ message: "Review updated successfully" });
        } else {
            res.status(404).json({ error: "Review not found" });
        }
    } catch (error) {
        console.error("Error in updateReview:", error);
        res.status(500).json({ error: "Error updating review" });
    }
}

async function deleteReview(req, res) {
    try {
        const success = await reviewModel.deleteReview(req.params.id, req.user.id);
        if (success) {
            res.status(200).json({ message: "Review deleted successfully" });
        } else {
            res.status(404).json({ error: "Review not found" });
        }
    } catch (error) {
        console.error("Error in deleteReview:", error);
        res.status(500).json({ error: "Error deleting review" });
    }
}

module.exports = {
    getReviewsByFacilityId,
    createReview,
    updateReview,
    deleteReview
};
