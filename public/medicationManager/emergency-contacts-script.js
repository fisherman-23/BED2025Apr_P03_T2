// global variables
let currentContacts = [];
let editingContactId = null;
let deletingContactId = null;

// initialize page when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    loadEmergencyContacts();
    setupEventListeners();
});

// sets up event listeners
function setupEventListeners() {
    // contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

// loads all emergency contacts
async function loadEmergencyContacts() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/emergency-contacts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch emergency contacts');
        }

        const data = await response.json();
        currentContacts = data.data.contacts;
        
        renderContactsList(currentContacts);
        updateContactsStats();
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading emergency contacts:', error);
        showError('Failed to load emergency contacts');
        showLoading(false);
    }
}

// renders the emergency contacts list
function renderContactsList(contacts) {
    const contactsList = document.getElementById('contactsList');
    
    if (!contacts || contacts.length === 0) {
        contactsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Emergency Contacts</h3>
                <p class="text-gray-500 mb-4">Add emergency contacts to receive alerts when you miss medications.</p>
                <button onclick="openAddContactModal()" class="btn-team-primary">Add First Contact</button>
            </div>
        `;
        return;
    }

    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact-card ${!contact.isActive ? 'inactive-contact' : ''}">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-lg font-semibold">${contact.contactName}</h3>
                        <span class="priority-badge priority-${contact.priority}">
                            Priority ${contact.priority}
                        </span>
                    </div>
                    <p class="text-gray-600 capitalize">${contact.relationship}</p>
                </div>
                
                <div class="flex items-center gap-2">
                    ${!contact.isActive ? '<span class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inactive</span>' : ''}
                    <button onclick="testContact(${contact.contactId})" 
                            class="btn-test text-sm py-1 px-2" title="Send test alert">
                        Test
                    </button>
                </div>
            </div>
            
            <div class="space-y-2 mb-4">
                <div class="flex items-center text-sm">
                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                    </svg>
                    ${contact.phoneNumber}
                </div>
                
                ${contact.email ? `
                    <div class="flex items-center text-sm">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                        </svg>
                        ${contact.email}
                    </div>
                ` : ''}
                
                <div class="flex items-center text-sm">
                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                    </svg>
                    Alert delay: ${contact.alertDelayHours === 0 ? 'Immediate' : `${contact.alertDelayHours} hour(s)`}
                </div>
                
                ${contact.lastAlertSent ? `
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        Last alert: ${formatDateTime(contact.lastAlertSent)}
                    </div>
                ` : ''}
            </div>
            
            <div class="flex gap-2">
                <button onclick="editContact(${contact.contactId})" 
                        class="btn-team-secondary flex-1 text-sm py-2">
                    Edit
                </button>
                <button onclick="deleteContact(${contact.contactId})" 
                        class="btn-danger flex-1 text-sm py-2">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// updates the contacts statistics
function updateContactsStats() {
    const totalContactsElement = document.getElementById('totalContacts');
    const activeContactsElement = document.getElementById('activeContacts');
    const recentAlertsElement = document.getElementById('recentAlerts');
    
    if (totalContactsElement) {
        totalContactsElement.textContent = currentContacts.length;
    }
    
    if (activeContactsElement) {
        const activeCount = currentContacts.filter(contact => contact.isActive).length;
        activeContactsElement.textContent = activeCount;
    }
    
    if (recentAlertsElement) {
        // this would typically come from API data
        recentAlertsElement.textContent = '0';
    }
}

// opens the add contact modal
function openAddContactModal() {
    editingContactId = null;
    const modal = document.getElementById('contactModal');
    const title = document.getElementById('contactModalTitle');
    const submitBtn = document.getElementById('submitBtn');
    
    if (modal && title && submitBtn) {
        title.textContent = 'Add Emergency Contact';
        submitBtn.textContent = 'Add Contact';
        
        // reset form
        const form = document.getElementById('contactForm');
        if (form) {
            form.reset();
            document.getElementById('isActive').checked = true;
        }
        
        modal.style.display = 'block';
    }
}

// opens the edit contact modal
function editContact(contactId) {
    const contact = currentContacts.find(c => c.contactId === contactId);
    if (!contact) return;
    
    editingContactId = contactId;
    const modal = document.getElementById('contactModal');
    const title = document.getElementById('contactModalTitle');
    const submitBtn = document.getElementById('submitBtn');
    
    if (modal && title && submitBtn) {
        title.textContent = 'Edit Emergency Contact';
        submitBtn.textContent = 'Update Contact';
        
        // fill form with existing data
        document.getElementById('contactId').value = contact.contactId;
        document.getElementById('contactName').value = contact.contactName;
        document.getElementById('relationship').value = contact.relationship;
        document.getElementById('phoneNumber').value = contact.phoneNumber;
        document.getElementById('email').value = contact.email || '';
        document.getElementById('priority').value = contact.priority;
        document.getElementById('alertDelayHours').value = contact.alertDelayHours;
        document.getElementById('isActive').checked = contact.isActive;
        
        modal.style.display = 'block';
    }
}

// closes the contact modal
function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'none';
        editingContactId = null;
    }
}

// handles contact form submission
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const contactData = {
        contactName: formData.get('contactName'),
        relationship: formData.get('relationship'),
        phoneNumber: formData.get('phoneNumber'),
        email: formData.get('email') || null,
        priority: parseInt(formData.get('priority')),
        alertDelayHours: parseInt(formData.get('alertDelayHours')),
        isActive: formData.get('isActive') === 'on'
    };
    
    try {
        showLoading(true);
        
        const url = editingContactId 
            ? `/api/emergency-contacts/${editingContactId}`
            : '/api/emergency-contacts';
        
        const method = editingContactId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(contactData)
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess(editingContactId ? 'Contact updated successfully!' : 'Contact added successfully!');
            closeContactModal();
            await loadEmergencyContacts();
        } else {
            showError(data.message || 'Failed to save contact');
        }
        
    } catch (error) {
        console.error('Error saving contact:', error);
        showError('Failed to save contact. Please try again.');
    } finally {
        showLoading(false);
    }
}

// initiates contact deletion
function deleteContact(contactId) {
    deletingContactId = contactId;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// confirms and executes contact deletion
async function confirmDeleteContact() {
    if (!deletingContactId) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`/api/emergency-contacts/${deletingContactId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Contact deleted successfully!');
            closeDeleteModal();
            await loadEmergencyContacts();
        } else {
            showError(data.message || 'Failed to delete contact');
        }
        
    } catch (error) {
        console.error('Error deleting contact:', error);
        showError('Failed to delete contact. Please try again.');
    } finally {
        showLoading(false);
    }
}

// closes the delete confirmation modal
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
        deletingContactId = null;
    }
}

// tests emergency contact by sending test alert
async function testContact(contactId) {
    try {
        showLoading(true);
        
        const response = await fetch(`/api/emergency-contacts/${contactId}/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Test alert sent successfully!');
        } else {
            showError(data.message || 'Failed to send test alert');
        }
        
    } catch (error) {
        console.error('Error sending test alert:', error);
        showError('Failed to send test alert. Please try again.');
    } finally {
        showLoading(false);
    }
}

// shows alert history modal
async function showAlertHistory() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/emergency-contacts/alerts/history', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch alert history');
        }

        const data = await response.json();
        renderAlertHistory(data.data.alertHistory);
        
        const modal = document.getElementById('alertHistoryModal');
        if (modal) {
            modal.style.display = 'block';
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading alert history:', error);
        showError('Failed to load alert history');
        showLoading(false);
    }
}

// renders alert history in modal
function renderAlertHistory(alerts) {
    const contentElement = document.getElementById('alertHistoryContent');
    
    if (!alerts || alerts.length === 0) {
        contentElement.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-400 mb-4">
                    <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <p class="text-gray-500">No emergency alerts have been sent yet</p>
            </div>
        `;
        return;
    }

    contentElement.innerHTML = alerts.map(alert => `
        <div class="alert-history-item">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="font-semibold">${alert.contactName} (${alert.relationship})</div>
                    <div class="text-sm text-gray-600">${alert.phoneNumber}</div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-semibold">Level ${alert.alertLevel}</div>
                    <div class="text-xs text-gray-500">${formatDateTime(alert.sentAt)}</div>
                </div>
            </div>
            
            ${alert.medicationName ? `
                <div class="text-sm mb-2">
                    <span class="font-medium">Medication:</span> ${alert.medicationName} (${alert.dosage})
                </div>
            ` : ''}
            
            <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                ${alert.alertMessage}
            </div>
        </div>
    `).join('');
}

// closes alert history modal
function closeAlertHistoryModal() {
    const modal = document.getElementById('alertHistoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// utility functions
// formats date and time for display
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-SG');
}

// gets authentication token from storage
function getAuthToken() {
    return localStorage.getItem('authToken') || '';
}

// shows loading state
function showLoading(show) {
    // implementation would show/hide loading spinner
    console.log('Loading:', show);
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
window.onclick = function(event) {
    const contactModal = document.getElementById('contactModal');
    const deleteModal = document.getElementById('deleteModal');
    const alertHistoryModal = document.getElementById('alertHistoryModal');
    
    if (event.target === contactModal) {
        closeContactModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
    if (event.target === alertHistoryModal) {
        closeAlertHistoryModal();
    }
};