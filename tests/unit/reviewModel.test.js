const sql = require("mssql");
const reviewModel = require("../../models/reviewModel");

jest.mock("mssql");

describe("reviewModel.getReviewsByFacilityId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return reviews for a valid facility ID", async () => {
        const mockReviews = [
            { id: 1, facilityId: 1, userId: 1, rating: 5, comment: "Great service!" },
            { id: 2, facilityId: 1, userId: 2, rating: 4, comment: "Very good experience." }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockReviews })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        const reviews = await reviewModel.getReviewsByFacilityId(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("facilityId", sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("SELECT r.*, u.name AS UserName, u.ProfilePicture"));
        expect(reviews).toEqual(mockReviews);
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(reviewModel.getReviewsByFacilityId(1)).rejects.toThrow("Database connection failed");
    });

    it("should handle empty results gracefully", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [] })
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };
        sql.connect.mockResolvedValue(mockConnection);
        const reviews = await reviewModel.getReviewsByFacilityId(1);
        expect(reviews).toEqual([]);
    });
});

describe("reviewModel.createReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should create a review for a valid facility and user", async () => {
        const mockReviewData = {
            facilityId: 1,
            userId: 1,
            rating: 5,
            comment: "Excellent service!"
        };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await reviewModel.createReview(mockReviewData);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("facilityId", sql.Int, mockReviewData.facilityId);
        expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, mockReviewData.userId);
        expect(mockRequest.input).toHaveBeenCalledWith("rating", sql.Int, mockReviewData.rating);
        expect(mockRequest.input).toHaveBeenCalledWith("comment", sql.NVarChar, mockReviewData.comment);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO Reviews"));
        expect(result).toBe(true);
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(reviewModel.createReview({})).rejects.toThrow("Database connection failed");
    });
});

describe("reviewModel.updateReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a review for a valid review ID", async () => {
        const mockReviewData = {
            reviewId: 1,
            facilityId: 1,
            userId: 1,
            rating: 5,
            comment: "Excellent service!"
        };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await reviewModel.updateReview(mockReviewData.reviewId, mockReviewData);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("reviewId", sql.Int, mockReviewData.reviewId);
        expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, mockReviewData.userId);
        expect(mockRequest.input).toHaveBeenCalledWith("rating", sql.Int, mockReviewData.rating);
        expect(mockRequest.input).toHaveBeenCalledWith("comment", sql.NVarChar, mockReviewData.comment);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE Reviews"));
        expect(result).toBe(true);
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(reviewModel.updateReview({})).rejects.toThrow("Database connection failed");
    });
});

describe("reviewModel.deleteReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a review for a valid review ID and user ID", async () => {
        const mockReviewId = 1;
        const mockUserId = 1;

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await reviewModel.deleteReview(mockReviewId, mockUserId);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("reviewId", sql.Int, mockReviewId);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM Reviews"));
        expect(result).toBe(true);
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(reviewModel.deleteReview(1, 1)).rejects.toThrow("Database connection failed");
    });
});