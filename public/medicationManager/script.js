// global variables
let currentUser = null;
let currentTab = "dashboard";
let medications = [];
let appointments = [];
let emergencyContacts = [];
let healthData = [];
let doctors = [];

// API base URL
const API_BASE = "http://localhost:3000/api";

// initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  checkAuthStatus();
});

/* initialize the application */
function initializeApp() {
  // set today's date as default for date inputs
  const today = new Date().toISOString().split("T")[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach((input) => {
    if (input.id === "medStartDate" || input.id === "healthDate") {
      input.value = today;
    }
    if (input.id === "appointmentDate") {
      input.min = today;
    }
  });

  // load initial data
  loadDashboardData();
}

/* setup event listeners */
function setupEventListeners() {
  // tab navigation
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      switchTab(this.dataset.tab);
    });
  });

  // form submissions
  document
    .getElementById("addMedicationForm")
    .addEventListener("submit", handleAddMedication);
  document
    .getElementById("addAppointmentForm")
    .addEventListener("submit", handleAddAppointment);
  document
    .getElementById("addContactForm")
    .addEventListener("submit", handleAddContact);
  document
    .getElementById("addHealthDataForm")
    .addEventListener("submit", handleAddHealthData);

  // modal close events
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });

  // keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });
}

/* check authentication status */
async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      document.getElementById("userName").textContent =
        `Welcome, ${currentUser.name}`;
    } else {
      // redirect to login if not authenticated
      window.location.href = "/login.html";
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    showToast("Authentication error. Please login again.", "error");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 2000);
  }
}

/* switch between tabs */
function switchTab(tabName) {
  // update active tab button
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

  // update active tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(tabName).classList.add("active");

  currentTab = tabName;

  // load tab-specific data
  switch (tabName) {
    case "dashboard":
      loadDashboardData();
      break;
    case "medications":
      loadMedications();
      break;
    case "appointments":
      loadAppointments();
      loadDoctors();
      break;
    case "emergency":
      loadEmergencyContacts();
      break;
    case "health":
      loadHealthData();
      loadHealthStatistics();
      break;
  }
}

/* load dashboard data */
async function loadDashboardData() {
  try {
    showLoading();

    // load all data for dashboard
    await Promise.all([
      loadMedications(true),
      loadAppointments(true),
      loadEmergencyContacts(true),
      loadHealthStatistics(true),
    ]);

    updateDashboardStats();
    updateTodayMedications();
    updateUpcomingAppointments();

    hideLoading();
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showToast("Error loading dashboard data", "error");
    hideLoading();
  }
}

/* update dashboard statistics */
function updateDashboardStats() {
  const activeMeds = medications.filter((med) => med.active).length;
  const upcomingAppts = appointments.filter(
    (appt) =>
      new Date(appt.appointmentDate) > new Date() && appt.status === "scheduled"
  ).length;
  const totalContacts = emergencyContacts.length;

  // calculate average compliance rate
  const avgCompliance =
    medications.length > 0
      ? Math.round(
          medications.reduce((sum, med) => sum + (med.complianceRate || 0), 0) /
            medications.length
        )
      : 0;

  document.getElementById("activeMedications").textContent = activeMeds;
  document.getElementById("upcomingAppointments").textContent = upcomingAppts;
  document.getElementById("emergencyContacts").textContent = totalContacts;
  document.getElementById("complianceRate").textContent = `${avgCompliance}%`;
}

/* update today's medications section */
function updateTodayMedications() {
  const container = document.getElementById("todayMedications");
  const activeMeds = medications.filter((med) => med.active).slice(0, 3);

  if (activeMeds.length === 0) {
    container.innerHTML = '<p class="empty-state">No active medications</p>';
    return;
  }

  container.innerHTML = activeMeds
    .map(
      (med) => `
        <div class="medication-summary">
            <div class="med-summary-info">
                <h4>${med.name}</h4>
                <p>${med.dosage} - ${med.frequency}</p>
                <p class="next-time">Next: ${med.timing}</p>
            </div>
            <button class="btn-success" onclick="markMedicationTaken(${med.medicationId})">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `
    )
    .join("");
}

/* update upcoming appointments section */
function updateUpcomingAppointments() {
  const container = document.getElementById("upcomingAppointmentsList");
  const upcoming = appointments
    .filter(
      (appt) =>
        new Date(appt.appointmentDate) > new Date() &&
        appt.status === "scheduled"
    )
    .slice(0, 2);

  if (upcoming.length === 0) {
    container.innerHTML = '<p class="empty-state">No upcoming appointments</p>';
    return;
  }

  container.innerHTML = upcoming
    .map(
      (appt) => `
        <div class="appointment-summary">
            <div class="appt-summary-info">
                <h4>${appt.doctorName}</h4>
                <p>${appt.specialty}</p>
                <p class="appt-date">${formatDateTime(appt.appointmentDate)}</p>
            </div>
            <div class="appt-summary-actions">
                <button class="action-btn" onclick="showOnMap('${appt.address}')" title="Show on map">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

/* load medications */
async function loadMedications(silent = false) {
  try {
    if (!silent) showLoading();

    const response = await fetchWithAuth(`${API_BASE}/medications`);
    const data = await response.json();

    if (response.ok) {
      medications = data.medications;
      if (currentTab === "medications") {
        renderMedications();
      }
    } else {
      throw new Error(data.error || "Failed to load medications");
    }

    if (!silent) hideLoading();
  } catch (error) {
    console.error("Error loading medications:", error);
    if (!silent) {
      showToast("Error loading medications", "error");
      hideLoading();
    }
  }
}

/* render medications list */
function renderMedications() {
  const container = document.getElementById("medicationsList");

  if (medications.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pills"></i>
                <h3>No medications added yet</h3>
                <p>Add your first medication to get started with tracking</p>
                <button class="btn-primary" onclick="showAddMedicationModal()">
                    <i class="fas fa-plus"></i>
                    Add Medication
                </button>
            </div>
        `;
    return;
  }

  container.innerHTML = medications
    .map(
      (med) => `
        <div class="medication-card">
            <div class="medication-header">
                <div class="medication-info">
                    <h4>${med.name}</h4>
                    <div class="dosage">${med.dosage}</div>
                    <div class="prescriber">Prescribed by: ${med.prescribedBy || "Not specified"}</div>
                </div>
                <div class="medication-actions">
                    <button class="action-btn qr" onclick="showQRCode(${med.medicationId})" title="Show QR Code">
                        <i class="fas fa-qrcode"></i>
                    </button>
                    <button class="action-btn edit" onclick="editMedication(${med.medicationId})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteMedication(${med.medicationId})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="medication-details">
                <div class="detail-row">
                    <span class="detail-label">Frequency:</span>
                    <span class="detail-value">${med.frequency}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Timing:</span>
                    <span class="detail-value">${med.timing}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${med.category || "General"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Compliance Rate:</span>
                    <span class="detail-value">
                        <div class="compliance-bar">
                            <div class="compliance-fill ${getComplianceClass(med.complianceRate)}" 
                                 style="width: ${med.complianceRate || 0}%"></div>
                        </div>
                        ${med.complianceRate || 0}%
                    </span>
                </div>
            </div>

            ${
              med.instructions
                ? `
                <div class="medication-instructions">
                    <strong>Instructions:</strong> ${med.instructions}
                </div>
            `
                : ""
            }

            ${
              med.nextDose
                ? `
                <div class="next-dose">
                    <i class="fas fa-clock"></i>
                    <span>Next dose: ${formatDateTime(med.nextDose)}</span>
                </div>
            `
                : ""
            }

            <button class="take-medication-btn" onclick="markMedicationTaken(${med.medicationId})">
                <i class="fas fa-check"></i>
                Mark as Taken
            </button>
        </div>
    `
    )
    .join("");
}

/* get compliance rate CSS class */
function getComplianceClass(rate) {
  if (rate >= 90) return "high";
  if (rate >= 70) return "medium";
  return "low";
}

/* load appointments */
async function loadAppointments(silent = false) {
  try {
    if (!silent) showLoading();

    const response = await fetchWithAuth(`${API_BASE}/appointments`);
    const data = await response.json();

    if (response.ok) {
      appointments = data.appointments;
      if (currentTab === "appointments") {
        renderAppointments();
      }
    } else {
      throw new Error(data.error || "Failed to load appointments");
    }

    if (!silent) hideLoading();
  } catch (error) {
    console.error("Error loading appointments:", error);
    if (!silent) {
      showToast("Error loading appointments", "error");
      hideLoading();
    }
  }
}

/* render appointments list */
function renderAppointments() {
  const container = document.getElementById("appointmentsList");

  if (appointments.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No appointments scheduled</h3>
                <p>Book your first appointment with a healthcare provider</p>
                <button class="btn-primary" onclick="showAddAppointmentModal()">
                    <i class="fas fa-plus"></i>
                    Book Appointment
                </button>
            </div>
        `;
    return;
  }

  container.innerHTML = appointments
    .map(
      (appt) => `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="doctor-info">
                    <h4>${appt.doctorName}</h4>
                    <div class="specialty">${appt.specialty}</div>
                </div>
                <div class="appointment-actions">
                    <button class="action-btn" onclick="showOnMap('${appt.address}')" title="Show on map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn edit" onclick="editAppointment(${appt.appointmentId})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteAppointment(${appt.appointmentId})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="appointment-datetime">
                <div class="appointment-date">${formatDate(appt.appointmentDate)}</div>
                <div class="appointment-time">${formatTime(appt.appointmentDate)}</div>
            </div>

            <div class="appointment-reason">
                <div class="reason-label">Reason for visit:</div>
                <div>${appt.reason}</div>
            </div>

            <div class="appointment-location">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <div>${appt.location}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">${appt.address}</div>
                </div>
            </div>

            ${
              appt.notes
                ? `
                <div class="appointment-notes">
                    <strong>Notes:</strong> ${appt.notes}
                </div>
            `
                : ""
            }

            <div class="appointment-footer">
                <span class="status-badge status-${appt.status}">${appt.status}</span>
                <div class="appointment-contact">
                    <i class="fas fa-phone"></i>
                    ${appt.doctorPhone}
                </div>
            </div>

            ${
              appt.followUpNeeded
                ? `
                <div class="follow-up-notice">
                    <i class="fas fa-info-circle"></i>
                    Follow-up appointment may be needed
                </div>
            `
                : ""
            }
        </div>
    `
    )
    .join("");
}

/* load doctors list */
async function loadDoctors() {
  try {
    const response = await fetchWithAuth(
      `${API_BASE}/appointments/doctors/all`
    );
    const data = await response.json();

    if (response.ok) {
      doctors = data.doctors;
      populateDoctorSelect();
    } else {
      throw new Error(data.error || "Failed to load doctors");
    }
  } catch (error) {
    console.error("Error loading doctors:", error);
    showToast("Error loading doctors list", "error");
  }
}

/* populate doctor select dropdown */
function populateDoctorSelect() {
  const select = document.getElementById("appointmentDoctor");

  select.innerHTML =
    '<option value="">Select a doctor</option>' +
    doctors
      .map(
        (doctor) => `
            <option value="${doctor.doctorId}">
                ${doctor.name} - ${doctor.specialty} (Rating: ${doctor.rating})
            </option>
        `
      )
      .join("");
}

/* load emergency contacts */
async function loadEmergencyContacts(silent = false) {
  try {
    if (!silent) showLoading();

    const response = await fetchWithAuth(`${API_BASE}/emergency-contacts`);
    const data = await response.json();

    if (response.ok) {
      emergencyContacts = data.contacts;
      if (currentTab === "emergency") {
        renderEmergencyContacts();
      }
    } else {
      throw new Error(data.error || "Failed to load emergency contacts");
    }

    if (!silent) hideLoading();
  } catch (error) {
    console.error("Error loading emergency contacts:", error);
    if (!silent) {
      showToast("Error loading emergency contacts", "error");
      hideLoading();
    }
  }
}

/* render emergency contacts list */
function renderEmergencyContacts() {
  const container = document.getElementById("emergencyContactsList");

  if (emergencyContacts.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No emergency contacts added</h3>
                <p>Add family members or caregivers who should be notified in case of emergencies</p>
                <button class="btn-primary" onclick="showAddContactModal()">
                    <i class="fas fa-plus"></i>
                    Add Contact
                </button>
            </div>
        `;
    return;
  }

  container.innerHTML = emergencyContacts
    .map(
      (contact) => `
        <div class="contact-card ${contact.isPrimary ? "primary" : ""}">
            <div class="contact-header">
                <div class="contact-info">
                    <h4>${contact.name}</h4>
                    <div class="relationship">${contact.relationship}</div>
                    ${contact.isPrimary ? '<span class="primary-badge">Primary Contact</span>' : ""}
                </div>
                <div class="contact-actions">
                    <button class="action-btn edit" onclick="editContact(${contact.contactId})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteContact(${contact.contactId})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="contact-details">
                <div class="contact-detail">
                    <i class="fas fa-phone"></i>
                    <span>${contact.phone}</span>
                </div>
                ${
                  contact.email
                    ? `
                    <div class="contact-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${contact.email}</span>
                    </div>
                `
                    : ""
                }
            </div>

            <div class="alert-settings">
                <div class="alert-setting">
                    <span>Medication alerts:</span>
                    <span class="alert-status ${contact.alertOnMissedMeds ? "alert-active" : "alert-disabled"}">
                        ${contact.alertOnMissedMeds ? "Active" : "Disabled"}
                    </span>
                </div>
                ${
                  contact.alertOnMissedMeds
                    ? `
                    <div class="alert-setting">
                        <span>Alert threshold:</span>
                        <span>${contact.alertThresholdHours} hours</span>
                    </div>
                `
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");
}

/* load health data */
async function loadHealthData(silent = false) {
  try {
    if (!silent) showLoading();

    const response = await fetchWithAuth(`${API_BASE}/health-data?limit=20`);
    const data = await response.json();

    if (response.ok) {
      healthData = data.healthData;
      if (currentTab === "health") {
        renderHealthData();
      }
    } else {
      throw new Error(data.error || "Failed to load health data");
    }

    if (!silent) hideLoading();
  } catch (error) {
    console.error("Error loading health data:", error);
    if (!silent) {
      showToast("Error loading health data", "error");
      hideLoading();
    }
  }
}

/* load health statistics */
async function loadHealthStatistics(silent = false) {
  try {
    const response = await fetchWithAuth(`${API_BASE}/health-data/statistics`);
    const data = await response.json();

    if (response.ok) {
      if (currentTab === "health") {
        renderHealthStatistics(data.statistics);
      }
    } else {
      throw new Error(data.error || "Failed to load health statistics");
    }
  } catch (error) {
    console.error("Error loading health statistics:", error);
    if (!silent) {
      showToast("Error loading health statistics", "error");
    }
  }
}

/* render health statistics */
function renderHealthStatistics(stats) {
  const container = document.getElementById("healthStatistics");

  if (!stats || stats.recordCount === 0) {
    container.innerHTML =
      '<p class="empty-state">No health data available for statistics</p>';
    return;
  }

  container.innerHTML = `
        <div class="health-stat">
            <div class="health-stat-value">${Math.round(stats.avgSystolic || 0)}</div>
            <div class="health-stat-label">Avg Systolic BP</div>
        </div>
        <div class="health-stat">
            <div class="health-stat-value">${Math.round(stats.avgDiastolic || 0)}</div>
            <div class="health-stat-label">Avg Diastolic BP</div>
        </div>
        <div class="health-stat">
            <div class="health-stat-value">${stats.avgWeight ? stats.avgWeight.toFixed(1) : "N/A"}</div>
            <div class="health-stat-label">Avg Weight (kg)</div>
        </div>
        <div class="health-stat">
            <div class="health-stat-value">${Math.round(stats.avgCompliance || 0)}%</div>
            <div class="health-stat-label">Avg Compliance</div>
        </div>
        <div class="health-stat">
            <div class="health-stat-value">${stats.recordCount}</div>
            <div class="health-stat-label">Total Records</div>
        </div>
    `;
}

/* render health data list */
function renderHealthData() {
  const container = document.getElementById("healthDataList");

  if (healthData.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No health data recorded</h3>
                <p>Start tracking your health metrics for better medication management</p>
                <button class="btn-primary" onclick="showAddHealthDataModal()">
                    <i class="fas fa-plus"></i>
                    Log Health Data
                </button>
            </div>
        `;
    return;
  }

  container.innerHTML = healthData
    .map(
      (data) => `
        <div class="health-card">
            <div class="health-header">
                <div class="health-date">${formatDate(data.recordDate)}</div>
                <div class="health-actions">
                    <button class="action-btn edit" onclick="editHealthData(${data.healthId})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteHealthData(${data.healthId})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="health-metrics">
                ${
                  data.bloodPressureSystolic
                    ? `
                    <div class="metric-group">
                        <div class="metric-label">Blood Pressure</div>
                        <div class="metric-value">
                            ${data.bloodPressureSystolic}/${data.bloodPressureDiastolic}
                            <span class="metric-unit">mmHg</span>
                        </div>
                    </div>
                `
                    : ""
                }
                ${
                  data.weight
                    ? `
                    <div class="metric-group">
                        <div class="metric-label">Weight</div>
                        <div class="metric-value">
                            ${data.weight}
                            <span class="metric-unit">kg</span>
                        </div>
                    </div>
                `
                    : ""
                }
                ${
                  data.bloodSugar
                    ? `
                    <div class="metric-group">
                        <div class="metric-label">Blood Sugar</div>
                        <div class="metric-value">
                            ${data.bloodSugar}
                            <span class="metric-unit">mg/dL</span>
                        </div>
                    </div>
                `
                    : ""
                }
            </div>

            ${
              data.complianceScore
                ? `
                <div class="compliance-score">
                    <div class="compliance-label">Medication Compliance</div>
                    <div class="compliance-value">${data.complianceScore}%</div>
                </div>
            `
                : ""
            }

            ${
              data.notes
                ? `
                <div class="health-notes">
                    <strong>Notes:</strong> ${data.notes}
                </div>
            `
                : ""
            }
        </div>
    `
    )
    .join("");
}

// modal functions

/* show add medication modal */
function showAddMedicationModal() {
  document.getElementById("addMedicationModal").style.display = "block";
  document.getElementById("medName").focus();
}

/* show add appointment modal */
function showAddAppointmentModal() {
  if (doctors.length === 0) {
    loadDoctors();
  }
  document.getElementById("addAppointmentModal").style.display = "block";
  document.getElementById("appointmentDoctor").focus();
}

/* show add contact modal */
function showAddContactModal() {
  document.getElementById("addContactModal").style.display = "block";
  document.getElementById("contactName").focus();
}

/* show add health data modal */
function showAddHealthDataModal() {
  document.getElementById("addHealthDataModal").style.display = "block";
  document.getElementById("healthDate").focus();
}

/* show QR code modal */
function showQRCode(medicationId) {
  const medication = medications.find(
    (med) => med.medicationId === medicationId
  );
  if (medication) {
    document.getElementById("qrCodeValue").textContent =
      medication.qrCode ||
      `MED${medicationId}-${medication.name.toUpperCase()}`;
    document.getElementById("qrCodeModal").style.display = "block";
  }
}

/* close modal */
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";

  // reset forms when closing modals
  const forms = [
    "addMedicationForm",
    "addAppointmentForm",
    "addContactForm",
    "addHealthDataForm",
  ];
  forms.forEach((formId) => {
    const form = document.getElementById(formId);
    if (form) form.reset();
  });
}

/* close all modals */
function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none";
  });
}

// form handlers

/* handle add medication form submission */
async function handleAddMedication(e) {
  e.preventDefault();

  try {
    showLoading();

    const formData = {
      name: document.getElementById("medName").value.trim(),
      dosage: document.getElementById("medDosage").value.trim(),
      frequency: document.getElementById("medFrequency").value,
      timing: document.getElementById("medTiming").value.trim(),
      startDate: document.getElementById("medStartDate").value,
      endDate: document.getElementById("medEndDate").value || null,
      prescribedBy:
        document.getElementById("medPrescriber").value.trim() || null,
      instructions:
        document.getElementById("medInstructions").value.trim() || null,
      category: document.getElementById("medCategory").value,
    };

    // validate required fields
    if (
      !formData.name ||
      !formData.dosage ||
      !formData.frequency ||
      !formData.timing ||
      !formData.startDate
    ) {
      throw new Error("Please fill in all required fields");
    }

    const response = await fetchWithAuth(`${API_BASE}/medications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Medication added successfully!", "success");
      closeModal("addMedicationModal");
      await loadMedications();
      if (currentTab === "dashboard") {
        updateDashboardStats();
        updateTodayMedications();
      }
    } else {
      throw new Error(data.error || "Failed to add medication");
    }

    hideLoading();
  } catch (error) {
    console.error("Error adding medication:", error);
    showToast(error.message, "error");
    hideLoading();
  }
}

/* handle add appointment form submission */
async function handleAddAppointment(e) {
  e.preventDefault();

  try {
    showLoading();

    const appointmentDate = document.getElementById("appointmentDate").value;
    const appointmentTime = document.getElementById("appointmentTime").value;

    const formData = {
      doctorId: parseInt(document.getElementById("appointmentDoctor").value),
      appointmentDate: `${appointmentDate}T${appointmentTime}:00.000Z`,
      duration: document.getElementById("appointmentDuration").value,
      reason: document.getElementById("appointmentReason").value.trim(),
      notes: document.getElementById("appointmentNotes").value.trim() || null,
      followUpNeeded: document.getElementById("followUpNeeded").checked,
    };

    // validate required fields
    if (
      !formData.doctorId ||
      !appointmentDate ||
      !appointmentTime ||
      !formData.reason
    ) {
      throw new Error("Please fill in all required fields");
    }

    const response = await fetchWithAuth(`${API_BASE}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Appointment booked successfully!", "success");
      closeModal("addAppointmentModal");
      await loadAppointments();
      if (currentTab === "dashboard") {
        updateDashboardStats();
        updateUpcomingAppointments();
      }
    } else {
      throw new Error(data.error || "Failed to book appointment");
    }

    hideLoading();
  } catch (error) {
    console.error("Error booking appointment:", error);
    showToast(error.message, "error");
    hideLoading();
  }
}

/* handle add contact form submission */
async function handleAddContact(e) {
  e.preventDefault();

  try {
    showLoading();

    const formData = {
      name: document.getElementById("contactName").value.trim(),
      relationship: document.getElementById("contactRelationship").value,
      phone: document.getElementById("contactPhone").value.trim(),
      email: document.getElementById("contactEmail").value.trim() || null,
      isPrimary: document.getElementById("isPrimaryContact").checked,
      alertOnMissedMeds: document.getElementById("alertOnMissedMeds").checked,
      alertThresholdHours: parseInt(
        document.getElementById("alertThreshold").value
      ),
    };

    // validate required fields
    if (!formData.name || !formData.relationship || !formData.phone) {
      throw new Error("Please fill in all required fields");
    }

    const response = await fetchWithAuth(`${API_BASE}/emergency-contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Emergency contact added successfully!", "success");
      closeModal("addContactModal");
      await loadEmergencyContacts();
      if (currentTab === "dashboard") {
        updateDashboardStats();
      }
    } else {
      throw new Error(data.error || "Failed to add emergency contact");
    }

    hideLoading();
  } catch (error) {
    console.error("Error adding emergency contact:", error);
    showToast(error.message, "error");
    hideLoading();
  }
}

/* handle add health data form submission */
async function handleAddHealthData(e) {
  e.preventDefault();

  try {
    showLoading();

    const formData = {
      recordDate: document.getElementById("healthDate").value,
      bloodPressureSystolic: document.getElementById("systolicBP").value
        ? parseInt(document.getElementById("systolicBP").value)
        : null,
      bloodPressureDiastolic: document.getElementById("diastolicBP").value
        ? parseInt(document.getElementById("diastolicBP").value)
        : null,
      weight: document.getElementById("weight").value
        ? parseFloat(document.getElementById("weight").value)
        : null,
      bloodSugar: document.getElementById("bloodSugar").value
        ? parseInt(document.getElementById("bloodSugar").value)
        : null,
      complianceScore: document.getElementById("complianceScore").value
        ? parseInt(document.getElementById("complianceScore").value)
        : null,
      notes: document.getElementById("healthNotes").value.trim() || null,
    };

    // validate required fields
    if (!formData.recordDate) {
      throw new Error("Please select a date");
    }

    const response = await fetchWithAuth(`${API_BASE}/health-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Health data logged successfully!", "success");
      closeModal("addHealthDataModal");
      await loadHealthData();
      await loadHealthStatistics();
    } else {
      throw new Error(data.error || "Failed to log health data");
    }

    hideLoading();
  } catch (error) {
    console.error("Error logging health data:", error);
    showToast(error.message, "error");
    hideLoading();
  }
}

// action functions

/* mark medication as taken */
async function markMedicationTaken(medicationId) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE}/medications/${medicationId}/take`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (response.ok) {
      showToast("Medication marked as taken!", "success");
      await loadMedications();
      if (currentTab === "dashboard") {
        updateTodayMedications();
        updateDashboardStats();
      }
    } else {
      throw new Error(data.error || "Failed to mark medication as taken");
    }
  } catch (error) {
    console.error("Error marking medication as taken:", error);
    showToast(error.message, "error");
  }
}

/* delete medication */
async function deleteMedication(medicationId) {
  if (!confirm("Are you sure you want to delete this medication?")) {
    return;
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE}/medications/${medicationId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (response.ok) {
      showToast("Medication deleted successfully!", "success");
      await loadMedications();
      if (currentTab === "dashboard") {
        updateDashboardStats();
        updateTodayMedications();
      }
    } else {
      throw new Error(data.error || "Failed to delete medication");
    }
  } catch (error) {
    console.error("Error deleting medication:", error);
    showToast(error.message, "error");
  }
}

/* delete appointment */
async function deleteAppointment(appointmentId) {
  if (!confirm("Are you sure you want to cancel this appointment?")) {
    return;
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE}/appointments/${appointmentId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (response.ok) {
      showToast("Appointment cancelled successfully!", "success");
      await loadAppointments();
      if (currentTab === "dashboard") {
        updateDashboardStats();
        updateUpcomingAppointments();
      }
    } else {
      throw new Error(data.error || "Failed to cancel appointment");
    }
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    showToast(error.message, "error");
  }
}

/* delete emergency contact */
async function deleteContact(contactId) {
  if (!confirm("Are you sure you want to delete this emergency contact?")) {
    return;
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE}/emergency-contacts/${contactId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (response.ok) {
      showToast("Emergency contact deleted successfully!", "success");
      await loadEmergencyContacts();
      if (currentTab === "dashboard") {
        updateDashboardStats();
      }
    } else {
      throw new Error(data.error || "Failed to delete emergency contact");
    }
  } catch (error) {
    console.error("Error deleting emergency contact:", error);
    showToast(error.message, "error");
  }
}

/* delete health data */
async function deleteHealthData(healthId) {
  if (!confirm("Are you sure you want to delete this health record?")) {
    return;
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE}/health-data/${healthId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (response.ok) {
      showToast("Health record deleted successfully!", "success");
      await loadHealthData();
      await loadHealthStatistics();
    } else {
      throw new Error(data.error || "Failed to delete health record");
    }
  } catch (error) {
    console.error("Error deleting health record:", error);
    showToast(error.message, "error");
  }
}

// utility functions

/* show OneMap location */
function showOnMap(address) {
  const encodedAddress = encodeURIComponent(address);
  window.open(
    `https://www.onemap.gov.sg/main/v2/?search=${encodedAddress}`,
    "_blank"
  );
}

/* fetch with authentication */
async function fetchWithAuth(url, options = {}) {
  const config = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  return fetch(url, config);
}

/* show loading overlay */
function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
}

/* hide loading overlay */
function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}

/* show toast notification */
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* format date string */
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* format time string */
function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* format date and time string */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

/* logout function */
async function logout() {
  try {
    const response = await fetchWithAuth(`${API_BASE}/auth/logout`, {
      method: "POST",
    });

    if (response.ok) {
      showToast("Logged out successfully", "success");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1000);
    } else {
      throw new Error("Failed to logout");
    }
  } catch (error) {
    console.error("Logout error:", error);
    // force logout even if server request fails
    window.location.href = "/login.html";
  }
}

// edit functions
function editMedication(medicationId) {
  showToast("Edit medication feature coming soon!", "info");
}

function editAppointment(appointmentId) {
  showToast("Edit appointment feature coming soon!", "info");
}

function editContact(contactId) {
  showToast("Edit contact feature coming soon!", "info");
}

function editHealthData(healthId) {
  showToast("Edit health data feature coming soon!", "info");
}
