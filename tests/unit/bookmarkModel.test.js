const sql = require("mssql");
const bookmarkModel = require("../../models/bookmarkModel");

jest.mock("mssql");

describe ("bookmarkModel.getBookmarkedFacilities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return bookmarks for a valid user ID", async () => {
        const mockBookmarks = [
            { id: 1, userId: 1, facilityId: 101, createdAt: new Date() },
            { id: 2, userId: 1, facilityId: 102, createdAt: new Date() }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockBookmarks })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        await bookmarkModel.getBookmarkedFacilities(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("SELECT f.*, b.bookmarkId"));
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(bookmarkModel.getBookmarkedFacilities(1)).rejects.toThrow("Database connection failed");
    });
});

describe("bookmarkModel.saveBookmark", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should add a bookmark for a valid user and facility ID", async () => {
        const mockBookmark = {
            userId: 1,
            facilityId: 101,
            note: "Test bookmark",
            locationName: "Test Location"
        };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [{ bookmarkId: 1 }] })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        await bookmarkModel.saveBookmark(mockBookmark);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
        expect(mockRequest.input).toHaveBeenCalledWith("facilityId", sql.Int, 101);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO Bookmarks"));
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(bookmarkModel.saveBookmark(1, 101)).rejects.toThrow("Database connection failed");
    });
});

describe("bookmarkModel.updateBookmark", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a bookmark for a valid user and facility ID", async () => {
        const mockBookmark = {
            bookmarkId: 1,
            userId: 1,
            facilityId: 101,
            note: "Updated notes",
            locationName: "Test Location"
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

        const result = await bookmarkModel.updateBookmark(mockBookmark.bookmarkId, mockBookmark);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("note", sql.NVarChar, "Updated notes");
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE Bookmarks"));
        expect(result).toBe(true);
    });
});

describe("bookmarkModel.deleteBookmark", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should remove a bookmark for a valid user and facility ID", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        await bookmarkModel.deleteBookmark(1, 101);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("bookmarkId", sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM Bookmarks"));
    });

    it("should throw an error if the database connection fails", async () => {
        const mockError = new Error("Database connection failed");
        sql.connect.mockRejectedValue(mockError);

        await expect(bookmarkModel.deleteBookmark(1, 101)).rejects.toThrow("Database connection failed");
    });
});

describe("bookmarkModel.checkIfBookmarked", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return true if the facility is bookmarked by the user", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [{ bookmarkId: 1 }] })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        await bookmarkModel.checkIfBookmarked(1, 101);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
        expect(mockRequest.input).toHaveBeenCalledWith("facilityId", sql.Int, 101);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("SELECT bookmarkId, note"));
    });

    it("should return false if the facility is not bookmarked by the user", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [] })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined)
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await bookmarkModel.checkIfBookmarked(1, 101);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.request).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
        expect(mockRequest.input).toHaveBeenCalledWith("facilityId", sql.Int, 101);
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("SELECT bookmarkId, note"));
        expect(result).toStrictEqual({ isBookmarked: false, bookmarkId: null, notes: null });
    });
});