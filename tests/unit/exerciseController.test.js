// Unit tests for exerciseController
const exerciseController = require("../../controllers/exerciseController");
const exerciseModel = require("../../models/exerciseModel");

jest.mock("../../models/exerciseModel");

// Test exercise controller for getting exercises
describe("exerciseController.getExercises", () => {
  beforeEach(() => jest.clearAllMocks());
  it("should return user exercises", async () => {
    const mockExercise = [
      {
        exerciseId: 1,
        title: "Seated Knee Lifts",
        description:
          "A simple seated movement that strengthens thighs and supports circulation. Ideal for those with limited mobility.",
        image_url: "/exercise/images/seated_knee_lifts.png",
        categoryId: 1,
        benefits:
          "This exercise helps stimulate blood flow in your legs and strengthens your thigh muscles. You may feel improved lower-body control and reduced stiffness.",
      },
    ];
    exerciseModel.getExercises.mockResolvedValue(mockExercise);
    const req = {
      user: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await exerciseController.getExercises(req, res);
    expect(exerciseModel.getExercises).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockExercise);
  });
  it("should handle errors and return 500", async () => {
    const req = { user: { id: 123 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    exerciseModel.getExercises.mockRejectedValue(
      new Error("Error fetching exercises")
    );

    await exerciseController.getExercises(req, res);

    expect(exerciseModel.getExercises).toHaveBeenCalledWith(123);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal Server Error",
    });
  });
});

// Test controller getting exercises steps
describe("exerciseController.getSteps", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return exercise steps", async () => {
    const mockSteps = [{ stepId: 1, description: "Lift knee" }];
    exerciseModel.getSteps.mockResolvedValue(mockSteps);

    const req = { params: { exerciseId: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.getSteps(req, res);

    expect(exerciseModel.getSteps).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockSteps);
  });

  it("should handle errors and return 500", async () => {
    exerciseModel.getSteps.mockRejectedValue(
      new Error("Error getting exercise steps")
    );

    const req = { params: { exerciseId: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.getSteps(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

// Test controller creating user preferences
describe("exerciseController.personalisation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should save preferences and return 200", async () => {
    exerciseModel.personalisation.mockResolvedValue(true);

    const req = { body: { categoryIds: [1, 2] }, user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.personalisation(req, res);

    expect(exerciseModel.personalisation).toHaveBeenCalledWith([1, 2], 1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Preferences saved successfully",
    });
  });

  it("should return 400 if preferences are not saved", async () => {
    exerciseModel.personalisation.mockResolvedValue(false);

    const req = { body: { categoryIds: [1] }, user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.personalisation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to save preferences",
    });
  });

  it("should handle errors and return 500", async () => {
    exerciseModel.personalisation.mockRejectedValue(
      new Error("Error saving preferences")
    );

    const req = { body: { categoryIds: [1] }, user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.personalisation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

// Test controller getting user exercises preferences
describe("exerciseController.getExercisePreferences", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return user preferences", async () => {
    const mockPrefs = [{ categoryId: 1 }, { categoryId: 2 }];
    exerciseModel.getExercisePreferences.mockResolvedValue(mockPrefs);

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.getExercisePreferences(req, res);

    expect(exerciseModel.getExercisePreferences).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ categoryIds: [1, 2] });
  });

  it("should return empty array if no preferences found", async () => {
    exerciseModel.getExercisePreferences.mockResolvedValue([]);

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.getExercisePreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      categoryIds: [],
      message: "No preferences found",
    });
  });

  it("should handle errors and return 500", async () => {
    exerciseModel.getExercisePreferences.mockRejectedValue(
      new Error("Error getting exercise preferences")
    );

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.getExercisePreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

// Test controller updating exercise preferences
describe("exerciseController.updateExercisePreferences", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update preferences and return success", async () => {
    exerciseModel.updateExercisePreferences.mockResolvedValue();

    const req = { body: { categoryIds: [1, 2] }, user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.updateExercisePreferences(req, res);

    expect(exerciseModel.updateExercisePreferences).toHaveBeenCalledWith(
      [1, 2],
      1
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Preferences updated successfully",
    });
  });

  it("should handle errors and return 500", async () => {
    exerciseModel.updateExercisePreferences.mockRejectedValue(
      new Error("Error updating exercise preferences")
    );

    const req = { body: { categoryIds: [1] }, user: { id: 123 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.updateExercisePreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

// Test controller deleting exercise preferences
describe("exerciseController.deleteExercisePreference", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should delete preference and return success", async () => {
    exerciseModel.deleteExercisePreference.mockResolvedValue();

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.deleteExercisePreference(req, res);

    expect(exerciseModel.deleteExercisePreference).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Preference deleted successfully",
    });
  });

  it("should handle errors and return 500", async () => {
    exerciseModel.deleteExercisePreference.mockRejectedValue(
      new Error("Error deleting exercise preferences")
    );

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.deleteExercisePreference(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

// Test controller get user statistics
describe("exerciseController.getUserStats", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return user statistics", async () => {
    const mockStats = { userID: 1, exercise_completed: 5, goal_completed: 3 };
    exerciseModel.getUserStats.mockResolvedValue(mockStats);

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.getUserStats(req, res);

    expect(exerciseModel.getUserStats).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockStats);
  });

  it("should handle errors and return 500", async () => {
    exerciseModel.getUserStats.mockRejectedValue(
      new Error("Error in getting user statistics")
    );

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.getUserStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

// Test controller logging user completed exercise
describe("exerciseController.logExerciseCompletion", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should log exercise completion and return 201", async () => {
    exerciseModel.logExerciseCompletion.mockResolvedValue();

    const req = { user: { id: 1 }, params: { exerciseID: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.logExerciseCompletion(req, res);

    expect(exerciseModel.logExerciseCompletion).toHaveBeenCalledWith(1, "1");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Exercise logged" });
  });

  it("should handle errors and return 500", async () => {
    exerciseModel.logExerciseCompletion.mockRejectedValue(
      new Error("Error in logging completed exercise")
    );

    const req = { user: { id: 1 }, params: { exerciseID: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await exerciseController.logExerciseCompletion(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});
