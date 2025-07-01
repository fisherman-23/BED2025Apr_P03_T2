const request = require('supertest');
const app = require('../app');
const EmergencyContact = require('../models/emergencyContactModel');

// mock the emergency contact model
jest.mock('../models/emergencyContactModel');

describe('Emergency Contact Controller', () => {
    let authToken;
    const mockUser = { id: 1, email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        authToken = 'mock-jwt-token';
    });

    describe('POST /api/emergency-contacts', () => {
        test('should create a new emergency contact successfully', async () => {
            const mockContact = {
                contactId: 1,
                userId: 1,
                name: 'John Doe',
                relationship: 'Son',
                phone: '+65 9123-4567',
                email: 'john@example.com',
                isPrimary: true,
                alertOnMissedMeds: true,
                alertThresholdHours: 2
            };

            const contactData = {
                name: 'John Doe',
                relationship: 'Son',
                phone: '+65 9123-4567',
                email: 'john@example.com',
                isPrimary: true
            };

            EmergencyContact.createEmergencyContact.mockResolvedValue(mockContact);

            const response = await request(app)
                .post('/api/emergency-contacts')
                .set('Cookie', [`token=${authToken}`])
                .send(contactData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Emergency contact created successfully');
            expect(response.body.contact).toEqual(mockContact);
            expect(EmergencyContact.createEmergencyContact).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.id,
                    name: contactData.name,
                    relationship: contactData.relationship,
                    phone: contactData.phone
                })
            );
        });

        test('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/emergency-contacts')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'John Doe'
                    // missing relationship and phone
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required fields');
        });

        test('should return 400 for invalid phone number', async () => {
            const response = await request(app)
                .post('/api/emergency-contacts')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'John Doe',
                    relationship: 'Son',
                    phone: 'invalid-phone'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid phone number format');
        });

        test('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/api/emergency-contacts')
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'John Doe',
                    relationship: 'Son',
                    phone: '+65 9123-4567',
                    email: 'invalid-email'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid email format');
        });
    });

    describe('GET /api/emergency-contacts', () => {
        test('should get all emergency contacts for user', async () => {
            const mockContacts = [
                {
                    contactId: 1,
                    name: 'John Doe',
                    relationship: 'Son',
                    phone: '+65 9123-4567',
                    isPrimary: true
                },
                {
                    contactId: 2,
                    name: 'Jane Doe',
                    relationship: 'Daughter',
                    phone: '+65 9876-5432',
                    isPrimary: false
                }
            ];

            EmergencyContact.getEmergencyContactsByUserId.mockResolvedValue(mockContacts);

            const response = await request(app)
                .get('/api/emergency-contacts')
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Emergency contacts retrieved successfully');
            expect(response.body.contacts).toEqual(mockContacts);
            expect(EmergencyContact.getEmergencyContactsByUserId).toHaveBeenCalledWith(mockUser.id);
        });
    });

    describe('PUT /api/emergency-contacts/:id', () => {
        test('should update emergency contact successfully', async () => {
            const contactId = 1;
            const existingContact = {
                contactId,
                userId: mockUser.id,
                name: 'John Doe',
                relationship: 'Son',
                phone: '+65 9123-4567',
                isPrimary: false
            };

            const updateData = {
                name: 'John Smith',
                relationship: 'Son',
                phone: '+65 9999-8888',
                email: 'john.smith@example.com',
                isPrimary: true,
                alertOnMissedMeds: true,
                alertThresholdHours: 1
            };

            EmergencyContact.getEmergencyContactById.mockResolvedValue(existingContact);
            EmergencyContact.updateEmergencyContact.mockResolvedValue(true);
            EmergencyContact.getEmergencyContactById.mockResolvedValueOnce(existingContact)
                .mockResolvedValueOnce({ ...existingContact, ...updateData });

            const response = await request(app)
                .put(`/api/emergency-contacts/${contactId}`)
                .set('Cookie', [`token=${authToken}`])
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Emergency contact updated successfully');
            expect(EmergencyContact.updateEmergencyContact).toHaveBeenCalledWith(
                contactId,
                expect.objectContaining(updateData)
            );
        });

        test('should return 404 for non-existent contact', async () => {
            const contactId = 999;
            EmergencyContact.getEmergencyContactById.mockResolvedValue(null);

            const response = await request(app)
                .put(`/api/emergency-contacts/${contactId}`)
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'Test',
                    relationship: 'Friend',
                    phone: '+65 1234-5678'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Emergency contact not found');
        });

        test('should return 403 for unauthorized contact access', async () => {
            const contactId = 1;
            const otherUserContact = {
                contactId,
                userId: 999, // different user
                name: 'John Doe'
            };

            EmergencyContact.getEmergencyContactById.mockResolvedValue(otherUserContact);

            const response = await request(app)
                .put(`/api/emergency-contacts/${contactId}`)
                .set('Cookie', [`token=${authToken}`])
                .send({
                    name: 'Test',
                    relationship: 'Friend',
                    phone: '+65 1234-5678'
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('DELETE /api/emergency-contacts/:id', () => {
        test('should delete emergency contact successfully', async () => {
            const contactId = 1;
            const contact = {
                contactId,
                userId: mockUser.id,
                name: 'John Doe'
            };

            EmergencyContact.getEmergencyContactById.mockResolvedValue(contact);
            EmergencyContact.deleteEmergencyContact.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/emergency-contacts/${contactId}`)
                .set('Cookie', [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Emergency contact deleted successfully');
            expect(EmergencyContact.deleteEmergencyContact).toHaveBeenCalledWith(contactId);
        });
    });
});