const sql = require("mssql");
jest.mock("mssql");

const friendModel = require("../../models/friendModel"); // adjust path if needed

describe("friendModel", () => {
  let mockRequest;

  beforeEach(() => {
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    sql.connect.mockReset();
    sql.connect.mockResolvedValue({
      request: () => mockRequest,
      close: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserIdByUUID", () => {
    it("returns user ID if found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ ID: 123 }] });

      const result = await friendModel.getUserIdByUUID("some-uuid");
      expect(result).toBe(123);
    });

    it("returns null if not found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await friendModel.getUserIdByUUID("not-found");
      expect(result).toBeNull();
    });
  });

  describe("checkRequestOrFriendshipExists", () => {
    it("returns true if a record exists", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{}] });

      const result = await friendModel.checkRequestOrFriendshipExists(1, 2);
      expect(result).toBe(true);
    });

    it("returns false if no record exists", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await friendModel.checkRequestOrFriendshipExists(1, 2);
      expect(result).toBe(false);
    });
  });

  describe("insertFriendRequest", () => {
    it("inserts a new request without error", async () => {
      mockRequest.query.mockResolvedValue({});

      await expect(
        friendModel.insertFriendRequest(1, 2)
      ).resolves.toBeUndefined();
      expect(mockRequest.input).toHaveBeenCalledWith("sender", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("receiver", sql.Int, 2);
    });
  });

  describe("getAllPendingRequests", () => {
    it("returns incoming and outgoing requests", async () => {
      sql.connect.mockResolvedValueOnce({
        request: () => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValueOnce({
            recordset: [{ ID: 1, Name: "A", Direction: "incoming" }],
          }),
        }),
        close: jest.fn(),
      });
      sql.connect.mockResolvedValueOnce({
        request: () => ({
          input: jest.fn().mockReturnThis(),
          query: jest.fn().mockResolvedValueOnce({
            recordset: [{ ID: 2, Name: "B", Direction: "outgoing" }],
          }),
        }),
        close: jest.fn(),
      });

      const result = await friendModel.getAllPendingRequests(1);
      expect(result.incoming).toHaveLength(1);
      expect(result.outgoing).toHaveLength(1);
    });
  });

  describe("getFriends", () => {
    it("returns a list of friends", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [
          { FriendID: 1, Name: "Alice", PublicUUID: "uuid1" },
          { FriendID: 2, Name: "Bob", PublicUUID: "uuid2" },
        ],
      });

      const result = await friendModel.getFriends(123);
      console.log("Result from getFriends:", result);
      expect(result).toHaveLength(2);
    });
  });

  describe("acceptFriendRequest", () => {
    it("accepts a request and inserts into Friends", async () => {
      const mockQuery = jest
        .fn()
        .mockResolvedValueOnce({
          recordset: [
            { ID: 10, SenderID: 1, ReceiverID: 2, Status: "pending" },
          ],
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: mockQuery,
      };
      sql.connect.mockResolvedValue({
        request: () => mockRequest,
        close: jest.fn(),
      });

      await expect(
        friendModel.acceptFriendRequest(2, 10)
      ).resolves.toBeUndefined();
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it("throws error if request not found", async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await expect(friendModel.acceptFriendRequest(2, 99)).rejects.toThrow(
        "Friend request not found or unauthorized"
      );
    });
  });

  describe("rejectFriendRequest", () => {
    it("updates request status to rejected", async () => {
      const mockQuery = jest
        .fn()
        .mockResolvedValueOnce({
          recordset: [{ ID: 5, SenderID: 1, ReceiverID: 2, Status: "pending" }],
        })
        .mockResolvedValueOnce({}); // update FriendRequests

      mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: mockQuery,
      };
      sql.connect.mockResolvedValue({
        request: () => mockRequest,
        close: jest.fn(),
      });

      await expect(
        friendModel.rejectFriendRequest(2, 5)
      ).resolves.toBeUndefined();
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("throws error if request not found", async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await expect(friendModel.rejectFriendRequest(2, 404)).rejects.toThrow(
        "Friend request not found or unauthorized"
      );
    });
  });

  describe("removeFriend (model)", () => {
    let mockRequest, mockQuery;

    beforeEach(() => {
      mockQuery = jest.fn().mockResolvedValue({ rowsAffected: [1] });
      mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: mockQuery,
      };

      sql.connect.mockResolvedValue({
        request: () => mockRequest,
        close: jest.fn(),
      });
    });

    it("deletes a friend and returns true if rows affected", async () => {
      const result = await friendModel.removeFriend(1, 2);
      expect(sql.connect).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("friendId", sql.Int, 2);
      expect(result).toBe(true);
    });

    it("returns false if no rows affected", async () => {
      mockQuery.mockResolvedValue({ rowsAffected: [0] });
      const result = await friendModel.removeFriend(1, 2);
      expect(result).toBe(false);
    });

    it("throws error if query fails", async () => {
      mockQuery.mockRejectedValue(new Error("DB error"));
      await expect(friendModel.removeFriend(1, 2)).rejects.toThrow("DB error");
    });
  });
});
