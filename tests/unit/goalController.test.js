const goalController = require("../../controllers/goalController");
const goalModel = require("../../models/goalModel");

jest.mock("../../models/goalModel");

// Test controller creating goal
describe("goalController.createGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a goal and return 201", async () => {
    const req = {
      user: { id: 1 },
      body: { name: "Run", description: "Jog 10 mins" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockGoal = {
      goalId: 1,
      userId: 1,
      name: "Run",
      description: "Jog 10 mins",
    };
    goalModel.createGoal.mockResolvedValue(mockGoal);

    await goalController.createGoal(req, res);

    expect(goalModel.createGoal).toHaveBeenCalledWith(1, "Run", "Jog 10 mins");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockGoal);
  });

  it("should handle errors when creating goal", async () => {
    const req = {
      user: { id: 1 },
      body: { name: "Run", description: "Jog 10 mins" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.createGoal.mockRejectedValue(new Error("Failed to create goal"));

    await goalController.createGoal(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to create goal" });
  });
});

// Test goal controller getting goals
describe("goalController.getGoals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return goals for user", async () => {
    const req = {
      user: { id: "1" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockGoals = [{ goalId: 1 }, { goalId: 2 }];
    goalModel.getGoals.mockResolvedValue(mockGoals);

    await goalController.getGoals(req, res);

    expect(goalModel.getGoals).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockGoals);
  });

  it("should handle fetch errors", async () => {
    const req = {
      user: { id: "1" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.getGoals.mockRejectedValue(new Error("Failed to fetch goals"));

    await goalController.getGoals(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch goals" });
  });
});

// Test goal controller deleting goals
describe("goalController.deleteGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a goal", async () => {
    const req = {
      params: { goalId: "1" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.deleteGoal.mockResolvedValue();

    await goalController.deleteGoal(req, res);

    expect(goalModel.deleteGoal).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Goal deleted successfully",
    });
  });

  it("should handle deletion errors", async () => {
    const req = {
      params: { goalId: "1" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.deleteGoal.mockRejectedValue(new Error("Failed to delete goal"));

    await goalController.deleteGoal(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to delete goal" });
  });
});

// Test goal controller updating goals
describe("goalController.updateGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update the goals' timestamp and return 200", async () => {
    const req = {
      body: {
        goalIds: [1, 2, 3],
      },
      user: {
        id: "1",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    goalModel.updateGoal
      .mockResolvedValueOnce({ goalId: 1 })
      .mockResolvedValueOnce({ goalId: 2 })
      .mockResolvedValueOnce({ goalId: 3 });

    const mockResponse = [{ goalId: 1 }, { goalId: 2 }, { goalId: 3 }];
    goalModel.updateGoal.mockResolvedValue(mockResponse);

    await goalController.updateGoal(req, res);
    expect(goalModel.updateGoal).toHaveBeenCalledTimes(3);
    expect(goalModel.updateGoal).toHaveBeenNthCalledWith(1, 1, 1);
    expect(goalModel.updateGoal).toHaveBeenNthCalledWith(2, 2, 1);
    expect(goalModel.updateGoal).toHaveBeenNthCalledWith(3, 3, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle error when updating", async () => {
    const req = {
      body: {
        goalIds: [1, 2],
      },
      user: {
        id: "5",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.updateGoal.mockRejectedValue(new Error("Failed to update goal"));

    await goalController.updateGoal(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to update goal" });
  });
});

// Test controller getting incompleted goals
describe("goalController.getIncompletedGoals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return incompleted goals", async () => {
    const req = {
      user: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockGoals = [{ goalId: 1, last_completed_at: null }];
    goalModel.getIncompletedGoals.mockResolvedValue(mockGoals);

    await goalController.getIncompletedGoals(req, res);

    expect(goalModel.getIncompletedGoals).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockGoals);
  });

  it("should handle errors when getting incompleted goals", async () => {
    const req = {
      user: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.getIncompletedGoals.mockRejectedValue(
      new Error("Failed to fetch incomplete goals")
    );

    await goalController.getIncompletedGoals(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch incompleted goals",
    });
  });
});

// Test goal controler reseting goals
describe("goalController.resetGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset goals and return success message", async () => {
    const req = {
      user: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockResponse = { message: "All goals reset successfully" };
    goalModel.resetGoal.mockResolvedValue(mockResponse);

    await goalController.resetGoal(req, res);

    expect(goalModel.resetGoal).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle errors when reseting", async () => {
    const req = {
      user: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.resetGoal.mockRejectedValue(new Error("Failed to reset goal"));

    await goalController.resetGoal(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to reset goal" });
  });
});

// Test controller log goal completion
describe("goalController.logGoalCompletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log multiple goal completions and return 201", async () => {
    const req = {
      body: {
        goalIds: [1, 2, 3],
      },
      user: {
        id: "1",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.logGoalCompletion
      .mockResolvedValueOnce()
      .mockResolvedValueOnce()
      .mockResolvedValueOnce();

    await goalController.logGoalCompletion(req, res);

    expect(goalModel.logGoalCompletion).toHaveBeenCalledTimes(3);
    expect(goalModel.logGoalCompletion).toHaveBeenNthCalledWith(1, 1, 1);
    expect(goalModel.logGoalCompletion).toHaveBeenNthCalledWith(2, 1, 2);
    expect(goalModel.logGoalCompletion).toHaveBeenNthCalledWith(3, 1, 3);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Goal logged" });
  });

  it("should handle error when logging goals", async () => {
    const req = {
      body: {
        goalIds: [1],
      },
      user: {
        id: "1",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    goalModel.logGoalCompletion.mockRejectedValue(
      new Error("Failed to log goal")
    );

    await goalController.logGoalCompletion(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to log goal" });
  });
});
