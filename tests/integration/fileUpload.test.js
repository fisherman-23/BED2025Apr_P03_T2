jest.mock('firebase-admin', () => {
  const mockStream = {
    on: jest.fn().mockImplementation(function (event, cb) {
      if (event === 'finish') cb();
      return this;
    }),
    end: jest.fn(),
  };

  const mockFile = {
    createWriteStream: jest.fn(() => mockStream),
    makePublic: jest.fn().mockResolvedValue(),
    name: "mock-file-path/test.png"
  };

  const mockBucket = {
    file: jest.fn(() => mockFile),
    name: "mock-bucket"
  };

  return {
    credential: { cert: jest.fn() },
    apps: [],
    initializeApp: jest.fn(),
    storage: () => ({
      bucket: () => mockBucket
    })
  };
});

const request = require("supertest");
const path = require("path");
const app = require("../../app");

describe("POST /api/upload/profile_pictures", () => {
  it("should upload a file and return a mocked URL", async () => {
    const filePath = path.join(__dirname, '..', '..', 'public', 'assets', 'images', 'elderlyPFP.png');

    const res = await request(app)
      .post("/api/upload/profile_pictures")
      .attach("file", filePath);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("url");
    expect(res.body.url).toMatch(/^https:\/\/storage\.googleapis\.com\/mock-bucket\//);
  });

  it("should return 400 if no file is provided", async () => {
    const res = await request(app).post("/api/upload/profile_pictures");
    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/No file uploaded/i);
  });
});