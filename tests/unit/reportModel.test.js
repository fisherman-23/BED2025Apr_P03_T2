const sql = require("mssql");
const reportModel = require("../../models/reportModel");

jest.mock("mssql");

describe("reportModel.createReport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a report for a valid review ID", async () => {
        const mockReportData = {
            reviewId: 1,
            userId: 1,
            reason: "Inappropriate content"
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

        const result = await reportModel.createReport(mockReportData);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("reviewId", sql.Int, mockReportData.reviewId);
        expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, mockReportData.userId);
        expect(mockRequest.input).toHaveBeenCalledWith("reason", sql.NVarChar, mockReportData.reason);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO Reports"));
        expect(result).toBe(true);
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(reportModel.createReport({ reviewId: 1, userId: 1, reason: "Test" })).rejects.toThrow("Database connection failed");
    });
});