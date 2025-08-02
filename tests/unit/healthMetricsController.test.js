const request = require('supertest');
const express = require('express');
const sql = require('mssql');
const HealthMetricsController = require('../../controllers/healthMetricsController');

// Mock dependencies
jest.mock('mssql');
jest.mock('../../dbConfig', () => ({
  server: 'test-server',
  database: 'test-db',
  user: 'test-user',
  password: 'test-pass'
}));

describe('HealthMetricsController', () => {
  let app;
  let mockRequest;
  let mockResponse;
  let mockPool;
  let mockConnectionRequest;
  let healthMetricsController;

  beforeEach(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    
    // Initialize controller
    healthMetricsController = new HealthMetricsController();
    
    // Mock request and response objects
    mockRequest = {
      user: { id: 1 },
      body: {},
      query: {},
      params: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock SQL connection and request
    mockConnectionRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };

    mockPool = {
      request: jest.fn().mockReturnValue(mockConnectionRequest)
    };

    sql.connect = jest.fn().mockResolvedValue(mockPool);
    sql.Int = 'Int';
    sql.NVarChar = 'NVarChar';
    sql.DateTime = 'DateTime';
    sql.Float = 'Float';
    sql.MAX = 'MAX';

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('getHealthDashboard', () => {
    it('should retrieve comprehensive health dashboard data successfully', async () => {
      // Mock database responses
      const mockComplianceResult = {
        recordset: [{
          totalDoses: 100,
          takenDoses: 85,
          overallCompliance: 85.0
        }]
      };

      const mockDailyResult = {
        recordset: [
          { date: '2024-01-01', totalDoses: 3, takenDoses: 3, dailyCompliance: 100.0 },
          { date: '2024-01-02', totalDoses: 3, takenDoses: 2, dailyCompliance: 66.67 }
        ]
      };

      const mockMedicationResult = {
        recordset: [
          {
            medicationName: 'Aspirin',
            dosage: '100mg',
            frequency: 'Daily',
            totalDoses: 30,
            takenDoses: 28,
            missedDoses: 2,
            adherenceRate: 93.33
          }
        ]
      };

      const mockMissedResult = {
        recordset: [
          {
            medicationName: 'Vitamin D',
            dosage: '1000IU',
            scheduledTime: '2024-01-01T08:00:00Z',
            hoursOverdue: 2
          }
        ]
      };

      const mockTrendsResult = {
        recordset: [
          { year: 2024, week: 1, totalDoses: 21, takenDoses: 19, weeklyCompliance: 90.48 }
        ]
      };

      // Mock multiple query calls
      mockConnectionRequest.query
        .mockResolvedValueOnce(mockComplianceResult)
        .mockResolvedValueOnce(mockDailyResult)
        .mockResolvedValueOnce(mockMedicationResult)
        .mockResolvedValueOnce(mockMissedResult)
        .mockResolvedValueOnce(mockTrendsResult);

      await healthMetricsController.getHealthDashboard(mockRequest, mockResponse);

      expect(sql.connect).toHaveBeenCalled();
      expect(mockPool.request).toHaveBeenCalledTimes(5);
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('userId', 'Int', 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          overallStats: mockComplianceResult.recordset[0],
          dailyAdherence: mockDailyResult.recordset,
          medicationAdherence: mockMedicationResult.recordset,
          recentMissed: mockMissedResult.recordset,
          weeklyTrends: mockTrendsResult.recordset
        }
      });
    });

    it('should handle empty compliance data gracefully', async () => {
      const mockEmptyResult = { recordset: [] };
      mockConnectionRequest.query
        .mockResolvedValueOnce(mockEmptyResult)
        .mockResolvedValueOnce(mockEmptyResult)
        .mockResolvedValueOnce(mockEmptyResult)
        .mockResolvedValueOnce(mockEmptyResult)
        .mockResolvedValueOnce(mockEmptyResult);

      await healthMetricsController.getHealthDashboard(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          overallStats: {
            totalDoses: 0,
            takenDoses: 0,
            overallCompliance: 100
          },
          dailyAdherence: [],
          medicationAdherence: [],
          recentMissed: [],
          weeklyTrends: []
        }
      });
    });

    it('should handle database errors properly', async () => {
      const mockError = new Error('Database connection failed');
      sql.connect.mockRejectedValue(mockError);

      await healthMetricsController.getHealthDashboard(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to retrieve health dashboard data',
        error: mockError.message
      });
    });
  });

  describe('recordHealthMetric', () => {
    beforeEach(() => {
      mockRequest.body = {
        metricType: 'blood_pressure',
        value: '120/80',
        unit: 'mmHg',
        notes: 'Morning reading after exercise'
      };
    });

    it('should record a health metric successfully', async () => {
      const mockResult = {
        recordset: [{
          metricId: 1,
          metricType: 'blood_pressure',
          value: '120/80',
          unit: 'mmHg',
          notes: 'Morning reading after exercise',
          recordedAt: new Date(),
          createdAt: new Date()
        }]
      };

      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.recordHealthMetric(mockRequest, mockResponse);

      expect(mockConnectionRequest.input).toHaveBeenCalledWith('userId', 'Int', 1);
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('metricType', 'NVarChar', 'blood_pressure');
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('value', 'NVarChar', '120/80');
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('unit', 'NVarChar', 'mmHg');
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('notes', 'NVarChar', 'Morning reading after exercise');
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Health metric recorded successfully',
        data: { metric: mockResult.recordset[0] }
      });
    });

    it('should validate required fields', async () => {
      mockRequest.body = { value: '120/80' }; // Missing metricType

      await healthMetricsController.recordHealthMetric(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Metric type and value are required'
      });
    });

    it('should handle database errors during insertion', async () => {
      const mockError = new Error('Insertion failed');
      mockConnectionRequest.query.mockRejectedValue(mockError);

      await healthMetricsController.recordHealthMetric(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to record health metric',
        error: mockError.message
      });
    });
  });

  describe('getHealthMetrics', () => {
    beforeEach(() => {
      mockRequest.query = {
        limit: '10',
        metricType: 'blood_pressure',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };
    });

    it('should retrieve health metrics with filters successfully', async () => {
      const mockResult = {
        recordset: [
          {
            metricId: 1,
            metricType: 'blood_pressure',
            value: '120/80',
            unit: 'mmHg',
            notes: 'Morning reading',
            recordedAt: '2024-01-15T08:00:00Z',
            createdAt: '2024-01-15T08:00:00Z'
          },
          {
            metricId: 2,
            metricType: 'blood_pressure',
            value: '118/78',
            unit: 'mmHg',
            notes: 'Evening reading',
            recordedAt: '2024-01-14T20:00:00Z',
            createdAt: '2024-01-14T20:00:00Z'
          }
        ]
      };

      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.getHealthMetrics(mockRequest, mockResponse);

      expect(mockConnectionRequest.input).toHaveBeenCalledWith('userId', 'Int', 1);
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('limit', 'Int', 10);
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('metricType', 'NVarChar', 'blood_pressure');
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('startDate', 'DateTime', expect.any(Date));
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('endDate', 'DateTime', expect.any(Date));

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { metrics: mockResult.recordset }
      });
    });

    it('should work without filters', async () => {
      mockRequest.query = {}; // No filters
      const mockResult = { recordset: [] };
      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.getHealthMetrics(mockRequest, mockResponse);

      expect(mockConnectionRequest.input).toHaveBeenCalledWith('userId', 'Int', 1);
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('limit', 'Int', 50); // Default limit
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors during retrieval', async () => {
      const mockError = new Error('Query failed');
      mockConnectionRequest.query.mockRejectedValue(mockError);

      await healthMetricsController.getHealthMetrics(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to retrieve health metrics',
        error: mockError.message
      });
    });
  });

  describe('generateAdherenceReport', () => {
    beforeEach(() => {
      mockRequest.query = {
        period: 'monthly',
        format: 'json'
      };
    });

    it('should generate monthly adherence report successfully', async () => {
      const mockResult = {
        recordset: [
          {
            period: 'January 2024',
            totalDoses: 93,
            takenDoses: 85,
            adherenceRate: 91.4,
            missedDoses: 8
          }
        ]
      };

      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.generateAdherenceReport(mockRequest, mockResponse);

      expect(mockConnectionRequest.input).toHaveBeenCalledWith('userId', 'Int', 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          reportTitle: 'Monthly Medication Adherence Report',
          generatedAt: expect.any(String),
          period: 'monthly',
          adherenceData: mockResult.recordset
        }
      });
    });

    it('should handle weekly period correctly', async () => {
      mockRequest.query.period = 'weekly';
      const mockResult = { recordset: [] };
      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.generateAdherenceReport(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          reportTitle: 'Weekly Medication Adherence Report',
          generatedAt: expect.any(String),
          period: 'weekly',
          adherenceData: []
        }
      });
    });

    it('should handle quarterly period correctly', async () => {
      mockRequest.query.period = 'quarterly';
      const mockResult = { recordset: [] };
      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.generateAdherenceReport(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          reportTitle: 'Quarterly Medication Adherence Report',
          generatedAt: expect.any(String),
          period: 'quarterly',
          adherenceData: []
        }
      });
    });

    it('should default to monthly period for invalid input', async () => {
      mockRequest.query.period = 'invalid';
      const mockResult = { recordset: [] };
      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.generateAdherenceReport(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          reportTitle: 'Monthly Medication Adherence Report',
          generatedAt: expect.any(String),
          period: 'invalid',
          adherenceData: []
        }
      });
    });

    it('should handle database errors during report generation', async () => {
      const mockError = new Error('Report generation failed');
      mockConnectionRequest.query.mockRejectedValue(mockError);

      await healthMetricsController.generateAdherenceReport(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to generate adherence report',
        error: mockError.message
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing user context', async () => {
      mockRequest.user = undefined;

      await healthMetricsController.getHealthDashboard(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle SQL connection failure', async () => {
      const connectionError = new Error('Cannot connect to database');
      sql.connect.mockRejectedValue(connectionError);

      await healthMetricsController.recordHealthMetric(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to record health metric',
        error: connectionError.message
      });
    });

    it('should handle invalid date formats gracefully', async () => {
      mockRequest.query = {
        startDate: 'invalid-date',
        endDate: '2024-13-45' // Invalid date
      };

      const mockResult = { recordset: [] };
      mockConnectionRequest.query.mockResolvedValue(mockResult);

      await healthMetricsController.getHealthMetrics(mockRequest, mockResponse);

      // Should still process but with potentially invalid dates
      expect(mockConnectionRequest.input).toHaveBeenCalledWith('userId', 'Int', 1);
    });
  });
});