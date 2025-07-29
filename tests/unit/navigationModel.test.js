const NavigationModel = require("../../models/navigationModel");
const axios = require("axios");

jest.mock("axios");
const mockedAxios = axios;

beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
});

describe("NavigationModel.getDirections", () => {
    it("should return directions successfully", async () => {
        const mockResponse = {
            data: {
                status: 'OK',
                routes: [{ legs: [{ distance: { text: '5.2 km', value: 5200 }, duration: { text: '15 mins', value: 900 } }] }]
            }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await NavigationModel.getDirections('1.3521,103.8198', '1.3621,103.8298', 'TRANSIT');

        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://maps.googleapis.com/maps/api/directions/json',
            {
                params: {
                    origin: '1.3521,103.8198',
                    destination: '1.3621,103.8298',
                    mode: 'transit',
                    alternatives: true,
                    key: 'test-api-key'
                }
            }
        );
        expect(result).toEqual(mockResponse.data.routes);
    });

    it("should handle Google API errors", async () => {
        mockedAxios.get.mockResolvedValue({
            data: { status: 'ZERO_RESULTS', error_message: 'No routes found' }
        });

        await expect(NavigationModel.getDirections('1.3521,103.8198', '1.3621,103.8298', 'TRANSIT'))
            .rejects.toThrow('No routes found');
    });

    it("should handle network errors", async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        await expect(NavigationModel.getDirections('1.3521,103.8198', '1.3621,103.8298', 'TRANSIT'))
            .rejects.toThrow('Network error');
    });

    it("should use default travel mode when not specified", async () => {
        mockedAxios.get.mockResolvedValue({ data: { status: 'OK', routes: [] } });

        await NavigationModel.getDirections('1.3521,103.8198', '1.3621,103.8298');

        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://maps.googleapis.com/maps/api/directions/json',
            expect.objectContaining({
                params: expect.objectContaining({ mode: 'transit' })
            })
        );
    });
});

describe("NavigationModel.geocodeAddress", () => {
    it("should geocode address successfully", async () => {
        const mockResponse = {
            data: {
                status: 'OK',
                results: [{
                    formatted_address: '123 Test Street, Singapore 123456',
                    geometry: { location: { lat: 1.3521, lng: 103.8198 } },
                    place_id: 'ChIJ123test'
                }]
            }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await NavigationModel.geocodeAddress('123 Test Street, Singapore');

        expect(result).toEqual({
            formatted_address: '123 Test Street, Singapore 123456',
            geometry: { location: { lat: 1.3521, lng: 103.8198 } },
            place_id: 'ChIJ123test'
        });
    });

    it("should handle Google API errors", async () => {
        mockedAxios.get.mockResolvedValue({
            data: { status: 'ZERO_RESULTS', error_message: 'Address not found' }
        });

        await expect(NavigationModel.geocodeAddress('Invalid Address')).rejects.toThrow('Address not found');
    });

    it("should handle network errors", async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network timeout'));

        await expect(NavigationModel.geocodeAddress('123 Test Street')).rejects.toThrow('Network timeout');
    });

    it("should handle missing error message", async () => {
        mockedAxios.get.mockResolvedValue({
            data: { status: 'ZERO_RESULTS' }
        });

        await expect(NavigationModel.geocodeAddress('Invalid Address')).rejects.toThrow('Unable to geocode address');
    });
});

describe("NavigationModel.formatCoordinates", () => {
    it("should format coordinates correctly", () => {
        expect(NavigationModel.formatCoordinates(1.3521, 103.8198)).toBe('1.3521,103.8198');
    });

    it("should handle negative coordinates", () => {
        expect(NavigationModel.formatCoordinates(-1.3521, -103.8198)).toBe('-1.3521,-103.8198');
    });

    it("should handle decimal coordinates", () => {
        expect(NavigationModel.formatCoordinates(1.123456789, 103.987654321)).toBe('1.123456789,103.987654321');
    });
});

