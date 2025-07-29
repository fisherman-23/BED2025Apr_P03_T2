const reviewController = require("../../controllers/reviewController");
const reviewModel = require("../../models/reviewModel");

jest.mock("../../models/reviewModel");

describe("reviewController.getReviewsByFacilityId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return reviews for a valid facility ID", async () => {
        const mockReviews = [
            { id: 1, facilityId: 1, userId: 1, rating: 5, comment: "Great service!" },
            { id: 2, facilityId: 1, userId: 2, rating: 4, comment: "Very good experience." }
        ];

        reviewModel.getReviewsByFacilityId.mockResolvedValue(mockReviews);

        const req = { params: { facilityId: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.getReviewsByFacilityId(req, res);

        expect(reviewModel.getReviewsByFacilityId).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockReviews);
    });

    it("should handle errors and return a 500 status with error message", async () => {
        reviewModel.getReviewsByFacilityId.mockRejectedValue(new Error("Database error"));

        const req = { params: { facilityId: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.getReviewsByFacilityId(req, res);

        expect(reviewModel.getReviewsByFacilityId).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error fetching reviews" });
    });

    it("should return an empty array if no reviews are found", async () => {
        reviewModel.getReviewsByFacilityId.mockResolvedValue([]);

        const req = { params: { facilityId: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.getReviewsByFacilityId(req, res);

        expect(reviewModel.getReviewsByFacilityId).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });
});

describe("reviewController.createReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a review for a valid facility ID and user ID", async () => {
        const mockReviewData = {
            facilityId: 1,
            userId: 1,
            rating: 5,
            comment: "Excellent service!"
        };

        reviewModel.createReview.mockResolvedValue(true);

        const req = {
            body: mockReviewData,
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.createReview(req, res);

        expect(reviewModel.createReview).toHaveBeenCalledWith(mockReviewData);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: "Review added successfully" });
    });

    it("should return 500 when review creation fails", async () => {
        reviewModel.createReview.mockResolvedValue(false);

        const req = {
            body: { facilityId: 1, rating: 5, comment: "Great!" },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.createReview(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to add review" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        reviewModel.createReview.mockRejectedValue(new Error("Database error"));

        const req = {
            body: { facilityId: 1, rating: 5, comment: "Great!" },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.createReview(req, res);

        expect(reviewModel.createReview).toHaveBeenCalledWith(expect.objectContaining({
            facilityId: 1,
            userId: 1
        }));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error adding review" });
    });

    it("should handle duplicate review constraint and return 409 status", async () => {
        const constraintError = new Error("Violation of UNIQUE KEY constraint 'UQ_Reviews_User_Facility'");
        reviewModel.createReview.mockRejectedValue(constraintError);

        const req = {
            body: { facilityId: 1, rating: 5, comment: "Great!" },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.createReview(req, res);

        expect(reviewModel.createReview).toHaveBeenCalledWith(expect.objectContaining({
            facilityId: 1,
            userId: 1
        }));
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ 
            error: "You have already reviewed this facility. Please edit your existing review instead." 
        });
    });
});

describe("reviewController.updateReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a review for a valid review ID and user ID", async () => {
        const mockReviewData = {
            rating: 4,
            comment: "Good service!"
        };

        reviewModel.updateReview.mockResolvedValue(true);

        const req = {
            params: { id: 1 },
            body: mockReviewData,
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.updateReview(req, res);

        expect(reviewModel.updateReview).toHaveBeenCalledWith(1, expect.objectContaining({
            userId: 1,
            rating: 4,
            comment: "Good service!"
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Review updated successfully" });
    });

    it("should return 404 when review not found", async () => {
        reviewModel.updateReview.mockResolvedValue(false);

        const req = {
            params: { id: 999 },
            body: { rating: 4, comment: "Updated" },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.updateReview(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Review not found" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        reviewModel.updateReview.mockRejectedValue(new Error("Database error"));

        const req = {
            params: { id: 1 },
            body: { rating: 4, comment: "Good!" },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.updateReview(req, res);

        expect(reviewModel.updateReview).toHaveBeenCalledWith(1, expect.objectContaining({
            userId: 1
        }));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error updating review" });
    });
});

describe("reviewController.deleteReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a review for a valid review ID and user ID", async () => {
        reviewModel.deleteReview.mockResolvedValue(true);

        const req = {
            params: { id: 1 },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.deleteReview(req, res);

        expect(reviewModel.deleteReview).toHaveBeenCalledWith(1, 1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Review deleted successfully" });
    });

    it("should return 404 when review not found", async () => {
        reviewModel.deleteReview.mockResolvedValue(false);

        const req = {
            params: { id: 999 },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.deleteReview(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Review not found" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        reviewModel.deleteReview.mockRejectedValue(new Error("Database error"));

        const req = {
            params: { id: 1 },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reviewController.deleteReview(req, res);

        expect(reviewModel.deleteReview).toHaveBeenCalledWith(1, 1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error deleting review" });
    });
});