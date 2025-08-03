const sql = require("mssql");
const config = require("../dbConfig");

class CaregiverController {
  // gets real-time medication compliance dashboard for caregiver's family member
  async getCaregiverDashboard(req, res) {
    try {
      const { patientId } = req.params;

      // verify caregiver relationship
      const relationshipQuery = `
                SELECT cr.*, u.firstName, u.lastName 
                FROM CaregiverRelationships cr
                JOIN Users u ON u.ID = cr.patientId
                WHERE cr.caregiverId = @caregiverId AND cr.patientId = @patientId
            `;

      const pool = await sql.connect(config);
      const relationshipResult = await pool
        .request()
        .input("caregiverId", sql.Int, req.user.id)
        .input("patientId", sql.Int, patientId)
        .query(relationshipQuery);

      if (relationshipResult.recordset.length === 0) {
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You are not authorized to view this patient's data.",
        });
      }

      // get medication compliance data
      const complianceQuery = `
                SELECT 
                    m.medicationId,
                    m.medicationName,
                    m.dosage,
                    m.frequency,
                    COUNT(ml.logId) as totalDoses,
                    COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                    COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses
                FROM Medications m
                LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                WHERE m.userId = @patientId AND m.active = 1
                GROUP BY m.medicationId, m.medicationName, m.dosage, m.frequency
            `;

      const complianceResult = await pool
        .request()
        .input("patientId", sql.Int, patientId)
        .query(complianceQuery);

      // get recent missed medications (last 24 hours)
      const missedQuery = `
                SELECT 
                    m.medicationName,
                    ml.scheduledTime,
                    DATEDIFF(HOUR, ml.scheduledTime, GETDATE()) as hoursOverdue
                FROM MedicationLogs ml
                JOIN Medications m ON ml.medicationId = m.medicationId
                WHERE m.userId = @patientId 
                AND ml.taken = 0 
                AND ml.scheduledTime < GETDATE()
                AND ml.scheduledTime > DATEADD(DAY, -1, GETDATE())
                ORDER BY ml.scheduledTime DESC
            `;

      const missedResult = await pool
        .request()
        .input("patientId", sql.Int, patientId)
        .query(missedQuery);

      // calculate overall compliance rate
      const totalExpected = complianceResult.recordset.reduce(
        (sum, med) => sum + med.totalDoses,
        0
      );
      const totalTaken = complianceResult.recordset.reduce(
        (sum, med) => sum + med.takenDoses,
        0
      );
      const overallCompliance =
        totalExpected > 0
          ? Math.round((totalTaken / totalExpected) * 100)
          : 100;

      res.status(200).json({
        status: "success",
        data: {
          patientInfo: relationshipResult.recordset[0],
          overallCompliance,
          medications: complianceResult.recordset.map((med) => ({
            ...med,
            complianceRate:
              med.totalDoses > 0
                ? Math.round((med.takenDoses / med.totalDoses) * 100)
                : 100,
          })),
          recentMissed: missedResult.recordset,
        },
      });
    } catch (error) {
      console.error("Error fetching caregiver dashboard:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve caregiver dashboard",
        error: error.message,
      });
    }
  }

  // gets medication adherence reports for specified time periods
  async getAdherenceReports(req, res) {
    try {
      const { patientId } = req.params;
      const { period = "weekly", format = "json" } = req.query; // Add format parameter

      // verify caregiver relationship
      const relationshipQuery = `
              SELECT cr.*, u.firstName, u.lastName, u.email 
              FROM CaregiverRelationships cr
              JOIN Users u ON u.ID = cr.patientId
              WHERE caregiverId = @caregiverId AND patientId = @patientId
          `;

      const pool = await sql.connect(config);
      const relationshipResult = await pool
        .request()
        .input("caregiverId", sql.Int, req.user.id)
        .input("patientId", sql.Int, patientId)
        .query(relationshipQuery);

      if (relationshipResult.recordset.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "Access denied.",
        });
      }

      let dateFormat, dateInterval;
      switch (period) {
        case "daily":
          dateFormat = "YYYY-MM-DD";
          dateInterval = "DAY";
          break;
        case "monthly":
          dateFormat = "YYYY-MM";
          dateInterval = "MONTH";
          break;
        default: // weekly
          dateFormat = "YYYY-\\WW";
          dateInterval = "WEEK";
      }

      const adherenceQuery = `
              SELECT 
                  FORMAT(ml.scheduledTime, '${dateFormat}') as period,
                  COUNT(*) as totalDoses,
                  COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                  ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as adherenceRate
              FROM MedicationLogs ml
              JOIN Medications m ON ml.medicationId = m.medicationId
              WHERE m.userId = @patientId 
              AND ml.scheduledTime >= DATEADD(${dateInterval}, -12, GETDATE())
              GROUP BY FORMAT(ml.scheduledTime, '${dateFormat}')
              ORDER BY period DESC
          `;

      const adherenceResult = await pool
        .request()
        .input("patientId", sql.Int, patientId)
        .query(adherenceQuery);

      // Get detailed medication data for PDF
      const medicationQuery = `
              SELECT 
                  m.medicationName,
                  m.dosage,
                  m.frequency,
                  COUNT(ml.logId) as totalDoses,
                  COUNT(CASE WHEN ml.taken = 1 THEN 1 END) as takenDoses,
                  COUNT(CASE WHEN ml.taken = 0 AND ml.scheduledTime < GETDATE() THEN 1 END) as missedDoses,
                  ROUND(COUNT(CASE WHEN ml.taken = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(ml.logId), 0), 2) as adherenceRate
              FROM Medications m
              LEFT JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                  AND ml.scheduledTime >= DATEADD(${dateInterval}, -12, GETDATE())
              WHERE m.userId = @patientId AND m.active = 1
              GROUP BY m.medicationId, m.medicationName, m.dosage, m.frequency
              ORDER BY adherenceRate DESC
          `;

      const medicationResult = await pool
        .request()
        .input("patientId", sql.Int, patientId)
        .query(medicationQuery);

      // Calculate overall compliance
      const totalDoses = medicationResult.recordset.reduce((sum, med) => sum + (med.totalDoses || 0), 0);
      const takenDoses = medicationResult.recordset.reduce((sum, med) => sum + (med.takenDoses || 0), 0);
      const overallCompliance = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      const reportData = {
        period,
        adherenceData: adherenceResult.recordset,
        patientInfo: relationshipResult.recordset[0],
        medications: medicationResult.recordset,
        summary: {
          totalMedications: medicationResult.recordset.length,
          overallCompliance,
          totalDoses,
          takenDoses,
          missedDoses: totalDoses - takenDoses
        },
        generatedAt: new Date(),
        caregiverInfo: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          relationship: relationshipResult.recordset[0].relationship
        }
      };

      // Handle PDF generation
      if (format === 'pdf') {
        try {
          const pdfGenerator = require('../utils/pdfGenerator');
          
          // Format data for PDF generator
          const pdfReportData = {
            caregiverInfo: reportData.caregiverInfo,
            patients: [{
              firstName: reportData.patientInfo.firstName,
              lastName: reportData.patientInfo.lastName,
              email: reportData.patientInfo.email,
              overallCompliance: reportData.summary.overallCompliance,
              activeMedications: reportData.summary.totalMedications,
              medications: reportData.medications,
              reportPeriod: period,
              generatedAt: new Date()
            }]
          };
          
          const pdfPath = await pdfGenerator.generateCaregiverReport(pdfReportData);
          
          // Send PDF file
          res.download(pdfPath, `patient_${patientId}_adherence_report_${period}_${Date.now()}.pdf`, (err) => {
            if (err) {
              console.error('Error sending PDF:', err);
              res.status(500).json({ 
                status: 'error', 
                message: 'Failed to send PDF report',
                error: err.message 
              });
            }
            // Optionally delete temporary file after download
            // fs.unlinkSync(pdfPath);
          });
          
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          // Fallback to JSON if PDF generation fails
          res.status(500).json({
            status: 'error',
            message: 'PDF generation failed, returning JSON data',
            data: reportData,
            error: pdfError.message
          });
        }
      } else {
        // Return JSON data
        res.status(200).json({
          status: "success",
          data: reportData,
        });
      }
      
    } catch (error) {
      console.error("Error fetching adherence reports:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve adherence reports",
        error: error.message,
      });
    }
  }

  // sends SMS/email alerts for missed medications
  async sendMissedMedicationAlert(req, res) {
    try {
      const { patientId, medicationId } = req.body;

      // verify caregiver relationship
      const relationshipQuery = `
                SELECT cr.*, u.firstName, u.lastName, u.email, u.phoneNumber
                FROM CaregiverRelationships cr
                JOIN Users u ON u.ID = cr.patientId
                WHERE cr.caregiverId = @caregiverId AND cr.patientId = @patientId
            `;

      const pool = await sql.connect(config);
      const relationshipResult = await pool
        .request()
        .input("caregiverId", sql.Int, req.user.id)
        .input("patientId", sql.Int, patientId)
        .query(relationshipQuery);

      if (relationshipResult.recordset.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "Access denied.",
        });
      }

      // get medication details
      const medicationQuery = `
                SELECT medicationName, dosage, scheduledTime
                FROM Medications m
                JOIN MedicationLogs ml ON m.medicationId = ml.medicationId
                WHERE m.medicationId = @medicationId AND ml.taken = 0
                ORDER BY ml.scheduledTime DESC
            `;

      const medicationResult = await pool
        .request()
        .input("medicationId", sql.Int, medicationId)
        .query(medicationQuery);

      if (medicationResult.recordset.length > 0) {
        const medication = medicationResult.recordset[0];
        const patient = relationshipResult.recordset[0];

        // log alert in database
        const alertQuery = `
                    INSERT INTO CaregiverAlerts (caregiverId, patientId, medicationId, alertType, alertMessage, sentAt)
                    VALUES (@caregiverId, @patientId, @medicationId, 'missed_medication', @message, GETDATE())
                `;

        const alertMessage = `MEDICATION ALERT: ${patient.firstName} ${patient.lastName} has missed their ${medication.medicationName} (${medication.dosage}) scheduled for ${new Date(medication.scheduledTime).toLocaleString()}.`;

        await pool
          .request()
          .input("caregiverId", sql.Int, req.user.id)
          .input("patientId", sql.Int, patientId)
          .input("medicationId", sql.Int, medicationId)
          .input("message", sql.NVarChar, alertMessage)
          .query(alertQuery);

        console.log("Alert sent:", alertMessage);

        res.status(200).json({
          status: "success",
          message: "Alert sent successfully",
          data: { alertMessage },
        });
      } else {
        res.status(404).json({
          status: "error",
          message: "No missed medications found for this medication ID",
        });
      }
    } catch (error) {
      console.error("Error sending missed medication alert:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to send alert",
        error: error.message,
      });
    }
  }

  // gets list of patients under caregiver's care
  async getCaregiverPatients(req, res) {
    console.log("Fetching caregiver patients for user ID:", req.user.id);
    try {
      const patientsQuery = `
                SELECT 
                    cr.patientId,
                    u.firstName,
                    u.lastName,
                    u.email,
                    cr.relationship,
                    cr.accessLevel,
                    cr.createdAt
                FROM CaregiverRelationships cr
                JOIN Users u ON u.ID = cr.patientId
                WHERE cr.caregiverId = @caregiverId
                ORDER BY u.firstName, u.lastName
            `;

      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("caregiverId", sql.Int, req.user.id)
        .query(patientsQuery);

      const patients = result.recordset || []; // Handle undefined/null recordset
      console.log(patients);

      res.status(200).json({
        status: "success",
        data: { patients },
      });
    } catch (error) {
      console.error("Error fetching caregiver patients:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve patients",
        error: error.message,
      });
    }
  }

  // adds a new caregiver relationship
  async addCaregiverRelationship(req, res) {
    try {
      const {
        patientEmail,
        relationship,
        accessLevel = "monitoring",
      } = req.body;

      // find patient by email
      const patientQuery = `
                SELECT ID, firstName, lastName FROM Users WHERE email = @email
            `;

      const pool = await sql.connect(config);
      const patientResult = await pool
        .request()
        .input("email", sql.NVarChar, patientEmail)
        .query(patientQuery);

      if (patientResult.recordset.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Patient not found with this email address",
        });
      }

      const patient = patientResult.recordset[0];

      // check if relationship already exists
      const existingQuery = `
                SELECT 1 FROM CaregiverRelationships 
                WHERE caregiverId = @caregiverId AND patientId = @patientId
            `;

      const existingResult = await pool
        .request()
        .input("caregiverId", sql.Int, req.user.id)
        .input("patientId", sql.Int, patient.ID)
        .query(existingQuery);

      if (existingResult.recordset.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Caregiver relationship already exists",
        });
      }

      // create new relationship
      const insertQuery = `
                INSERT INTO CaregiverRelationships (caregiverId, patientId, relationship, accessLevel, createdAt)
                VALUES (@caregiverId, @patientId, @relationship, @accessLevel, GETDATE())
            `;

      await pool
        .request()
        .input("caregiverId", sql.Int, req.user.id)
        .input("patientId", sql.Int, patient.ID)
        .input("relationship", sql.NVarChar, relationship)
        .input("accessLevel", sql.NVarChar, accessLevel)
        .query(insertQuery);

      res.status(201).json({
        status: "success",
        message: "Caregiver relationship added successfully",
        data: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          relationship,
          accessLevel,
        },
      });
    } catch (error) {
      console.error("Error adding caregiver relationship:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to add caregiver relationship",
        error: error.message,
      });
    }
  }
}

module.exports = new CaregiverController();