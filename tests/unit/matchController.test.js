const matchController = require("../../controllers/matchController");
const matchModel = require("../../models/matchModel");

jest.mock("../../models/matchModel");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (userId, body = {}, params = {}) => ({
  user: { id: userId },
  body,
  params,
});

describe("matchController", () => {
  afterEach(() => jest.clearAllMocks());

  describe("createMatchProfile", () => {
    test("should create profile if not exists", async () => {
      const req = mockReq(1, { bio: "hello" });
      const res = mockRes();

      matchModel.hasMatchProfile.mockResolvedValue(false);
      matchModel.createMatchProfile.mockResolvedValue();

      await matchController.createMatchProfile(req, res);

      expect(matchModel.createMatchProfile).toHaveBeenCalledWith(1, {
        bio: "hello",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Match profile created.",
      });
    });

    test("should return 409 if profile already exists", async () => {
      const req = mockReq(1);
      const res = mockRes();

      matchModel.hasMatchProfile.mockResolvedValue(true);

      await matchController.createMatchProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Match profile already exists.",
      });
    });

    test("should handle error", async () => {
      const req = mockReq(1);
      const res = mockRes();

      matchModel.hasMatchProfile.mockRejectedValue(new Error("DB error"));

      await matchController.createMatchProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Could not create profile.",
      });
    });
  });

  describe("hasMatchProfile", () => {
    test("should return existence status", async () => {
      const req = mockReq(1);
      const res = mockRes();

      matchModel.hasMatchProfile.mockResolvedValue(true);

      await matchController.hasMatchProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ exists: true });
    });
  });

  describe("updateMatchProfile", () => {
    test("should update if exists", async () => {
      const req = mockReq(1, { bio: "updated" });
      const res = mockRes();

      matchModel.hasMatchProfile.mockResolvedValue(true);
      matchModel.updateMatchProfile.mockResolvedValue();

      await matchController.updateMatchProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Match profile updated.",
      });
    });

    test("should return 404 if profile doesn't exist", async () => {
      const req = mockReq(1);
      const res = mockRes();

      matchModel.hasMatchProfile.mockResolvedValue(false);

      await matchController.updateMatchProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "No match profile found to update.",
      });
    });
  });

  describe("getMatchProfile", () => {
    test("should return profile if found", async () => {
      const req = mockReq(1);
      const res = mockRes();

      matchModel.getMatchProfileByUserId.mockResolvedValue({ UserID: 1 });

      await matchController.getMatchProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ UserID: 1 });
    });

    test("should return 404 if not found", async () => {
      const req = mockReq(1);
      const res = mockRes();

      matchModel.getMatchProfileByUserId.mockResolvedValue(null);

      await matchController.getMatchProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Profile not found." });
    });
  });

  describe("getPotentialMatches", () => {
    test("should return matches", async () => {
      const req = mockReq(1);
      const res = mockRes();

      matchModel.getPotentialMatches.mockResolvedValue([{ id: 2 }]);

      await matchController.getPotentialMatches(req, res);

      expect(res.json).toHaveBeenCalledWith([{ id: 2 }]);
    });
  });

  describe("likeUser", () => {
    test("should return matched true/false", async () => {
      const req = mockReq(1, {}, { targetUserId: "2" });
      const res = mockRes();

      matchModel.likeUser.mockResolvedValue({ matched: true });

      await matchController.likeUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, matched: true });
    });

    test("should return 400 if liking self", async () => {
      const req = mockReq(1, {}, { targetUserId: "1" });
      const res = mockRes();

      await matchController.likeUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "You cannot like yourself.",
      });
    });
  });

  describe("skipUser", () => {
    test("should return success", async () => {
      const req = mockReq(1, {}, { targetUserId: "2" });
      const res = mockRes();

      matchModel.skipUser.mockResolvedValue();

      await matchController.skipUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test("should return 400 if skipping self", async () => {
      const req = mockReq(1, {}, { targetUserId: "1" });
      const res = mockRes();

      await matchController.skipUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "You cannot skip yourself.",
      });
    });
  });
});
