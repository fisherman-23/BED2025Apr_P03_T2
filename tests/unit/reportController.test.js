const reportController = require("../../controllers/reportController");
const reportModel = require("../../models/reportModel");

jest.mock("../../models/reportModel");

describe("reportController.createReport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a report for a valid review ID", async () => {
        const mockReportData = {
            reviewId: 1,
            userId: 1,
            reason: "Inappropriate content"
        };

        reportModel.createReport.mockResolvedValue(true);

        const req = {
            body: mockReportData,
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reportController.createReport(req, res);

        expect(reportModel.createReport).toHaveBeenCalledWith(mockReportData);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Review reported successfully" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        reportModel.createReport.mockRejectedValue(new Error("Database error"));

        const req = {
            body: { reviewId: 1, reason: "Test reason" },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await reportController.createReport(req, res);

        expect(reportModel.createReport).toHaveBeenCalledWith({
            reviewId: req.body.reviewId,
            userId: req.user.id,
            reason: req.body.reason
        });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error reporting review" });
    });
});