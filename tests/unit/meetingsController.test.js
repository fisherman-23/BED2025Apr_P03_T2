const meetingsController = require("../../controllers/meetingsController");
const meetingsModel = require("../../models/meetingsModel");

// Mock the meetingsModel
jest.mock("../../models/meetingsModel");

describe("meetingsController.createMeeting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create room, token, save and return 201 payload", async () => {
    meetingsModel.createRoom.mockResolvedValue({ name:"r", url:"u" });
    meetingsModel.createMeetingToken.mockResolvedValue("tk");
    meetingsModel.saveMeeting.mockResolvedValue(55);

    const req = { user:{ id:9 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await meetingsController.createMeeting(req, res);
    expect(meetingsModel.createRoom).toHaveBeenCalled();
    expect(meetingsModel.createMeetingToken).toHaveBeenCalledWith("r", true);
    expect(meetingsModel.saveMeeting).toHaveBeenCalledWith("r", "u", 9);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ meetingId:55, url:"u", token:"tk" });
  });

  it("should return 500 on error", async () => {
    meetingsModel.createRoom.mockRejectedValue(new Error("fail"));

    const req = { user:{ id:1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await meetingsController.createMeeting(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Could not create meeting room or token" });
  });
});

describe("meetingsController.getMeetingData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return hostId when meeting exists", async () => {
    meetingsModel.getMeetingById.mockResolvedValue({ HostID:7 });

    const req = { params:{ meetingId:"3" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await meetingsController.getMeetingData(req, res);
    expect(meetingsModel.getMeetingById).toHaveBeenCalledWith(3);
    expect(res.json).toHaveBeenCalledWith({ hostId:7 });
  });

  it("should return 400 for invalid ID", async () => {
    const req = { params:{ meetingId:"x" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await meetingsController.getMeetingData(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid meeting ID" });
  });

  it("should return 404 if not found", async () => {
    meetingsModel.getMeetingById.mockResolvedValue(null);

    const req = { params:{ meetingId:"4" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await meetingsController.getMeetingData(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Meeting not found" });
  });
});

describe("meetingsController.joinByName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if name missing", async () => {
    const req = { query:{ name:"   " } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await meetingsController.joinByName(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Room name is required" });
  });

  it("should return url when found", async () => {
    meetingsModel.getMeetingByName.mockResolvedValue("link");

    const req = { query:{ name:"room1" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await meetingsController.joinByName(req, res);
    expect(meetingsModel.getMeetingByName).toHaveBeenCalledWith("room1");
    expect(res.json).toHaveBeenCalledWith({ url:"link" });
  });

  it("should return 404 if not found", async () => {
    meetingsModel.getMeetingByName.mockResolvedValue(null);

    const req = { query:{ name:"x" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await meetingsController.joinByName(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Meeting not found" });
  });
});
