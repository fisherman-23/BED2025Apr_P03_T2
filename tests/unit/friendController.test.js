const friendModel = require("../../models/friendModel");
const friendController = require("../../controllers/friendController");

jest.mock("../../models/friendModel");

describe("friendController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1, ID: 1 },
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("sendFriendRequest", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req.user = { id: 1 };
      req.params = {};
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();
    });

    it("sends a friend request successfully", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockResolvedValue(2); // receiverId
      friendModel.getFriendshipStatus.mockResolvedValue(null); // no existing relation
      friendModel.insertFriendRequest.mockResolvedValue();

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Friend request sent" });
    });

    it("returns 404 if receiver user not found", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockResolvedValue(null);

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("returns 400 if sending request to self", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockResolvedValue(1); // same as sender

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Can't send request to yourself",
      });
    });

    it("returns 400 if already friends", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockResolvedValue(2);
      friendModel.getFriendshipStatus.mockResolvedValue("friends");

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "You are already friends",
      });
    });

    it("returns 400 if outgoing pending request already sent", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockResolvedValue(2);
      friendModel.getFriendshipStatus.mockResolvedValue("outgoing_pending");

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "You have already sent a request. Please wait for the other user to accept.",
      });
    });

    it("returns 400 if incoming pending request exists", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockResolvedValue(2);
      friendModel.getFriendshipStatus.mockResolvedValue("incoming_pending");

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "The other user has sent you a request. Please accept it from your friend requests tab.",
      });
    });

    it("returns 400 if request was previously rejected", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockResolvedValue(2);
      friendModel.getFriendshipStatus.mockResolvedValue("rejected");

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "A friend request was previously rejected. You cannot send another request.",
      });
    });

    it("returns 500 on server error", async () => {
      req.params.uuid = "receiver-uuid";
      friendModel.getUserIdByUUID.mockRejectedValue(new Error("DB error"));

      await friendController.sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });

  describe("listAllPendingRequests", () => {
    it("returns incoming and outgoing requests", async () => {
      friendModel.getAllPendingRequests.mockResolvedValue({
        incoming: [{ id: 1 }],
        outgoing: [{ id: 2 }],
      });

      await friendController.listAllPendingRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        incoming: [{ id: 1 }],
        outgoing: [{ id: 2 }],
      });
    });

    it("returns 500 on error", async () => {
      friendModel.getAllPendingRequests.mockRejectedValue(new Error("fail"));

      await friendController.listAllPendingRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch friend requests",
      });
    });
  });

  describe("listFriends", () => {
    it("returns list of friends", async () => {
      friendModel.getFriends.mockResolvedValue([{ id: 1, name: "Bob" }]);

      await friendController.listFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        friends: [{ id: 1, name: "Bob" }],
      });
    });

    it("returns 500 on error", async () => {
      friendModel.getFriends.mockRejectedValue(new Error("fail"));

      await friendController.listFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch friends list",
      });
    });
  });

  describe("acceptFriendRequest", () => {
    it("accepts friend request successfully", async () => {
      req.params.id = "5";
      friendModel.acceptFriendRequest.mockResolvedValue();

      await friendController.acceptFriendRequest(req, res);

      expect(friendModel.acceptFriendRequest).toHaveBeenCalledWith(1, 5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Friend request accepted",
      });
    });

    it("returns 404 for not found request", async () => {
      req.params.id = "5";
      friendModel.acceptFriendRequest.mockRejectedValue(
        new Error("Friend request not found or unauthorized")
      );

      await friendController.acceptFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Friend request not found or unauthorized",
      });
    });

    it("returns 500 on server error", async () => {
      req.params.id = "5";
      friendModel.acceptFriendRequest.mockRejectedValue(new Error("DB fail"));

      await friendController.acceptFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
      });
    });
  });

  describe("rejectFriendRequest", () => {
    it("rejects request successfully", async () => {
      req.params.id = "9";
      friendModel.rejectFriendRequest.mockResolvedValue();

      await friendController.rejectFriendRequest(req, res);

      expect(friendModel.rejectFriendRequest).toHaveBeenCalledWith(1, 9);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Friend request rejected",
      });
    });

    it("returns 404 if not found", async () => {
      req.params.id = "9";
      friendModel.rejectFriendRequest.mockRejectedValue(
        new Error("Friend request not found or unauthorized")
      );

      await friendController.rejectFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Friend request not found or unauthorized",
      });
    });

    it("returns 500 on server error", async () => {
      req.params.id = "9";
      friendModel.rejectFriendRequest.mockRejectedValue(new Error("DB error"));

      await friendController.rejectFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
      });
    });
  });
  describe("removeFriend (controller)", () => {
    let req, res;

    beforeEach(() => {
      req = {
        user: { id: 1 },
        params: { friendId: "2" },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("returns 400 if friendId is not a number", async () => {
      req.params.friendId = "abc";
      await friendController.removeFriend(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid friend ID" });
    });

    it("returns 200 if friend was successfully removed", async () => {
      friendModel.removeFriend.mockResolvedValue(true);
      await friendController.removeFriend(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Friend removed successfully",
      });
    });

    it("returns 404 if friend was not found", async () => {
      friendModel.removeFriend.mockResolvedValue(false);
      await friendController.removeFriend(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Friend not found or already removed",
      });
    });

    it("returns 500 on error", async () => {
      friendModel.removeFriend.mockRejectedValue(new Error("DB error"));
      await friendController.removeFriend(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });
});
