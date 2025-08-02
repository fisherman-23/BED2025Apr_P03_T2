const Medication = require('../../models/medicationModel');
const sql = require('mssql');

// Mock mssql
jest.mock('mssql', () => ({
    connect: jest.fn(),
    close: jest.fn(),
    Int: 'Int',
    NVarChar: 'NVarChar',
    DateTime: 'DateTime',
    Bit: 'Bit'
}));

describe('Medication Model Tests', () => {
    let mockConnection;
    let mockRequest;

    beforeEach(() => {
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
        };

        mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn()
        };

        sql.connect.mockResolvedValue(mockConnection);
        jest.clearAllMocks();
    });

    describe('createMedication', () => {
        it('should successfully create a new medication', async () => {
            const medicationData = {
                userId: 1,
                medicationName: 'Aspirin',
                dosage: '100mg',
                frequency: 'once_daily',
                timing: '08:00:00',
                startDate: '2025-08-03',
                instructions: 'Take with food',
                prescribedBy: 'Dr. Smith',
                category: 'Pain Relief'
            };

            const mockResult = {
                recordset: [{
                    medicationId: 1,
                    ...medicationData
                }]
            };

            mockRequest.query.mockResolvedValue(mockResult);

            const result = await Medication.createMedication(medicationData);

            expect(sql.connect).toHaveBeenCalled();
            expect(mockConnection.request).toHaveBeenCalled();
            expect(mockRequest.input).toHaveBeenCalledWith('userId', medicationData.userId);
            expect(mockRequest.input).toHaveBeenCalledWith('name', medicationData.medicationName);
            expect(mockRequest.query).toHaveBeenCalled();
            expect(result.medicationId).toBe(1);
            expect(mockConnection.close).toHaveBeenCalled();
        });

        it('should handle database connection errors', async () => {
            sql.connect.mockRejectedValue(new Error('Connection failed'));

            await expect(Medication.createMedication({})).rejects.toThrow('Connection failed');
        });

        it('should handle query execution errors', async () => {
            mockRequest.query.mockRejectedValue(new Error('Query failed'));

            await expect(Medication.createMedication({})).rejects.toThrow('Query failed');
        });
    });

    describe('getUserMedications', () => {
        it('should return all medications for a user', async () => {
            const userId = 1;
            const mockMedications = [
                {
                    medicationId: 1,
                    medicationName: 'Aspirin',
                    dosage: '100mg',
                    frequency: 'once_daily',
                    active: true
                },
                {
                    medicationId: 2,
                    medicationName: 'Lisinopril',
                    dosage: '10mg',
                    frequency: 'once_daily',
                    active: true
                }
            ];

            mockRequest.query.mockResolvedValue({ recordset: mockMedications });

            const result = await Medication.getUserMedications(userId);

            expect(mockRequest.input).toHaveBeenCalledWith('userId', userId);
            expect(result).toEqual(mockMedications);
            expect(result).toHaveLength(2);
        });

        it('should return empty array when user has no medications', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await Medication.getUserMedications(1);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should filter by category when provided', async () => {
            const userId = 1;
            const category = 'Pain Relief';

            await Medication.getUserMedications(userId, { category });

            expect(mockRequest.input).toHaveBeenCalledWith('userId', userId);
            expect(mockRequest.input).toHaveBeenCalledWith('category', category);
        });
    });

    describe('getMedicationById', () => {
        it('should return medication by ID', async () => {
            const medicationId = 1;
            const mockMedication = {
                medicationId: 1,
                medicationName: 'Aspirin',
                dosage: '100mg',
                has_conflicts: 0
            };

            mockRequest.query.mockResolvedValue({ recordset: [mockMedication] });

            const result = await Medication.getMedicationById(medicationId);

            expect(mockRequest.input).toHaveBeenCalledWith('medicationId', medicationId);
            expect(result).toEqual(mockMedication);
        });

        it('should return null when medication not found', async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await Medication.getMedicationById(999);

            expect(result).toBeNull();
        });
    });

    describe('updateMedication', () => {
        it('should successfully update medication', async () => {
            const medicationId = 1;
            const updateData = {
                medicationName: 'Updated Aspirin',
                dosage: '150mg',
                timing: '09:00:00'
            };

            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const result = await Medication.updateMedication(medicationId, updateData);

            expect(mockRequest.input).toHaveBeenCalledWith('medicationId', medicationId);
            expect(mockRequest.input).toHaveBeenCalledWith('name', updateData.medicationName);
            expect(mockRequest.input).toHaveBeenCalledWith('dosage', updateData.dosage);
            expect(result).toBe(true);
        });

        it('should return false when no rows affected', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

            const result = await Medication.updateMedication(999, {});

            expect(result).toBe(false);
        });
    });

    describe('deleteMedication', () => {
        it('should successfully soft delete medication', async () => {
            const medicationId = 1;

            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const result = await Medication.deleteMedication(medicationId);

            expect(mockRequest.input).toHaveBeenCalledWith('medicationId', medicationId);
            expect(result).toBe(true);
        });

        it('should return false when medication not found', async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

            const result = await Medication.deleteMedication(999);

            expect(result).toBe(false);
        });
    });

    describe('getAdherenceData', () => {
        it('should return adherence statistics', async () => {
            const userId = 1;
            const days = 30;
            const mockAdherence = [
                {
                    medicationId: 1,
                    name: 'Aspirin',
                    totalDoses: 30,
                    takenDoses: 25,
                    adherenceRate: 83.33
                }
            ];

            mockRequest.query.mockResolvedValue({ recordset: mockAdherence });

            const result = await Medication.getAdherenceData(userId, days);

            expect(mockRequest.input).toHaveBeenCalledWith('userId', userId);
            expect(mockRequest.input).toHaveBeenCalledWith('days', days);
            expect(result).toEqual(mockAdherence);
        });

        it('should filter by specific medication when provided', async () => {
            const userId = 1;
            const days = 30;
            const medicationId = 1;

            await Medication.getAdherenceData(userId, days, medicationId);

            expect(mockRequest.input).toHaveBeenCalledWith('medicationId', medicationId);
        });
    });

    describe('getUpcomingReminders', () => {
        it('should return upcoming medication reminders', async () => {
            const userId = 1;
            const hours = 24;
            const mockReminders = [
                {
                    logId: 1,
                    medicationId: 1,
                    medicationName: 'Aspirin',
                    scheduledTime: '2025-08-04T08:00:00Z',
                    dosage: '100mg',
                    minutesUntilDose: 120
                }
            ];

            mockRequest.query.mockResolvedValue({ recordset: mockReminders });

            const result = await Medication.getUpcomingReminders(userId, hours);

            expect(mockRequest.input).toHaveBeenCalledWith('userId', userId);
            expect(mockRequest.input).toHaveBeenCalledWith('hours', hours);
            expect(result).toEqual(mockReminders);
        });

        it('should use default 24 hours when not specified', async () => {
            const userId = 1;
            mockRequest.query.mockResolvedValue({ recordset: [] });

            await Medication.getUpcomingReminders(userId);

            expect(mockRequest.input).toHaveBeenCalledWith('hours', 24);
        });
    });

    describe('markAsTaken', () => {
        it('should successfully mark medication as taken', async () => {
            const logId = 1;
            const takenAt = new Date();

            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const result = await Medication.markAsTaken(logId, takenAt);

            expect(mockRequest.input).toHaveBeenCalledWith('logId', logId);
            expect(mockRequest.input).toHaveBeenCalledWith('takenAt', takenAt);
            expect(result).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should handle and re-throw database errors', async () => {
            const error = new Error('Database error');
            mockRequest.query.mockRejectedValue(error);

            await expect(Medication.getUserMedications(1)).rejects.toThrow('Database error');
        });

        it('should ensure connection is closed even on error', async () => {
            mockRequest.query.mockRejectedValue(new Error('Query error'));

            try {
                await Medication.getUserMedications(1);
            } catch (error) {
                expect(mockConnection.close).toHaveBeenCalled();
            }
        });
    });
});