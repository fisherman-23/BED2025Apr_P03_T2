const sql = require("mssql");
const chatModel = require("../../models/chatModel");
const { callGemini } = require("../../utils/geminiApi");

jest.mock("mssql");
jest.mock("../../utils/geminiApi");

const mockConnect = jest.fn();
const mockClose = jest.fn();
const mockRequest = {
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};
const mockConnection = {
  request: () => mockRequest,
  close: mockClose,
};

sql.connect.mockImplementation(() => {
  mockConnect();
  return mockConnection;
});

describe("chatModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isUserInConversation", () => {
    it("should return true if user is in conversation", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ User1ID: 1, User2ID: 2 }],
      });

      const result = await chatModel.isUserInConversation(1, 123);
      expect(result).toBe(true);
    });

    it("should return false if user is not in conversation", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ User1ID: 3, User2ID: 4 }],
      });

      const result = await chatModel.isUserInConversation(1, 123);
      expect(result).toBe(false);
    });
  });

  describe("getOrCreateConversation", () => {
    it("should return existing conversation", async () => {
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ ID: 1, User1ID: 1, User2ID: 2 }],
      });

      const result = await chatModel.getOrCreateConversation(1, 2);
      expect(result).toEqual({ ID: 1, User1ID: 1, User2ID: 2 });
    });

    it("should insert and return new conversation if none exists", async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [] }) // select returns nothing
        .mockResolvedValueOnce({
          recordset: [{ ID: 10, User1ID: 1, User2ID: 2 }],
        }); // insert result

      const result = await chatModel.getOrCreateConversation(2, 1);
      expect(result).toEqual({ ID: 10, User1ID: 1, User2ID: 2 });
    });
  });

  describe("getUserConversations", () => {
    it("should return user's conversations", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ ID: 1, User1ID: 1, User2ID: 2 }],
      });

      const result = await chatModel.getUserConversations(1);
      expect(result).toEqual([{ ID: 1, User1ID: 1, User2ID: 2 }]);
    });
  });

  describe("getMessages", () => {
    it("should return messages from a conversation", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ ID: 1, Content: "Hello" }],
      });

      const result = await chatModel.getMessages(1);
      expect(result).toEqual([{ ID: 1, Content: "Hello" }]);
    });
  });

  describe("sendMessage", () => {
    it("should insert and return a new message", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ ID: 1, Content: "Hi!" }],
      });

      const result = await chatModel.sendMessage(1, 1, "Hi!");
      expect(result).toEqual({ ID: 1, Content: "Hi!" });
    });
  });

  describe("deleteMessage", () => {
    it("should update message as deleted", async () => {
      mockRequest.query.mockResolvedValue({});
      await chatModel.deleteMessage(1, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Messages SET IsDeleted")
      );
    });
  });

  describe("generateSmartReplies", () => {
    it("should return a smart reply from Gemini", async () => {
      callGemini.mockResolvedValue({
        candidates: [
          {
            content: { parts: [{ text: "Sure, sounds good." }] },
          },
        ],
      });

      const result = await chatModel.generateSmartReplies("Hello!");
      expect(result).toBe("Sure, sounds good.");
    });
  });

  describe("getMessageById", () => {
    it("should return the message by ID", async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ ID: 1, Content: "Test" }],
      });

      const result = await chatModel.getMessageById(1);
      expect(result).toEqual({ ID: 1, Content: "Test" });
    });
  });
});
