const navigationController = require("../../controllers/navigationController");
const navigationModel = require("../../models/navigationModel");

jest.mock("../../models/navigationModel");

let req, res;

beforeEach(() => {
    jest.clearAllMocks();
    req = {
        params: {},
        body: {},
        headers: {},
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000')
    };
    res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
    };
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
});

describe("navigationController.getGoogleMapsConfig", () => {
    it("should return Google Maps configuration", async () => {
        await navigationController.getGoogleMapsConfig(req, res);
        expect(res.json).toHaveBeenCalledWith({
            apiKey: 'test-api-key',
            libraries: ['places'],
            loading: 'async'
        });
    });
});

describe("navigationController.getFacilityDirections", () => {
    beforeEach(() => {
        req.params = { facilityId: '123' };
        req.body = { origin: '1.3521,103.8198', travelMode: 'TRANSIT' };
        req.headers = { cookie: 'session=test' };
    });

    it("should return directions successfully", async () => {
        const mockFacility = {
            facilityId: 123,
            name: "Test Hospital",
            address: "123 Test St",
            latitude: 1.3521,
            longitude: 103.8198
        };
        const mockRoutes = [
            {
                legs: [{
                    distance: { text: '5.2 km', value: 5200 },
                    duration: { text: '15 mins', value: 900 }
                }]
            }
        ];

        navigationModel.getFacilityDetails.mockResolvedValue(mockFacility);
        navigationModel.formatCoordinates.mockReturnValue('1.3521,103.8198');
        navigationModel.getDirections.mockResolvedValue(mockRoutes);

        await navigationController.getFacilityDirections(req, res);

        expect(navigationModel.getFacilityDetails).toHaveBeenCalledWith('123', req);
        expect(navigationModel.formatCoordinates).toHaveBeenCalledWith(1.3521, 103.8198);
        expect(navigationModel.getDirections).toHaveBeenCalledWith('1.3521,103.8198', '1.3521,103.8198', 'TRANSIT');

        expect(res.json).toHaveBeenCalledWith({
            routes: mockRoutes,
            facility: {
                name: "Test Hospital",
                address: "123 Test St",
                coordinates: { lat: 1.3521, lng: 103.8198 }
            }
        });
    });

    it("should return 400 when origin is missing", async () => {
        req.body = {};

        await navigationController.getFacilityDirections(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Origin location is required'
        });
        expect(navigationModel.getFacilityDetails).not.toHaveBeenCalled();
    });

    it("should return 404 when facility is not found", async () => {
        navigationModel.getFacilityDetails.mockRejectedValue(
            new Error('Facility not found or coordinates missing')
        );

        await navigationController.getFacilityDirections(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Facility not found or coordinates missing'
        });
    });

    it("should return 400 when directions API fails", async () => {
        const mockFacility = {
            facilityId: 123,
            name: "Test Hospital",
            address: "123 Test St",
            latitude: 1.3521,
            longitude: 103.8198
        };

        navigationModel.getFacilityDetails.mockResolvedValue(mockFacility);
        navigationModel.formatCoordinates.mockReturnValue('1.3521,103.8198');
        navigationModel.getDirections.mockRejectedValue(
            new Error('Unable to get directions')
        );

        await navigationController.getFacilityDirections(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Unable to get directions'
        });
    });

    it("should return 500 for unexpected errors", async () => {
        navigationModel.getFacilityDetails.mockRejectedValue(
            new Error('Unexpected database error')
        );

        await navigationController.getFacilityDirections(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Unable to get directions'
        });
    });
});

describe("navigationController.geocodeAddress", () => {
    beforeEach(() => {
        req.body = { address: '123 Test Street, Singapore' };
    });

    it("should geocode address successfully", async () => {
        const mockGeocodeResult = {
            formatted_address: '123 Test Street, Singapore 123456',
            geometry: {
                location: { lat: 1.3521, lng: 103.8198 }
            },
            place_id: 'ChIJ123test'
        };

        navigationModel.geocodeAddress.mockResolvedValue(mockGeocodeResult);

        await navigationController.geocodeAddress(req, res);

        expect(navigationModel.geocodeAddress).toHaveBeenCalledWith('123 Test Street, Singapore');
        expect(res.json).toHaveBeenCalledWith(mockGeocodeResult);
    });

    it("should return 400 when address is missing", async () => {
        req.body = {};

        await navigationController.geocodeAddress(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Address is required'
        });
        expect(navigationModel.geocodeAddress).not.toHaveBeenCalled();
    });

    it("should return 400 when geocoding fails", async () => {
        navigationModel.geocodeAddress.mockRejectedValue(
            new Error('Unable to geocode address')
        );

        await navigationController.geocodeAddress(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Unable to geocode address'
        });
    });

    it("should return 500 for unexpected errors", async () => {
        navigationModel.geocodeAddress.mockRejectedValue(
            new Error('Network timeout')
        );

        await navigationController.geocodeAddress(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Unable to geocode address'
        });
    });
});
