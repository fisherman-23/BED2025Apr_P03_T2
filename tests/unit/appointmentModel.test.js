const sql = require('mssql');
const Appointment = require('../../models/appointmentModel');

// Mock dependencies
jest.mock('mssql');
jest.mock('../../dbConfig', () => ({
  server: 'test-server',
  database: 'test-db',
  user: 'test-user',
  password: 'test-pass'
}));

describe('Appointment Model', () => {
  let mockConnection;
  let mockRequest;

  beforeEach(() => {
    // Mock SQL request object
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };

    // Mock SQL connection
    mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest)
    };

    // Mock SQL types
    sql.Int = 'Int';
    sql.NVarChar = 'NVarChar';
    sql.DateTime2 = 'DateTime2';
    sql.Bit = 'Bit';
    sql.MAX = 'MAX';

    // Mock connection
    sql.connect = jest.fn().mockResolvedValue(mockConnection);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        userId: 1,
        doctorId: 2,
        appointmentDate: '2024-02-15T10:00:00Z',
        duration: 30,
        reason: 'Regular checkup',
        status: 'scheduled',
        notes: 'First visit',
        followUpNeeded: false
      };

      const mockResult = {
        recordset: [{
          appointmentId: 1,
          userId: 1,
          doctorId: 2,
          appointmentDate: new Date('2024-02-15T10:00:00Z'),
          duration: 30,
          reason: 'Regular checkup',
          status: 'scheduled',
          notes: 'First visit',
          reminderSent: false,
          followUpNeeded: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.createAppointment(appointmentData);

      expect(sql.connect).toHaveBeenCalled();
      expect(mockConnection.request).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledWith('userId', 'Int', 1);
      expect(mockRequest.input).toHaveBeenCalledWith('doctorId', 'Int', 2);
      expect(mockRequest.input).toHaveBeenCalledWith('appointmentDate', 'DateTime2', expect.any(Date));
      expect(mockRequest.input).toHaveBeenCalledWith('duration', 'Int', 30);
      expect(mockRequest.input).toHaveBeenCalledWith('reason', 'NVarChar', 'Regular checkup');
      expect(mockRequest.input).toHaveBeenCalledWith('status', 'NVarChar', 'scheduled');
      expect(mockRequest.input).toHaveBeenCalledWith('notes', 'NVarChar', 'First visit');
      expect(mockRequest.input).toHaveBeenCalledWith('followUpNeeded', 'Bit', false);

      expect(result).toBeInstanceOf(Appointment);
      expect(result.appointmentId).toBe(1);
      expect(result.userId).toBe(1);
      expect(result.doctorId).toBe(2);
      expect(result.reason).toBe('Regular checkup');
    });

    it('should create appointment with default values', async () => {
      const appointmentData = {
        userId: 1,
        doctorId: 2,
        appointmentDate: '2024-02-15T10:00:00Z',
        reason: 'Emergency visit'
      };

      const mockResult = {
        recordset: [{
          appointmentId: 2,
          userId: 1,
          doctorId: 2,
          appointmentDate: new Date('2024-02-15T10:00:00Z'),
          duration: 30,
          reason: 'Emergency visit',
          status: 'scheduled',
          notes: null,
          reminderSent: false,
          followUpNeeded: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.createAppointment(appointmentData);

      expect(mockRequest.input).toHaveBeenCalledWith('duration', 'Int', 30);
      expect(mockRequest.input).toHaveBeenCalledWith('status', 'NVarChar', 'scheduled');
      expect(mockRequest.input).toHaveBeenCalledWith('notes', 'NVarChar', null);
      expect(mockRequest.input).toHaveBeenCalledWith('followUpNeeded', 'Bit', false);
      expect(result.duration).toBe(30);
      expect(result.status).toBe('scheduled');
    });

    it('should handle database errors during appointment creation', async () => {
      const appointmentData = {
        userId: 1,
        doctorId: 2,
        appointmentDate: '2024-02-15T10:00:00Z',
        reason: 'Regular checkup'
      };

      const mockError = new Error('Database insertion failed');
      mockRequest.query.mockRejectedValue(mockError);

      await expect(Appointment.createAppointment(appointmentData))
        .rejects.toThrow('Database insertion failed');
    });
  });

  describe('getUserAppointments', () => {
    it('should retrieve all appointments for a user', async () => {
      const userId = 1;
      const mockResult = {
        recordset: [
          {
            appointmentId: 1,
            userId: 1,
            doctorId: 2,
            appointmentDate: new Date('2024-02-15T10:00:00Z'),
            duration: 30,
            reason: 'Regular checkup',
            status: 'scheduled',
            notes: 'First visit',
            doctorName: 'Dr. Smith',
            specialty: 'Cardiology',
            doctorPhone: '+65-6123-4567',
            doctorEmail: 'dr.smith@clinic.com',
            clinicLocation: 'Central',
            clinicAddress: '123 Medical Center',
            doctorRating: 4.8
          },
          {
            appointmentId: 2,
            userId: 1,
            doctorId: 3,
            appointmentDate: new Date('2024-02-20T14:00:00Z'),
            duration: 45,
            reason: 'Follow-up',
            status: 'completed',
            notes: 'Second visit',
            doctorName: 'Dr. Johnson',
            specialty: 'Neurology',
            doctorPhone: '+65-6234-5678',
            doctorEmail: 'dr.johnson@clinic.com',
            clinicLocation: 'East',
            clinicAddress: '456 Health Plaza',
            doctorRating: 4.6
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getUserAppointments(userId);

      expect(sql.connect).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledWith('userId', 'Int', userId);
      expect(result).toEqual(mockResult.recordset);
      expect(result).toHaveLength(2);
      expect(result[0].doctorName).toBe('Dr. Smith');
      expect(result[1].specialty).toBe('Neurology');
    });

    it('should filter appointments by status', async () => {
      const userId = 1;
      const status = 'scheduled';
      const mockResult = {
        recordset: [
          {
            appointmentId: 1,
            userId: 1,
            status: 'scheduled',
            doctorName: 'Dr. Smith'
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getUserAppointments(userId, status);

      expect(mockRequest.input).toHaveBeenCalledWith('userId', 'Int', userId);
      expect(mockRequest.input).toHaveBeenCalledWith('status', 'NVarChar', status);
      expect(result[0].status).toBe('scheduled');
    });

    it('should return empty array when no appointments found', async () => {
      const userId = 999;
      const mockResult = { recordset: [] };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getUserAppointments(userId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during retrieval', async () => {
      const userId = 1;
      const mockError = new Error('Database query failed');
      mockRequest.query.mockRejectedValue(mockError);

      await expect(Appointment.getUserAppointments(userId))
        .rejects.toThrow('Database query failed');
    });
  });

  describe('getUpcomingAppointments', () => {
    it('should retrieve upcoming scheduled appointments only', async () => {
      const userId = 1;
      const mockResult = {
        recordset: [
          {
            appointmentId: 1,
            userId: 1,
            appointmentDate: new Date('2024-02-20T10:00:00Z'),
            status: 'scheduled',
            doctorName: 'Dr. Smith',
            specialty: 'Cardiology',
            clinicLocation: 'Central'
          },
          {
            appointmentId: 2,
            userId: 1,
            appointmentDate: new Date('2024-02-25T14:00:00Z'),
            status: 'scheduled',
            doctorName: 'Dr. Johnson',
            specialty: 'Neurology',
            clinicLocation: 'East'
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getUpcomingAppointments(userId);

      expect(mockRequest.input).toHaveBeenCalledWith('userId', 'Int', userId);
      expect(result).toEqual(mockResult.recordset);
      expect(result).toHaveLength(2);
      
      // Verify query includes proper filtering conditions
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('appointmentDate >= GETDATE()')
      );
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'scheduled'")
      );
    });

    it('should return empty array when no upcoming appointments', async () => {
      const userId = 1;
      const mockResult = { recordset: [] };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getUpcomingAppointments(userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const appointmentId = 1;
      const updateData = {
        appointmentDate: '2024-02-16T11:00:00Z',
        duration: 45,
        reason: 'Updated reason',
        status: 'rescheduled',
        notes: 'Updated notes',
        followUpNeeded: true
      };

      const mockResult = {
        recordset: [{
          appointmentId: 1,
          userId: 1,
          doctorId: 2,
          appointmentDate: new Date('2024-02-16T11:00:00Z'),
          duration: 45,
          reason: 'Updated reason',
          status: 'rescheduled',
          notes: 'Updated notes',
          followUpNeeded: true,
          updatedAt: new Date()
        }]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.updateAppointment(appointmentId, updateData);

      expect(mockRequest.input).toHaveBeenCalledWith('appointmentId', 'Int', appointmentId);
      expect(mockRequest.input).toHaveBeenCalledWith('appointmentDate', 'DateTime2', expect.any(Date));
      expect(mockRequest.input).toHaveBeenCalledWith('duration', 'Int', 45);
      expect(mockRequest.input).toHaveBeenCalledWith('reason', 'NVarChar', 'Updated reason');
      expect(mockRequest.input).toHaveBeenCalledWith('status', 'NVarChar', 'rescheduled');
      expect(mockRequest.input).toHaveBeenCalledWith('notes', 'NVarChar', 'Updated notes');
      expect(mockRequest.input).toHaveBeenCalledWith('followUpNeeded', 'Bit', true);

      expect(result).toEqual(mockResult.recordset[0]);
      expect(result.duration).toBe(45);
      expect(result.status).toBe('rescheduled');
    });

    it('should update only specified fields', async () => {
      const appointmentId = 1;
      const updateData = {
        status: 'completed',
        notes: 'Appointment completed successfully'
      };

      const mockResult = {
        recordset: [{
          appointmentId: 1,
          status: 'completed',
          notes: 'Appointment completed successfully',
          updatedAt: new Date()
        }]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.updateAppointment(appointmentId, updateData);

      expect(mockRequest.input).toHaveBeenCalledWith('appointmentId', 'Int', appointmentId);
      expect(mockRequest.input).toHaveBeenCalledWith('appointmentDate', 'DateTime2', null);
      expect(mockRequest.input).toHaveBeenCalledWith('duration', 'Int', null);
      expect(mockRequest.input).toHaveBeenCalledWith('reason', 'NVarChar', null);
      expect(mockRequest.input).toHaveBeenCalledWith('status', 'NVarChar', 'completed');
      expect(mockRequest.input).toHaveBeenCalledWith('notes', 'NVarChar', 'Appointment completed successfully');
      expect(mockRequest.input).toHaveBeenCalledWith('followUpNeeded', 'Bit', null);

      expect(result.status).toBe('completed');
    });

    it('should throw error when appointment not found', async () => {
      const appointmentId = 999;
      const updateData = { status: 'completed' };

      const mockResult = { recordset: [] };
      mockRequest.query.mockResolvedValue(mockResult);

      await expect(Appointment.updateAppointment(appointmentId, updateData))
        .rejects.toThrow('Appointment not found or update failed');
    });

    it('should handle database errors during update', async () => {
      const appointmentId = 1;
      const updateData = { status: 'completed' };

      const mockError = new Error('Database update failed');
      mockRequest.query.mockRejectedValue(mockError);

      await expect(Appointment.updateAppointment(appointmentId, updateData))
        .rejects.toThrow('Database update failed');
    });
  });

  describe('deleteAppointment', () => {
    it('should soft delete appointment successfully', async () => {
      const appointmentId = 1;
      const mockResult = { rowsAffected: [1] };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.deleteAppointment(appointmentId);

      expect(mockRequest.input).toHaveBeenCalledWith('appointmentId', 'Int', appointmentId);
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'cancelled'")
      );
      expect(result).toBe(true);
    });

    it('should return false when appointment not found', async () => {
      const appointmentId = 999;
      const mockResult = { rowsAffected: [0] };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.deleteAppointment(appointmentId);

      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      const appointmentId = 1;
      const mockError = new Error('Database deletion failed');
      mockRequest.query.mockRejectedValue(mockError);

      await expect(Appointment.deleteAppointment(appointmentId))
        .rejects.toThrow('Database deletion failed');
    });
  });

  describe('searchDoctors', () => {
    it('should search doctors without filters', async () => {
      const mockResult = {
        recordset: [
          {
            doctorId: 1,
            name: 'Dr. Smith',
            specialty: 'Cardiology',
            phone: '+65-6123-4567',
            email: 'dr.smith@clinic.com',
            location: 'Central',
            address: '123 Medical Center',
            rating: 4.8,
            availability_notes: 'Available weekdays'
          },
          {
            doctorId: 2,
            name: 'Dr. Johnson',
            specialty: 'Neurology',
            phone: '+65-6234-5678',
            email: 'dr.johnson@clinic.com',
            location: 'East',
            address: '456 Health Plaza',
            rating: 4.6,
            availability_notes: 'Available weekends'
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.searchDoctors();

      expect(sql.connect).toHaveBeenCalled();
      expect(result).toEqual(mockResult.recordset);
      expect(result).toHaveLength(2);
    });

    it('should search doctors by specialty', async () => {
      const specialty = 'Cardiology';
      const mockResult = {
        recordset: [
          {
            doctorId: 1,
            name: 'Dr. Smith',
            specialty: 'Cardiology',
            location: 'Central',
            rating: 4.8
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.searchDoctors(specialty);

      expect(mockRequest.input).toHaveBeenCalledWith('specialty', 'NVarChar', specialty);
      expect(result[0].specialty).toBe('Cardiology');
    });

    it('should search doctors by location', async () => {
      const location = 'Central';
      const mockResult = {
        recordset: [
          {
            doctorId: 1,
            name: 'Dr. Smith',
            location: 'Central'
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.searchDoctors(null, location);

      expect(mockRequest.input).toHaveBeenCalledWith('location', 'NVarChar', location);
      expect(result[0].location).toBe('Central');
    });

    it('should search doctors by both specialty and location', async () => {
      const specialty = 'Cardiology';
      const location = 'Central';
      const mockResult = {
        recordset: [
          {
            doctorId: 1,
            name: 'Dr. Smith',
            specialty: 'Cardiology',
            location: 'Central'
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.searchDoctors(specialty, location);

      expect(mockRequest.input).toHaveBeenCalledWith('specialty', 'NVarChar', specialty);
      expect(mockRequest.input).toHaveBeenCalledWith('location', 'NVarChar', location);
      expect(result[0].specialty).toBe('Cardiology');
      expect(result[0].location).toBe('Central');
    });

    it('should handle database errors during doctor search', async () => {
      const mockError = new Error('Database search failed');
      mockRequest.query.mockRejectedValue(mockError);

      await expect(Appointment.searchDoctors())
        .rejects.toThrow('Database search failed');
    });
  });

  describe('getDoctorAvailability', () => {
    it('should retrieve doctor availability successfully', async () => {
      const doctorId = 1;
      const date = '2024-02-15';

      const mockResult = {
        recordset: [
          {
            availabilityId: 1,
            doctorId: 1,
            dayOfWeek: 'Monday',
            startTime: '09:00:00',
            endTime: '17:00:00',
            isAvailable: true,
            notes: 'Regular hours'
          },
          {
            availabilityId: 2,
            doctorId: 1,
            dayOfWeek: 'Tuesday',
            startTime: '09:00:00',
            endTime: '17:00:00',
            isAvailable: true,
            notes: 'Regular hours'
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getDoctorAvailability(doctorId, date);

      expect(mockRequest.input).toHaveBeenCalledWith('doctorId', 'Int', doctorId);
      expect(result).toEqual(mockResult.recordset);
    });

    it('should handle no availability found', async () => {
      const doctorId = 999;
      const date = '2024-02-15';

      const mockResult = { recordset: [] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getDoctorAvailability(doctorId, date);

      expect(result).toEqual([]);
    });
  });

  describe('getAppointmentById', () => {
    it('should retrieve specific appointment by ID', async () => {
      const appointmentId = 1;
      const mockResult = {
        recordset: [{
          appointmentId: 1,
          userId: 1,
          doctorId: 2,
          appointmentDate: new Date('2024-02-15T10:00:00Z'),
          duration: 30,
          reason: 'Regular checkup',
          status: 'scheduled',
          notes: 'First visit',
          doctorName: 'Dr. Smith',
          specialty: 'Cardiology'
        }]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getAppointmentById(appointmentId);

      expect(mockRequest.input).toHaveBeenCalledWith('appointmentId', 'Int', appointmentId);
      expect(result).toEqual(mockResult.recordset[0]);
    });

    it('should return null when appointment not found', async () => {
      const appointmentId = 999;
      const mockResult = { recordset: [] };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.getAppointmentById(appointmentId);

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle SQL connection failures', async () => {
      const connectionError = new Error('Cannot connect to database');
      sql.connect.mockRejectedValue(connectionError);

      await expect(Appointment.createAppointment({}))
        .rejects.toThrow('Cannot connect to database');
    });

    it('should handle invalid date formats in createAppointment', async () => {
      const appointmentData = {
        userId: 1,
        doctorId: 2,
        appointmentDate: 'invalid-date',
        reason: 'Test'
      };

      const mockResult = { recordset: [{}] };
      mockRequest.query.mockResolvedValue(mockResult);

      // Should handle invalid date gracefully
      await expect(Appointment.createAppointment(appointmentData))
        .not.toThrow();
    });

    it('should handle null/undefined input parameters', async () => {
      await expect(Appointment.getUserAppointments(null))
        .not.toThrow();

      await expect(Appointment.searchDoctors(undefined, undefined))
        .not.toThrow();
    });

    it('should handle empty update data', async () => {
      const appointmentId = 1;
      const updateData = {};

      const mockResult = {
        recordset: [{
          appointmentId: 1,
          updatedAt: new Date()
        }]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await Appointment.updateAppointment(appointmentId, updateData);

      expect(result).toBeDefined();
      expect(mockRequest.input).toHaveBeenCalledWith('appointmentDate', 'DateTime2', null);
    });
  });

  describe('Appointment Constructor', () => {
    it('should create Appointment instance with all properties', async () => {
      const appointmentData = {
        appointmentId: 1,
        userId: 1,
        doctorId: 2,
        appointmentDate: new Date(),
        duration: 30,
        reason: 'Test',
        status: 'scheduled',
        notes: 'Test notes',
        reminderSent: false,
        followUpNeeded: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const appointment = new Appointment(
        appointmentData.appointmentId,
        appointmentData.userId,
        appointmentData.doctorId,
        appointmentData.appointmentDate,
        appointmentData.duration,
        appointmentData.reason,
        appointmentData.status,
        appointmentData.notes,
        appointmentData.reminderSent,
        appointmentData.followUpNeeded,
        appointmentData.createdAt,
        appointmentData.updatedAt
      );

      expect(appointment.appointmentId).toBe(1);
      expect(appointment.userId).toBe(1);
      expect(appointment.doctorId).toBe(2);
      expect(appointment.duration).toBe(30);
      expect(appointment.reason).toBe('Test');
      expect(appointment.status).toBe('scheduled');
      expect(appointment.followUpNeeded).toBe(true);
    });
  });
});