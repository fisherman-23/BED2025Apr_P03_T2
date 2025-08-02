class MedicationAppointmentManager {
    constructor() {
        this.currentTab = 'overview';
        this.medications = [];
        this.appointments = [];
        this.doctors = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuthentication();
        await this.loadDoctors();
        await this.loadData();
        this.updateDashboard();
    }

    setupEventListeners() {
        // tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // modal controls
        document.getElementById('addMedicationBtn').addEventListener('click', () => {
            this.showMedicationModal();
        });

        document.getElementById('addAppointmentBtn').addEventListener('click', () => {
            this.showAppointmentModal();
        });

        document.getElementById('cancelMedicationBtn').addEventListener('click', () => {
            this.hideMedicationModal();
        });

        document.getElementById('cancelAppointmentBtn').addEventListener('click', () => {
            this.hideAppointmentModal();
        });

        document.getElementById('saveMedicationBtn').addEventListener('click', () => {
            this.saveMedication();
        });

        document.getElementById('saveAppointmentBtn').addEventListener('click', () => {
            this.saveAppointment();
        });

        // logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // close modals when clicking outside
        document.getElementById('medicationModal').addEventListener('click', (e) => {
            if (e.target.id === 'medicationModal') {
                this.hideMedicationModal();
            }
        });

        document.getElementById('appointmentModal').addEventListener('click', (e) => {
            if (e.target.id === 'appointmentModal') {
                this.hideAppointmentModal();
            }
        });
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                window.location.href = '/login.html';
                return;
            }

            const userData = await response.json();
            console.log('User authenticated:', userData);
        } catch (error) {
            console.error('Authentication check failed:', error);
            window.location.href = '/login.html';
        }
    }

    async loadDoctors() {
        try {
            const response = await fetch('/api/doctors', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                this.doctors = await response.json();
                this.populateDoctorSelect();
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    populateDoctorSelect() {
        const select = document.getElementById('doctorSelect');
        select.innerHTML = '<option value="">Select doctor</option>';
        
        if (this.doctors.data) {
            this.doctors.data.doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.doctorId;
                option.textContent = `${doctor.name} - ${doctor.specialty}`;
                select.appendChild(option);
            });
        }
    }

    async loadData() {
        await Promise.all([
            this.loadMedications(),
            this.loadAppointments()
        ]);
    }

    async loadMedications() {
        try {
            const response = await fetch('/api/medications', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.medications = data.data?.medications || [];
                this.renderMedications();
            } else {
                console.error('Failed to load medications');
            }
        } catch (error) {
            console.error('Error loading medications:', error);
        }
    }

    async loadAppointments() {
        try {
            const response = await fetch('/api/appointments', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.appointments = data.data?.appointments || [];
                this.renderAppointments();
            } else {
                console.error('Failed to load appointments');
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    }

    switchTab(tabName) {
        // update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active', 'text-blue-600', 'border-blue-500');
            button.classList.add('text-gray-500', 'border-transparent');
        });

        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        activeButton.classList.add('active', 'text-blue-600', 'border-blue-500');
        activeButton.classList.remove('text-gray-500', 'border-transparent');

        // show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.getElementById(`${tabName}-content`).classList.remove('hidden');
        this.currentTab = tabName;
    }

    renderMedications() {
        const container = document.getElementById('medicationsGrid');
        const todayContainer = document.getElementById('todayMedications');
        
        if (!container || !todayContainer) return;

        // clear containers
        container.innerHTML = '';
        todayContainer.innerHTML = '';

        if (this.medications.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No medications added yet. Click "Add Medication" to get started.</div>';
            todayContainer.innerHTML = '<div class="text-center py-4 text-gray-500">No medications for today</div>';
            return;
        }

        this.medications.forEach(medication => {
            const medicationCard = this.createMedicationCard(medication);
            container.appendChild(medicationCard);

            // add to today's medications if active
            if (medication.active) {
                const todayCard = this.createMedicationCard(medication, true);
                todayContainer.appendChild(todayCard);
            }
        });
    }

    createMedicationCard(medication, isCompact = false) {
        const card = document.createElement('div');
        card.className = `bg-white rounded-2xl shadow-lg border-l-4 border-blue-500 p-6 card-hover medication-card ${isCompact ? 'mb-3' : ''}`;

        const complianceRate = medication.compliance_rate || 0;
        const complianceClass = complianceRate >= 90 ? 'compliance-high' : 
                               complianceRate >= 70 ? 'compliance-medium' : 'compliance-low';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${medication.name}</h3>
                        <p class="text-gray-600">${medication.patient_name || 'Patient'}</p>
                        <p class="text-sm text-gray-500">Prescribed by ${medication.prescribedBy}</p>
                    </div>
                </div>
                ${!isCompact ? `
                <div class="flex space-x-2">
                    <button onclick="medicationManager.editMedication(${medication.medicationId})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                    </button>
                    <button onclick="medicationManager.deleteMedication(${medication.medicationId})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
                ` : ''}
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-sm text-gray-600">Dosage & Schedule</p>
                    <p class="font-semibold text-gray-800">${medication.dosage}</p>
                    <p class="text-sm text-blue-600">${medication.frequency} at ${medication.timing}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-sm text-gray-600">Taking Consistently</p>
                    <div class="flex items-center space-x-2">
                        <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="${complianceClass} h-2 rounded-full" style="width: ${complianceRate}%"></div>
                        </div>
                        <span class="text-sm font-bold">${complianceRate}%</span>
                    </div>
                </div>
            </div>

            <div class="bg-amber-50 rounded-lg p-3 mb-3">
                <p class="text-sm text-amber-800 font-medium">Instructions:</p>
                <p class="text-sm text-amber-700">${medication.instructions || 'No special instructions'}</p>
            </div>

            ${medication.next_dose ? `
            <div class="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
                <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm font-medium text-blue-800">Next dose</span>
                </div>
                <span class="text-sm font-bold text-purple-800">
                    ${new Date(medication.next_dose).toLocaleDateString()} at ${new Date(medication.next_dose).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
            ` : ''}

            ${medication.missed_doses > 0 ? `
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm font-medium text-red-800">
                        ${medication.missed_doses} missed dose(s) - Family members notified
                    </span>
                </div>
            </div>
            ` : ''}

            ${!medication.drug_conflicts ? `
            <div class="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-xs text-green-800">No drug interactions detected</span>
                </div>
            </div>
            ` : ''}

            <button onclick="medicationManager.markAsTaken(${medication.medicationId})" class="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                Mark as Taken
            </button>
        `;

        return card;
    }

    renderAppointments() {
        const container = document.getElementById('appointmentsGrid');
        const weekContainer = document.getElementById('weekAppointments');
        
        if (!container || !weekContainer) return;

        // clear containers
        container.innerHTML = '';
        weekContainer.innerHTML = '';

        if (this.appointments.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No appointments scheduled yet. Click "Book Appointment" to get started.</div>';
            weekContainer.innerHTML = '<div class="text-center py-4 text-gray-500">No appointments this week</div>';
            return;
        }

        // filter upcoming appointments for this week
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thisWeekAppointments = this.appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= now && aptDate <= nextWeek;
        });

        this.appointments.forEach(appointment => {
            const appointmentCard = this.createAppointmentCard(appointment);
            container.appendChild(appointmentCard);
        });

        thisWeekAppointments.forEach(appointment => {
            const weekCard = this.createAppointmentCard(appointment, true);
            weekContainer.appendChild(weekCard);
        });
    }

    createAppointmentCard(appointment, isCompact = false) {
        const card = document.createElement('div');
        card.className = `bg-white rounded-2xl shadow-lg border-l-4 border-green-500 p-6 card-hover appointment-card ${isCompact ? 'mb-3' : ''}`;

        const appointmentDate = new Date(appointment.appointmentDate);
        const statusClass = appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                           appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                           'bg-blue-100 text-blue-800';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${appointment.doctorName}</h3>
                    <p class="text-green-600 font-semibold">${appointment.specialty}</p>
                    <span class="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                        ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                </div>
                ${!isCompact ? `
                <div class="flex space-x-2">
                    <button onclick="medicationManager.editAppointment(${appointment.appointmentId})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                    </button>
                    <button onclick="medicationManager.cancelAppointment(${appointment.appointmentId})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
                ` : ''}
            </div>

            <div class="bg-gray-50 rounded-lg p-3 mb-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Date & Time</p>
                        <p class="font-semibold text-gray-800">${appointmentDate.toLocaleDateString()}</p>
                        <p class="text-sm text-blue-600">${appointmentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Duration</p>
                        <p class="font-semibold text-gray-800">${appointment.duration} minutes</p>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <p class="text-sm text-gray-600 font-medium">Reason for Visit:</p>
                <p class="text-gray-800">${appointment.reason}</p>
            </div>

            <div class="mb-4">
                <p class="text-sm text-gray-600 font-medium">Location:</p>
                <p class="text-gray-800">${appointment.location}</p>
                <p class="text-sm text-gray-500">${appointment.address}</p>
            </div>

            ${appointment.notes ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p class="text-sm text-yellow-800 font-medium">Notes:</p>
                <p class="text-sm text-yellow-700">${appointment.notes}</p>
            </div>
            ` : ''}

            <div class="flex space-x-2">
                <button onclick="medicationManager.sendReminder(${appointment.appointmentId})" class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                    Send Reminder
                </button>
                <button onclick="medicationManager.getDirections(${appointment.appointmentId})" class="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors">
                    Get Directions
                </button>
            </div>
        `;

        return card;
    }

    updateDashboard() {
        // update medication count
        document.getElementById('medicationCount').textContent = this.medications.filter(m => m.active).length;
        
        // update appointment count
        const upcomingAppointments = this.appointments.filter(apt => {
            return new Date(apt.appointmentDate) > new Date() && apt.status === 'scheduled';
        });
        document.getElementById('appointmentCount').textContent = upcomingAppointments.length;
        
        // update compliance rate
        const totalCompliance = this.medications.reduce((sum, med) => sum + (med.compliance_rate || 0), 0);
        const avgCompliance = this.medications.length > 0 ? Math.round(totalCompliance / this.medications.length) : 0;
        document.getElementById('complianceRate').textContent = `${avgCompliance}%`;
    }

    showMedicationModal() {
        document.getElementById('medicationModal').classList.remove('hidden');
    }

    hideMedicationModal() {
        document.getElementById('medicationModal').classList.add('hidden');
        document.getElementById('medicationForm').reset();
    }

    showAppointmentModal() {
        document.getElementById('appointmentModal').classList.remove('hidden');
    }

    hideAppointmentModal() {
        document.getElementById('appointmentModal').classList.add('hidden');
        document.getElementById('appointmentForm').reset();
    }

    async saveMedication() {
        const form = document.getElementById('medicationForm');
        const formData = new FormData(form);
        const medicationData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/medications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(medicationData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Medication added successfully!');
                this.hideMedicationModal();
                await this.loadMedications();
                this.updateDashboard();
            } else {
                this.showError(result.message || 'Failed to add medication');
            }
        } catch (error) {
            console.error('Error saving medication:', error);
            this.showError('Failed to add medication');
        }
    }

    async saveAppointment() {
        const form = document.getElementById('appointmentForm');
        const formData = new FormData(form);
        const appointmentData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(appointmentData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Appointment booked successfully!');
                this.hideAppointmentModal();
                await this.loadAppointments();
                this.updateDashboard();
            } else {
                this.showError(result.message || 'Failed to book appointment');
            }
        } catch (error) {
            console.error('Error saving appointment:', error);
            this.showError('Failed to book appointment');
        }
    }

    async markAsTaken(medicationId) {
        try {
            const response = await fetch(`/api/medications/${medicationId}/taken`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Medication marked as taken!');
                await this.loadMedications();
                this.updateDashboard();
            } else {
                this.showError(result.message || 'Failed to mark medication as taken');
            }
        } catch (error) {
            console.error('Error marking medication as taken:', error);
            this.showError('Failed to mark medication as taken');
        }
    }

    async deleteMedication(medicationId) {
        if (!confirm('Are you sure you want to delete this medication?')) {
            return;
        }

        try {
            const response = await fetch(`/api/medications/${medicationId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Medication deleted successfully!');
                await this.loadMedications();
                this.updateDashboard();
            } else {
                this.showError(result.message || 'Failed to delete medication');
            }
        } catch (error) {
            console.error('Error deleting medication:', error);
            this.showError('Failed to delete medication');
        }
    }

    async cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        try {
            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Appointment cancelled successfully!');
                await this.loadAppointments();
                this.updateDashboard();
            } else {
                this.showError(result.message || 'Failed to cancel appointment');
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            this.showError('Failed to cancel appointment');
        }
    }

    async sendReminder(appointmentId) {
        try {
            const response = await fetch(`/api/appointments/${appointmentId}/reminder`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Reminder sent successfully!');
            } else {
                this.showError(result.message || 'Failed to send reminder');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            this.showError('Failed to send reminder');
        }
    }

    async getDirections(appointmentId) {
        try {
            // get user's current location
            navigator.geolocation.getCurrentPosition(async (position) => {
                const currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                const response = await fetch(`/api/appointments/${appointmentId}/directions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ currentLocation })
                });

                const result = await response.json();

                if (response.ok) {
                    this.showDirections(result.data.directions);
                } else {
                    this.showError(result.message || 'Failed to get directions');
                }
            }, (error) => {
                this.showError('Location access denied. Please allow location access for directions.');
            });
        } catch (error) {
            console.error('Error getting directions:', error);
            this.showError('Failed to get directions');
        }
    }

    showDirections(directions) {
        // Create a more detailed directions modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
                <h3 class="text-lg font-bold mb-4">🗺️ Directions to Clinic</h3>
                <div class="mb-4">
                    <p class="text-sm text-gray-600">Distance: <span class="font-bold">${directions.distance}</span></p>
                    <p class="text-sm text-gray-600">Duration: <span class="font-bold">${directions.duration}</span></p>
                </div>
                <div class="mb-4">
                    <h4 class="font-semibold mb-2">Route Instructions:</h4>
                    <ol class="text-sm space-y-1">
                        ${directions.steps.map((step, index) => 
                            `<li>${index + 1}. ${step}</li>`
                        ).join('')}
                    </ol>
                </div>
                <button onclick="this.closest('.fixed').remove()" 
                        class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showSuccess(message) {
        // simple success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // simple error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async logout() {
        try {
            const response = await fetch('/users/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/login.html';
            } else {
                this.showError('Failed to logout');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            this.showError('Failed to logout');
        }
    }

    // placeholder methods for future implementation
    editMedication(medicationId) {
        this.showError('Edit medication feature coming soon!');
    }

    editAppointment(appointmentId) {
        this.showError('Edit appointment feature coming soon!');
    }
}

// initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.medicationManager = new MedicationAppointmentManager();
});