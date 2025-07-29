const reviewModel = require("../models/reviewModel.js");
/**
 * Retrieves reviews for a specific facility.
 *
 * @async
 * @function getReviewsByFacilityId
 * @param {Object} req - Express request object, requires `req.params.facilityId`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with reviews or 500 on error.
 */
async function getReviewsByFacilityId(req, res) {
    try {
        const reviews = await reviewModel.getReviewsByFacilityId(req.params.facilityId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error in getReviewsByFacilityId:", error);
        res.status(500).json({ error: "Error fetching reviews" });
    }
}
/**
 * Creates a review for a facility.
 *
 * @async
 * @function createReview
 * @param {Object} req - Express request object, requires `req.body.facilityId`, `req.body.rating`, and `req.body.comment`.
 * @param {Object} res - Express response object.
 * @returns {Object} 201 Created with success message or 500 on error.
 */
async function createReview(req, res) {
    try {
        const reviewData = {
            facilityId: req.body.facilityId,
            userId: req.user.id,
            rating: req.body.rating,
            comment: req.body.comment
        };

        const success = await reviewModel.createReview(reviewData);
        if (success) {
            res.status(201).json({ message: "Review added successfully" });
        } else {
            res.status(500).json({ error: "Failed to add review" });
        }
    } catch (error) {
        console.error("Error in addReview:", error);
        if (error.message && error.message.includes('UNIQUE KEY constraint')) {
            res.status(409).json({ error: "You have already reviewed this facility. Please edit your existing review instead." });
        } else {
            res.status(500).json({ error: "Error adding review" });
        }
    }
}
/**
 * Updates an existing review made by the user.
 *
 * @async
 * @function updateReview
 * @param {Object} req - Express request object, requires `req.params.id` and `req.body`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with success message or 404 if not found, 500 on error.
 */
async function updateReview(req, res) {
    try {
        const reviewData = {
            userId: req.user.id,
            rating: req.body.rating,
            comment: req.body.comment
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
/**
 * Deletes a review made by the user.
 *
 * @async
 * @function deleteReview
 * @param {Object} req - Express request object, requires `req.params.id`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 OK with success message or 404 if not found, 500 on error.
 */
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
