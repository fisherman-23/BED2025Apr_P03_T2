const chatController = require("../../controllers/chatController");
const chatModel = require("../../models/chatModel");

jest.mock("../../models/chatModel");

const mockReq = (overrides) => ({
  user: { id: 1 },
  body: {},
  params: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe("chatController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("startConversation", () => {
    it("should return a conversation", async () => {
      const req = mockReq({ body: { otherUserId: 2 } });
      const res = mockRes();
      const mockConvo = { ID: 1, User1ID: 1, User2ID: 2 };

      chatModel.getOrCreateConversation.mockResolvedValue(mockConvo);

      await chatController.startConversation(req, res);

      expect(chatModel.getOrCreateConversation).toHaveBeenCalledWith(1, 2);
      expect(res.json).toHaveBeenCalledWith(mockConvo);
    });

    it("should handle errors", async () => {
      const req = mockReq({ body: { otherUserId: 2 } });
      const res = mockRes();

      chatModel.getOrCreateConversation.mockRejectedValue(new Error("fail"));

      await chatController.startConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error starting conversation",
      });
    });
  });

  describe("getConversations", () => {
    it("should return user conversations", async () => {
      const req = mockReq();
      const res = mockRes();
      const mockData = [{ ID: 1 }];

      chatModel.getUserConversations.mockResolvedValue(mockData);

      await chatController.getConversations(req, res);

      expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });

  describe("getMessages", () => {
    it("should return messages if user authorized", async () => {
      const req = mockReq({ params: { conversationId: "1" } });
      const res = mockRes();
      const messages = [{ ID: 1, Content: "Hello" }];

      chatModel.isUserInConversation.mockResolvedValue(true);
      chatModel.getMessages.mockResolvedValue(messages);

      await chatController.getMessages(req, res);

      expect(res.json).toHaveBeenCalledWith(messages);
    });

    it("should deny access if user not in conversation", async () => {
      const req = mockReq({ params: { conversationId: "1" } });
      const res = mockRes();

      chatModel.isUserInConversation.mockResolvedValue(false);

      await chatController.getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied to this conversation",
      });
    });

    it("should handle invalid conversation ID", async () => {
      const req = mockReq({ params: { conversationId: "abc" } });
      const res = mockRes();

      await chatController.getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid conversation ID",
      });
    });
  });

  describe("sendMessage", () => {
    it("should send a message", async () => {
      const req = mockReq({
        params: { conversationId: "1" },
        body: { content: "Hi" },
      });
      const res = mockRes();
      const mockMsg = { ID: 1, Content: "Hi" };

      chatModel.isUserInConversation.mockResolvedValue(true);
      chatModel.sendMessage.mockResolvedValue(mockMsg);

      await chatController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockMsg);
    });

    it("should reject invalid input", async () => {
      const req = mockReq({
        params: { conversationId: "abc" },
        body: { content: "" },
      });
      const res = mockRes();

      await chatController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid conversation ID or empty message content",
      });
    });

    it("should reject unauthorized user", async () => {
      const req = mockReq({
        params: { conversationId: "1" },
        body: { content: "hello" },
      });
      const res = mockRes();

      chatModel.isUserInConversation.mockResolvedValue(false);

      await chatController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("deleteMessage", () => {
    it("should delete message if authorized", async () => {
      const req = mockReq({ params: { messageId: "1" } });
      const res = mockRes();

      chatModel.getMessageById.mockResolvedValue({
        ID: 1,
        ConversationID: 99,
      });
      chatModel.isUserInConversation.mockResolvedValue(true);

      await chatController.deleteMessage(req, res);

      expect(chatModel.deleteMessage).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 404 if message not found", async () => {
      const req = mockReq({ params: { messageId: "1" } });
      const res = mockRes();

      chatModel.getMessageById.mockResolvedValue(null);

      await chatController.deleteMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Message not found",
      });
    });

    it("should deny unauthorized user", async () => {
      const req = mockReq({ params: { messageId: "1" } });
      const res = mockRes();

      chatModel.getMessageById.mockResolvedValue({
        ID: 1,
        ConversationID: 99,
      });
      chatModel.isUserInConversation.mockResolvedValue(false);

      await chatController.deleteMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("getSmartReplies", () => {
    it("should return suggestions", async () => {
      const req = mockReq({ body: { content: "Hi there" } });
      const res = mockRes();

      chatModel.generateSmartReplies.mockResolvedValue("Sure, sounds good.");

      await chatController.getSmartReplies(req, res);

      expect(res.json).toHaveBeenCalledWith({
        suggestions: "Sure, sounds good.",
      });
    });

    it("should return 400 if no content", async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await chatController.getSmartReplies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Message is required.",
      });
    });
  });
});
