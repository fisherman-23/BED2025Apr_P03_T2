const facilitiesController = require("../../controllers/facilitiesController");
const facilitiesModel = require("../../models/facilitiesModel");

jest.mock("../../models/facilitiesModel");

describe("facilitiesController.handleLocationAccess", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return location data for valid coordinates", async () => {
        const mockLocationData = {
            address: "123 Test St, Test City",
            latitude: 12.34,
            longitude: 56.78
        };
        facilitiesModel.handleLocationAccess.mockResolvedValue(mockLocationData);

        const req = { query: { lat: 12.34, lng: 56.78 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.handleLocationAccess(req, res);

        expect(facilitiesModel.handleLocationAccess).toHaveBeenCalledWith(12.34, 56.78);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockLocationData);
    });

    it("should handle errors and return a 500 status with error message", async () => {
        facilitiesModel.handleLocationAccess.mockRejectedValue(new Error("Database error"));

        const req = { query: { lat: 12.34, lng: 56.78 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.handleLocationAccess(req, res);

        expect(facilitiesModel.handleLocationAccess).toHaveBeenCalledWith(12.34, 56.78);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error fetching location data" });
    });
});

describe("facilitiesController.getFacilities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return all facilities", async () => {
        const mockFacilities = [
            { facilityId: 1, name: "Facility A" },
            { facilityId: 2, name: "Facility B" }
        ];
        facilitiesModel.getFacilities.mockResolvedValue(mockFacilities);

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getFacilities(req, res);

        expect(facilitiesModel.getFacilities).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockFacilities);
    });

    it("should handle errors and return a 500 status with error message", async () => {
        facilitiesModel.getFacilities.mockRejectedValue(new Error("Database error"));

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getFacilities(req, res);

        expect(facilitiesModel.getFacilities).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error fetching facilities" });
    });
});

describe("facilitiesController.getFacilityById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return facility by ID", async () => {
        const mockFacility = { facilityId: 1, name: "Facility A" };
        facilitiesModel.getFacilityById.mockResolvedValue(mockFacility);

        const req = { params: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getFacilityById(req, res);

        expect(facilitiesModel.getFacilityById).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockFacility);
    });

    it("should return 404 if facility not found", async () => {
        facilitiesModel.getFacilityById.mockResolvedValue(null);

        const req = { params: { id: 999 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getFacilityById(req, res);

        expect(facilitiesModel.getFacilityById).toHaveBeenCalledWith(999);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Facility not found" });
    });

    it("should handle errors and return a 500 status with error message", async () => {
        facilitiesModel.getFacilityById.mockRejectedValue(new Error("Database error"));

        const req = { params: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getFacilityById(req, res);

        expect(facilitiesModel.getFacilityById).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error fetching facility by ID" });
    });
});

describe("facilitiesController.getFacilitiesByType", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return facilities by type", async () => {
        const mockFacilities = [
            { facilityId: 1, name: "Facility A", type: "Gym" },
            { facilityId: 2, name: "Facility B", type: "Library" }
        ];
        facilitiesModel.getFacilitiesByType.mockResolvedValue(mockFacilities);

        const req = { params: { type: "Gym" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getFacilitiesByType(req, res);

        expect(facilitiesModel.getFacilitiesByType).toHaveBeenCalledWith("Gym");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockFacilities);
    });

    it("should handle errors and return a 500 status with error message", async () => {
        facilitiesModel.getFacilitiesByType.mockRejectedValue(new Error("Database error"));

        const req = { params: { type: "Gym" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getFacilitiesByType(req, res);

        expect(facilitiesModel.getFacilitiesByType).toHaveBeenCalledWith("Gym");
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error fetching facilities by type" });
    });
});

describe("facilitiesController.getNearbyFacilities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return nearby facilities based on coordinates", async () => {
        const mockFacilities = [
            { facilityId: 1, name: "Facility A", distance: 100 },
            { facilityId: 2, name: "Facility B", distance: 200 }
        ];
        facilitiesModel.getNearbyFacilities.mockResolvedValue(mockFacilities);

        const req = { query: { lat: 12.34, lng: 56.78, rad: 500 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getNearbyFacilities(req, res);

        expect(facilitiesModel.getNearbyFacilities).toHaveBeenCalledWith(12.34, 56.78, 500);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockFacilities);
    });

    it("should handle errors and return a 500 status with error message", async () => {
        facilitiesModel.getNearbyFacilities.mockRejectedValue(new Error("Database error"));

        const req = { query: { lat: 12.34, lng: 56.78, rad: 500 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await facilitiesController.getNearbyFacilities(req, res);

        expect(facilitiesModel.getNearbyFacilities).toHaveBeenCalledWith(12.34, 56.78, 500);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error fetching nearby facilities" });
    });
});