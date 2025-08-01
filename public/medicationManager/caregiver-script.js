// global variables
let currentPatients = [];
let selectedPatientId = null;

// initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadCaregiverDashboard();
  setupEventListeners();
});

// sets up event listeners for the dashboard
function setupEventListeners() {
  // add patient form submission
  const addPatientForm = document.getElementById("addPatientForm");
  if (addPatientForm) {
    addPatientForm.addEventListener("submit", handleAddPatient);
  }
}

// loads the main caregiver dashboard data
async function loadCaregiverDashboard() {
  try {
    showLoading(true);

    // load patients under care
    await loadPatientsList();

    // update dashboard stats
    updateDashboardStats();

    // load recent alerts
    await loadRecentAlerts();

    showLoading(false);
  } catch (error) {
    console.error("Error loading caregiver dashboard:", error);
    showError("Failed to load dashboard data. Please refresh the page.");
    showLoading(false);
  }
}

// loads the list of patients under caregiver's care
async function loadPatientsList() {
  try {
    const response = await fetch("/api/caregiver/patients", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Failed to fetch patients:", response.statusText);
      throw new Error("Failed to fetch patients");
    }

    const data = await response.json();
    currentPatients = data.data.patients;

    renderPatientsList(currentPatients);
  } catch (error) {
    console.error("Error loading patients:", error);
    showError("Failed to load patients list");
  }
}

// renders the patients list in the dashboard
function renderPatientsList(patients) {
  const patientsList = document.getElementById("patientsList");

  if (!patients || patients.length === 0) {
    patientsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Patients Added</h3>
                <p class="text-gray-500 mb-4">Start by adding a patient to monitor their medication adherence.</p>
                <button onclick="openAddPatientModal()" class="btn-team-primary">Add First Patient</button>
            </div>
        `;
    return;
  }

  patientsList.innerHTML = patients
    .map(
      (patient) => `
        <div class="patient-card" onclick="viewPatientDetails(${patient.patientId})">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-semibold">${patient.firstName} ${patient.lastName}</h3>
                    <p class="text-gray-600">${patient.relationship}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${getAccessLevelClass(patient.accessLevel)}">
                    ${patient.accessLevel}
                </span>
            </div>
            
            <div class="mb-3">
                <div class="flex justify-between text-sm mb-1">
                    <span>Medication Compliance</span>
                    <span id="compliance-${patient.patientId}">Loading...</span>
                </div>
                <div class="compliance-bar bg-gray-200">
                    <div class="h-full rounded-full transition-all duration-300" 
                         id="compliance-bar-${patient.patientId}" 
                         style="width: 0%; background: linear-gradient(to right, #D7E961, #78B5D3);"></div>
                </div>
            </div>
            
            <div class="flex justify-between text-sm text-gray-600">
                <span>Added: ${formatDate(patient.createdAt)}</span>
                <button onclick="event.stopPropagation(); loadPatientDashboard(${patient.patientId})" 
                        class="text-blue-600 hover:text-blue-800">View Details →</button>
            </div>
        </div>
    `
    )
    .join("");

  // load compliance data for each patient
  patients.forEach((patient) => {
    loadPatientCompliance(patient.patientId);
  });
}

// loads compliance data for a specific patient
async function loadPatientCompliance(patientId) {
  try {
    const response = await fetch(
      `/api/caregiver/patients/${patientId}/dashboard`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const compliance = data.data.overallCompliance;

      // update compliance display
      const complianceElement = document.getElementById(
        `compliance-${patientId}`
      );
      const complianceBarElement = document.getElementById(
        `compliance-bar-${patientId}`
      );

      if (complianceElement && complianceBarElement) {
        complianceElement.textContent = `${compliance}%`;
        complianceBarElement.style.width = `${compliance}%`;

        // update color based on compliance level
        if (compliance >= 90) {
          complianceBarElement.style.background =
            "linear-gradient(to right, #10b981, #34d399)";
        } else if (compliance >= 70) {
          complianceBarElement.style.background =
            "linear-gradient(to right, #f59e0b, #fbbf24)";
        } else {
          complianceBarElement.style.background =
            "linear-gradient(to right, #ef4444, #f87171)";
        }
      }
    }
  } catch (error) {
    console.error(`Error loading compliance for patient ${patientId}:`, error);
  }
}

// opens the add patient modal
function openAddPatientModal() {
  const modal = document.getElementById("addPatientModal");
  if (modal) {
    modal.style.display = "block";

    // reset form
    const form = document.getElementById("addPatientForm");
    if (form) {
      form.reset();
    }
  }
}

// closes the add patient modal
function closeAddPatientModal() {
  const modal = document.getElementById("addPatientModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// handles add patient form submission
async function handleAddPatient(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const patientData = {
    patientEmail: formData.get("patientEmail"),
    relationship: formData.get("relationship"),
    accessLevel: formData.get("accessLevel") || "monitoring",
  };

  try {
    showLoading(true);

    const response = await fetch("/api/caregiver/relationships", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(patientData),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess("Patient added successfully!");
      closeAddPatientModal();
      await loadPatientsList();
      updateDashboardStats();
    } else {
      showError(data.message || "Failed to add patient");
    }
  } catch (error) {
    console.error("Error adding patient:", error);
    showError("Failed to add patient. Please try again.");
  } finally {
    showLoading(false);
  }
}

// loads detailed dashboard for a specific patient
async function loadPatientDashboard(patientId) {
  try {
    showLoading(true);

    const response = await fetch(
      `/api/caregiver/patients/${patientId}/dashboard`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch patient dashboard");
    }

    const data = await response.json();
    showPatientDetailModal(data.data);
  } catch (error) {
    console.error("Error loading patient dashboard:", error);
    showError("Failed to load patient details");
  } finally {
    showLoading(false);
  }
}

// shows patient detail modal with dashboard data
function showPatientDetailModal(dashboardData) {
  const modal = document.getElementById("patientDetailModal");
  const titleElement = document.getElementById("patientDetailTitle");
  const contentElement = document.getElementById("patientDetailContent");

  if (!modal || !titleElement || !contentElement) return;

  const patient = dashboardData.patientInfo;
  titleElement.textContent = `${patient.firstName} ${patient.lastName} - Medication Dashboard`;

  contentElement.innerHTML = `
        <div class="space-y-6">
            <!-- Overall Compliance -->
            <div class="team-card">
                <h3 class="text-lg font-semibold mb-4">Overall Compliance</h3>
                <div class="text-center">
                    <div class="text-4xl font-bold mb-2 ${getComplianceColor(dashboardData.overallCompliance)}">
                        ${dashboardData.overallCompliance}%
                    </div>
                    <div class="compliance-bar bg-gray-200 mx-auto" style="width: 200px;">
                        <div class="h-full rounded-full ${getComplianceBarClass(dashboardData.overallCompliance)}" 
                             style="width: ${dashboardData.overallCompliance}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Medications List -->
            <div class="team-card">
                <h3 class="text-lg font-semibold mb-4">Medications (${dashboardData.medications.length})</h3>
                <div class="space-y-3">
                    ${dashboardData.medications
                      .map(
                        (med) => `
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div class="font-medium">${med.medicationName}</div>
                                <div class="text-sm text-gray-600">${med.dosage} - ${med.frequency}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold ${getComplianceColor(med.complianceRate)}">
                                    ${med.complianceRate}%
                                </div>
                                <div class="text-sm text-gray-600">
                                    ${med.takenDoses}/${med.totalDoses} doses
                                </div>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            
            <!-- Recent Missed Medications -->
            ${
              dashboardData.recentMissed.length > 0
                ? `
                <div class="team-card">
                    <h3 class="text-lg font-semibold mb-4 text-red-600">Recent Missed Medications</h3>
                    <div class="space-y-2">
                        ${dashboardData.recentMissed
                          .map(
                            (missed) => `
                            <div class="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                                <div>
                                    <div class="font-medium text-red-800">${missed.medicationName}</div>
                                    <div class="text-sm text-red-600">Scheduled: ${formatDateTime(missed.scheduledTime)}</div>
                                </div>
                                <div class="text-red-600 font-semibold">
                                    ${missed.hoursOverdue}h overdue
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                    <div class="mt-4">
                        <button onclick="sendMissedMedicationAlert(${patient.patientId})" 
                                class="btn-danger">Send Alert to Emergency Contacts</button>
                    </div>
                </div>
            `
                : ""
            }
            
            <!-- Action Buttons -->
            <div class="flex gap-4">
                <button onclick="generatePatientReport(${patient.patientId})" class="btn-team-primary flex-1">
                    Generate Report
                </button>
                <button onclick="viewAdherenceHistory(${patient.patientId})" class="btn-team-secondary flex-1">
                    View History
                </button>
            </div>
        </div>
    `;

  modal.style.display = "block";
}

// closes the patient detail modal
function closePatientDetailModal() {
  const modal = document.getElementById("patientDetailModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// sends missed medication alert for a patient
async function sendMissedMedicationAlert(patientId) {
  try {
    showLoading(true);

    const response = await fetch("/api/caregiver/alerts/missed-medication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ patientId, alertLevel: 2 }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess("Emergency alert sent successfully!");
    } else {
      showError(data.message || "Failed to send alert");
    }
  } catch (error) {
    console.error("Error sending alert:", error);
    showError("Failed to send alert. Please try again.");
  } finally {
    showLoading(false);
  }
}

// loads recent alerts for the dashboard
async function loadRecentAlerts() {
  try {
    const alertsContainer = document.getElementById("recentAlerts");
    if (alertsContainer) {
      alertsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg class="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <p>No recent alerts</p>
                    <p class="text-sm">All patients are maintaining good medication compliance</p>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading recent alerts:", error);
  }
}

// updates dashboard statistics
function updateDashboardStats() {
  // update total patients
  const totalPatientsElement = document.getElementById("totalPatients");
  if (totalPatientsElement) {
    totalPatientsElement.textContent = currentPatients.length;
  }

  // update last update time
  const lastUpdateElement = document.getElementById("lastUpdate");
  if (lastUpdateElement) {
    lastUpdateElement.textContent = new Date().toLocaleTimeString("en-SG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // other stats would be calculated from API data
  const avgComplianceElement = document.getElementById("avgCompliance");
  if (avgComplianceElement) {
    avgComplianceElement.textContent = "85%"; // placeholder
  }

  const activeAlertsElement = document.getElementById("activeAlerts");
  if (activeAlertsElement) {
    activeAlertsElement.textContent = "0"; // placeholder
  }
}

// utility functions
// gets CSS class for access level badge
function getAccessLevelClass(accessLevel) {
  switch (accessLevel) {
    case "full":
      return "bg-green-100 text-green-800";
    case "alerts":
      return "bg-yellow-100 text-yellow-800";
    case "monitoring":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// gets compliance color class
function getComplianceColor(compliance) {
  if (compliance >= 90) return "text-green-600";
  if (compliance >= 70) return "text-yellow-600";
  return "text-red-600";
}

// gets compliance bar class
function getComplianceBarClass(compliance) {
  if (compliance >= 90) return "compliance-high";
  if (compliance >= 70) return "compliance-medium";
  return "compliance-low";
}

// formats date for display
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-SG");
}

// formats date and time for display
function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-SG");
}

// gets authentication token from storage
function getAuthToken() {
  return localStorage.getItem("authToken") || "";
}

// shows loading state
function showLoading(show) {
  // implementation would show/hide loading spinner
  console.log("Loading:", show);
}

// shows success message
function showSuccess(message) {
  // implementation would show success toast/alert
  alert(message);
}

// shows error message
function showError(message) {
  // implementation would show error toast/alert
  alert(message);
}

// close modals when clicking outside
window.onclick = function (event) {
  const addPatientModal = document.getElementById("addPatientModal");
  const patientDetailModal = document.getElementById("patientDetailModal");

  if (event.target === addPatientModal) {
    closeAddPatientModal();
  }
  if (event.target === patientDetailModal) {
    closePatientDetailModal();
  }
};
