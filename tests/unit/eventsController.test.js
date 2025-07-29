const eventsController = require("../../controllers/eventsController.js");
const eventsModel = require("../../models/eventsModel.js");

jest.mock("../../models/eventsModel.js");

describe("eventsController.getJoinedGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return joined groups JSON", async () => {
    const mockGroups = [{ ID: 1 }];
    eventsModel.getJoinedGroups.mockResolvedValue(mockGroups);

    const req = { user: { id: 10 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.getJoinedGroups(req, res);

    expect(eventsModel.getJoinedGroups).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith(mockGroups);
  });

  it("should handle errors", async () => {
    eventsModel.getJoinedGroups.mockRejectedValue(new Error("oops"));

    const req = { user: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.getJoinedGroups(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving joined groups" });
  });
});

describe("eventsController.getAvailableGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return available groups JSON", async () => {
    const mockGroups = [{ ID: 2 }];
    eventsModel.getAvailableGroups.mockResolvedValue(mockGroups);

    const req = { user: { id: 11 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.getAvailableGroups(req, res);

    expect(eventsModel.getAvailableGroups).toHaveBeenCalledWith(11);
    expect(res.json).toHaveBeenCalledWith(mockGroups);
  });

  it("should handle errors", async () => {
    eventsModel.getAvailableGroups.mockRejectedValue(new Error("err"));

    const req = { user: { id: 2 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.getAvailableGroups(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving available groups" });
  });
});

describe("eventsController.createGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create group and respond 201", async () => {
    const mockGroup = { ID: 3 };
    eventsModel.createGroup.mockResolvedValue(mockGroup);

    const req = { user: { id: 5 }, body: { Name: "X" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.createGroup(req, res);

    expect(eventsModel.createGroup).toHaveBeenCalledWith({ Name: "X" }, 5);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockGroup);
  });

  it("should handle errors", async () => {
    eventsModel.createGroup.mockRejectedValue(new Error("fail"));

    const req = { user: { id: 1 }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.createGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error creating group" });
  });
});

describe("eventsController.joinGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if no groupId", async () => {
    const req = { user: { id: 1 }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Group ID is required" });
  });

  it("should join and return 200 on success", async () => {
    eventsModel.joinGroup.mockResolvedValue(true);
    const req = { user: { id: 2 }, body: { groupId: 9 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Successfully joined the group" });
  });

  it("should return 404 if already joined/not found", async () => {
    eventsModel.joinGroup.mockResolvedValue(false);
    const req = { user: { id: 2 }, body: { groupId: 9 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Group not found or already joined" });
  });

  it("should handle errors", async () => {
    eventsModel.joinGroup.mockRejectedValue(new Error("err"));
    const req = { user: { id: 1 }, body: { groupId: 3 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.joinGroup(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error joining group" });
  });
});

describe("eventsController.leaveGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if no groupId", async () => {
    const req = { user: { id: 1 }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Group ID is required" });
  });

  it("should leave and return 200 on success", async () => {
    eventsModel.leaveGroup.mockResolvedValue(true);
    const req = { user: { id: 2 }, body: { groupId: 8 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Successfully left the group" });
  });

  it("should return 404 if not a member", async () => {
    eventsModel.leaveGroup.mockResolvedValue(false);
    const req = { user: { id: 2 }, body: { groupId: 8 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not a member of that group" });
  });

  it("should handle errors", async () => {
    eventsModel.leaveGroup.mockRejectedValue(new Error("fail"));
    const req = { user: { id: 1 }, body: { groupId: 4 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventsController.leaveGroup(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error leaving group" });
  });
});

describe("eventsController.getGroupInviteToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return invite token when owner", async () => {
    eventsModel.getGroupInviteToken.mockResolvedValue("tok");
    const req = { user: { id: 3 }, params: { groupId: "3" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.getGroupInviteToken(req, res);

    expect(eventsModel.getGroupInviteToken).toHaveBeenCalledWith(3, 3);
    expect(res.json).toHaveBeenCalledWith({ inviteToken: "tok" });
  });

  it("should return 404 when not owner or not found", async () => {
    eventsModel.getGroupInviteToken.mockResolvedValue(null);
    const req = { user: { id: 3 }, params: { groupId: "3" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.getGroupInviteToken(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Group not found or you're not the owner" });
  });

  it("should handle errors", async () => {
    eventsModel.getGroupInviteToken.mockRejectedValue(new Error("err"));
    const req = { user: { id: 1 }, params: { groupId: "1" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.getGroupInviteToken(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving group invite token" });
  });
});

describe("eventsController.findGroupByToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return group when found", async () => {
    const mockGroup = { ID: 4 };
    eventsModel.findGroupByInviteToken.mockResolvedValue(mockGroup);

    const req = { params: { token: "tok" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.findGroupByToken(req, res);

    expect(res.json).toHaveBeenCalledWith(mockGroup);
  });

  it("should return 404 when not found", async () => {
    eventsModel.findGroupByInviteToken.mockResolvedValue(null);

    const req = { params: { token: "tok" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.findGroupByToken(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Group not found" });
  });

  it("should handle errors", async () => {
    eventsModel.findGroupByInviteToken.mockRejectedValue(new Error("err"));
    const req = { params: { token: "t" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.findGroupByToken(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error finding group" });
  });
});

describe("eventsController.joinGroupByToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if no token", async () => {
    const req = { user: { id: 1 }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.joinGroupByToken(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invite token is required" });
  });

  it("should return 200 on successful join", async () => {
    eventsModel.joinGroupByInviteToken.mockResolvedValue({ success: true, message: "msg", groupName: "GN" });
    const req = { user: { id: 2 }, body: { inviteToken: "tok" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.joinGroupByToken(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "msg", groupName: "GN" });
  });

  it("should return 400 on failure message", async () => {
    eventsModel.joinGroupByInviteToken.mockResolvedValue({ success: false, message: "bad" });
    const req = { user: { id: 2 }, body: { inviteToken: "tok" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.joinGroupByToken(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "bad" });
  });

  it("should handle errors", async () => {
    eventsModel.joinGroupByInviteToken.mockRejectedValue(new Error("err"));
    const req = { user: { id: 1 }, body: { inviteToken: "tok" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eventsController.joinGroupByToken(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error joining group" });
  });
});
