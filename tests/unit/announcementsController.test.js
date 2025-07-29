const announcementsController = require("../../controllers/announcementsController");
const announcementsModel = require("../../models/announcementsModel");

// Mock the announcementsModel
jest.mock("../../models/announcementsModel");

describe("announcementsController.getAnnouncements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return list of announcements", async () => {
    const mockList = [{ ID:1 }];
    announcementsModel.getAnnouncementsByGroup.mockResolvedValue(mockList);

    const req = { query: { groupId: "2" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await announcementsController.getAnnouncements(req, res);

    expect(announcementsModel.getAnnouncementsByGroup).toHaveBeenCalledWith(2);
    expect(res.json).toHaveBeenCalledWith(mockList);
  });

  it("should handle errors", async () => {
    announcementsModel.getAnnouncementsByGroup.mockRejectedValue(new Error("fail"));
    const req = { query: { groupId: "2" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await announcementsController.getAnnouncements(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving announcements" });
  });
});

describe("announcementsController.createAnnouncement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 404 if group not found", async () => {
    announcementsModel.getGroupById.mockResolvedValue(null);
    const req = { user:{id:1}, body:{ GroupID:1,Title:"",Content:"",ImageURL:null } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.createAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Group not found" });
  });

  it("should return 403 if not owner", async () => {
    announcementsModel.getGroupById.mockResolvedValue({ CreatedBy:2 });
    const req = { user:{id:1}, body:{ GroupID:1,Title:"",Content:"",ImageURL:null } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.createAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Only the group owner can post announcements" });
  });

  it("should create and return new id", async () => {
    announcementsModel.getGroupById.mockResolvedValue({ CreatedBy:1 });
    announcementsModel.createAnnouncement.mockResolvedValue(7);

    const req = { user:{id:1}, body:{ GroupID:1,Title:"T",Content:"C",ImageURL:null } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.createAnnouncement(req, res);
    expect(announcementsModel.createAnnouncement).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 7 });
  });

  it("should handle errors", async () => {
    announcementsModel.getGroupById.mockResolvedValue({ CreatedBy:1 });
    announcementsModel.createAnnouncement.mockRejectedValue(new Error("err"));

    const req = { user:{id:1}, body:{ GroupID:1,Title:"",Content:"",ImageURL:null } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.createAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error creating announcement" });
  });
});

describe("announcementsController.getComments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return comments with IsOwnComment flag", async () => {
    const raw = [{ ID:1, UserID:2, Content:"c" }];
    announcementsModel.getCommentsForAnnouncement.mockResolvedValue(raw);

    const req = { params:{ id:"1" }, user:{ id:2 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await announcementsController.getComments(req, res);
    expect(res.json).toHaveBeenCalledWith([{ ID:1,UserID:2,Content:"c",IsOwnComment:true }]);
  });

  it("should handle errors", async () => {
    announcementsModel.getCommentsForAnnouncement.mockRejectedValue(new Error("fail"));
    const req = { params:{ id:"1" }, user:{ id:1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await announcementsController.getComments(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving comments" });
  });
});

describe("announcementsController.postComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should post and return new comment id", async () => {
    announcementsModel.postComment.mockResolvedValue(33);

    const req = { user:{id:5}, body:{ announcementId:1, content:"hi" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.postComment(req, res);
    expect(announcementsModel.postComment).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 33 });
  });

  it("should handle errors", async () => {
    announcementsModel.postComment.mockRejectedValue(new Error("err"));
    const req = { user:{id:5}, body:{ announcementId:1, content:"" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.postComment(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error posting comment" });
  });
});

describe("announcementsController.deleteComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete own comment", async () => {
    announcementsModel.deleteComment.mockResolvedValue(true);

    const req = { user:{id:2}, params:{ id:"1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.deleteComment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Comment deleted" });
  });

  it("should return 403 on forbidden", async () => {
    const err = new Error("no");
    err.code = "FORBIDDEN";
    announcementsModel.deleteComment.mockRejectedValue(err);

    const req = { user:{id:2}, params:{ id:"1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.deleteComment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "no" });
  });

  it("should handle other errors", async () => {
    announcementsModel.deleteComment.mockRejectedValue(new Error("oops"));
    const req = { user:{id:2}, params:{ id:"1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.deleteComment(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error deleting comment" });
  });
});

describe("announcementsController.editAnnouncement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update on success", async () => {
    announcementsModel.editAnnouncement.mockResolvedValue(true);

    const req = {
      user:{id:1},
      params:{ id:"1" },
      body:{ Title:"t", Content:"c", ImageURL:null }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.editAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Announcement updated" });
  });

  it("should return 403 on forbidden", async () => {
    const err = new Error("no");
    err.code = "FORBIDDEN";
    announcementsModel.editAnnouncement.mockRejectedValue(err);

    const req = { user:{id:1}, params:{ id:"1" }, body:{} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.editAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return 404 on not found", async () => {
    const err = new Error("nf");
    err.code = "NOT_FOUND";
    announcementsModel.editAnnouncement.mockRejectedValue(err);

    const req = { user:{id:1}, params:{ id:"1" }, body:{} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.editAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should handle other errors", async () => {
    announcementsModel.editAnnouncement.mockRejectedValue(new Error("err"));
    const req = { user:{id:1}, params:{ id:"1" }, body:{} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.editAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("announcementsController.deleteAnnouncement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete on success", async () => {
    announcementsModel.deleteAnnouncement.mockResolvedValue(true);

    const req = { user:{id:1}, params:{ id:"1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.deleteAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Announcement deleted" });
  });

  it("should return 403 on forbidden", async () => {
    const err = new Error("no");
    err.code = "FORBIDDEN";
    announcementsModel.deleteAnnouncement.mockRejectedValue(err);

    const req = { user:{id:1}, params:{ id:"1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.deleteAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return 404 on not found", async () => {
    const err = new Error("nf");
    err.code = "NOT_FOUND";
    announcementsModel.deleteAnnouncement.mockRejectedValue(err);

    const req = { user:{id:1}, params:{ id:"1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.deleteAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should handle other errors", async () => {
    announcementsModel.deleteAnnouncement.mockRejectedValue(new Error("err"));
    const req = { user:{id:1}, params:{ id:"1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await announcementsController.deleteAnnouncement(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
