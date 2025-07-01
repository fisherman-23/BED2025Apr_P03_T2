const db = require('../dbConfig.js');
class HealthController {

    /* creates a new health record with automatic compliance calculation */
    async createHealthRecord(req, res) {
        try {
            const {
                userId, date, bloodPressureSystolic, bloodPressureDiastolic,
                weight, bloodSugar, notes = ''
            } = req.body;

            const query = `
                INSERT INTO HealthRecords (
                    user_id, record_date, blood_pressure_systolic, blood_pressure_diastolic,
                    weight, blood_sugar, notes, created_at, updated_at
                )
                OUTPUT INSERTED.*
                VALUES (
                    @userId, @date, @bloodPressureSystolic, @bloodPressureDiastolic,
                    @weight, @bloodSugar, @notes, GETDATE(), GETDATE()
                )
            `;

            const result = await db.executeQuery(query, {
                userId, date, bloodPressureSystolic, bloodPressureDiastolic,
                weight, bloodSugar, notes
            });

            const complianceScore = await this.calculateDailyComplianceScore(userId, date);
            
            const healthRecord = {
                ...result.recordset[0],
                compliance_score: complianceScore
            };

            res.status(201).json({
                status: 'success',
                message: 'Health record logged successfully',
                data: { healthRecord }
            });

        } catch (error) {
            console.error('Create health record error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to log health record'
            });
        }
    }

    /* retrieves health records for a user with optional date filtering */
    async getHealthRecords(req, res) {
        try {
            const { userId } = req.params;
            const { startDate, endDate, limit = 30 } = req.query;

            let query = `
                SELECT 
                    hr.*,
                    u.name as patient_name,
                    (
                        SELECT STRING_AGG(m.name, ', ')
                        FROM MedicationLogs ml
                        INNER JOIN Medications m ON ml.medication_id = m.medication_id
                        WHERE CAST(ml.taken_at AS DATE) = hr.record_date
                        AND m.user_id = hr.user_id
                        AND ml.missed = 0
                    ) as medications_taken,
                    (
                        SELECT 
                            CASE 
                                WHEN COUNT(*) = 0 THEN 100
                                ELSE (COUNT(CASE WHEN missed = 0 THEN 1 END) * 100 / COUNT(*))
                            END
                        FROM MedicationLogs ml2
                        INNER JOIN Medications m2 ON ml2.medication_id = m2.medication_id
                        WHERE CAST(ml2.taken_at AS DATE) = hr.record_date
                        AND m2.user_id = hr.user_id
                    ) as compliance_score
                FROM HealthRecords hr
                INNER JOIN Users u ON hr.user_id = u.id
               WHERE hr.user_id = @userId
           `;

           const params = { userId };

           if (startDate) {
               query += ` AND hr.record_date >= @startDate`;
               params.startDate = startDate;
           }

           if (endDate) {
               query += ` AND hr.record_date <= @endDate`;
               params.endDate = endDate;
           }

           query += ` ORDER BY hr.record_date DESC`;

           if (limit) {
               query = `SELECT TOP (@limit) * FROM (${query}) as limited_results`;
               params.limit = limit;
           }

           const result = await db.executeQuery(query, params);

           res.status(200).json({
               status: 'success',
               data: {
                   healthRecords: result.recordset,
                   count: result.recordset.length
               }
           });

       } catch (error) {
           console.error('Get health records error:', error);
           res.status(500).json({
               status: 'error',
               message: 'Failed to retrieve health records'
           });
       }
   }

   /* retrieves a single health record by ID */
   async getHealthRecordById(req, res) {
       try {
           const { recordId } = req.params;

           const query = `
               SELECT 
                   hr.*,
                   u.name as patient_name
               FROM HealthRecords hr
               INNER JOIN Users u ON hr.user_id = u.id
               WHERE hr.record_id = @recordId
           `;

           const result = await db.executeQuery(query, { recordId });

           if (result.recordset.length === 0) {
               return res.status(404).json({
                   status: 'error',
                   message: 'Health record not found'
               });
           }

           const healthRecord = result.recordset[0];
           
           // get medications taken on that date
           const medicationsQuery = `
               SELECT m.name
               FROM MedicationLogs ml
               INNER JOIN Medications m ON ml.medication_id = m.medication_id
               WHERE CAST(ml.taken_at AS DATE) = @recordDate
               AND m.user_id = @userId
               AND ml.missed = 0
           `;

           const medicationsResult = await db.executeQuery(medicationsQuery, {
               recordDate: healthRecord.record_date,
               userId: healthRecord.user_id
           });

           healthRecord.medications_taken = medicationsResult.recordset.map(row => row.name);

           res.status(200).json({
               status: 'success',
               data: { healthRecord }
           });

       } catch (error) {
           console.error('Get health record by ID error:', error);
           res.status(500).json({
               status: 'error',
               message: 'Failed to retrieve health record'
           });
       }
   }

   /* updates an existing health record */
   async updateHealthRecord(req, res) {
       try {
           const { recordId } = req.params;
           const updateFields = req.body;

           delete updateFields.recordId;
           delete updateFields.createdAt;
           delete updateFields.userId;

           if (Object.keys(updateFields).length === 0) {
               return res.status(400).json({
                   status: 'error',
                   message: 'No valid fields to update'
               });
           }

           const setClause = Object.keys(updateFields)
               .map(key => `${this.camelToSnake(key)} = @${key}`)
               .join(', ');

           const query = `
               UPDATE HealthRecords 
               SET ${setClause}, updated_at = GETDATE()
               OUTPUT INSERTED.*
               WHERE record_id = @recordId
           `;

           const params = { recordId, ...updateFields };
           const result = await db.executeQuery(query, params);

           if (result.recordset.length === 0) {
               return res.status(404).json({
                   status: 'error',
                   message: 'Health record not found'
               });
           }

           res.status(200).json({
               status: 'success',
               message: 'Health record updated successfully',
               data: { healthRecord: result.recordset[0] }
           });

       } catch (error) {
           console.error('Update health record error:', error);
           res.status(500).json({
               status: 'error',
               message: 'Failed to update health record'
           });
       }
   }

   /* removes a health record */
   async deleteHealthRecord(req, res) {
       try {
           const { recordId } = req.params;

           const query = `
               DELETE FROM HealthRecords 
               OUTPUT DELETED.record_date, DELETED.user_id
               WHERE record_id = @recordId
           `;

           const result = await db.executeQuery(query, { recordId });

           if (result.recordset.length === 0) {
               return res.status(404).json({
                   status: 'error',
                   message: 'Health record not found'
               });
           }

           const { record_date } = result.recordset[0];

           res.status(200).json({
               status: 'success',
               message: `Health record for ${new Date(record_date).toLocaleDateString()} has been removed`
           });

       } catch (error) {
           console.error('Delete health record error:', error);
           res.status(500).json({
               status: 'error',
               message: 'Failed to remove health record'
           });
       }
   }

   /* generates comprehensive health analytics and trends */
   async getHealthAnalytics(req, res) {
       try {
           const { userId } = req.params;
           const { period = '30' } = req.query;

           const query = `
               SELECT 
                   record_date,
                   blood_pressure_systolic,
                   blood_pressure_diastolic,
                   weight,
                   blood_sugar,
                   (
                       SELECT 
                           CASE 
                               WHEN COUNT(*) = 0 THEN 100
                               ELSE (COUNT(CASE WHEN missed = 0 THEN 1 END) * 100 / COUNT(*))
                           END
                       FROM MedicationLogs ml
                       INNER JOIN Medications m ON ml.medication_id = m.medication_id
                       WHERE CAST(ml.taken_at AS DATE) = hr.record_date
                       AND m.user_id = hr.user_id
                   ) as daily_compliance
               FROM HealthRecords hr
               WHERE hr.user_id = @userId
               AND hr.record_date >= DATEADD(day, -@period, GETDATE())
               ORDER BY hr.record_date ASC
           `;

           const result = await db.executeQuery(query, { userId, period: parseInt(period) });

           const records = result.recordset;
           const analytics = this.calculateHealthTrends(records);

           res.status(200).json({
               status: 'success',
               data: {
                   period: `${period} days`,
                   analytics,
                   chartData: records,
                   summary: {
                       totalRecords: records.length,
                       averageCompliance: analytics.averages.compliance,
                       healthAlerts: analytics.alerts
                   }
               }
           });

       } catch (error) {
           console.error('Get health analytics error:', error);
           res.status(500).json({
               status: 'error',
               message: 'Failed to generate health analytics'
           });
       }
   }

   /* helper method to calculate daily compliance score */
   async calculateDailyComplianceScore(userId, date) {
       try {
           const query = `
               SELECT 
                   COUNT(*) as total_doses,
                   COUNT(CASE WHEN ml.missed = 0 THEN 1 END) as taken_doses
               FROM Medications m
               LEFT JOIN MedicationLogs ml ON m.medication_id = ml.medication_id 
                   AND CAST(ml.taken_at AS DATE) = @date
               WHERE m.user_id = @userId AND m.active = 1
           `;

           const result = await db.executeQuery(query, { userId, date });
           const { total_doses, taken_doses } = result.recordset[0];

           if (total_doses === 0) return 100;
           return Math.round((taken_doses / total_doses) * 100);

       } catch (error) {
           console.error('Calculate compliance score error:', error);
           return 0;
       }
   }

   /* helper method to calculate health trends and generate alerts */
   calculateHealthTrends(records) {
       if (records.length === 0) {
           return {
               averages: {},
               trends: {},
               alerts: []
           };
       }

       const validBP = records.filter(r => r.blood_pressure_systolic && r.blood_pressure_diastolic);
       const validWeight = records.filter(r => r.weight);
       const validBS = records.filter(r => r.blood_sugar);
       const validCompliance = records.filter(r => r.daily_compliance !== null);

       const averages = {
           blood_pressure: validBP.length > 0 ? {
               systolic: Math.round(validBP.reduce((sum, r) => sum + r.blood_pressure_systolic, 0) / validBP.length),
               diastolic: Math.round(validBP.reduce((sum, r) => sum + r.blood_pressure_diastolic, 0) / validBP.length)
           } : null,
           weight: validWeight.length > 0 ? 
               Math.round((validWeight.reduce((sum, r) => sum + r.weight, 0) / validWeight.length) * 10) / 10 : null,
           blood_sugar: validBS.length > 0 ? 
               Math.round(validBS.reduce((sum, r) => sum + r.blood_sugar, 0) / validBS.length) : null,
           compliance: validCompliance.length > 0 ? 
               Math.round(validCompliance.reduce((sum, r) => sum + r.daily_compliance, 0) / validCompliance.length) : null
       };

       const midpoint = Math.floor(records.length / 2);
       const firstHalf = records.slice(0, midpoint);
       const secondHalf = records.slice(midpoint);

       const trends = {};
       const alerts = [];

       // blood pressure trend analysis
       if (validBP.length >= 4) {
           const firstHalfBP = firstHalf.filter(r => r.blood_pressure_systolic);
           const secondHalfBP = secondHalf.filter(r => r.blood_pressure_systolic);
           
           if (firstHalfBP.length > 0 && secondHalfBP.length > 0) {
               const firstAvg = firstHalfBP.reduce((sum, r) => sum + r.blood_pressure_systolic, 0) / firstHalfBP.length;
               const secondAvg = secondHalfBP.reduce((sum, r) => sum + r.blood_pressure_systolic, 0) / secondHalfBP.length;
               
               trends.blood_pressure = secondAvg > firstAvg ? 'increasing' : 'decreasing';
               
               if (averages.blood_pressure.systolic > 140 || averages.blood_pressure.diastolic > 90) {
                   alerts.push({
                       type: 'blood_pressure',
                       message: 'Average blood pressure is elevated. Consider consulting your doctor.',
                       severity: 'high',
                       recommendation: 'Schedule appointment with cardiologist'
                   });
               }
           }
       }

       // medication compliance analysis
       if (validCompliance.length > 0) {
           const avgCompliance = averages.compliance;
           
           if (avgCompliance < 70) {
               alerts.push({
                   type: 'compliance',
                   message: 'Medication compliance is critically low. Emergency contacts will be notified immediately.',
                   severity: 'critical',
                   recommendation: 'Contact primary care physician immediately'
               });
           } else if (avgCompliance < 80) {
               alerts.push({
                   type: 'compliance',
                   message: 'Medication compliance is below target. Emergency contacts will be notified.',
                   severity: 'high',
                   recommendation: 'Review medication schedule with caregiver'
               });
           } else if (avgCompliance < 90) {
               alerts.push({
                   type: 'compliance',
                   message: 'Medication compliance could be improved.',
                   severity: 'medium',
                   recommendation: 'Consider medication reminder adjustments'
               });
           }
       }

       return { averages, trends, alerts };
   }

   camelToSnake(str) {
       return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
   }
}

module.exports = new HealthController();