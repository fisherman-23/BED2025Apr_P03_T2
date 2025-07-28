const bookmarkController = require("../../controllers/bookmarkController");
const bookmarkModel = require("../../models/bookmarkModel");

jest.mock("../../models/bookmarkModel");

describe("bookmarkController.getBookmarkedFacilities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return bookmarks for a valid user ID", async () => {
        const mockBookmarks = [
            { id: 1, userId: 1, facilityId: 101, createdAt: new Date() },
            { id: 2, userId: 1, facilityId: 102, createdAt: new Date() }
        ];

        bookmarkModel.getBookmarkedFacilities.mockResolvedValue(mockBookmarks);

        const req = { user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.getBookmarkedFacilities(req, res);

        expect(bookmarkModel.getBookmarkedFacilities).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockBookmarks);
    });

    it("should return 404 when no bookmarks found", async () => {
        bookmarkModel.getBookmarkedFacilities.mockResolvedValue(null);

        const req = { user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.getBookmarkedFacilities(req, res);

        expect(bookmarkModel.getBookmarkedFacilities).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "No bookmarks found for this user" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        bookmarkModel.getBookmarkedFacilities.mockRejectedValue(new Error("Database error"));

        const req = { user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.getBookmarkedFacilities(req, res);

        expect(bookmarkModel.getBookmarkedFacilities).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error fetching bookmarked facilities" });
    });
});

describe("bookmarkController.saveBookmark", () => {
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

        bookmarkModel.saveBookmark.mockResolvedValue({ bookmarkId: 1 });

        const req = {
            body: mockBookmark,
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.saveBookmark(req, res);

        expect(bookmarkModel.saveBookmark).toHaveBeenCalledWith(mockBookmark);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: "Bookmark saved successfully", bookmarkId: 1 });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        bookmarkModel.saveBookmark.mockRejectedValue(new Error("Database error"));

        const req = {
            body: { userId: 1, facilityId: 101, note: "Test bookmark", locationName: "Test Location" },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.saveBookmark(req, res);

        expect(bookmarkModel.saveBookmark).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error saving bookmark" });
    });
});

describe("bookmarkController.updateBookmark", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a bookmark for a valid user and facility ID", async () => {
        const mockBookmark = {
            bookmarkId: 1,
            userId: 1,
            facilityId: 101,
            note: "Updated notes",
            locationName: "Updated Location"
        };

        bookmarkModel.updateBookmark.mockResolvedValue(true);

        const req = {
            params: { bookmarkId: 1 },
            body: mockBookmark,
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.updateBookmark(req, res);

        expect(bookmarkModel.updateBookmark).toHaveBeenCalledWith(mockBookmark.bookmarkId, mockBookmark);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Bookmark updated successfully" });
    });

    it("should return 404 when bookmark not found", async () => {
        bookmarkModel.updateBookmark.mockResolvedValue(false);

        const req = {
            params: { bookmarkId: 999 },
            body: { note: "test" }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.updateBookmark(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Bookmark not found" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        bookmarkModel.updateBookmark.mockRejectedValue(new Error("Database error"));

        const req = {
            params: { bookmarkId: 1 },
            body: { note: "Updated notes" }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.updateBookmark(req, res);

        expect(bookmarkModel.updateBookmark).toHaveBeenCalledWith(req.params.bookmarkId, req.body);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error updating bookmark" });
    });
});

describe("bookmarkController.deleteBookmark", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should remove a bookmark for a valid user and facility ID", async () => {
        bookmarkModel.deleteBookmark.mockResolvedValue(true);

        const req = {
            params: { boookmarkId: 1 },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.deleteBookmark(req, res);

        expect(bookmarkModel.deleteBookmark).toHaveBeenCalledWith(req.params.bookmarkId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Bookmark deleted successfully" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        bookmarkModel.deleteBookmark.mockRejectedValue(new Error("Database error"));

        const req = {
            params: { bookmarkId: 1 },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.deleteBookmark(req, res);

        expect(bookmarkModel.deleteBookmark).toHaveBeenCalledWith(req.params.bookmarkId);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error deleting bookmark" });
    });
});

describe("bookmarkController.checkIfBookmarked", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return true if the facility is bookmarked by the user", async () => {
        const mockResult = { isBookmarked: true, bookmarkId: 1, notes: "Test note" };

        bookmarkModel.checkIfBookmarked.mockResolvedValue(mockResult);

        const req = {
            params: { facilityId: 101 },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.checkIfBookmarked(req, res);

        expect(bookmarkModel.checkIfBookmarked).toHaveBeenCalledWith(req.user.id, req.params.facilityId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should return false if the facility is not bookmarked by the user", async () => {
        const mockResult = { isBookmarked: false, bookmarkId: null, notes: null };

        bookmarkModel.checkIfBookmarked.mockResolvedValue(mockResult);

        const req = {
            params: { facilityId: 101 },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.checkIfBookmarked(req, res);

        expect(bookmarkModel.checkIfBookmarked).toHaveBeenCalledWith(req.user.id, req.params.facilityId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should handle errors and return a 500 status with error message", async () => {
        bookmarkModel.checkIfBookmarked.mockRejectedValue(new Error("Database error"));

        const req = {
            params: { facilityId: 101 },
            user: { id: 1 }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await bookmarkController.checkIfBookmarked(req, res);

        expect(bookmarkModel.checkIfBookmarked).toHaveBeenCalledWith(req.user.id, req.params.facilityId);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error checking bookmark status" });
    });
});
