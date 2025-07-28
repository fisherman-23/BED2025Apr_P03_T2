const sql = require("mssql");
const facilitiesModel = require("../../models/facilitiesModel");
const axios = require("axios");

jest.mock("mssql");
jest.mock("axios", () => ({
    get: jest.fn()
}));

describe("facilitiesModel.handleLocationAccess", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should handle location access correctly", async () => {
        const mockResponse = {
            data: {
                status: "OK",
                results: [
                    { formatted_address: "123 Main St, City, Country" }
                ]
            }
        };

        axios.get = jest.fn().mockResolvedValue(mockResponse);
        const result = await facilitiesModel.handleLocationAccess(12.34, 56.78);
        expect(axios.get).toHaveBeenCalledWith(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            expect.objectContaining({
                params: {
                    latlng: "12.34,56.78",
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            })
        );

        expect(result).toEqual({
            status: "OK",
            address: "123 Main St, City, Country"
        });
    });
    it("should handle geocoding errors", async () => {
        const mockError = {
            response: {
                data: {
                    status: "ZERO_RESULTS"
                }
            }
        };

        axios.get = jest.fn().mockRejectedValue(mockError);
        await expect(facilitiesModel.handleLocationAccess(12.34, 56.78)).rejects.toThrow("Failed to access location data.");
    });
});

describe("facilitiesModel.getFacilities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch all facilities from the database", async () => {
        const mockFacilities = [
            { 
                facilityId: 1, 
                name: "Facility A",
                address: "123 Main St",
                facilityType: "Polyclinic",
                phoneNo: "123-456-7890",
                hours: "9 AM - 5 PM",
                image_url: "http://example.com/image.jpg",
                static_map_url: "http://example.com/map.jpg",
                latitude: 12.34,
                longitude: 56.78,
                google_place_id: "place123",
                lastVerified: new Date()

            },
        ];
        
        const mockRequest = {
            query: jest.fn().mockResolvedValue({ recordset: mockFacilities }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const facilities = await facilitiesModel.getFacilities();

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(facilities).toHaveLength(1);
        expect(facilities[0].facilityId).toBe(1);
        expect(facilities[0].name).toBe("Facility A");
        expect(facilities[0].address).toBe("123 Main St");
        expect(facilities[0].facilityType).toBe("Polyclinic");
        expect(facilities[0].phoneNo).toBe("123-456-7890");
        expect(facilities[0].hours).toBe("9 AM - 5 PM");
        expect(facilities[0].image_url).toBe("http://example.com/image.jpg");
        expect(facilities[0].static_map_url).toBe("http://example.com/map.jpg");
        expect(facilities[0].latitude).toBe(12.34);
        expect(facilities[0].longitude).toBe(56.78);
        expect(facilities[0].google_place_id).toBe("place123");
        expect(facilities[0].lastVerified).toBeInstanceOf(Date);
    });

    it ("should handle errors when fetching facilities", async () => {
        const errorMessage = new Error("Database error");
        sql.connect.mockRejectedValue(errorMessage);
        await expect(facilitiesModel.getFacilities()).rejects.toThrow(errorMessage);
    });
});

describe("facilitiesModel.getFacilityById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch a facility by ID", async () => {
        const mockFacility = {
            facilityId: 1,
            name: "Facility A",
            address: "123 Main St",
            facilityType: "Polyclinic",
            phoneNo: "123-456-7890",
            hours: "9 AM - 5 PM",
            image_url: "http://example.com/image.jpg",
            static_map_url: "http://example.com/map.jpg",
            latitude: 12.34,
            longitude: 56.78,
            google_place_id: "place123",
            lastVerified: new Date()
        };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockFacility] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const facility = await facilitiesModel.getFacilityById(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(facility).toEqual(mockFacility);
    });

    it("should handle errors when fetching facility by ID", async () => {
        const errorMessage = new Error("Database error");
        sql.connect.mockRejectedValue(errorMessage);
        await expect(facilitiesModel.getFacilityById(1)).rejects.toThrow(errorMessage);
    });
});

describe("facilitiesModel.getFacilitiesByType", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch facilities by type", async () => {
        const mockFacilities = [
            { 
                facilityId: 1, 
                name: "Facility A",
                address: "123 Main St",
                facilityType: "Polyclinic",
                phoneNo: "123-456-7890",
                hours: "9 AM - 5 PM",
                image_url: "http://example.com/image.jpg",
                static_map_url: "http://example.com/map.jpg",
                latitude: 12.34,
                longitude: 56.78,
                google_place_id: "place123",
                lastVerified: new Date()
            },
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockFacilities }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const facilities = await facilitiesModel.getFacilitiesByType("Polyclinic");

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(facilities).toHaveLength(1);
        expect(facilities[0].facilityId).toBe(1);
        expect(facilities[0].name).toBe("Facility A");
    });

    it("should handle errors when fetching facilities by type", async () => {
        const errorMessage = new Error("Database error");
        sql.connect.mockRejectedValue(errorMessage);
        await expect(facilitiesModel.getFacilitiesByType("Polyclinic")).rejects.toThrow(errorMessage);
    });
});

describe("facilitiesModel.getNearbyFacilities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch nearby facilities based on latitude and longitude", async () => {
        const mockFacilities = [
            { 
                facilityId: 1, 
                name: "Facility A",
                address: "123 Main St",
                facilityType: "Polyclinic",
                phoneNo: "123-456-7890",
                hours: "9 AM - 5 PM",
                image_url: "http://example.com/image.jpg",
                static_map_url: "http://example.com/map.jpg",
                latitude: 12.34,
                longitude: 56.78,
                google_place_id: "place123",
                lastVerified: new Date()
            },
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockFacilities }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const facilities = await facilitiesModel.getNearbyFacilities(12.34, 56.78);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(facilities).toHaveLength(1);
        expect(facilities[0].facilityId).toBe(1);
        expect(facilities[0].name).toBe("Facility A");
    });

    it("should handle errors when fetching nearby facilities", async () => {
        const errorMessage = new Error("Database error");
        sql.connect.mockRejectedValue(errorMessage);
        await expect(facilitiesModel.getNearbyFacilities(12.34, 56.78)).rejects.toThrow(errorMessage);
    });
});

describe("facilitiesModel.saveFacility", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should save a new facility to the database", async () => {
        const mockFacilityData = {
            name: "New Facility",
            address: "456 Elm St",
            latitude: 12.34,
            longitude: 56.78,
            facilityType: "Hospital",
            phoneNo: "987-654-3210",
            hours: "8 AM - 6 PM",
            image_url: "http://example.com/new_image.jpg",
            static_map_url: "http://example.com/new_map.jpg",
            google_place_id: "new_place123"
        };

        const mockCheckRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [] }),
        };

        const mockInsertRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [{ FacilityId: 999 }] }),
        };

        const mockConnection = {
            request: jest
                .fn()
                .mockReturnValueOnce(mockCheckRequest)
                .mockReturnValueOnce(mockInsertRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await facilitiesModel.saveFacility(mockFacilityData);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ FacilityId: 999 });
    });

    it("should handle errors when saving a facility", async () => {
        const errorMessage = new Error("Database error");
        sql.connect.mockRejectedValue(errorMessage);
        await expect(facilitiesModel.saveFacility({})).rejects.toThrow(errorMessage);
    });
});

