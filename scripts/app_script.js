// Global state
        let selectedDate = new Date();
        let currentCalendarDate = new Date();
        // Track the appointment used to open the consultation (if any)
        let currentConsultationAppointmentId = null;
        // Track current consultation being worked on (for lab assessments from consultation form)
        let currentConsultationPatientId = null;
        let editingConsultationId = null; // when set, the consultation form saves as update

        // Appointment storage system
        let storedAppointments = [];

        // Patient storage system
        let storedPatients = [];

// Language system (moved to translation.js)
let currentLanguage = window.currentLanguage || 'en';
        
// Translation alias (provided by translation.js)
const translations = window.translations;
        
        // File storage system
        
        // Edit mode variables
        let editingPatient = null;
        let editModeNewFiles = [];
        let editModeRemovedFiles = [];

        // Helper function to format date consistently
        const formatDateForStorage = (date) => {
            if (typeof date === 'string') {
                // If it's already a string in YYYY-MM-DD format, return as is
                return date;
            }
            // If it's a Date object, format it consistently
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

// Load patients from localStorage
const loadStoredPatients = () => {
    const saved = localStorage.getItem('healthcarePatients');
    console.log('Loading patients from localStorage:', saved);
    if (saved) {
        storedPatients = JSON.parse(saved);
        console.log('Loaded patients:', storedPatients);
    } else {
        console.log('No saved patients found');
        // Add some sample patients for demonstration
        storedPatients = [
            {
                id: 'patient-1',
                fullName: 'John Smith',
                email: 'john.smith@email.com',
                phone: '+1 (555) 123-4567',
                dateOfBirth: '1985-03-15',
                gender: 'Male',
                address: '123 Main St, New York, NY',
                medicalHistory: 'No known allergies. Regular check-ups.',
                createdAt: new Date().toISOString()
            },
            {
                id: 'patient-2',
                fullName: 'Sarah Johnson',
                email: 'sarah.j@company.com',
                phone: '+1 (555) 234-5678',
                dateOfBirth: '1990-07-22',
                gender: 'Female',
                address: '456 Oak Ave, Los Angeles, CA',
                medicalHistory: 'Allergic to penicillin. Diabetes type 2.',
                createdAt: new Date().toISOString()
            }
        ];
        saveStoredPatients();
    }
};

// Load appointments from localStorage
const loadStoredAppointments = () => {
    const saved = localStorage.getItem('healthcareAppointments');
    console.log('Loading appointments from localStorage:', saved);
    if (saved) {
        storedAppointments = JSON.parse(saved);
        console.log('Loaded appointments:', storedAppointments);
    } else {
        console.log('No saved appointments found');
    }
};

        

        // Save appointments to localStorage
        const saveStoredAppointments = () => {
            localStorage.setItem('healthcareAppointments', JSON.stringify(storedAppointments));
        };

        // Save patients to localStorage
        const saveStoredPatients = () => {
            localStorage.setItem('healthcarePatients', JSON.stringify(storedPatients));
        };

        // Add new appointment to storage
        const addAppointment = (appointmentData) => {
            console.log('=== ADDING NEW APPOINTMENT ===');
            console.log('Input appointment data:', appointmentData);
            console.log('Current selectedDate:', selectedDate);
            console.log('Selected date formatted:', formatDateForStorage(selectedDate));

            const formattedDate = formatDateForStorage(appointmentData.appointmentDate);
            console.log('Appointment date from form:', appointmentData.appointmentDate);
            console.log('Appointment date formatted for storage:', formattedDate);

            const newAppointment = {
                id: `appointment-${Date.now()}`,
                time: appointmentData.appointmentTime,
                duration: 30, // Default duration
                clientName: appointmentData.patientName,
                clientPhone: appointmentData.patientPhone,
                clientEmail: appointmentData.patientEmail || '',
                type: appointmentData.appointmentType,
                status: 'pre-validation',
                notes: appointmentData.appointmentNotes || '',
                doctor: appointmentData.doctorName,
                date: formattedDate
            };

            console.log('New appointment object:', newAppointment);
            storedAppointments.push(newAppointment);
            saveStoredAppointments();
            console.log('Total appointments after adding:', storedAppointments.length);
            console.log('All stored appointments:', storedAppointments);
            console.log('=== APPOINTMENT ADDED ===');
            
            // Update cabinet cash display after adding appointment
            if (typeof updateCabinetCashDisplay === 'function') {
                updateCabinetCashDisplay();
            }
            
            // Update today's summary after adding appointment
            if (typeof updateTodaySummary === 'function') {
                updateTodaySummary();
            }
            
            // Update waiting room after adding appointment
            if (typeof updateWaitingRoom === 'function') {
                updateWaitingRoom();
            }
            
            return newAppointment;
        };

        // Function to get consultations count for a specific date
        const getConsultationsForDate = (date) => {
            const dateStr = formatDateForStorage(date);
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            
            const consultationsForDate = consultations.filter(consultation => {
                const consultationDate = new Date(consultation.createdAt);
                const consultationDateStr = consultationDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                return consultationDateStr === dateStr;
            });
            
            return consultationsForDate.length;
        };

        // Function to get cash entry (bills total) for a specific date
        const getCashEntryForDate = (date) => {
            const dateStr = formatDateForStorage(date);
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            
            const billsForDate = bills.filter(bill => bill.billDate === dateStr);
            const totalCashEntry = billsForDate.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
            
            return totalCashEntry;
        };

        // Function to get expenses for a specific date
        const getExpensesForDate = (date) => {
            const dateStr = formatDateForStorage(date);
            const expenses = JSON.parse(localStorage.getItem('healthcareExpenses') || '[]');
            
            const expensesForDate = expenses.filter(expense => {
                // Handle both date formats (ISO string and date string)
                const expenseDate = expense.date ? expense.date.split('T')[0] : null;
                return expenseDate === dateStr;
            });
            const totalExpenses = expensesForDate.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
            
            return totalExpenses;
        };

        // Function to get net cabinet cash for a specific date
        const getCabinetCashForDate = (date) => {
            const cashEntry = getCashEntryForDate(date);
            const expenses = getExpensesForDate(date);
            return cashEntry - expenses;
        };

        // Get appointments for a specific date
        const getAppointmentsForDate = (date) => {
            const dateStr = formatDateForStorage(date);

            console.log('=== GETTING APPOINTMENTS FOR DATE ===');
            console.log('Requested date object:', date);
            console.log('Requested date formatted:', dateStr);
            console.log('Total stored appointments:', storedAppointments.length);

            // Debug each stored appointment's date
            storedAppointments.forEach((apt, index) => {
                console.log(`Appointment ${index + 1}: date="${apt.date}", matches="${apt.date === dateStr}"`);
            });

            // Get stored appointments for this date
            const storedForDate = storedAppointments.filter(apt => {
                const matches = apt.date === dateStr;
                console.log(`Checking appointment ${apt.id}: stored date="${apt.date}" vs requested="${dateStr}" = ${matches}`);
                return matches;
            });

            console.log('Filtered appointments for this date:', storedForDate);
            console.log('=== END GETTING APPOINTMENTS ===');

            // Return only stored appointments, sorted by time
            return storedForDate.sort((a, b) => a.time.localeCompare(b.time));
        };


        // Utility functions
        const formatDate = (date) => {
            // Get current language from i18n system or fallback to English
            const currentLang = localStorage.getItem('app_lang') || 'en';
            const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';
            
            return date.toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'pre-validation': return 'bg-orange-100 text-orange-800';
                case 'validated': return 'bg-green-100 text-green-800';
                case 'cancelled': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        const getTypeColor = (type) => {
            switch (type.toLowerCase()) {
                case 'consultation': return 'bg-blue-100 text-blue-800';
                case 'meeting': return 'bg-purple-100 text-purple-800';
                case 'interview': return 'bg-indigo-100 text-indigo-800';
                case 'follow-up': return 'bg-orange-100 text-orange-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        // Get status action buttons for appointment cards
        const getStatusActions = (appointment) => {
            const actions = [];

            switch (appointment.status) {
                case 'pre-validation':
                    actions.push(`
                        <button onclick="updateAppointmentStatus('${appointment.id}', 'validated')" 
                                class="btn btn-sm bg-green-600 hover:bg-green-700 text-white">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            ${window.t ? window.t('confirm', 'Confirm') : 'Confirm'}
                        </button>
                    `);
                    actions.push(`
                        <button onclick="updateAppointmentStatus('${appointment.id}', 'cancelled')" 
                                class="btn btn-sm bg-red-600 hover:bg-red-700 text-white">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            ${window.t ? window.t('cancel', 'Cancel') : 'Cancel'}
                        </button>
                    `);
                    break;

                case 'validated':

                    actions.push(`
                        <button onclick="updateAppointmentStatus('${appointment.id}', 'cancelled')" 
                                class="btn btn-sm bg-red-600 hover:bg-red-700 text-white">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            ${window.t ? window.t('cancel', 'Cancel') : 'Cancel'}
                        </button>
                    `);
                    break;



                case 'cancelled':
                    actions.push(`
                        <span class="text-sm text-red-600 font-medium">
                            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            ${window.t ? window.t('cancelled', 'Cancelled') : 'Cancelled'}
                        </span>
                    `);
                    break;
            }

            return actions.join('');
        };

        // Generate time slots
        const generateTimeSlots = () => {
            const slots = [];
            for (let hour = 8; hour < 18; hour++) {
                slots.push(`${hour}:00`);
                slots.push(`${hour}:30`);
            }
            return slots;
        };

        // Return a set of unavailable times for a given date (exclude cancelled)
        const getUnavailableTimesForDate = (dateStr) => {
            if (!dateStr) return new Set();
            const unavailable = new Set(
                (storedAppointments || [])
                    .filter(apt => apt.date === dateStr && apt.status !== 'cancelled')
                    .map(apt => apt.time)
            );
            return unavailable;
        };

        // Populate the time select with only available slots for the selected date
        const populateAvailableTimes = () => {
            const dateInput = document.getElementById('appointmentDate');
            const timeSelect = document.getElementById('appointmentTime');
            if (!dateInput || !timeSelect) return;

            // Compute selected date string
            const selectedDateStr = dateInput.value || (selectedDate ? formatDateForStorage(selectedDate) : '');

            // Generate options
            const allSlots = generateTimeSlots();
            const unavailable = getUnavailableTimesForDate(selectedDateStr);

            // Rebuild options list
            timeSelect.innerHTML = '';
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = window.t ? window.t('select_time', 'Select time') : 'Select time';
            timeSelect.appendChild(placeholder);

            allSlots
                .filter(slot => !unavailable.has(slot))
                .forEach(slot => {
                    const opt = document.createElement('option');
                    opt.value = slot;
                    // Display in HH:MM (24h) to match agenda; keep as-is
                    opt.textContent = slot;
                    timeSelect.appendChild(opt);
                });
        };

        // Create appointment card HTML
        const createAppointmentCard = (appointment) => {
            const statusActions = getStatusActions(appointment);

            return `
                <div class="card appointment-card p-4">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <svg class="icon" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            <span class="font-medium">${appointment.time}</span>
                            <span class="text-sm text-gray-500">(${appointment.duration} ${window.t ? window.t('min', 'min') : 'min'})</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="badge ${getStatusColor(appointment.status)}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2">
                            <svg class="icon" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span class="font-medium">${appointment.clientName}</span>
                            <span class="badge badge-outline ${getTypeColor(appointment.type)}">${window.t ? window.t(appointment.type.toLowerCase().replace(/\s+/g, '_'), appointment.type) : appointment.type}</span>
                        </div>
                        ${appointment.doctor ? `
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <svg class="icon-sm" viewBox="0 0 24 24">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                                </svg>
                                <span><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${appointment.doctor}</span>
                            </div>
                        ` : ''}
                        <div class="flex flex-col gap-1 text-sm text-gray-500">
                            ${appointment.clientPhone ? `
                                <div class="flex items-center gap-2">
                                    <svg class="icon-sm" viewBox="0 0 24 24">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>
                                    <span>${appointment.clientPhone}</span>
                                </div>
                            ` : ''}
                            ${appointment.clientEmail ? `
                                <div class="flex items-center gap-2">
                                    <svg class="icon-sm" viewBox="0 0 24 24">
                                        <rect width="20" height="16" x="2" y="4" rx="2"/>
                                        <path d="m22 7-10 5L2 7"/>
                                    </svg>
                                    <span>${appointment.clientEmail}</span>
                                </div>
                            ` : ''}
                        </div>
                        ${appointment.notes ? `
                            <div class="mt-2 p-2 bg-gray-50 rounded-md">
                                <p class="text-sm">${appointment.notes}</p>
                            </div>
                        ` : ''}
                        ${statusActions ? `
                            <div class="mt-3 pt-3 border-t border-gray-200">
                                <div class="flex gap-2">
                                    ${statusActions}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        };
        // Render daily agenda
        const renderDailyAgenda = () => {
            console.log('Rendering daily agenda for date:', selectedDate);
            console.log('Selected date formatted for storage:', formatDateForStorage(selectedDate));
            const appointments = getAppointmentsForDate(selectedDate);
            console.log('Appointments to render:', appointments);
            console.log('Total stored appointments:', storedAppointments.length);
            const timeSlots = generateTimeSlots();

            const appointmentCount = appointments.length;
            const preValidationCount = appointments.filter(apt => apt.status === 'pre-validation').length;
            const confirmedCount = appointments.filter(apt => apt.status === 'validated').length;
            const cancelledCount = appointments.filter(apt => apt.status === 'cancelled').length;
            const consultationsCount = getConsultationsForDate(selectedDate);
            const cashEntryAmount = getCashEntryForDate(selectedDate);
            const expensesAmount = getExpensesForDate(selectedDate);
            const cabinetCashAmount = getCabinetCashForDate(selectedDate);

            let agendaHTML = `
                <div class="space-y-4">
                    <div class="card p-6">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <svg class="icon-lg" viewBox="0 0 24 24">
                                    <path d="M8 2v4"/>
                                    <path d="M16 2v4"/>
                                    <rect width="18" height="18" x="3" y="4" rx="2"/>
                                    <path d="M3 10h18"/>
                                </svg>
                                <h2 class="text-xl font-semibold">${formatDate(selectedDate)}</h2>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-primary inline-flex items-center" onclick="showAddAppointmentModal()" title="${window.t ? window.t('add_appointment', 'Add Appointment') : 'Add Appointment'}">
                                <svg class="icon mr-2" viewBox="0 0 24 24">
                                    <path d="M12 4v16M20 12H4" />
                                </svg>
                                    ${window.t ? window.t('add_appointment', 'Add Appointment') : 'Add Appointment'}
                                </button>
                                <button class="btn btn-outline inline-flex items-center" onclick="showPatientManagement()" title="${window.t ? window.t('add_new_patient', 'Add New Patient') : 'Add New Patient'}">
                                    <svg class="icon mr-2" viewBox="0 0 24 24">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    ${window.t ? window.t('add_new_patient', 'Add New Patient') : 'Add New Patient'}
                            </button>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-2 flex-wrap">
                            <span class="badge badge-secondary text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('total', 'Total') : 'Total'}</span>
                                <span class="font-semibold">${appointmentCount}</span>
                            </span>
                            <span class="badge bg-orange-100 text-orange-800 text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('pre_validation', 'Pre-validation') : 'Pre-validation'}</span>
                                <span class="font-semibold">${preValidationCount}</span>
                            </span>
                            <span class="badge bg-green-100 text-green-800 text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('validated', 'Validated') : 'Validated'}</span>
                                <span class="font-semibold">${confirmedCount}</span>
                            </span>
                            <span class="badge bg-red-100 text-red-800 text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('cancelled', 'Cancelled') : 'Cancelled'}</span>
                                <span class="font-semibold">${cancelledCount}</span>
                            </span>
                            <span class="badge bg-purple-100 text-purple-800 text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('consultations_done', 'Consultations Done') : 'Consultations Done'}</span>
                                <span class="font-semibold">${consultationsCount}</span>
                            </span>
                            <span class="badge bg-blue-100 text-blue-800 text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('cash_entry', 'Cash Entry') : 'Cash Entry'}</span>
                                <span class="font-semibold">${cashEntryAmount.toFixed(2)} TND</span>
                            </span>
                            <span class="badge bg-gray-100 text-gray-800 text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('expenses', 'Expenses') : 'Expenses'}</span>
                                <span class="font-semibold">${expensesAmount.toFixed(2)} TND</span>
                            </span>
                            <span class="badge bg-indigo-100 text-indigo-800 text-sm px-3 py-2 flex flex-col items-center rounded-none">
                                <span class="text-xs">${window.t ? window.t('cabinet_cash', 'Cabinet Cash') : 'Cabinet Cash'}</span>
                                <span class="font-semibold">${cabinetCashAmount.toFixed(2)} TND</span>
                            </span>
                        </div>
                    </div>
            `;

            if (appointmentCount === 0) {
                // Show empty state when no appointments
                agendaHTML += `
                    <div class="card p-8 text-center">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <h3 class="text-lg font-semibold text-gray-600 mb-2">${window.t ? window.t('no_appointments_today', 'No Appointments Scheduled') : 'No Appointments Scheduled'}</h3>
                        <p class="text-gray-500 mb-4">${window.t ? window.t('no_appointments_for_date', 'There are no appointments scheduled for') : 'There are no appointments scheduled for'} ${formatDate(selectedDate)}.</p>
                    </div>
                `;
            } else {
                // Show appointments in time slots
                agendaHTML += '<div class="space-y-2 current-time-container" id="currentTimeContainer">';

                timeSlots.forEach((timeSlot, index) => {
                    const slotAppointments = appointments.filter(apt => apt.time === timeSlot);

                    agendaHTML += `
                    <div class="time-slot">
                        <div class="time-label">
                            <svg class="icon-sm" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            ${timeSlot}
                        </div>
                        <div class="slot-content" data-slot-index="${index}">
                `;

                    if (slotAppointments.length > 0) {
                        slotAppointments.forEach(appointment => {
                            agendaHTML += createAppointmentCard(appointment);
                        });
                    } else {
                        agendaHTML += `<div class="available-slot">${window.t ? window.t('available', 'Available') : 'Available'}</div>`;
                    }

                    agendaHTML += '</div></div>';
                });

                agendaHTML += '</div>';
            }

            agendaHTML += '</div>';

            document.getElementById('dailyAgenda').innerHTML = agendaHTML;

            // Draw and update current time indicator if the selected date is today
            try {
                const container = document.getElementById('currentTimeContainer');
                if (container && isSameDay(selectedDate, new Date())) {
                    const update = () => renderOrUpdateCurrentTimeLine(container);
                    update();
                    // Update every minute
                    if (window.__currentTimeInterval) clearInterval(window.__currentTimeInterval);
                    window.__currentTimeInterval = setInterval(update, 60000);
                    // Also update on scroll within the agenda container to keep the line pinned correctly
                    container.addEventListener('scroll', update, { passive: true });
                } else {
                    if (window.__currentTimeInterval) clearInterval(window.__currentTimeInterval);
                }
            } catch {}
        };

        // Function to update today's summary with today's data only
        const updateTodaySummary = () => {
            const today = new Date();
            const todayStr = formatDateForStorage(today);
            
            // Get all appointments for today only
            const todayAppointments = storedAppointments.filter(apt => apt.date === todayStr);
            
            const appointmentCount = todayAppointments.length;
            const preValidationCount = todayAppointments.filter(apt => apt.status === 'pre-validation').length;
            const confirmedCount = todayAppointments.filter(apt => apt.status === 'validated').length;
            const cancelledCount = todayAppointments.filter(apt => apt.status === 'cancelled').length;

            // Update stats
            document.getElementById('totalAppointments').textContent = appointmentCount;
            document.getElementById('preValidationAppointments').textContent = preValidationCount;
            document.getElementById('confirmedAppointments').textContent = confirmedCount;
            const cancelledEl = document.getElementById('cancelledAppointments');
            if (cancelledEl) cancelledEl.textContent = cancelledCount;
        };

        // Expose updateTodaySummary to global scope
        window.updateTodaySummary = updateTodaySummary;

        // Function to update waiting room with today's validated appointments
        const updateWaitingRoom = () => {
            const today = new Date();
            const todayStr = formatDateForStorage(today);
            
            // Get all validated appointments for today only
            const waitingAppointments = storedAppointments.filter(apt => 
                apt.date === todayStr && apt.status === 'validated'
            );
            
            const waitingRoomCountEl = document.getElementById('waitingRoomCount');
            const waitingRoomListEl = document.getElementById('waitingRoomList');
            
            if (waitingRoomCountEl) {
                waitingRoomCountEl.textContent = waitingAppointments.length;
            }
            
            if (waitingRoomListEl) {
                if (waitingAppointments.length === 0) {
                    waitingRoomListEl.innerHTML = `
                        <p class="text-gray-500 text-center py-4" data-translate="no_patients_waiting">
                            ${window.t ? window.t('no_patients_waiting', 'No patients waiting') : 'No patients waiting'}
                        </p>
                    `;
                } else {
                    waitingRoomListEl.innerHTML = waitingAppointments.map(appointment => `
                        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">${appointment.clientName}</div>
                                    <div class="text-sm text-gray-500">${appointment.time}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="badge bg-green-100 text-green-800 text-xs">${window.t ? window.t('validated', 'Validated') : 'Validated'}</span>
                            </div>
                        </div>
                    `).join('');
                }
                
                // Apply translations to the newly added content
                if (typeof applyTranslations === 'function') {
                    applyTranslations(waitingRoomListEl);
                }
            }
        };

        // Expose updateWaitingRoom to global scope
        window.updateWaitingRoom = updateWaitingRoom;

        function isSameDay(a, b) {
            return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
        }

        // Compute Y offset for current time within 08:00-18:00 grid built from 30-min slots
        function computeCurrentTimeOffsetPx(container) {
            const startHour = 8; // matches generateTimeSlots
            const endHour = 18;
            const now = new Date();
            const minutesSinceStart = (now.getHours() - startHour) * 60 + now.getMinutes();
            const totalMinutes = (endHour - startHour) * 60;
            // If outside schedule, do not show
            if (minutesSinceStart < 0 || minutesSinceStart > totalMinutes) return null;
            const clamped = minutesSinceStart;

            // Measure slots by summing heights of .time-slot blocks to avoid overlay issues
            const slots = Array.from(container.querySelectorAll('.time-slot'));
            if (slots.length === 0) return null;
            const containerTop = container.getBoundingClientRect().top;
            const top = slots[0].getBoundingClientRect().top;
            const bottom = slots[slots.length - 1].getBoundingClientRect().bottom;
            const usableHeight = bottom - top;
            if (usableHeight <= 0) return null;

            const ratio = clamped / totalMinutes;
            return (top - containerTop) + usableHeight * ratio;
        }

        function renderOrUpdateCurrentTimeLine(container) {
            let line = container.querySelector('.current-time-line');
            let badge = container.querySelector('.current-time-badge');
            if (!line) {
                line = document.createElement('div');
                line.className = 'current-time-line';
                container.appendChild(line);
            }
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'current-time-badge';
                container.appendChild(badge);
            }

            const y = computeCurrentTimeOffsetPx(container);
            if (y == null) {
                // hide when out of range
                if (line) line.style.display = 'none';
                if (badge) badge.style.display = 'none';
                return;
            }
            line.style.display = 'block';
            badge.style.display = 'block';
            line.style.top = `${y}px`;
            badge.style.top = `${y}px`;
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            badge.textContent = `${hh}:${mm}`;
        }

        // Calendar functions
        const renderCalendar = () => {
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();

            // Get current language from i18n system or fallback to English
            const currentLang = localStorage.getItem('app_lang') || 'en';
            const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';

            document.getElementById('currentMonthYear').textContent =
                currentCalendarDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            const calendarGrid = document.getElementById('calendarGrid');
            calendarGrid.innerHTML = '';

            // Add day headers based on current language
            let dayHeaders;
            if (currentLang === 'fr') {
                dayHeaders = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Dim, Lun, Mar, Mer, Jeu, Ven, Sam
            } else {
                dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // English
            }
            dayHeaders.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'text-center text-sm font-medium text-gray-500 p-2';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });

            // Add calendar days
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);

                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = date.getDate();

                if (date.getMonth() !== month) {
                    dayElement.className += ' text-gray-300';
                }

                if (date.toDateString() === selectedDate.toDateString()) {
                    dayElement.className += ' selected';
                }

                dayElement.onclick = () => {
                    selectedDate = new Date(date);
                    renderCalendar();
                    renderDailyAgenda();
                };

                calendarGrid.appendChild(dayElement);
            }
        };

        // Expose renderCalendar to global scope for language switching
        window.renderCalendar = renderCalendar;

        // Function to calculate today's cabinet cash from bills
        const calculateTodayCabinetCash = () => {
            try {
                const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
                const today = new Date();
                // Use local date string format (YYYY-MM-DD) instead of UTC
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                const todayBills = bills.filter(bill => {
                    // Use billDate (set on bill creation) instead of createdAt
                    return bill.billDate === todayStr;
                });
                
                const todayTotal = todayBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
                const billCount = todayBills.length;
                
                return {
                    total: todayTotal,
                    count: billCount,
                    bills: todayBills
                };
            } catch (error) {
                console.error('Error calculating today\'s cabinet cash:', error);
                return { total: 0, count: 0, bills: [] };
            }
        };

        // Function to update cabinet cash display
        const updateCabinetCashDisplay = () => {
            const cashData = calculateTodayCabinetCash();
            const expensesData = calculateTodayExpenses();
            const netCash = cashData.total - expensesData;
            const cashDisplay = document.getElementById('cabinetCashDisplay');
            
            if (cashDisplay) {
                cashDisplay.innerHTML = `
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex flex-col">
                            <div class="text-sm text-gray-500 mb-1" data-translate="cabinet_cash">Cabinet Cash</div>
                            <div class="text-2xl font-bold text-blue-600 mb-1">${netCash.toFixed(2)} TND</div>
                            <div class="text-sm text-gray-400">${cashData.count} <span data-translate="bills_today">bills today</span></div>
                        </div>
                        <svg class="w-12 h-12 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </div>
                    <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-600" data-translate="cash_entry">Cash Entry</span>
                        </div>
                        <div class="font-semibold text-gray-800">${cashData.total.toFixed(2)} TND</div>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-600" data-translate="expenses">Expenses</span>
                        </div>
                        <div class="font-semibold text-gray-800">${expensesData.toFixed(2)} TND</div>
                    </div>
                `;
                
                // Apply translations to the newly added content
                if (typeof applyTranslations === 'function') {
                    applyTranslations(cashDisplay);
                }
            }
        };

        // Expose functions to global scope
        window.calculateTodayCabinetCash = calculateTodayCabinetCash;
        window.updateCabinetCashDisplay = updateCabinetCashDisplay;

        // Navigation functions
        const goToPreviousDay = () => {
            selectedDate.setDate(selectedDate.getDate() - 1);
            renderCalendar();
            renderDailyAgenda();
        };

        const goToNextDay = () => {
            selectedDate.setDate(selectedDate.getDate() + 1);
            renderCalendar();
            renderDailyAgenda();
        };

        const goToToday = () => {
            selectedDate = new Date();
            currentCalendarDate = new Date();
            renderCalendar();
            renderDailyAgenda();
        };

        const previousMonth = () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        };

        const nextMonth = () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        };

        // Mobile menu toggle function
        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        }

        // Modal functions
        function showAddAppointmentModal() {
            const modal = document.getElementById('addAppointmentModal');
            modal.classList.add('active');

            // Set minimum date to today
            const dateInput = document.getElementById('appointmentDate');
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;

            // Populate patient dropdown
            populatePatientDropdown();

            // If a date is already selected in the agenda, default the modal date and times
            try {
                if (!dateInput.value && selectedDate) {
                    dateInput.value = formatDateForStorage(selectedDate);
                }
            } catch {}

            // Populate available times for the selected date
            populateAvailableTimes();

            // Update modal translations
            updateModalTranslations();

            // Reset form and hide patient details
            resetAppointmentForm();

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');
        }

        function closeAddAppointmentModal() {
            const modal = document.getElementById('addAppointmentModal');
            modal.classList.remove('active');

            // Reset form
            resetAppointmentForm();
        }

        // Patient selection functions
        function populatePatientDropdown() {
            const patientSelect = document.getElementById('patientSelection');
            patientSelect.innerHTML = `<option value="">${window.t ? window.t('choose_patient', 'Choose a patient...') : 'Choose a patient...'}</option>`;

            if (storedPatients.length === 0) {
                patientSelect.innerHTML = `<option value="">${window.t ? window.t('no_patients_available', 'No patients available. Add a patient first.') : 'No patients available. Add a patient first.'}</option>`;
                return;
            }

            storedPatients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.fullName} (${patient.fileNumber || 'No file#'}) - ${patient.phone}`;
                patientSelect.appendChild(option);
            });
        }

        function handlePatientSelection() {
            const patientSelect = document.getElementById('patientSelection');
            const selectedPatientId = patientSelect.value;
            const patientDetailsDiv = document.getElementById('selectedPatientDetails');

            if (!selectedPatientId) {
                // No patient selected
                patientDetailsDiv.classList.add('hidden');
                clearPatientData();
                return;
            }

            // Find the selected patient
            const selectedPatient = storedPatients.find(patient => patient.id === selectedPatientId);

            if (selectedPatient) {
                // Display patient details
                displayPatientDetails(selectedPatient);

                // Populate hidden inputs
                populatePatientData(selectedPatient);

                // Show patient details section
                patientDetailsDiv.classList.remove('hidden');
            }
        }

        function displayPatientDetails(patient) {
            document.getElementById('displayPatientName').textContent = patient.fullName;
            document.getElementById('displayPatientEmail').textContent = patient.email;
            document.getElementById('displayPatientPhone').textContent = patient.phone;

            // Calculate and display age
            const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
            document.getElementById('displayPatientAge').textContent = age;
        }

        function populatePatientData(patient) {
            document.getElementById('patientName').value = patient.fullName;
            document.getElementById('patientEmail').value = patient.email;
            document.getElementById('patientPhone').value = patient.phone;
        }

        function clearPatientData() {
            document.getElementById('patientName').value = '';
            document.getElementById('patientEmail').value = '';
            document.getElementById('patientPhone').value = '';
            // Clear doctor name as well
            const doctorField = document.getElementById('doctorName');
            if (doctorField) {
                doctorField.value = '';
            }
        }

        function resetAppointmentForm() {
            document.getElementById('appointmentForm').reset();
            document.getElementById('selectedPatientDetails').classList.add('hidden');
            clearPatientData();
            // Reset time options to current date availability
            populateAvailableTimes();
        }





        // Medical file functionality restored

        function viewPatientFiles(patientId) {
            const patient = storedPatients.find(p => p.id === patientId);
            if (!patient || !patient.medicalFiles || patient.medicalFiles.length === 0) {
                showTranslatedAlert('no_medical_files');
                return;
            }

            // Create modal for viewing files
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 class="modal-title" data-translate="medical_files">Medical Files - ${patient.fullName}</h2>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="space-y-4">
                        ${patient.medicalFiles.map(file => `
                            <div class="file-item">
                                <div class="file-info">
                                    <div class="file-icon ${file.name.split('.').pop().toLowerCase()}">${file.name.split('.').pop().toUpperCase()}</div>
                                    <div class="file-details">
                                        <h4>${file.name}</h4>
                                        <p>Uploaded ${new Date(file.uploadedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Update translations for the new modal
            updateModalTranslations();

            // Close modal when clicking outside
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.remove();
                }
            });
        }

        function displayCurrentFiles(files) {
            const currentFilesDiv = document.getElementById('editCurrentFiles');

            if (!files || files.length === 0) {
                currentFilesDiv.innerHTML = '<p class="text-gray-500 text-sm">No medical files attached.</p>';
                return;
            }

            currentFilesDiv.innerHTML = files.map(file => `
                <div class="current-file-item">
                    <div class="current-file-info">
                        <div class="file-icon ${file.name.split('.').pop().toLowerCase()}">${file.name.split('.').pop().toUpperCase()}</div>
                        <div class="file-details">
                            <h4>${file.name}</h4>
                            <p>Uploaded ${new Date(file.uploadedAt).toLocaleString()}</p>
                        </div>
                        <span class="current-file-label">${window.t ? window.t('current_file', 'Current File') : 'Current File'}</span>
                    </div>
                </div>
            `).join('');
        }

        function handleEditFileUpload(event) {
            // Basic file upload handler - files will be stored as empty for now
            const files = Array.from(event.target.files);

            files.forEach(file => {
                const fileData = {
                    id: `edit-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    file: file,
                    uploadedAt: new Date().toISOString()
                };

                editModeNewFiles.push(fileData);
            });

            // Clear the input
            event.target.value = '';
            showTranslatedAlert('files_selected', files.length);
        }


        // Patient Management Functions

        function closeEditPatientModal() {
            const modal = document.getElementById('editPatientModal');
            modal.classList.remove('active');

            // Reset form
            document.getElementById('editPatientForm').reset();

            // Clear edit mode variables
            editingPatient = null;
            editModeNewFiles = [];
            editModeRemovedFiles = [];

            // Clear file displays
            const curFilesEl = document.getElementById('editCurrentFiles');
            if (curFilesEl) curFilesEl.innerHTML = '';
            const newFilesEl = document.getElementById('editFileList');
            if (newFilesEl) newFilesEl.innerHTML = '';
        }

        // Close modal when clicking outside
        document.addEventListener('click', function (event) {
            const modal = document.getElementById('addAppointmentModal');
            if (event.target === modal) {
                closeAddAppointmentModal();
            }
        });

        // Handle form submission
        document.getElementById('appointmentForm').addEventListener('submit', function (event) {
            event.preventDefault();

            // Get form data
            const formData = {
                patientName: document.getElementById('patientName').value,
                patientEmail: document.getElementById('patientEmail').value,
                patientPhone: document.getElementById('patientPhone').value,
                appointmentDate: document.getElementById('appointmentDate').value,
                appointmentTime: document.getElementById('appointmentTime').value,
                doctorName: document.getElementById('doctorName').value,
                appointmentType: document.getElementById('appointmentType').value,
                appointmentNotes: document.getElementById('appointmentNotes').value
            };

            // Validate form data
            if (!validateAppointmentForm(formData)) {
                return;
            }

            // Add appointment to storage
            console.log('About to add appointment with data:', formData);
            const newAppointment = addAppointment(formData);
            console.log('New appointment created:', newAppointment);

            // Show success message
            showAppointmentSuccess(formData);

            // Force refresh the agenda display
            console.log('Refreshing agenda after appointment creation...');
            renderDailyAgenda();
            renderCalendar();

            // Close modal and reset form
            closeAddAppointmentModal();
        });

        // Update available times when the appointment date changes
        document.addEventListener('DOMContentLoaded', function () {
            const dateInput = document.getElementById('appointmentDate');
            if (dateInput) {
                dateInput.addEventListener('change', populateAvailableTimes);
            }
        });

        function validateAppointmentForm(data) {
            // Check if patient is selected
            const patientSelect = document.getElementById('patientSelection');
            if (!patientSelect.value) {
                showTranslatedAlert('select_patient_appointment');
                return false;
            }

            // Basic validation
            if (!data.patientName || !data.patientPhone ||
                !data.appointmentDate || !data.appointmentTime || !data.appointmentType) {
                showTranslatedAlert('fill_required_fields');
                return false;
            }

            // Email validation (if provided)
            if (data.patientEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.patientEmail)) {
                    showTranslatedAlert('valid_email');
                    return false;
                }
            }

            // Date validation (not in the past)
            const selectedDate = new Date(data.appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                showTranslatedAlert('future_date');
                return false;
            }

            return true;
        }
        function showAppointmentSuccess(data) {
            // Create success message
            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #059669;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #065f46; margin: 0;">${window.t ? window.t('appointment_added_successfully', 'Appointment Added Successfully!') : 'Appointment Added Successfully!'}</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
                        <p><strong>${window.t ? window.t('patient', 'Patient') : 'Patient'}:</strong> ${data.patientName}</p>
                        <p><strong>${window.t ? window.t('date', 'Date') : 'Date'}:</strong> ${new Date(data.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>${window.t ? window.t('time', 'Time') : 'Time'}:</strong> ${data.appointmentTime}</p>
                        <p><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${data.doctorName}</p>
                        <p><strong>${window.t ? window.t('type', 'Type') : 'Type'}:</strong> ${data.appointmentType}</p>
                    </div>
                    <p style="font-size: 0.875rem; color: #059669; margin: 0;">
                        ${window.t ? window.t('appointment_added_to_system', 'The appointment has been added to the system. You can view it in the agenda.') : 'The appointment has been added to the system. You can view it in the agenda.'}
                    </p>
                </div>
            `;

            // Insert success message at the top of the main content
            const mainContent = document.querySelector('.max-w-7xl');
            const existingSuccess = mainContent.querySelector('.appointment-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'appointment-success';
            successDiv.innerHTML = successMessage;
            mainContent.insertBefore(successDiv, mainContent.firstChild);

            // Scroll to success message
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Remove success message after 1 second
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 1000);

            // Refresh the agenda to show the new appointment
            renderDailyAgenda();
        }

        // Update appointment status
        function updateAppointmentStatus(appointmentId, newStatus) {
            console.log('Updating appointment status:', appointmentId, 'to', newStatus);

            // Find the appointment in stored appointments
            const appointmentIndex = storedAppointments.findIndex(apt => apt.id === appointmentId);

            if (appointmentIndex !== -1) {
                // Update the status
                storedAppointments[appointmentIndex].status = newStatus;

                // Save to localStorage
                saveStoredAppointments();

                // Show success message
                showStatusUpdateMessage(storedAppointments[appointmentIndex], newStatus);

                // Refresh the agenda
                renderDailyAgenda();
                
                // Update today's summary after status change
                if (typeof updateTodaySummary === 'function') {
                    updateTodaySummary();
                }
                
                // Update waiting room after status change
                if (typeof updateWaitingRoom === 'function') {
                    updateWaitingRoom();
                }
            } else {
                console.error('Appointment not found:', appointmentId);
                showTranslatedAlert('appointment_not_found');
            }
        }

        // Show status update success message
        function showStatusUpdateMessage(appointment, newStatus) {
            const statusMessages = {
                'validated': window.t ? window.t('appointment_validated_successfully', 'Appointment validated successfully!') : 'Appointment validated successfully!',
                'cancelled': window.t ? window.t('appointment_cancelled_successfully', 'Appointment cancelled successfully!') : 'Appointment cancelled successfully!'
            };

            const statusColors = {
                'validated': '#059669',
                'cancelled': '#dc2626'
            };

            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid ${statusColors[newStatus]}; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${statusColors[newStatus]};">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: ${statusColors[newStatus]}; margin: 0;">${statusMessages[newStatus]}</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #374151; margin-bottom: 0.75rem;">
                        <p><strong>${window.t ? window.t('patient', 'Patient') : 'Patient'}:</strong> ${appointment.clientName}</p>
                        <p><strong>${window.t ? window.t('time', 'Time') : 'Time'}:</strong> ${appointment.time}</p>
                        <p><strong>${window.t ? window.t('status', 'Status') : 'Status'}:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: 600;">${window.t ? window.t(newStatus.toLowerCase(), newStatus.charAt(0).toUpperCase() + newStatus.slice(1)) : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
                    </div>
                </div>
            `;

            // Insert success message at the top of the main content
            const mainContent = document.querySelector('.max-w-7xl');
            const existingSuccess = mainContent.querySelector('.status-update-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'status-update-success';
            successDiv.innerHTML = successMessage;
            mainContent.insertBefore(successDiv, mainContent.firstChild);

            // Scroll to success message
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Remove success message after 1 second
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 1000);
        }

        // Patient Management Functions
        function showPatientManagement(fromMenu = false) {
            // Check permission
            if (!hasPermission('view_patients')) {
                alert('You do not have permission to access patient management.');
                return;
            }
            
            const modal = document.getElementById('patientManagementModal');
            modal.classList.add('active');

            // Update modal title based on context
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                if (fromMenu) {
                    modalTitle.textContent = 'Patient Management';
                } else {
                    modalTitle.textContent = 'Patient Addition';
                }
            }

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');

            // Hide all buttons if called from menu
            const addPatientButton = document.getElementById('addPatientTab');
            const viewPatientsButton = document.getElementById('viewPatientsTab');
            const buttonContainer = addPatientButton?.parentElement;
            
            if (fromMenu) {
                // Hide the entire button container when called from menu
                if (buttonContainer) {
                    buttonContainer.style.display = 'none';
                }
                // Switch to view patients tab
                switchPatientTab('view');
            } else {
                // Show buttons when called from other places
                if (buttonContainer) {
                    buttonContainer.style.display = 'flex';
                }
                if (addPatientButton) {
                    addPatientButton.style.display = 'inline-flex';
                }
                if (viewPatientsButton) {
                    viewPatientsButton.style.display = 'inline-flex';
                }
            }

            // Load patients list
            loadPatientsList();

            // Update modal translations
            updateModalTranslations();

            // Set initial tab state based on context
            if (!fromMenu) {
                // When not from menu, ensure we're on the Add tab
                switchPatientTab('add');
            }

            // Auto-generate file number on open (Add tab)
            const fileNumEl = document.getElementById('patientFileNumber');
            if (fileNumEl) {
                fileNumEl.value = generatePatientFileNumber();
                fileNumEl.readOnly = true;
            }
        }

        function closePatientManagement() {
            const modal = document.getElementById('patientManagementModal');
            modal.classList.remove('active');

            // Reset form
            document.getElementById('patientForm').reset();


            // Switch back to add patient tab
            switchPatientTab('add');
        }

        function switchPatientTab(tab) {
            const addContent = document.getElementById('addPatientContent');
            const viewContent = document.getElementById('viewPatientsContent');
            const addTab = document.getElementById('addPatientTab');
            const viewTab = document.getElementById('viewPatientsTab');
            const modal = document.getElementById('patientManagementModal');
            const modalTitle = modal?.querySelector('.modal-title');

            if (tab === 'add') {
                addContent.style.display = 'block';
                viewContent.style.display = 'none';
                addTab.className = 'btn btn-primary';
                viewTab.className = 'btn btn-secondary';
                // Update modal title
                if (modalTitle) {
                    modalTitle.textContent = 'Patient Addition';
                }
                // Ensure file number is generated when switching back to Add tab
                const fileNumEl = document.getElementById('patientFileNumber');
                if (fileNumEl) {
                    fileNumEl.value = generatePatientFileNumber();
                    fileNumEl.readOnly = true;
                }
            } else {
                addContent.style.display = 'none';
                viewContent.style.display = 'block';
                addTab.className = 'btn btn-secondary';
                viewTab.className = 'btn btn-primary';
                // Update modal title
                if (modalTitle) {
                    modalTitle.textContent = 'Patient Management';
                }
                loadPatientsList();
            }
        }

        // Patient Details Modal Functions
        let currentPatientDetailsId = null;

        // Toggle accordion function
        window.toggleAccordion = function(accordionId) {
            const accordion = document.getElementById(accordionId);
            if (!accordion) return;
            
            const isHidden = accordion.classList.contains('hidden');
            
            if (isHidden) {
                accordion.classList.remove('hidden');
                // Rotate icon
                const iconId = accordionId + 'Icon';
                const icon = document.getElementById(iconId);
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                accordion.classList.add('hidden');
                // Reset icon rotation
                const iconId = accordionId + 'Icon';
                const icon = document.getElementById(iconId);
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        };

        function viewPatientDetails(patientId) {
            currentPatientDetailsId = patientId;
            const modal = document.getElementById('patientDetailsModal');
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const patient = patients.find(p => p.id === patientId);
            
            if (!patient) {
                alert('Patient not found.');
                return;
            }

            // Calculate number of visits (consultations)
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const visitsCount = consultations.filter(c => c.patientId === patientId).length;

            // Load patient information
            const patientDetailsInfo = document.getElementById('patientDetailsInfo');
            const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
            const filesCount = patient.medicalFiles ? patient.medicalFiles.length : 0;
            
            patientDetailsInfo.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('full_name', 'Full Name') : 'Full Name'}:</span>
                        <span class="text-gray-900">${patient.fullName || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('file_number', 'File Number') : 'File Number'}:</span>
                        <span class="text-gray-900">${patient.fileNumber || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('cin_passport', 'CIN/Passport') : 'CIN/Passport'}:</span>
                        <span class="text-gray-900">${patient.cinPassport || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('email', 'Email') : 'Email'}:</span>
                        <span class="text-gray-900">${patient.email || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('phone', 'Phone') : 'Phone'}:</span>
                        <span class="text-gray-900">${patient.phone || 'N/A'}</span>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('date_of_birth', 'Date of Birth') : 'Date of Birth'}:</span>
                        <span class="text-gray-900">${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('age', 'Age') : 'Age'}:</span>
                        <span class="text-gray-900">${age}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('gender', 'Gender') : 'Gender'}:</span>
                        <span class="text-gray-900">${patient.gender ? (window.t ? window.t(patient.gender.toLowerCase(), patient.gender) : patient.gender) : 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('address', 'Address') : 'Address'}:</span>
                        <span class="text-gray-900">${patient.address || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('number_of_visits', 'Number of Visits') : 'Number of Visits'}:</span>
                        <span class="font-bold text-blue-600">${visitsCount}</span>
                    </div>
                    ${patient.medicalHistory ? `
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('medical_history', 'Medical History') : 'Medical History'}:</span>
                        <span class="text-gray-900">${patient.medicalHistory}</span>
                    </div>
                    ` : ''}
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('registered', 'Registered') : 'Registered'}:</span>
                        <span class="text-gray-900">${new Date(patient.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            `;

            // Load past consultations
            loadPatientConsultations(patientId);

            // Load past bills
            loadPatientBills(patientId);

            // Load patient documents
            loadPatientDocuments(patientId);

            // Load medical files if any
            if (filesCount > 0) {
                const filesSection = document.getElementById('patientFilesSection');
                const filesList = document.getElementById('patientFilesList');
                filesSection.style.display = 'block';
                
                filesList.innerHTML = patient.medicalFiles.map((file, index) => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-sm font-medium">${file.name}</span>
                        </div>
                        <button onclick="downloadPatientFile('${patientId}', ${index})" class="btn btn-sm btn-outline">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                        </button>
                    </div>
                `).join('');
            } else {
                document.getElementById('patientFilesSection').style.display = 'none';
            }

            modal.classList.add('active');
        }

        function loadPatientConsultations(patientId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const patientConsultations = consultations.filter(c => c.patientId === patientId).sort((a, b) => new Date(b.date) - new Date(a.date));
            const consultationsList = document.getElementById('patientConsultationsList');

            if (patientConsultations.length === 0) {
                consultationsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p data-translate="no_consultations">No consultations recorded for this patient yet.</p>
                    </div>
                `;
                return;
            }

            consultationsList.innerHTML = patientConsultations.map(consultation => {
                const consultationDate = new Date(consultation.date).toLocaleDateString();
                const consultationTime = new Date(consultation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="font-semibold text-gray-900">${consultationDate} at ${consultationTime}</span>
                                </div>
                                <div class="text-sm text-gray-600 ml-7">
                                    <strong data-translate="doctor">Doctor:</strong> ${consultation.doctorName || 'N/A'}
                                </div>
                            </div>
                            <span class="badge badge-secondary">ID: ${consultation.id}</span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                            ${consultation.height ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('height', 'Height') : 'Height'}:</strong> ${consultation.height} cm</span>
                                </div>
                            ` : ''}
                            ${consultation.weight ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('weight', 'Weight') : 'Weight'}:</strong> ${consultation.weight} kg</span>
                                </div>
                            ` : ''}
                            ${consultation.bloodPressure ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('blood_pressure', 'BP') : 'BP'}:</strong> ${consultation.bloodPressure}</span>
                                </div>
                            ` : ''}
                            ${consultation.temperature ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('temperature', 'Temp') : 'Temp'}:</strong> ${consultation.temperature}°C</span>
                                </div>
                            ` : ''}
                        </div>

                        ${consultation.reason ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="reason">Reason:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.reason}</p>
                            </div>
                        ` : ''}

                        ${consultation.diagnosis ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="diagnosis">Diagnosis:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.diagnosis}</p>
                            </div>
                        ` : ''}

                        ${consultation.clinicalExam ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="clinical_examination">Clinical Examination:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.clinicalExam}</p>
                            </div>
                        ` : ''}

                        ${consultation.prescription ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="prescription">Prescription:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.prescription}</p>
                            </div>
                        ` : ''}

                        ${consultation.labTests && consultation.labTests.length > 0 ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="lab_tests">Lab Tests:</span>
                                <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                    ${consultation.labTests.map(test => `<li>${test}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${consultation.notes ? `
                            <div>
                                <span class="font-semibold text-gray-700" data-translate="notes">Notes:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }

        function loadPatientBills(patientId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const patientBills = bills.filter(b => b.patientId === patientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const billsList = document.getElementById('patientBillsList');

            if (patientBills.length === 0) {
                billsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
                        </svg>
                        <p data-translate="no_bills">No bills recorded for this patient yet.</p>
                    </div>
                `;
                return;
            }

            billsList.innerHTML = patientBills.map(bill => {
                const billDate = new Date(bill.billDate).toLocaleDateString();
                const dueDate = new Date(bill.dueDate).toLocaleDateString();
                const createdDate = new Date(bill.createdAt).toLocaleDateString();
                
                // Status badge styling
                let statusClass = 'bg-yellow-100 text-yellow-800';
                if (bill.status === 'Paid') {
                    statusClass = 'bg-green-100 text-green-800';
                } else if (bill.status === 'Overdue') {
                    statusClass = 'bg-red-100 text-red-800';
                } else if (bill.status === 'Cancelled') {
                    statusClass = 'bg-gray-100 text-gray-800';
                }
                
                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span class="font-semibold text-gray-900" data-translate="bill_id">Bill ID:</span>
                                    <span class="font-semibold text-gray-900 ml-1">${bill.id}</span>
                                </div>
                                <div class="text-sm text-gray-600 ml-7">
                                    <strong data-translate="bill_date">Bill Date:</strong> ${billDate}
                                </div>
                                <div class="text-sm text-gray-600 ml-7">
                                    <strong data-translate="due_date">Due Date:</strong> ${dueDate}
                                </div>
                            </div>
                            <span class="badge ${statusClass} px-3 py-1 rounded-full text-xs font-semibold">
                                ${window.t ? window.t(bill.status.toLowerCase(), bill.status) : bill.status}
                            </span>
                        </div>
                        
                        <!-- Bill Items -->
                        <div class="mb-3">
                            <span class="font-semibold text-gray-700" data-translate="bill_items">Bill Items:</span>
                            <div class="mt-2 space-y-2">
                                ${bill.items.map(item => `
                                    <div class="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                        <div>
                                            <span class="font-medium">${item.description}</span>
                                            <span class="text-gray-500 ml-2">(${window.t ? window.t('qty', 'Qty') : 'Qty'}: ${item.quantity})</span>
                                        </div>
                                        <span class="font-semibold">${(item.price * item.quantity).toFixed(2)} TND</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Bill Summary -->
                        <div class="border-t pt-3 space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600" data-translate="subtotal">Subtotal:</span>
                                <span class="font-medium">${bill.subtotal.toFixed(2)} TND</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600" data-translate="tax">Tax:</span>
                                <span class="font-medium">${bill.tax.toFixed(2)} TND</span>
                            </div>
                            <div class="flex justify-between text-base font-bold border-t pt-2">
                                <span data-translate="total">Total:</span>
                                <span class="text-blue-600">${bill.total.toFixed(2)} TND</span>
                            </div>
                        </div>

                        ${bill.notes ? `
                            <div class="mt-3 pt-3 border-t">
                                <span class="font-semibold text-gray-700 text-sm" data-translate="notes">Notes:</span>
                                <p class="text-gray-600 text-sm mt-1">${bill.notes}</p>
                            </div>
                        ` : ''}

                        <div class="mt-3 pt-3 border-t flex justify-between items-center">
                            <span class="text-xs text-gray-500">
                                <span data-translate="created_on">Created on:</span> ${createdDate}
                            </span>
                            <button onclick="viewBillDetails('${bill.id}')" class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                <span data-translate="view_full_bill">View Full Bill</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function loadPatientDocuments(patientId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            const labAssessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
            const documentsList = document.getElementById('patientDocumentsList');
            
            if (!documentsList) return;
            
            // Collect all documents for this patient
            const allDocuments = [];
            
            // Get certificates for this patient
            const patientCertificates = certificates.filter(cert => cert.patientId === patientId);
            patientCertificates.forEach(cert => {
                const certType = cert.certType ? cert.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Medical Certificate';
                allDocuments.push({
                    type: 'certificate',
                    title: certType,
                    id: cert.id,
                    date: cert.createdAt,
                    data: cert,
                    consultationId: cert.consultationId || ''
                });
            });
            
            // Get lab assessments from consultations
            const patientConsultations = consultations.filter(c => c.patientId === patientId);
            patientConsultations.forEach(consultation => {
                // Get lab assessments linked to this consultation
                const consultationLabAssessments = labAssessments.filter(lab => lab.consultationId === consultation.id);
                consultationLabAssessments.forEach(lab => {
                    allDocuments.push({
                        type: 'lab',
                        title: 'Lab Result',
                        id: lab.id,
                        date: lab.createdAt,
                        consultationId: consultation.id,
                        data: lab
                    });
                });
                
                // Only include prescription as a patient document (exclude consultation notes)
                if (consultation.prescription) {
                    allDocuments.push({
                        type: 'prescription',
                        title: 'Prescription',
                        id: `consultation-${consultation.id}`,
                        date: consultation.createdAt,
                        consultationId: consultation.id,
                        data: consultation
                    });
                }
            });
            
            // Sort by date (newest first)
            allDocuments.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (allDocuments.length === 0) {
                documentsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p data-translate="no_documents_found">No documents found for this patient.</p>
                    </div>
                `;
                return;
            }
            
            documentsList.innerHTML = allDocuments.map(doc => {
                const docDate = new Date(doc.date);
                let docIcon = '';
                let bgColor = 'bg-gray-50';
                
                switch(doc.type) {
                    case 'certificate':
                        docIcon = '<svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                        bgColor = 'bg-blue-50';
                        break;
                    case 'lab':
                        docIcon = '<svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>';
                        bgColor = 'bg-green-50';
                        break;
                    case 'prescription':
                        docIcon = '<svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>';
                        bgColor = 'bg-purple-50';
                        break;
                    case 'notes':
                        docIcon = '<svg class="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
                        bgColor = 'bg-orange-50';
                        break;
                }
                
                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${bgColor} cursor-pointer" onclick="previewPatientDocument('${doc.type}', '${doc.id}', '${doc.consultationId || ''}')">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center">
                                ${docIcon}
                                <span class="font-semibold text-gray-900">${doc.title}</span>
                            </div>
                            <span class="text-xs text-gray-500">${docDate.toLocaleDateString()} ${docDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="text-sm text-gray-600 mt-2 flex justify-between items-center">
                            <span>
                                <strong data-translate="document_id">Document ID:</strong> ${doc.id}
                            </span>
                            <span class="text-blue-600 text-xs font-medium" data-translate="click_to_preview">Click to preview</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        // Preview patient document
        window.previewPatientDocument = function(docType, docId, consultIdFromDoc) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            const labAssessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
            const modal = document.getElementById('patientDocumentPreviewModal');
            const previewContent = document.getElementById('patientDocumentPreviewContent');
            
            if (!modal || !previewContent) {
                alert('Preview feature not available.');
                return;
            }
            
            let documentData = null;
            let documentTitle = '';
            let documentHTML = '';
            
            // Get document based on type
            switch(docType) {
                case 'certificate':
                    documentData = certificates.find(cert => cert.id === docId);
                    if (documentData) {
                        const certType = documentData.certType ? documentData.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Medical Certificate';
                        documentTitle = certType;
                        // Extract certificate details
                        documentHTML = `
                            <div class="space-y-4">
                                <div class="border-b pb-3">
                                    <h4 class="font-semibold text-lg mb-2">${documentTitle}</h4>
                                    <div class="text-sm text-gray-600">
                                        <strong>ID:</strong> ${documentData.id}<br>
                                        <strong>Date:</strong> ${new Date(documentData.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                
                                ${documentData.patientName ? `
                                    <div>
                                        <strong class="text-gray-700">Patient Name:</strong>
                                        <p class="text-gray-900">${documentData.patientName}</p>
                                    </div>
                                ` : ''}
                                
                                ${documentData.certType ? `
                                    <div>
                                        <strong class="text-gray-700">Certificate Type:</strong>
                                        <p class="text-gray-900">${certType}</p>
                                    </div>
                                ` : ''}
                                
                                ${documentData.restPeriod ? `
                                    <div>
                                        <strong class="text-gray-700">Rest Period:</strong>
                                        <p class="text-gray-900">${documentData.restPeriod} ${window.t ? window.t('days', 'days') : 'days'}</p>
                                    </div>
                                ` : ''}
                                
                                ${documentData.startDate || documentData.endDate ? `
                                    <div class="grid grid-cols-2 gap-4">
                                        ${documentData.startDate ? `
                                    <div>
                                                <strong class="text-gray-700">Start Date:</strong>
                                                <p class="text-gray-900">${new Date(documentData.startDate).toLocaleDateString()}</p>
                                    </div>
                                ` : ''}
                                        ${documentData.endDate ? `
                                    <div>
                                                <strong class="text-gray-700">End Date:</strong>
                                                <p class="text-gray-900">${new Date(documentData.endDate).toLocaleDateString()}</p>
                                    </div>
                                ` : ''}
                                    </div>
                                ` : ''}
                                
                                ${documentData.notes ? `
                                    <div>
                                        <strong class="text-gray-700">Notes:</strong>
                                        <p class="text-gray-900">${documentData.notes}</p>
                                    </div>
                                ` : ''}
                                
                                ${documentData.doctorName ? `
                                    <div class="mt-4 pt-3 border-t">
                                        <strong class="text-gray-700">Doctor:</strong>
                                        <p class="text-gray-900">${documentData.doctorName}</p>
                                    </div>
                                ` : ''}
                                
                                <div class="mt-4 pt-3 border-t">
                                    <button onclick="printMedicalCertificate('${documentData.id}')" class="btn btn-primary">
                                        <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                        </svg>
                                        ${window.t ? window.t('print_certificate', 'Print Certificate') : 'Print Certificate'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    break;
                    
                case 'lab':
                    documentData = labAssessments.find(lab => lab.id === docId);
                    if (documentData) {
                        documentTitle = 'Lab Result';
                        const labDate = new Date(documentData.createdAt).toLocaleString();
                        documentHTML = `
                            <div class="space-y-4">
                                <div class="border-b pb-3">
                                    <h4 class="font-semibold text-lg mb-2">${documentTitle}</h4>
                                    <div class="text-sm text-gray-600">
                                        <strong>ID:</strong> ${documentData.id}<br>
                                        <strong>Date:</strong> ${labDate}
                                    </div>
                                </div>
                                
                                ${documentData.testName ? `
                                    <div>
                                        <strong class="text-gray-700">Test Name:</strong>
                                        <p class="text-gray-900">${documentData.testName}</p>
                                    </div>
                                ` : ''}
                                
                                ${documentData.results ? `
                                    <div>
                                        <strong class="text-gray-700">Results:</strong>
                                        <div class="bg-gray-50 p-3 rounded mt-2">
                                            <pre class="text-sm text-gray-900 whitespace-pre-wrap">${documentData.results}</pre>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${documentData.referenceRange ? `
                                    <div>
                                        <strong class="text-gray-700">Reference Range:</strong>
                                        <p class="text-gray-900">${documentData.referenceRange}</p>
                                    </div>
                                ` : ''}
                                
                                ${documentData.notes ? `
                                    <div>
                                        <strong class="text-gray-700">Notes:</strong>
                                        <p class="text-gray-900">${documentData.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }
                    break;
                    
                case 'prescription':
                case 'notes':
                    // Get consultation data
                    const consultationId = docId.replace('consultation-', '');
                    documentData = consultations.find(c => c.id === consultationId);
                    if (documentData) {
                        documentTitle = docType === 'prescription' ? 'Prescription' : 'Consultation Notes';
                        const consultDate = new Date(documentData.createdAt).toLocaleString();
                        documentHTML = `
                            <div class="space-y-4">
                                <div class="border-b pb-3">
                                    <h4 class="font-semibold text-lg mb-2">${documentTitle}</h4>
                                    <div class="text-sm text-gray-600">
                                        <strong>Consultation ID:</strong> ${documentData.id}<br>
                                        <strong>Date:</strong> ${consultDate}
                                    </div>
                                </div>
                                
                                ${docType === 'prescription' && documentData.prescription ? `
                                    <div>
                                        <strong class="text-gray-700">Prescription:</strong>
                                        <div class="bg-gray-50 p-3 rounded mt-2">
                                            <pre class="text-sm text-gray-900 whitespace-pre-wrap">${documentData.prescription}</pre>
                                        </div>
                                        <div class="mt-4 pt-3 border-t">
                                            <button class="btn btn-primary" onclick="printPrescription('${documentData.id}')">
                                                <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                                </svg>
                                                ${window.t ? window.t('print_prescription', 'Print Prescription') : 'Print Prescription'}
                                            </button>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${docType === 'notes' && documentData.notes ? `
                                    <div>
                                        <strong class="text-gray-700">Notes:</strong>
                                        <div class="bg-gray-50 p-3 rounded mt-2">
                                            <pre class="text-sm text-gray-900 whitespace-pre-wrap">${documentData.notes}</pre>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${documentData.doctor ? `
                                    <div class="mt-4 pt-3 border-t">
                                        <strong class="text-gray-700">Doctor:</strong>
                                        <p class="text-gray-900">${documentData.doctor}</p>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }
                    break;
            }
            
            if (!documentData) {
                alert('Document not found.');
                return;
            }
            
            previewContent.innerHTML = documentHTML;
            modal.classList.add('active');
        };

        // Close patient document preview modal
        window.closePatientDocumentPreviewModal = function() {
            const modal = document.getElementById('patientDocumentPreviewModal');
            if (modal) {
                modal.classList.remove('active');
            }
        };

        function viewBillDetails(billId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const bill = bills.find(b => b.id === billId);
            
            if (!bill) {
                alert('Bill not found.');
                return;
            }

            // Use existing bill display function if available, or show in alert
            if (typeof showPrintableBill === 'function') {
                showPrintableBill(bill);
            } else {
                // Fallback to simple display
                alert(`Bill ID: ${bill.id}\nTotal: ${bill.total.toFixed(2)} TND\nStatus: ${bill.status}`);
            }
        }

        function closePatientDetailsModal() {
            const modal = document.getElementById('patientDetailsModal');
            modal.classList.remove('active');
            currentPatientDetailsId = null;
        }

        function editPatientFromDetails() {
            if (currentPatientDetailsId) {
                closePatientDetailsModal();
                editPatient(currentPatientDetailsId);
            }
        }

        function downloadPatientFile(patientId, fileIndex) {
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const patient = patients.find(p => p.id === patientId);
            
            if (patient && patient.medicalFiles && patient.medicalFiles[fileIndex]) {
                const file = patient.medicalFiles[fileIndex];
                const link = document.createElement('a');
                link.href = file.data;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        // Handle patient form submission
        document.getElementById('patientForm').addEventListener('submit', function (event) {
            event.preventDefault();

            // Get form data
            const formData = {
                fileNumber: document.getElementById('patientFileNumber').value,
                cinPassport: document.getElementById('patientCinPassport').value,
                fullName: document.getElementById('patientFullName').value,
                email: document.getElementById('patientEmailAddress').value,
                phone: document.getElementById('patientPhoneNumber').value,
                dateOfBirth: document.getElementById('patientDateOfBirth').value,
                gender: document.getElementById('patientGender').value,
                address: document.getElementById('patientAddress').value,
                medicalHistory: document.getElementById('patientMedicalHistory').value
            };

            // Validate form data
            if (!validatePatientForm(formData)) {
                return;
            }

            // Add patient to storage
            const newPatient = addPatient(formData);

            // Show success message
            showPatientSuccess(newPatient);

            // Switch to 'View All Patients' to show the updated list
            switchPatientTab('view');

            // After the list renders, scroll to the new card and highlight it briefly
            setTimeout(() => {
                const newCard = document.getElementById(`patient-card-${newPatient.id}`);
                if (newCard) {
                    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add a temporary highlight using ring and bg utility classes
                    newCard.classList.add('ring-2', 'ring-blue-500', 'bg-yellow-50');
                    setTimeout(() => {
                        newCard.classList.remove('ring-2', 'ring-blue-500', 'bg-yellow-50');
                    }, 2500);
                }
            }, 100);

            // Reset form (for next time)
            document.getElementById('patientForm').reset();
            // Pre-fill a fresh generated file number for the next entry
            const fileNumEl = document.getElementById('patientFileNumber');
            if (fileNumEl) {
                fileNumEl.value = generatePatientFileNumber();
                fileNumEl.readOnly = true;
            }
        });

        // Handle edit patient form submission
        document.getElementById('editPatientForm').addEventListener('submit', function (event) {
            event.preventDefault();

            // Get form data
            const formData = {
                // File number is immutable; always use the original value
                fileNumber: (editingPatient && editingPatient.fileNumber) || document.getElementById('editPatientFileNumber').value,
                cinPassport: document.getElementById('editPatientCinPassport').value,
                fullName: document.getElementById('editPatientFullName').value,
                email: document.getElementById('editPatientEmailAddress').value,
                phone: document.getElementById('editPatientPhoneNumber').value,
                dateOfBirth: document.getElementById('editPatientDateOfBirth').value,
                gender: document.getElementById('editPatientGender').value,
                address: document.getElementById('editPatientAddress').value,
                medicalHistory: document.getElementById('editPatientMedicalHistory').value
            };

            // Validate form data
            if (!validateEditPatientForm(formData)) {
                return;
            }

            // Update patient
            updatePatient(formData);
        });

        function validatePatientForm(data) {
            // Basic validation
            if (!data.fileNumber || !data.cinPassport || !data.fullName || !data.phone || !data.dateOfBirth) {
                showTranslatedAlert('fill_required_patient_fields');
                return false;
            }

            // Normalize inputs for consistent comparisons
            data.cinPassport = (data.cinPassport || '').trim();
            data.email = (data.email || '').trim().toLowerCase();

            // Email validation (if provided) - only format check, duplicates allowed
            if (data.email && data.email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    showTranslatedAlert('valid_email');
                    return false;
                }
            }

            // Ensure unique file number: if duplicate, auto-generate a new unique one and update the form
            try {
                const lsPatients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                const existingSet = new Set([
                    ...((storedPatients || []).map(p => p && p.fileNumber).filter(Boolean)),
                    ...(lsPatients.map(p => p && p.fileNumber).filter(Boolean))
                ]);

                if (existingSet.has(data.fileNumber)) {
                    let newNum = generatePatientFileNumber();
                    // Extra safety: loop until unique in case state changed
                    while (existingSet.has(newNum)) {
                        const m = /^P-(\d{4})-(\d{3,})$/i.exec(newNum);
                        const y = new Date().getFullYear();
                        const nextSeq = m ? (parseInt(m[2], 10) + 1) : (existingSet.size + 1);
                        newNum = `P-${y}-${String(nextSeq).padStart(3, '0')}`;
                    }
                    data.fileNumber = newNum;
                    const fileNumEl = document.getElementById('patientFileNumber');
                    if (fileNumEl) fileNumEl.value = newNum;
                    // No blocking alert; proceed with the unique number
                }
            } catch {}

            // CIN/Passport validation removed - duplicates are allowed

            return true;
        }

        function validateEditPatientForm(data) {
            // Basic validation
            if (!data.fileNumber || !data.cinPassport || !data.fullName || !data.phone || !data.dateOfBirth) {
                showTranslatedAlert('fill_required_patient_fields');
                return false;
            }

            // Normalize inputs for consistent comparisons
            data.cinPassport = (data.cinPassport || '').trim();
            data.email = (data.email || '').trim().toLowerCase();

            // Email validation (if provided) - only format check, duplicates allowed
            if (data.email && data.email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    showTranslatedAlert('valid_email');
                    return false;
                }
            }

            // Check for duplicate file number (excluding current patient)
            const existingFileNumber = storedPatients.find(patient => patient.fileNumber === data.fileNumber && patient.id !== editingPatient.id);
            if (existingFileNumber) {
                showTranslatedAlert('file_number_exists');
                return false;
            }

            // CIN/Passport validation removed - duplicates are allowed

            return true;
        }

        function updatePatient(formData) {
            if (!editingPatient) {
                showTranslatedAlert('no_patient_selected');
                return;
            }



            // Process new files
            const newFilesPromises = editModeNewFiles.map(fileData => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        resolve({
                            id: fileData.id,
                            name: fileData.name,
                            size: fileData.size,
                            type: fileData.type,
                            uploadedAt: fileData.uploadedAt,
                            data: e.target.result
                        });
                    };
                    reader.readAsDataURL(fileData.file);
                });
            });

            // Wait for new files to be processed
            Promise.all(newFilesPromises).then(newFilesData => {
                // Get current files (excluding removed ones)
                const currentFiles = (editingPatient.medicalFiles || []).filter(file =>
                    !editModeRemovedFiles.includes(file.id)
                );

                // Combine current files with new files
                const updatedFiles = [...currentFiles, ...newFilesData];

                // Update patient data
                const updatedPatient = {
                    ...editingPatient,
                    fileNumber: formData.fileNumber,
                    cinPassport: (formData.cinPassport || '').trim(),
                    fullName: formData.fullName,
                    email: (formData.email || '').trim().toLowerCase(),
                    phone: formData.phone,
                    dateOfBirth: formData.dateOfBirth || '',
                    gender: formData.gender || '',
                    address: formData.address || '',
                    medicalHistory: formData.medicalHistory || '',
                    medicalFiles: updatedFiles,
                    updatedAt: new Date().toISOString()
                };

                // Find and update patient in storage
                const patientIndex = storedPatients.findIndex(p => p.id === editingPatient.id);
                if (patientIndex !== -1) {
                    storedPatients[patientIndex] = updatedPatient;
                    saveStoredPatients();

                    // Show success message
                    showEditPatientSuccess(updatedPatient);

                    // Close modal
                    closeEditPatientModal();

                    // Refresh patient list
                    loadPatientsList();
                } else {
                    showTranslatedAlert('patient_not_found_storage');
                }
            });
        }

        function showEditPatientSuccess(patient) {
            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #059669;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #065f46; margin: 0;">Patient Updated Successfully!</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
                        <p><strong>Name:</strong> ${patient.fullName}</p>
                        <p><strong>Email:</strong> ${patient.email}</p>
                        <p><strong>Phone:</strong> ${patient.phone}</p>
                    </div>
                    <p style="font-size: 0.875rem; color: #059669; margin: 0;">
                        The patient information has been updated successfully.
                    </p>
                </div>
            `;

            // Insert success message at the top of the patient management modal content
            const modalContent = document.querySelector('#patientManagementModal .modal-content');
            const existingSuccess = modalContent.querySelector('.edit-patient-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'edit-patient-success';
            successDiv.innerHTML = successMessage;
            modalContent.insertBefore(successDiv, modalContent.children[1]);

            // Remove success message after 5 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 5000);
        }

        function addPatient(patientData) {
            // Check permission
            if (!hasPermission('add_patients')) {
                alert('You do not have permission to add patients.');
                return;
            }
            
            const newPatient = {
                id: `patient-${Date.now()}`,
                fileNumber: patientData.fileNumber,
                // Store trimmed CIN/Passport to avoid accidental whitespace differences
                cinPassport: (patientData.cinPassport || '').trim(),
                fullName: patientData.fullName,
                // Normalize email for storage
                email: (patientData.email || '').trim().toLowerCase(),
                phone: patientData.phone,
                dateOfBirth: patientData.dateOfBirth || '',
                gender: patientData.gender || '',
                address: patientData.address || '',
                medicalHistory: patientData.medicalHistory || '',
                medicalFiles: [], // No medical files for new patients
                createdAt: new Date().toISOString()
            };

            console.log('Adding patient:', newPatient);
            storedPatients.push(newPatient);
            saveStoredPatients();
            console.log('Stored patients:', storedPatients);

            // Return the new patient for the form handler
            return newPatient;
        }

        function showPatientSuccess(patient) {
            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #059669;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #065f46; margin: 0;">Patient Added Successfully!</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
                        <p><strong>Name:</strong> ${patient.fullName}</p>
                        <p><strong>Email:</strong> ${patient.email}</p>
                        <p><strong>Phone:</strong> ${patient.phone}</p>
                    </div>
                    <p style="font-size: 0.875rem; color: #059669; margin: 0;">
                        The patient has been added to the system. You can now schedule appointments for this patient.
                    </p>
                </div>
            `;

            // Insert success message at the top of the modal content
            const modalContent = document.querySelector('#patientManagementModal .modal-content');
            const existingSuccess = modalContent.querySelector('.patient-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'patient-success';
            successDiv.innerHTML = successMessage;
            modalContent.insertBefore(successDiv, modalContent.children[1]);

            // Refresh the appointment form patient dropdown if it's open
            const appointmentModal = document.getElementById('addAppointmentModal');
            if (appointmentModal.classList.contains('active')) {
                populatePatientDropdown();
            }

            // Remove success message after 5 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 5000);
        }

        function loadPatientsList() {
            const patientsList = document.getElementById('patientsList');
            patientsList.innerHTML = '';

            if (storedPatients.length === 0) {
                patientsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <p>No patients found. Add your first patient using the form above.</p>
                    </div>
                `;
                return;
            }

            storedPatients.forEach(patient => {
                const patientCard = createPatientCard(patient);
                patientsList.appendChild(patientCard);
            });
        }

        function createPatientCard(patient) {
            const card = document.createElement('div');
            card.className = 'patient-card';
            card.id = `patient-card-${patient.id}`;

            const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
            const filesCount = patient.medicalFiles ? patient.medicalFiles.length : 0;
            
            // Check permissions for action buttons
            const canEdit = hasPermission('add_patients');
            const canDelete = hasPermission('delete_patients');

            card.innerHTML = `
                <div class="patient-info">
                    <div class="patient-details">
                        <h3>${patient.fullName}</h3>
                        <p><strong>${window.t ? window.t('file_number', 'File Number') : 'File Number'}:</strong> ${patient.fileNumber || 'N/A'}</p>
                        <p><strong>${window.t ? window.t('cin_passport', 'CIN/Passport') : 'CIN/Passport'}:</strong> ${patient.cinPassport || 'N/A'}</p>
                        <p><strong>${window.t ? window.t('email', 'Email') : 'Email'}:</strong> ${patient.email || 'N/A'}</p>
                        <p><strong>${window.t ? window.t('phone', 'Phone') : 'Phone'}:</strong> ${patient.phone}</p>
                        <p><strong>${window.t ? window.t('age', 'Age') : 'Age'}:</strong> ${age} ${patient.gender ? `• ${window.t ? window.t(patient.gender.toLowerCase(), patient.gender) : patient.gender}` : ''}</p>
                        ${patient.address ? `<p><strong>${window.t ? window.t('address', 'Address') : 'Address'}:</strong> ${patient.address}</p>` : ''}
                        ${patient.medicalHistory ? `<p><strong>${window.t ? window.t('medical_history', 'Medical History') : 'Medical History'}:</strong> ${patient.medicalHistory}</p>` : ''}
                        ${filesCount > 0 ? `<p><strong>${window.t ? window.t('medical_files', 'Medical Files') : 'Medical Files'}:</strong> ${filesCount} ${window.t ? window.t('files_attached', 'file(s) attached') : 'file(s) attached'}</p>` : ''}
                        <p><strong>${window.t ? window.t('added', 'Added') : 'Added'}:</strong> ${new Date(patient.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="patient-actions">
                        <button onclick="viewPatientDetails('${patient.id}')" class="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white" data-translate="view_details">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            View Details
                        </button>
                        ${filesCount > 0 ? `
                            <button onclick="viewPatientFiles('${patient.id}')" class="btn btn-sm bg-green-600 hover:bg-green-700 text-white" data-translate="files">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Files
                            </button>
                        ` : ''}
                        ${canEdit ? `
                        <button onclick="editPatient('${patient.id}')" class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white" data-translate="edit">
                            Edit
                        </button>
                        ` : ''}
                        ${false && canDelete ? `
                        <button onclick="deletePatient('${patient.id}')" class="btn btn-sm bg-red-600 hover:bg-red-700 text-white" data-translate="delete">
                            Delete
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;

            return card;
        }

        function calculateAge(dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        }

        // Generate a unique patient file number for the current year, format: P-YYYY-XXX
        function generatePatientFileNumber() {
            const year = new Date().getFullYear();
            let maxSeq = 0;
            // Build a set of existing numbers across both in-memory and localStorage
            const existingNumbers = new Set();
            try {
                const lsPatients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                lsPatients.forEach(p => { if (p && p.fileNumber) existingNumbers.add(p.fileNumber); });
            } catch {}
            try {
                (storedPatients || []).forEach(p => { if (p && p.fileNumber) existingNumbers.add(p.fileNumber); });
            } catch {}

            // Determine the current max sequence for this year
            existingNumbers.forEach(fn => {
                const m = /^P-(\d{4})-(\d{3,})$/i.exec(fn || '');
                    if (m && parseInt(m[1], 10) === year) {
                        const seq = parseInt(m[2], 10);
                        if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
                    }
                });

            // Generate next and ensure uniqueness by incrementing if needed
            let seqNum = maxSeq + 1;
            let candidate = `P-${year}-${String(seqNum).padStart(3, '0')}`;
            while (existingNumbers.has(candidate)) {
                seqNum += 1;
                candidate = `P-${year}-${String(seqNum).padStart(3, '0')}`;
            }
            return candidate;
        }

        function searchPatients() {
            const searchTerm = document.getElementById('patientSearch').value.toLowerCase().trim();
            const patientsList = document.getElementById('patientsList');
            const searchResults = document.getElementById('searchResults');
            const clearButton = document.getElementById('clearSearch');

            // Show/hide clear button based on search input
            if (searchTerm) {
                clearButton.style.display = 'block';
            } else {
                clearButton.style.display = 'none';
            }

            // If search term is empty, show all patients and hide search results
            if (!searchTerm) {
                loadPatientsList();
                searchResults.style.display = 'none';
                return;
            }

            // Filter patients based on search criteria
            const filteredPatients = storedPatients.filter(patient => {
                // Search in full name
                if (patient.fullName && patient.fullName.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in CIN/Passport
                if (patient.cinPassport && patient.cinPassport.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in file number
                if (patient.fileNumber && patient.fileNumber.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in email
                if (patient.email && patient.email.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in phone
                if (patient.phone && patient.phone.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in date of birth (format: YYYY-MM-DD)
                if (patient.dateOfBirth && patient.dateOfBirth.includes(searchTerm)) {
                    return true;
                }

                // Search in formatted date of birth (DD/MM/YYYY or MM/DD/YYYY)
                if (patient.dateOfBirth) {
                    const formattedDate = new Date(patient.dateOfBirth).toLocaleDateString();
                    if (formattedDate.toLowerCase().includes(searchTerm)) {
                        return true;
                    }

                    // Also search in year, month, day separately
                    const dateObj = new Date(patient.dateOfBirth);
                    const year = dateObj.getFullYear().toString();
                    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    const day = dateObj.getDate().toString().padStart(2, '0');

                    if (year.includes(searchTerm) || month.includes(searchTerm) || day.includes(searchTerm)) {
                        return true;
                    }
                }

                return false;
            });

            // Clear and display filtered results
            patientsList.innerHTML = '';

            // Show search results count
            searchResults.style.display = 'block';
            if (filteredPatients.length === 0) {
                searchResults.innerHTML = `No patients found matching "${searchTerm}"`;
                patientsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <p>No patients found matching "${searchTerm}"</p>
                        <p class="text-sm mt-2">Try searching by name, CIN/Passport, file number, email, phone, or date of birth</p>
                    </div>
                `;
            } else {
                const resultText = filteredPatients.length === 1 ?
                    `Found 1 patient matching "${searchTerm}"` :
                    `Found ${filteredPatients.length} patients matching "${searchTerm}"`;
                searchResults.innerHTML = resultText;

                filteredPatients.forEach(patient => {
                    const card = createPatientCard(patient);
                    patientsList.appendChild(card);
                });
            }
        }

        function clearPatientSearch() {
            const searchInput = document.getElementById('patientSearch');
            const searchResults = document.getElementById('searchResults');
            const clearButton = document.getElementById('clearSearch');

            // Clear the search input
            searchInput.value = '';

            // Hide search results and clear button
            searchResults.style.display = 'none';
            clearButton.style.display = 'none';

            // Reload all patients
            loadPatientsList();
        }
        function editPatient(patientId) {
            const patient = storedPatients.find(p => p.id === patientId);
            if (!patient) {
                showTranslatedAlert('patient_not_found');
                return;
            }

            // Set editing patient
            editingPatient = patient;

            // Reset edit mode variables
            editModeNewFiles = [];
            editModeRemovedFiles = [];

            // Populate form with patient data
            document.getElementById('editPatientId').value = patient.id;
            document.getElementById('editPatientFileNumber').value = patient.fileNumber || '';
            // Ensure file number is not editable in Edit mode
            const editFileNumEl = document.getElementById('editPatientFileNumber');
            if (editFileNumEl) {
                editFileNumEl.readOnly = true;
                editFileNumEl.disabled = true;
            }
            document.getElementById('editPatientCinPassport').value = patient.cinPassport || '';
            document.getElementById('editPatientFullName').value = patient.fullName;
            document.getElementById('editPatientEmailAddress').value = patient.email;
            document.getElementById('editPatientPhoneNumber').value = patient.phone;
            document.getElementById('editPatientDateOfBirth').value = patient.dateOfBirth || '';
            document.getElementById('editPatientGender').value = patient.gender || '';
            document.getElementById('editPatientAddress').value = patient.address || '';
            document.getElementById('editPatientMedicalHistory').value = patient.medicalHistory || '';

            // Display current files
            displayCurrentFiles(patient.medicalFiles || []);

            // Clear new files list (guarded; upload UI removed)
            const editFileListEl = document.getElementById('editFileList');
            if (editFileListEl) editFileListEl.innerHTML = '';

            // Show modal
            const modal = document.getElementById('editPatientModal');
            modal.classList.add('active');

            // Update modal translations
            updateModalTranslations();

            // Vitals history rendering removed with UI section
        }

        function deletePatient(patientId) {
            // Check permission
            if (!hasPermission('delete_patients')) {
                alert('You do not have permission to delete patients.');
                return;
            }
            
            const patient = storedPatients.find(p => p.id === patientId);
            if (patient && showTranslatedConfirm('delete_patient_confirm', patient.fullName)) {
                storedPatients = storedPatients.filter(p => p.id !== patientId);
                saveStoredPatients();
                loadPatientsList();
                showTranslatedAlert('patient_deleted');
            }
        }

        function viewPatientFiles(patientId) {
            const patient = storedPatients.find(p => p.id === patientId);
            if (!patient || !patient.medicalFiles || patient.medicalFiles.length === 0) {
                showTranslatedAlert('no_medical_files');
                return;
            }

            // Create modal for viewing files
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 class="modal-title" data-translate="medical_files">Medical Files - ${patient.fullName}</h2>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="space-y-4">
                        ${patient.medicalFiles.map(file => `
                            <div class="file-item">
                                <div class="file-info">
                                    <div class="file-icon ${file.name.split('.').pop().toLowerCase()}">${file.name.split('.').pop().toUpperCase()}</div>
                                    <div class="file-details">
                                        <h4>${file.name}</h4>
                                        <p>${formatFileSize(file.size)} • Uploaded ${new Date(file.uploadedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div class="file-actions">
                                    <button class="btn-preview" onclick="previewStoredFile('${file.id}', '${file.name}', '${file.data}', '${file.type}')" title="Preview">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </button>
                                    <button class="btn-download" onclick="downloadStoredFile('${file.id}', '${file.name}', '${file.data}')" title="Download">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Update translations for the new modal
            updateModalTranslations();

            // Close modal when clicking outside
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.remove();
                }
            });
        }

        function downloadStoredFile(fileId, fileName, fileData) {
            // Convert base64 to blob
            const byteCharacters = atob(fileData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray]);

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // File preview functions
        function previewUploadedFile(fileId) {
            const fileData = uploadedFiles.find(file => file.id === fileId);
            if (fileData) {
                showFilePreview(fileData.name, fileData.file, fileData.type);
            }
        }

        function previewStoredFile(fileId, fileName, fileData, fileType) {
            // Convert base64 to blob
            const byteCharacters = atob(fileData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: fileType });

            showFilePreview(fileName, blob, fileType);
        }

        function showFilePreview(fileName, file, fileType) {
            // Create preview modal
            const modal = document.createElement('div');
            modal.className = 'file-preview-modal';
            modal.innerHTML = `
                <div class="file-preview-content">
                    <div class="file-preview-header">
                        <h3 class="file-preview-title">${fileName}</h3>
                        <div class="file-preview-actions">
                            <button class="btn-close-preview" onclick="this.closest('.file-preview-modal').remove()">&times;</button>
                        </div>
                    </div>
                    <div class="file-preview-body">
                        ${getPreviewContent(fileName, file, fileType)}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Update translations for the new modal
            updateModalTranslations();

            // Close modal when clicking outside
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.remove();
                }
            });

            // Close modal with Escape key
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    modal.remove();
                }
            });
        }

        function getPreviewContent(fileName, file, fileType) {
            const fileExtension = fileName.split('.').pop().toLowerCase();

            // Handle different file types
            if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                // Image preview
                const url = URL.createObjectURL(file);
                return `<img src="${url}" alt="${fileName}" class="file-preview-image" onload="URL.revokeObjectURL('${url}')">`;
            }
            else if (fileType === 'application/pdf' || fileExtension === 'pdf') {
                // PDF preview
                const url = URL.createObjectURL(file);
                return `<iframe src="${url}" class="file-preview-iframe" onload="URL.revokeObjectURL('${url}')"></iframe>`;
            }
            else if (['doc', 'docx'].includes(fileExtension)) {
                // Word document - show unsupported message with download option
                return `
                    <div class="file-preview-unsupported">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3>Preview Not Available</h3>
                        <p>Word documents cannot be previewed in the browser.</p>
                        <p>Please download the file to view it.</p>
                    </div>
                `;
            }
            else {
                // Unsupported file type
                return `
                    <div class="file-preview-unsupported">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3>Preview Not Available</h3>
                        <p>This file type cannot be previewed in the browser.</p>
                        <p>Please download the file to view it.</p>
                    </div>
                `;
            }
        }

        // Billing Functions
        function refreshBillDescriptionSelects() {
            // Refresh all description select elements with latest bill descriptions
            const descriptionSelects = document.querySelectorAll('[id^="itemDescription"]');
            const optionsHTML = getBillDescriptionOptionsHTML();
            
            descriptionSelects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = optionsHTML;
                // Try to restore the previous selection if it still exists
                if (currentValue) {
                    select.value = currentValue;
                }
            });
        }

        function showBillingModal() {
            // Check permission
            if (!hasPermission('create_bills')) {
                alert('You do not have permission to create bills.');
                return;
            }
            
            const modal = document.getElementById('billingModal');
            modal.classList.add('active');
            
            // Update translations after opening modal with a small delay to ensure DOM is ready
            setTimeout(() => {
                if (window.I18n && window.I18n.walkAndTranslate) {
                    window.I18n.walkAndTranslate();
                }
                // Ensure we start with one clean bill item
                resetBillItems();
            }, 100);

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');

            // Update modal translations
            updateModalTranslations();

            // Set default due date
            const today = new Date();
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + 30); // 30 days from today

            document.getElementById('billDueDate').value = dueDate.toISOString().split('T')[0];

            // Reset form
            resetBillingForm();

            // Refresh bill description selects with managed descriptions
            refreshBillDescriptionSelects();

            // Initialize bill total calculation
            calculateBillTotal();
        }

        function closeBillingModal() {
            const modal = document.getElementById('billingModal');
            modal.classList.remove('active');
        }

        function autoFillPrice(selectElement) {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            
            if (price && price !== '0') {
                // Find the price input in the same bill item (third input field)
                const billItem = selectElement.closest('.bill-item');
                const numberInputs = billItem.querySelectorAll('input[type="number"]');
                const priceInput = numberInputs[1]; // Second number input (index 1) is the price field
                if (priceInput) {
                    priceInput.value = price;
                    // Trigger calculation
                    if (typeof calculateBillTotal === 'function') {
                        calculateBillTotal();
                    }
                }
            }
        }

        // Ready Bills (Secretary)
        function showBillingOrReadyBills() {
            try {
                const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
                if (session && (session.role === 'secretary' || session.role === 'doctor')) {
                    showReadyBillsModal();
                    return;
                }
            } catch {}
            showBillingModal();
        }

        function showReadyBillsModal() {
            const modal = document.getElementById('readyBillsModal');
            modal.classList.add('active');
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            // Default to ready bills tab
            switchBillsTab('ready');
        }

        function closeReadyBillsModal() {
            const modal = document.getElementById('readyBillsModal');
            modal.classList.remove('active');
        }

        function switchBillsTab(tab) {
            const readyContent = document.getElementById('readyBillsContent');
            const doneContent = document.getElementById('doneBillsContent');
            const readyTab = document.getElementById('readyBillsTab');
            const doneTab = document.getElementById('doneBillsTab');

            if (tab === 'ready') {
                readyContent.style.display = 'block';
                doneContent.style.display = 'none';
                readyTab.className = 'btn btn-primary';
                doneTab.className = 'btn btn-secondary';
                renderReadyBills();
            } else {
                readyContent.style.display = 'none';
                doneContent.style.display = 'block';
                readyTab.className = 'btn btn-secondary';
                doneTab.className = 'btn btn-primary';
                renderDoneBills();
            }
        }

        function renderReadyBills() {
            const container = document.getElementById('readyBillsContainer');
            if (!container) return;

            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');

            // Get all consultation IDs that already have bills
            const consultationIdsWithBills = new Set(
                bills.filter(b => b.consultationId).map(b => b.consultationId)
            );

            // Filter out consultations where patient no longer exists OR where a bill already exists
            const validConsultations = consultations.filter(c => {
                const patientExists = patients.some(p => p.id === c.patientId);
                const hasBill = consultationIdsWithBills.has(c.id);
                return patientExists && !hasBill;
            });

            // Show most recent first
            const sorted = validConsultations.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (sorted.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-6" data-translate="no_consultations_today">No consultations conducted today.</p>';
                return;
            }

            container.innerHTML = sorted.map(c => {
                const patient = patients.find(p => p.id === c.patientId);
                const patientName = patient ? patient.fullName : 'Unknown Patient';
                const created = new Date(c.createdAt);
                const dateStr = isNaN(created) ? '' : created.toLocaleString();
                const imcStr = (typeof c.imc === 'number' && !isNaN(c.imc)) ? c.imc.toFixed(1) : '-';
                const doctorName = c.doctor || 'Doctor';
                return `
                    <div class="card p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-semibold">${patientName}</div>
                                <div class="text-sm text-gray-600">Consultation • ${dateStr}</div>
                                <div class="text-xs text-gray-500">Doctor: ${doctorName} • BMI: ${imcStr}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button class="btn btn-secondary" onclick="viewConsultationDetails('${c.id}')" data-translate="view">${window.t ? window.t('view', 'View') : 'View'}</button>
                                <button class="btn btn-primary" onclick="createBillFromConsultation('${c.id}')" data-translate="create_bill">${window.t ? window.t('create_bill', 'Create Bill') : 'Create Bill'}</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderDoneBills(searchTerm = '') {
            const container = document.getElementById('doneBillsContainer');
            if (!container) return;

            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');

            // Sort by creation date (newest first)
            let sortedBills = bills.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Apply search filter if provided
            if (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                sortedBills = sortedBills.filter(bill => 
                    bill.patientName.toLowerCase().includes(searchTerm) ||
                    bill.id.toLowerCase().includes(searchTerm) ||
                    bill.status.toLowerCase().includes(searchTerm)
                );
            }

            if (sortedBills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
                        </svg>
                        <p data-translate="no_bills_found">${searchTerm ? 'No bills found matching your search.' : 'No bills have been created yet.'}</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = sortedBills.map(bill => {
                const billDate = new Date(bill.billDate).toLocaleDateString();
                const dueDate = new Date(bill.dueDate).toLocaleDateString();
                const createdDate = new Date(bill.createdAt).toLocaleDateString();
                
                // Status badge styling
                let statusClass = 'bg-yellow-100 text-yellow-800';
                if (bill.status === 'Paid') {
                    statusClass = 'bg-green-100 text-green-800';
                } else if (bill.status === 'Overdue') {
                    statusClass = 'bg-red-100 text-red-800';
                } else if (bill.status === 'Cancelled') {
                    statusClass = 'bg-gray-100 text-gray-800';
                }

                // Get patient info
                const patient = patients.find(p => p.id === bill.patientId);
                const patientFileNumber = patient ? patient.fileNumber : 'N/A';

                return `
                    <div class="card p-4 hover:shadow-lg transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <div>
                                        <span class="font-bold text-gray-900">${bill.patientName}</span>
                                        <span class="text-sm text-gray-500 ml-2">File: ${patientFileNumber}</span>
                                    </div>
                                </div>
                                <div class="ml-7 space-y-1">
                                    <div class="text-sm text-gray-600">
                                        <strong data-translate="bill_id">Bill ID:</strong> ${bill.id}
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        <strong data-translate="bill_date">Bill Date:</strong> ${billDate} | 
                                        <strong data-translate="due_date">Due Date:</strong> ${dueDate}
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        <strong data-translate="created_on">Created:</strong> ${createdDate}
                                    </div>
                                </div>
                            </div>
                            <span class="badge ${statusClass} px-3 py-1 rounded-full text-xs font-semibold ml-4">
                                ${window.t ? window.t(bill.status.toLowerCase(), bill.status) : bill.status}
                            </span>
                        </div>

                        <!-- Bill Items Summary -->
                        <div class="border-t pt-3 mb-3">
                            <div class="text-sm font-semibold text-gray-700 mb-2" data-translate="bill_items">Bill Items (${bill.items.length}):</div>
                            <div class="space-y-1">
                                ${bill.items.slice(0, 3).map(item => `
                                    <div class="text-sm text-gray-600 flex justify-between">
                                        <span>${item.description} <span class="text-gray-400">(x${item.quantity})</span></span>
                                        <span class="font-medium">${(item.price * item.quantity).toFixed(2)} TND</span>
                                    </div>
                                `).join('')}
                                ${bill.items.length > 3 ? `<div class="text-sm text-gray-500 italic">+ ${bill.items.length - 3} more items...</div>` : ''}
                            </div>
                        </div>

                        <!-- Bill Total -->
                        <div class="border-t pt-3 flex justify-between items-center">
                            <div>
                                <div class="text-xs text-gray-500" data-translate="subtotal">Subtotal: ${bill.subtotal.toFixed(2)} TND</div>
                                <div class="text-xs text-gray-500" data-translate="tax">Tax: ${bill.tax.toFixed(2)} TND</div>
                                <div class="text-lg font-bold text-blue-600">
                                    <span data-translate="total">Total:</span> ${bill.total.toFixed(2)} TND
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="viewFullBillDetails('${bill.id}')" class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <span data-translate="view_details">View Details</span>
                                </button>
                                <button onclick="printBill('${bill.id}')" class="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                    </svg>
                                    <span data-translate="print">Print</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function searchDoneBills() {
            const searchInput = document.getElementById('billSearch');
            const searchTerm = searchInput ? searchInput.value : '';
            renderDoneBills(searchTerm);
        }
        function viewFullBillDetails(billId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const bill = bills.find(b => b.id === billId);
            
            if (!bill) {
                alert('Bill not found.');
                return;
            }

            // Use existing bill display function if available
            if (typeof showPrintableBill === 'function') {
                showPrintableBill(bill);
            } else {
                // Fallback to simple display
                alert(`Bill ID: ${bill.id}\nPatient: ${bill.patientName}\nTotal: ${bill.total.toFixed(2)} TND\nStatus: ${bill.status}`);
            }
        }

        function printBill(billId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const bill = bills.find(b => b.id === billId);
            
            if (!bill) {
                alert('Bill not found.');
                return;
            }

            // Use existing bill display function if available
            if (typeof showPrintableBill === 'function') {
                showPrintableBill(bill);
            } else {
                window.print();
            }
        }

        function viewConsultationDetails(consultationId) {
            try {
                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                const c = consultations.find(x => x.id === consultationId);
                if (!c) return;
                // Reuse existing detail modal when available
                const modal = document.getElementById('consultationDetailModal');
                const content = document.getElementById('consultationDetailContent');
                if (modal && content) {
                    const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                    const patient = patients.find(p => p.id === c.patientId);
                    const patientName = patient ? patient.fullName : 'Unknown Patient';
                    content.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><strong>${window.t ? window.t('patient', 'Patient') : 'Patient'}:</strong> ${patientName}</div>
                            <div><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${c.doctor || ''}</div>
                            <div><strong>${window.t ? window.t('date', 'Date') : 'Date'}:</strong> ${new Date(c.createdAt).toLocaleString()}</div>
                            <div><strong>${window.t ? window.t('bmi', 'BMI') : 'BMI'}:</strong> ${(typeof c.imc === 'number' && !isNaN(c.imc)) ? c.imc.toFixed(1) : '-'}</div>
                        </div>
                        <div class="mt-3">
                            <strong>${window.t ? window.t('notes', 'Notes') : 'Notes'}:</strong>
                            <div class="text-sm whitespace-pre-wrap">${(c.notes || '').toString()}</div>
                        </div>
                    `;
                    modal.classList.add('active');
                    // Update modal translations
                    if (window.I18n && window.I18n.walkAndTranslate) {
                        window.I18n.walkAndTranslate();
                    }
                }
            } catch {}
        }

        function createBillFromConsultation(consultationId) {
            try {
                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                const c = consultations.find(x => x.id === consultationId);
                if (!c) return;

                // Prefill billing with patient and one item (Consultation)
                closeReadyBillsModal();
                showBillingModal();

                // Store the consultation ID for linking the bill to this consultation
                const consultationIdField = document.getElementById('billConsultationId');
                if (consultationIdField) {
                    consultationIdField.value = consultationId;
                }

                const patient = patients.find(p => p.id === c.patientId);
                if (patient) {
                    // Set patient ID and populate the form
                    document.getElementById('billPatientId').value = patient.id;
                    if (typeof handleBillPatientSelection === 'function') {
                        setTimeout(() => {
                            handleBillPatientSelection();
                        }, 100);
                    }
                }

                // Fill first item description and an example price if missing
                setTimeout(() => {
                const desc = document.getElementById('itemDescription1');
                const qty = document.getElementById('itemQuantity1');
                const price = document.getElementById('itemPrice1');
                    
                    // Try to set 'General Consultation' if it exists in the bill descriptions
                    if (desc) {
                        const generalConsultOption = Array.from(desc.options).find(o => o.value === 'General Consultation');
                        if (generalConsultOption) {
                            desc.value = 'General Consultation';
                            // Trigger autoFillPrice
                            if (typeof autoFillPrice === 'function') autoFillPrice(desc);
                        }
                    }
                if (qty) qty.value = 1;
                if (price && !price.value) price.value = 50;
                if (typeof calculateBillTotal === 'function') calculateBillTotal();
                }, 100);
            } catch {}
        }

        // Language Settings Functions
        function showLanguageSettings() {
            const modal = document.getElementById('languageSettingsModal');
            modal.classList.add('active');
            modal.style.opacity = '1'; // Reset opacity

            // Get current language from i18n system or fallback to legacy
            const currentLang = localStorage.getItem('app_lang') || currentLanguage || 'en';
            console.log('Current language when opening modal:', currentLang);

            // Set current language as selected
            const currentLangRadio = document.getElementById(`lang-${currentLang}`);
            if (currentLangRadio) {
                currentLangRadio.checked = true;
                console.log(`Set radio button ${currentLang} as checked`);
            } else {
                console.log(`Radio button for ${currentLang} not found`);
            }

            // Update modal translations immediately
            updateModalTranslations();

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');
        }

        // updateModalTranslations is now provided by translation.js

        function closeLanguageSettings() {
            const modal = document.getElementById('languageSettingsModal');
            modal.classList.remove('active');
        }

        // ========================================
        // Settings Menu Functions
        // ========================================

        function showSettingsMenu() {
            const modal = document.getElementById('settingsMenuModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            // Update translations
            updateModalTranslations();
        }

        function closeSettingsMenu() {
            const modal = document.getElementById('settingsMenuModal');
            modal.classList.remove('active');
        }

        function openLanguageSettings() {
            closeSettingsMenu();
            setTimeout(() => showLanguageSettings(), 200);
        }

        function openBillDescriptionsManagement() {
            closeSettingsMenu();
            setTimeout(() => showBillDescriptionsModal(), 200);
        }

        function openCabinetSettings() {
            closeSettingsMenu();
            setTimeout(() => showCabinetSettingsModal(), 200);
        }

        function openUserManagement() {
            // Check permission
            if (!hasPermission('manage_users')) {
                alert('You do not have permission to manage users.');
                closeSettingsMenu();
                return;
            }
            
            closeSettingsMenu();
            setTimeout(() => showUserManagementModal(), 200);
        }

        // ========================================
        // User Management Functions
        // ========================================

        function getSystemUsers() {
            const stored = localStorage.getItem('system_users');
            if (stored) {
                try {
                    const users = JSON.parse(stored);
                    // Validate and fix user roles if needed
                    return users.map(user => {
                        // Ensure role is correct for default users
                        if (user.id === 'user_default_1' && user.username === 'doctor') {
                            user.role = 'doctor';
                        } else if (user.id === 'user_default_2' && user.username === 'secretary') {
                            user.role = 'secretary';
                        }
                        return user;
                    });
                } catch (error) {
                    console.error('Error parsing users:', error);
                    return getDefaultUsers();
                }
            }
            // Default users (include current logged-in user)
            return getDefaultUsers();
        }

        function getDefaultUsers() {
            return [
                { role: 'doctor', username: 'doctor', password: 'doctor123', name: 'Dr. John Smith', email: 'doctor@clinic.com', status: 'active', id: 'user_default_1' },
                { role: 'secretary', username: 'secretary', password: 'secretary123', name: 'Alice Johnson', email: 'secretary@clinic.com', status: 'active', id: 'user_default_2' }
            ];
        }

        function saveSystemUsers(users) {
            localStorage.setItem('system_users', JSON.stringify(users));
        }

        function exportUserCredentials() {
            const users = getSystemUsers();
            const credentials = users.map(user => {
                return `Username: ${user.username}\nPassword: ${user.password}\nRole: ${user.role}\nName: ${user.name}\nEmail: ${user.email}\nStatus: ${user.status}\nID: ${user.id}\n---`;
            }).join('\n\n');
            
            const exportData = `Healthcare System - User Credentials Export\nGenerated: ${new Date().toLocaleString()}\n\n${credentials}`;
            
            // Create and download the file
            const blob = new Blob([exportData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show the content in a modal for easy copying to config/users.txt
            showCredentialsModal(exportData);
        }

        function showCredentialsModal(credentials) {
            // Create modal if it doesn't exist
            let modal = document.getElementById('credentialsModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'credentialsModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 800px;">
                        <div class="modal-header">
                            <h2 class="modal-title">User Credentials Export</h2>
                            <button class="modal-close" onclick="closeCredentialsModal()">&times;</button>
                        </div>
                        <div class="p-6">
                            <p class="mb-4 text-gray-600">Copy the content below and save it to <code>config/users.txt</code>:</p>
                            <textarea id="credentialsText" class="form-textarea" rows="20" style="font-family: monospace; font-size: 12px;" readonly></textarea>
                            <div class="flex gap-2 mt-4">
                                <button onclick="copyCredentials()" class="btn btn-primary">Copy to Clipboard</button>
                                <button onclick="closeCredentialsModal()" class="btn btn-secondary">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            // Set the content
            document.getElementById('credentialsText').value = credentials;
            modal.classList.add('active');
        }

        function closeCredentialsModal() {
            const modal = document.getElementById('credentialsModal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        function copyCredentials() {
            const textarea = document.getElementById('credentialsText');
            textarea.select();
            document.execCommand('copy');
            alert('Credentials copied to clipboard! You can now paste them into config/users.txt');
        }

        function showUserManagementModal() {
            const modal = document.getElementById('userManagementModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            renderUsersList();
            updateModalTranslations();
        }

        function closeUserManagement() {
            const modal = document.getElementById('userManagementModal');
            modal.classList.remove('active');
        }

        function renderUsersList(searchTerm = '') {
            const tbody = document.getElementById('usersTableBody');
            const users = getSystemUsers();
            
            const filtered = searchTerm
                ? users.filter(u => 
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.username.toLowerCase().includes(searchTerm.toLowerCase())
                )
                : users;
            
            // Update total count
            document.getElementById('totalUsersCount').textContent = users.length;
            
            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                            ${searchTerm ? 'No users found' : 'No users yet. Add your first user above.'}
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = filtered.map(user => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 whitespace-nowrap">
                        <div class="font-medium text-gray-900">${user.name}</div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-gray-600">${user.username}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-gray-600">${user.email}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}">
                            ${capitalizeFirst(user.role)}
                        </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(user.status)}">
                            ${capitalizeFirst(user.status)}
                        </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                        <button onclick="editUser('${user.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                            <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">
                            <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function getRoleBadgeClass(role) {
            const classes = {
                'doctor': 'bg-blue-100 text-blue-800',
                'secretary': 'bg-green-100 text-green-800',
                'admin': 'bg-purple-100 text-purple-800'
            };
            return classes[role] || 'bg-gray-100 text-gray-800';
        }

        function getStatusBadgeClass(status) {
            return status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800';
        }

        function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        function searchUsers() {
            const searchTerm = document.getElementById('userSearch').value;
            renderUsersList(searchTerm);
        }

        function editUser(userId) {
            const users = getSystemUsers();
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUserName').value = user.name;
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editUserUsername').value = user.username;
            document.getElementById('editUserPassword').value = '';
            document.getElementById('editUserRole').value = user.role;
            document.getElementById('editUserStatus').value = user.status;
            
            // Load permissions
            const permissions = user.permissions || {};
            const permissionKeys = [
                'view_patients', 'add_patients', 'delete_patients',
                'view_appointments', 'add_appointments', 'delete_appointments',
                'view_bills', 'create_bills', 'manage_bills',
                'view_consultations', 'add_consultations', 'delete_consultations',
                'view_reports', 'export_reports',
                'view_expenses', 'manage_expenses',
                'access_settings', 'manage_users'
            ];
            
            permissionKeys.forEach(key => {
                const checkbox = document.getElementById(`editPerm_${key}`);
                if (checkbox) {
                    checkbox.checked = permissions[key] || false;
                }
            });
            
            const modal = document.getElementById('editUserModal');
            modal.classList.add('active');
            updateModalTranslations();
        }

        function closeEditUserModal() {
            const modal = document.getElementById('editUserModal');
            modal.classList.remove('active');
        }

        function deleteUser(userId) {
            const confirmMessage = translations[currentLanguage].confirm_delete_user || 'Are you sure you want to delete this user?';
            if (!confirm(confirmMessage)) return;
            
            const users = getSystemUsers();
            const filtered = users.filter(u => u.id !== userId);
            saveSystemUsers(filtered);
            
            renderUsersList();
            
            const successMessage = translations[currentLanguage].user_deleted || 'User deleted successfully!';
            showTranslatedAlert('user_deleted', successMessage);
        }

        // ========================================
        // Cabinet Settings Functions
        // ========================================

        function getCabinetSettings() {
            const stored = localStorage.getItem('cabinet_settings');
            if (stored) {
                return JSON.parse(stored);
            }
            // Default settings
            return {
                name: '',
                address: '',
                phone: '',
                logo: null,
                timetable: {
                    monday: { enabled: true, open: '09:00', close: '17:00' },
                    tuesday: { enabled: true, open: '09:00', close: '17:00' },
                    wednesday: { enabled: true, open: '09:00', close: '17:00' },
                    thursday: { enabled: true, open: '09:00', close: '17:00' },
                    friday: { enabled: true, open: '09:00', close: '17:00' },
                    saturday: { enabled: false, open: '09:00', close: '13:00' },
                    sunday: { enabled: false, open: '09:00', close: '13:00' }
                }
            };
        }

        function saveCabinetSettings(settings) {
            localStorage.setItem('cabinet_settings', JSON.stringify(settings));
            // Refresh cabinet info display after saving
            if (window.updateCabinetInfo) {
                window.updateCabinetInfo();
            }
        }

        function showCabinetSettingsModal() {
            const modal = document.getElementById('cabinetSettingsModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            // Load existing settings
            loadCabinetSettingsForm();
            updateModalTranslations();
        }

        function closeCabinetSettings() {
            const modal = document.getElementById('cabinetSettingsModal');
            modal.classList.remove('active');
        }

        function loadCabinetSettingsForm() {
            const settings = getCabinetSettings();
            
            // Load basic info
            document.getElementById('cabinetName').value = settings.name || '';
            document.getElementById('cabinetAddress').value = settings.address || 'Tunis, Tunisia';
            document.getElementById('cabinetPhone').value = settings.phone || '00 000 000';
            
            // Load logo
            if (settings.logo) {
                displayLogoPreview(settings.logo);
            }
            
            // Load timetable
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            days.forEach(day => {
                const daySettings = settings.timetable[day];
                document.getElementById(`${day}_enabled`).checked = daySettings.enabled;
                document.getElementById(`${day}_open`).value = daySettings.open;
                document.getElementById(`${day}_close`).value = daySettings.close;
                
                // Update schedule visibility
                const schedule = document.getElementById(`${day}_schedule`);
                const openInput = document.getElementById(`${day}_open`);
                const closeInput = document.getElementById(`${day}_close`);
                
                if (daySettings.enabled) {
                    schedule.style.opacity = '1';
                    openInput.disabled = false;
                    closeInput.disabled = false;
                } else {
                    schedule.style.opacity = '0.5';
                    openInput.disabled = true;
                    closeInput.disabled = true;
                }
            });
        }

        function toggleDaySchedule(day) {
            const enabled = document.getElementById(`${day}_enabled`).checked;
            const schedule = document.getElementById(`${day}_schedule`);
            const openInput = document.getElementById(`${day}_open`);
            const closeInput = document.getElementById(`${day}_close`);
            
            if (enabled) {
                schedule.style.opacity = '1';
                openInput.disabled = false;
                closeInput.disabled = false;
            } else {
                schedule.style.opacity = '0.5';
                openInput.disabled = true;
                closeInput.disabled = true;
            }
        }

        function handleLogoUpload(input) {
            const file = input.files[0];
            if (!file) return;
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert(translations[currentLanguage].invalid_image || 'Invalid image file. Please upload a valid image.');
                input.value = '';
                return;
            }
            
            // Check file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                alert(translations[currentLanguage].logo_too_large || 'Image is too large. Maximum size is 2MB.');
                input.value = '';
                return;
            }
            
            // Read and display the image
            const reader = new FileReader();
            reader.onload = function(e) {
                displayLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }

        function displayLogoPreview(imageData) {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="${imageData}" alt="Cabinet Logo" class="w-full h-full object-cover rounded-lg">`;
        }

        function removeLogo() {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
            `;
            document.getElementById('cabinetLogoInput').value = '';
        }

        // ========================================
        // Bill Descriptions Management Functions
        // ========================================

        function getDefaultBillDescriptions() {
            return [
                { id: 1, name: 'General Consultation', price: 50 },
                { id: 2, name: 'Follow-up Consultation', price: 30 },
                { id: 3, name: 'Emergency Consultation', price: 100 },
                { id: 4, name: 'Blood Test', price: 25 },
                { id: 5, name: 'X-Ray', price: 80 },
                { id: 6, name: 'MRI Scan', price: 300 },
                { id: 7, name: 'CT Scan', price: 250 },
                { id: 8, name: 'Ultrasound', price: 120 },
                { id: 9, name: 'ECG', price: 40 },
                { id: 10, name: 'Vaccination', price: 35 },
                { id: 11, name: 'Prescription Medication', price: 15 },
                { id: 12, name: 'Physical Therapy Session', price: 60 },
                { id: 13, name: 'Laboratory Analysis', price: 45 },
                { id: 14, name: 'Minor Surgery', price: 200 },
                { id: 15, name: 'Dressing Change', price: 20 },
                { id: 16, name: 'Injection', price: 25 }
            ];
        }

        function getBillDescriptions() {
            const stored = localStorage.getItem('bill_descriptions');
            if (!stored) {
                const defaults = getDefaultBillDescriptions();
                saveBillDescriptions(defaults);
                return defaults;
            }
            return JSON.parse(stored);
        }

        function saveBillDescriptions(descriptions) {
            localStorage.setItem('bill_descriptions', JSON.stringify(descriptions));
        }

        function showBillDescriptionsModal() {
            const modal = document.getElementById('billDescriptionsModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            renderBillDescriptionsList();
            updateModalTranslations();
        }

        function closeBillDescriptionsModal() {
            const modal = document.getElementById('billDescriptionsModal');
            modal.classList.remove('active');
        }

        function renderBillDescriptionsList(searchTerm = '') {
            const container = document.getElementById('descriptionsListContainer');
            const descriptions = getBillDescriptions();
            
            const filtered = searchTerm
                ? descriptions.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : descriptions;
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>${translations[currentLanguage].no_services || 'No services found'}</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = filtered.map(desc => `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-900">${desc.name}</div>
                        <div class="text-sm text-gray-600">${Number(desc.price).toFixed(2)} TND</div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editBillDescription(${desc.id})" class="btn btn-sm btn-outline">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            <span data-translate="edit">${translations[currentLanguage].edit || 'Edit'}</span>
                        </button>
                        <button onclick="deleteBillDescription(${desc.id})" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <span data-translate="delete">${translations[currentLanguage].delete || 'Delete'}</span>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function searchBillDescriptions() {
            const searchTerm = document.getElementById('descriptionSearch').value;
            renderBillDescriptionsList(searchTerm);
        }
        function editBillDescription(id) {
            const descriptions = getBillDescriptions();
            const desc = descriptions.find(d => d.id === id);
            if (!desc) return;
            
            document.getElementById('editDescriptionId').value = desc.id;
            document.getElementById('editDescriptionName').value = desc.name;
            document.getElementById('editDescriptionPrice').value = desc.price;
            
            const modal = document.getElementById('editDescriptionModal');
            modal.classList.add('active');
            updateModalTranslations();
        }

        function closeEditDescriptionModal() {
            const modal = document.getElementById('editDescriptionModal');
            modal.classList.remove('active');
        }

        function deleteBillDescription(id) {
            const confirmMessage = translations[currentLanguage].confirm_delete_service || 'Are you sure you want to delete this service?';
            if (!confirm(confirmMessage)) return;
            
            const descriptions = getBillDescriptions();
            const filtered = descriptions.filter(d => d.id !== id);
            saveBillDescriptions(filtered);
            
            renderBillDescriptionsList();
            
            const successMessage = translations[currentLanguage].service_deleted || 'Service deleted successfully!';
            showTranslatedAlert('service_deleted', successMessage);
        }

        // ========================================
        // Medicines Management Functions
        // ========================================
        
        function getMedicines() {
            const stored = localStorage.getItem('medicines');
            if (!stored) {
                const defaults = [];
                saveMedicines(defaults);
                return defaults;
            }
            return JSON.parse(stored);
        }

        function saveMedicines(medicines) {
            localStorage.setItem('medicines', JSON.stringify(medicines));
        }

        function showMedicinesModal() {
            const modal = document.getElementById('medicinesModal');
            if (modal) {
                modal.classList.add('active');
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) mobileMenu.classList.add('hidden');
                
                renderMedicinesList();
                updateModalTranslations();
            }
        }

        function closeMedicinesModal() {
            const modal = document.getElementById('medicinesModal');
            if (modal) modal.classList.remove('active');
        }

        function renderMedicinesList(searchTerm = '') {
            const container = document.getElementById('medicinesListContainer');
            if (!container) return;
            
            const medicines = getMedicines();
            
            const filtered = searchTerm
                ? medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : medicines;
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>${window.t ? window.t('no_medicines_found', 'No medicines found') : 'No medicines found'}</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = filtered.map(med => `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-900">${med.name}</div>
                        ${med.dosage ? `<div class="text-sm text-gray-600">${window.t ? window.t('dosage', 'Dosage') : 'Dosage'}: ${med.dosage}</div>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editMedicine(${med.id})" class="btn btn-sm btn-outline">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            <span data-translate="edit">${window.t ? window.t('edit', 'Edit') : 'Edit'}</span>
                        </button>
                        <button onclick="deleteMedicine(${med.id})" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <span data-translate="delete">${window.t ? window.t('delete', 'Delete') : 'Delete'}</span>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function searchMedicines() {
            const searchTerm = document.getElementById('medicineSearch')?.value || '';
            renderMedicinesList(searchTerm);
        }

        window.editMedicine = function(id) {
            const medicines = getMedicines();
            const med = medicines.find(m => m.id === id);
            if (!med) return;
            
            const editIdInput = document.getElementById('editMedicineId');
            const editNameInput = document.getElementById('editMedicineName');
            const editDosageInput = document.getElementById('editMedicineDosage');
            
            if (editIdInput) editIdInput.value = med.id;
            if (editNameInput) editNameInput.value = med.name;
            if (editDosageInput) editDosageInput.value = med.dosage || '';
            
            const modal = document.getElementById('editMedicineModal');
            if (modal) {
                modal.classList.add('active');
                updateModalTranslations();
            }
        }

        function closeEditMedicineModal() {
            const modal = document.getElementById('editMedicineModal');
            if (modal) modal.classList.remove('active');
        }

        window.deleteMedicine = function(id) {
            const confirmMessage = window.t ? window.t('confirm_delete_medicine', 'Are you sure you want to delete this medicine?') : 'Are you sure you want to delete this medicine?';
            if (!confirm(confirmMessage)) return;
            
            const medicines = getMedicines();
            const filtered = medicines.filter(m => m.id !== id);
            saveMedicines(filtered);
            
            renderMedicinesList();
            
            const successMessage = window.t ? window.t('medicine_deleted', 'Medicine deleted successfully!') : 'Medicine deleted successfully!';
            showTranslatedAlert('medicine_deleted', successMessage);
        }

        // ========================================
        // Doctor Profit Reports Functions
        // ========================================

        let currentReportTab = 'daily';
        let currentReportData = null;

        function showReportsModal() {
            // Check permission
            if (!hasPermission('view_reports')) {
                alert('You do not have permission to view reports.');
                return;
            }

            const modal = document.getElementById('reportsModal');
            modal.classList.add('active');
            
            // Update translations after opening modal
            setTimeout(() => {
                if (window.I18n && window.I18n.walkAndTranslate) {
                    window.I18n.walkAndTranslate();
                }
            }, 100);
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');

            // Initialize years dropdown
            initializeYearsDropdown();

            // Set default dates
            const today = new Date();
            document.getElementById('dailyReportDate').valueAsDate = today;
            document.getElementById('weeklyReportDate').valueAsDate = today;
            document.getElementById('monthlyReportMonth').value = today.getMonth();
            document.getElementById('monthlyReportYear').value = today.getFullYear();

            // Default to daily report
            switchReportTab('daily');
        }

        function closeReportsModal() {
            const modal = document.getElementById('reportsModal');
            modal.classList.remove('active');
        }

        function switchReportTab(tab) {
            currentReportTab = tab;

            const dailyContent = document.getElementById('dailyReportContent');
            const weeklyContent = document.getElementById('weeklyReportContent');
            const monthlyContent = document.getElementById('monthlyReportContent');

            const dailyTab = document.getElementById('dailyReportTab');
            const weeklyTab = document.getElementById('weeklyReportTab');
            const monthlyTab = document.getElementById('monthlyReportTab');

            // Hide all content
            dailyContent.style.display = 'none';
            weeklyContent.style.display = 'none';
            monthlyContent.style.display = 'none';

            // Reset all tabs
            dailyTab.className = 'btn btn-secondary';
            weeklyTab.className = 'btn btn-secondary';
            monthlyTab.className = 'btn btn-secondary';

            // Show selected content
            if (tab === 'daily') {
                dailyContent.style.display = 'block';
                dailyTab.className = 'btn btn-primary';
                renderDailyReport();
            } else if (tab === 'weekly') {
                weeklyContent.style.display = 'block';
                weeklyTab.className = 'btn btn-primary';
                renderWeeklyReport();
            } else if (tab === 'monthly') {
                monthlyContent.style.display = 'block';
                monthlyTab.className = 'btn btn-primary';
                renderMonthlyReport();
            }
        }

        function initializeYearsDropdown() {
            const yearSelect = document.getElementById('monthlyReportYear');
            const currentYear = new Date().getFullYear();
            yearSelect.innerHTML = '';
            
            // Add years from 5 years ago to current year
            for (let year = currentYear; year >= currentYear - 5; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
        }

        function getDoctorBillsForPeriod(startDate, endDate) {
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const doctorName = session.name || '';

            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');

            // Filter consultations by doctor and date range
            // Check both 'doctor' and 'doctorName' fields for compatibility
            const doctorConsultations = consultations.filter(c => {
                const consultDate = new Date(c.createdAt);
                const consultDoctor = c.doctor || c.doctorName || '';
                
                // Check if consultation is within date range and by this doctor
                const isInDateRange = consultDate >= startDate && consultDate <= endDate;
                const isByThisDoctor = consultDoctor === doctorName || consultDoctor.includes(doctorName) || doctorName.includes(consultDoctor);
                
                return isInDateRange && isByThisDoctor;
            });

            // Get bills that match these consultations by patient
            // If no doctor consultations found, show all bills in the period
            let doctorBills;
            
            if (doctorConsultations.length > 0) {
                // Filter bills by doctor's patients
                doctorBills = bills.filter(bill => {
                    const billDate = new Date(bill.createdAt);
                    // Check if bill is in date range
                    if (billDate < startDate || billDate > endDate) return false;
                    
                    // Check if there's a consultation for this patient by this doctor
                    return doctorConsultations.some(c => c.patientId === bill.patientId);
                });
            } else {
                // Fallback: show all bills in the date range
                // This helps when consultation-bill linking isn't perfect
                doctorBills = bills.filter(bill => {
                    const billDate = new Date(bill.createdAt);
                    return billDate >= startDate && billDate <= endDate;
                });
            }

            return {
                bills: doctorBills,
                consultations: doctorConsultations
            };
        }

        // Get total expenses within a date range [startDate, endDate]
        function getExpensesForPeriod(startDate, endDate) {
            try {
                const expenses = JSON.parse(localStorage.getItem('healthcareExpenses') || '[]');
                const inRange = expenses.filter(exp => {
                    const raw = exp.date || exp.createdAt;
                    if (!raw) return false;
                    const d = new Date(raw);
                    return d >= startDate && d <= endDate;
                });
                const total = inRange.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
                return { list: inRange, total };
            } catch {
                return { list: [], total: 0 };
            }
        }

        function renderDailyReport() {
            const dateInput = document.getElementById('dailyReportDate');
            const selectedDate = new Date(dateInput.value);
            
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);

            const data = getDoctorBillsForPeriod(startDate, endDate);
            const expenseData = getExpensesForPeriod(startDate, endDate);
            currentReportData = data;

            const container = document.getElementById('dailyReportContainer');
            
            if (data.bills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <p data-translate="no_data_for_period">${window.t ? window.t('no_data_for_period', 'No billing data for this date.') : 'No billing data for this date.'}</p>
                    </div>
                `;
                return;
            }

            const totalRevenue = data.bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalExpenses = expenseData.total;
            const netProfit = totalRevenue - totalExpenses;
            const totalConsultations = data.consultations.length;
            const totalBills = data.bills.length;

            container.innerHTML = `
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="card p-4 bg-blue-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_consultations">${window.t ? window.t('total_consultations', 'Total Consultations') : 'Total Consultations'}</div>
                                <div class="text-2xl font-bold text-blue-600">${totalConsultations}</div>
                            </div>
                            <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-green-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_bills">${window.t ? window.t('total_bills', 'Total Bills') : 'Total Bills'}</div>
                                <div class="text-2xl font-bold text-green-600">${totalBills}</div>
                            </div>
                            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-yellow-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('total_revenue', 'Total Revenue') : 'Total Revenue'}</div>
                                <div class="text-2xl font-bold text-yellow-600">${totalRevenue.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-red-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('total_expenses', 'Total Expenses') : 'Total Expenses'}</div>
                                <div class="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m4-4H8M12 4a8 8 0 100 16 8 8 0 000-16z" />
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-teal-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('net_profit', 'Net Profit') : 'Net Profit'}</div>
                                <div class="text-2xl font-bold text-teal-600">${netProfit.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Bills Details -->
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4" data-translate="bill_details">${window.t ? window.t('bill_details', 'Bill Details') : 'Bill Details'}</h3>
                    <div class="space-y-3">
                        ${data.bills.map(bill => `
                            <div class="border-b pb-3">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="font-semibold text-gray-900">${bill.patientName}</div>
                                        <div class="text-sm text-gray-600">${window.t ? window.t('bill_id', 'Bill ID') : 'Bill ID'}: ${bill.id}</div>
                                        <div class="text-xs text-gray-500">${new Date(bill.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-green-600">${bill.total.toFixed(2)} TND</div>
                                        <div class="text-xs text-gray-500">${bill.items.length} ${window.t ? window.t('items', 'items') : 'items'}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function renderWeeklyReport() {
            const dateInput = document.getElementById('weeklyReportDate');
            const selectedDate = new Date(dateInput.value);
            
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(selectedDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            const data = getDoctorBillsForPeriod(startDate, endDate);
            const expenseData = getExpensesForPeriod(startDate, endDate);
            currentReportData = data;

            const container = document.getElementById('weeklyReportContainer');
            
            if (data.bills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <p data-translate="no_data_for_period">No billing data for this week.</p>
                    </div>
                `;
                return;
            }

            const totalRevenue = data.bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalExpenses = expenseData.total;
            const netProfit = totalRevenue - totalExpenses;
            const totalConsultations = data.consultations.length;
            const totalBills = data.bills.length;

            // Group bills by day
            const billsByDay = {};
            data.bills.forEach(bill => {
                const dayKey = new Date(bill.createdAt).toLocaleDateString();
                if (!billsByDay[dayKey]) {
                    billsByDay[dayKey] = {
                        bills: [],
                        total: 0
                    };
                }
                billsByDay[dayKey].bills.push(bill);
                billsByDay[dayKey].total += bill.total;
            });

            container.innerHTML = `
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="card p-4 bg-blue-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_consultations">${window.t ? window.t('total_consultations', 'Total Consultations') : 'Total Consultations'}</div>
                                <div class="text-2xl font-bold text-blue-600">${totalConsultations}</div>
                            </div>
                            <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-green-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_bills">${window.t ? window.t('total_bills', 'Total Bills') : 'Total Bills'}</div>
                                <div class="text-2xl font-bold text-green-600">${totalBills}</div>
                            </div>
                            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-yellow-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('total_revenue', 'Total Revenue') : 'Total Revenue'}</div>
                                <div class="text-2xl font-bold text-yellow-600">${totalRevenue.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-red-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('total_expenses', 'Total Expenses') : 'Total Expenses'}</div>
                                <div class="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m4-4H8M12 4a8 8 0 100 16 8 8 0 000-16z" />
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-teal-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('net_profit', 'Net Profit') : 'Net Profit'}</div>
                                <div class="text-2xl font-bold text-teal-600">${netProfit.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Daily Breakdown -->
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4" data-translate="daily_breakdown">Daily Breakdown</h3>
                    <div class="space-y-3">
                        ${Object.keys(billsByDay).sort((a, b) => new Date(b) - new Date(a)).map(day => `
                            <div class="border-b pb-3">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="font-semibold text-gray-900">${day}</div>
                                        <div class="text-sm text-gray-600">${billsByDay[day].bills.length} ${window.t ? window.t('bills', 'bills') : 'bills'}</div>
                                    </div>
                                    <div class="text-xl font-bold text-green-600">${billsByDay[day].total.toFixed(2)} TND</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function renderMonthlyReport() {
            const monthSelect = document.getElementById('monthlyReportMonth');
            const yearSelect = document.getElementById('monthlyReportYear');
            
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearSelect.value);

            const startDate = new Date(year, month, 1, 0, 0, 0, 0);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const data = getDoctorBillsForPeriod(startDate, endDate);
            const expenseData = getExpensesForPeriod(startDate, endDate);
            currentReportData = data;

            const container = document.getElementById('monthlyReportContainer');
            
            if (data.bills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <p data-translate="no_data_for_period">No billing data for this month.</p>
                    </div>
                `;
                return;
            }

            const totalRevenue = data.bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalConsultations = data.consultations.length;
            const totalBills = data.bills.length;
            const totalExpenses = expenseData.total;
            const netProfit = totalRevenue - totalExpenses;
            const averagePerBill = totalRevenue / totalBills;

            // Group bills by week
            const billsByWeek = {};
            data.bills.forEach(bill => {
                const billDate = new Date(bill.createdAt);
                const weekNum = Math.ceil(billDate.getDate() / 7);
                const weekKey = `${window.t ? window.t('week', 'Week') : 'Week'} ${weekNum}`;
                
                if (!billsByWeek[weekKey]) {
                    billsByWeek[weekKey] = {
                        bills: [],
                        total: 0
                    };
                }
                billsByWeek[weekKey].bills.push(bill);
                billsByWeek[weekKey].total += bill.total;
            });

            const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

            container.innerHTML = `
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div class="card p-4 bg-blue-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_consultations">${window.t ? window.t('total_consultations', 'Total Consultations') : 'Total Consultations'}</div>
                                <div class="text-2xl font-bold text-blue-600">${totalConsultations}</div>
                            </div>
                            <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-green-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_bills">${window.t ? window.t('total_bills', 'Total Bills') : 'Total Bills'}</div>
                                <div class="text-2xl font-bold text-green-600">${totalBills}</div>
                            </div>
                            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-yellow-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('total_revenue', 'Total Revenue') : 'Total Revenue'}</div>
                                <div class="text-2xl font-bold text-yellow-600">${totalRevenue.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-red-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('total_expenses', 'Total Expenses') : 'Total Expenses'}</div>
                                <div class="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m4-4H8M12 4a8 8 0 100 16 8 8 0 000-16z" />
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-teal-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600">${window.t ? window.t('net_profit', 'Net Profit') : 'Net Profit'}</div>
                                <div class="text-2xl font-bold text-teal-600">${netProfit.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-purple-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="avg_per_bill">Avg. Per Bill</div>
                                <div class="text-2xl font-bold text-purple-600">${averagePerBill.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Weekly Breakdown -->
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4">${monthName} ${year} - <span data-translate="weekly_breakdown">Weekly Breakdown</span></h3>
                    <div class="space-y-3">
                        ${Object.keys(billsByWeek).sort().map(week => `
                            <div class="border-b pb-3">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="font-semibold text-gray-900">${week}</div>
                                        <div class="text-sm text-gray-600">${billsByWeek[week].bills.length} ${window.t ? window.t('bills', 'bills') : 'bills'}</div>
                                    </div>
                                    <div class="text-xl font-bold text-green-600">${billsByWeek[week].total.toFixed(2)} TND</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function exportReport() {
            if (!currentReportData || currentReportData.bills.length === 0) {
                alert('No data to export.');
                return;
            }

            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const doctorName = session.name || 'Doctor';

            let reportText = `Profit Report - ${doctorName}\n`;
            reportText += `Generated: ${new Date().toLocaleString()}\n`;
            reportText += `Report Type: ${currentReportTab.charAt(0).toUpperCase() + currentReportTab.slice(1)}\n`;
            reportText += `\n==========================================\n\n`;

            reportText += `Summary:\n`;
            reportText += `Total Consultations: ${currentReportData.consultations.length}\n`;
            const now = new Date();
            let rangeStart, rangeEnd;
            if (currentReportTab === 'daily') {
                rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            } else if (currentReportTab === 'weekly') {
                const day = now.getDay();
                rangeStart = new Date(now);
                rangeStart.setDate(now.getDate() - day);
                rangeStart.setHours(0,0,0,0);
                rangeEnd = new Date(rangeStart);
                rangeEnd.setDate(rangeStart.getDate() + 6);
                rangeEnd.setHours(23,59,59,999);
            } else {
                const m = document.getElementById('monthlyReportMonth') ? parseInt(document.getElementById('monthlyReportMonth').value) : now.getMonth();
                const y = document.getElementById('monthlyReportYear') ? parseInt(document.getElementById('monthlyReportYear').value) : now.getFullYear();
                rangeStart = new Date(y, m, 1, 0,0,0,0);
                rangeEnd = new Date(y, m + 1, 0, 23,59,59,999);
            }
            const expensesForRange = getExpensesForPeriod(rangeStart, rangeEnd).total;
            const totalRevenueForRange = currentReportData.bills.reduce((sum, b) => sum + b.total, 0);
            const netProfitForRange = totalRevenueForRange - expensesForRange;

            reportText += `Total Bills: ${currentReportData.bills.length}\n`;
            reportText += `Total Revenue: ${totalRevenueForRange.toFixed(2)} TND\n`;
            reportText += `Total Expenses: ${expensesForRange.toFixed(2)} TND\n`;
            reportText += `Net Profit: ${netProfitForRange.toFixed(2)} TND\n`;
            reportText += `\n==========================================\n\n`;

            reportText += `Bill Details:\n`;
            currentReportData.bills.forEach((bill, index) => {
                reportText += `\n${index + 1}. ${bill.patientName}\n`;
                reportText += `   Bill ID: ${bill.id}\n`;
                reportText += `   Date: ${new Date(bill.createdAt).toLocaleString()}\n`;
                reportText += `   Total: ${bill.total.toFixed(2)} TND\n`;
                reportText += `   Items: ${bill.items.length}\n`;
            });

            // Create and download file
            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `profit_report_${currentReportTab}_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Report exported successfully!');
        }

        function changeLanguage(lang) {
            currentLanguage = lang;
            localStorage.setItem('selectedLanguage', lang);

            // Update HTML lang attribute
            document.documentElement.lang = lang;

            // Update text direction
                document.documentElement.dir = 'ltr';
                document.body.style.fontFamily = '';

            // Add visual feedback for language change
            const modal = document.getElementById('languageSettingsModal');
            modal.style.opacity = '0.7';

            // Update all translatable elements immediately
            updateTranslations();

            // Also update modal translations specifically
            updateModalTranslations();

            // Refresh dashboard to update dynamic content
            if (typeof renderDailyAgenda === 'function') {
                renderDailyAgenda();
            }
            
            // Refresh calendar to update month/year and day headers
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }

            // Restore modal opacity and close after showing the change
            setTimeout(() => {
                modal.style.opacity = '1';
                setTimeout(() => {
                    closeLanguageSettings();
                }, 300);
            }, 400);
        }

        function updateTranslations() {
            const elements = document.querySelectorAll('[data-translate]');

            elements.forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.textContent = translations[currentLanguage][key];
                }
            });

            // Update placeholder translations
            const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
            placeholderElements.forEach(element => {
                const key = element.getAttribute('data-translate-placeholder');
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.placeholder = translations[currentLanguage][key];
                }
            });
        }

        // Helper function for translated alerts
        function showTranslatedAlert(key, ...args) {
            let message;
            if (window.t) {
                message = window.t(key, key);
            } else {
                message = translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
            }
            if (args.length > 0) {
                message = message.replace(/\{(\d+)\}/g, (match, index) => args[index] || match);
            }
            alert(message);
        }

        // Helper function for translated confirm dialogs
        function showTranslatedConfirm(key, ...args) {
            let message;
            if (window.t) {
                message = window.t(key, key);
            } else {
                message = translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
            }
            if (args.length > 0) {
                message = message.replace(/\{(\d+)\}/g, (match, index) => args[index] || match);
            }
            return confirm(message);
        }
        // Initialize language on page load
        function initializeLanguage() {
            // Only initialize legacy system if i18n is not available
            if (window.I18n) {
                console.log('i18n system available, skipping legacy language initialization');
                return;
            }
            
            const savedLang = localStorage.getItem('selectedLanguage') || 'en';
            currentLanguage = savedLang;
            if (savedLang !== 'en') {
                changeLanguage(savedLang);
            } else {
                updateTranslations();
            }
        }

        // Test function for language modal (for debugging)
        function testLanguageModal() {
            console.log('Current language:', currentLanguage);
            console.log('Available translations:', Object.keys(translations));
            console.log('Modal elements with data-translate:');
            const modalElements = document.querySelectorAll('#languageSettingsModal [data-translate]');
            modalElements.forEach(el => {
                console.log(`- ${el.getAttribute('data-translate')}: "${el.textContent}"`);
            });
        }


        function handleBillPatientSelection() {
            const patientId = document.getElementById('billPatientId').value;
            const patientDisplay = document.getElementById('billPatientDisplay');
            const patientDetails = document.getElementById('billPatientDetails');

            if (patientId) {
                const patient = storedPatients.find(p => p.id === patientId);
                if (patient) {
                    // Set display field
                    if (patientDisplay) {
                        patientDisplay.value = patient.fullName + (patient.email ? ' (' + patient.email + ')' : '');
                    }
                    
                    // Show patient details
                    document.getElementById('billPatientName').textContent = patient.fullName;
                    document.getElementById('billPatientEmail').textContent = patient.email;
                    document.getElementById('billPatientPhone').textContent = patient.phone;
                    document.getElementById('billPatientAddress').textContent = patient.address || 'Not provided';

                    // Set hidden inputs
                    document.getElementById('billPatientFullName').value = patient.fullName;
                    document.getElementById('billPatientEmailAddress').value = patient.email;
                    document.getElementById('billPatientPhoneNumber').value = patient.phone;

                    patientDetails.classList.remove('hidden');
                }
            } else {
                if (patientDisplay) {
                    patientDisplay.value = '';
                }
                patientDetails.classList.add('hidden');
            }
        }

        function getBillDescriptionOptionsHTML() {
            const descriptions = getBillDescriptions();
            let optionsHTML = `<option value="">${window.t ? window.t('select_service', 'Select service...') : 'Select service...'}</option>`;
            descriptions.forEach(desc => {
                optionsHTML += `<option value="${desc.name}" data-price="${desc.price}">${desc.name}</option>`;
            });
            return optionsHTML;
        }

        function createBillItemHTML(itemNumber) {
            return `
                <div class="bill-item border border-gray-200 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                            <label class="form-label" for="itemDescription${itemNumber}" data-translate="description">Description</label>
                            <select id="itemDescription${itemNumber}" class="form-input" required onchange="autoFillPrice(this)">
                            ${getBillDescriptionOptionsHTML()}
                        </select>
                    </div>
                    <div style="display: none;">
                            <label class="form-label" for="itemQuantity${itemNumber}" data-translate="quantity">Quantity</label>
                            <input type="number" id="itemQuantity${itemNumber}" class="form-input" min="1" value="1" required onchange="calculateBillTotal()" oninput="calculateBillTotal()">
                    </div>
                    <div>
                            <label class="form-label" for="itemPrice${itemNumber}" data-translate="price">Price</label>
                            <input type="number" id="itemPrice${itemNumber}" class="form-input" min="0" step="0.01" placeholder="0.00" data-translate-placeholder="price_placeholder" required onchange="calculateBillTotal()" oninput="calculateBillTotal()">
                    </div>
                </div>
                <div class="mt-2 flex justify-end">
                        <button type="button" class="btn btn-outline btn-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400" onclick="removeBillItem(this)" title="Remove Item">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    </div>
                </div>
            `;
        }

        function resetBillItems() {
            const billItems = document.getElementById('billItems');
            if (!billItems) {
                console.error('Bill items container not found');
                return;
            }
            
            // Clear all existing items
            billItems.innerHTML = '';
            
            // Add one default item
            billItems.innerHTML = createBillItemHTML(1);
            
            // Update translations
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
            
            // Ensure all quantity fields are set to 1
            setAllQuantitiesToOne();
            
            // Recalculate totals
            calculateBillTotal();
        }
        
        function setAllQuantitiesToOne() {
            const quantityInputs = document.querySelectorAll('input[id^="itemQuantity"]');
            quantityInputs.forEach(input => {
                input.value = 1;
            });
        }

        function addBillItem() {
            const billItems = document.getElementById('billItems');
            const itemCount = billItems.children.length + 1;

            const newItem = document.createElement('div');
            newItem.innerHTML = createBillItemHTML(itemCount);
            billItems.appendChild(newItem);

            // Update translations for the new item
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
            
            // Ensure all quantity fields are set to 1
            setAllQuantitiesToOne();

            calculateBillTotal();
        }

        function removeBillItem(button) {
            const billItems = document.getElementById('billItems');
            if (billItems.children.length > 1) {
                button.closest('.bill-item').remove();
                calculateBillTotal();
            } else {
                showTranslatedAlert('at_least_one_item');
            }
        }

        function calculateBillTotal() {
            const billItems = document.getElementById('billItems');
            let subtotal = 0;

            if (!billItems) {
                console.error('Bill items container not found');
                return;
            }

            billItems.querySelectorAll('.bill-item').forEach((item, index) => {
                // Find quantity input (first number input)
                const quantityInput = item.querySelector('input[type="number"]');
                // Find price input (second number input)
                const priceInput = item.querySelectorAll('input[type="number"]')[1];

                if (quantityInput && priceInput) {
                    const quantity = parseFloat(quantityInput.value) || 0;
                    const price = parseFloat(priceInput.value) || 0;
                    const itemTotal = quantity * price;
                    subtotal += itemTotal;

                    console.log(`Item ${index + 1}: Qty=${quantity}, Price=${price}, Total=${itemTotal}`);
                } else {
                    console.warn(`Item ${index + 1}: Missing quantity or price input`);
                }
            });

            const taxRate = 0.08; // 8% tax
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            console.log(`Bill calculation: Subtotal=${subtotal}, Tax=${tax}, Total=${total}`);

            // Update the display
            const subtotalElement = document.getElementById('billSubtotal');
            const taxElement = document.getElementById('billTax');
            const totalElement = document.getElementById('billTotal');

            if (subtotalElement) subtotalElement.textContent = `${subtotal.toFixed(2)} TND`;
            if (taxElement) taxElement.textContent = `${tax.toFixed(2)} TND`;
            if (totalElement) totalElement.textContent = `${total.toFixed(2)} TND`;
        }

        function resetBillingForm() {
            document.getElementById('billingForm').reset();
            document.getElementById('billPatientDetails').classList.add('hidden');

            // Reset bill items to just one
            resetBillItems();
        }

        function createBill(formData) {
            const billId = 'bill-' + Date.now();
            const billItems = [];

            // Collect bill items
            document.querySelectorAll('.bill-item').forEach((item, index) => {
                // Find quantity input (first number input)
                const quantityInput = item.querySelector('input[type="number"]');
                // Find price input (second number input)
                const priceInput = item.querySelectorAll('input[type="number"]')[1];
                const descriptionInput = item.querySelector('select');

                if (descriptionInput && quantityInput && priceInput) {
                    const description = descriptionInput.value.trim();
                    const quantity = parseFloat(quantityInput.value) || 0;
                    const price = parseFloat(priceInput.value) || 0;

                    if (description && quantity > 0 && price >= 0) {
                        billItems.push({
                            description,
                            quantity,
                            price,
                            total: quantity * price
                        });
                    }
                }
            });

            // Validate that we have at least one bill item
            if (billItems.length === 0) {
                throw new Error('Please add at least one item to the bill.');
            }

            const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
            const tax = subtotal * 0.08;
            const total = subtotal + tax;

            const newBill = {
                id: billId,
                patientId: formData.patientId,
                patientName: formData.patientName,
                patientEmail: formData.patientEmail,
                patientPhone: formData.patientPhone,
                billDate: new Date().toISOString().split('T')[0],
                dueDate: formData.dueDate,
                items: billItems,
                subtotal: subtotal,
                tax: tax,
                total: total,
                notes: formData.notes || '',
                status: 'Paid',
                createdAt: new Date().toISOString(),
                consultationId: formData.consultationId || null // Link to consultation if bill came from consultation
            };

            console.log('Creating bill:', newBill);
            storedBills.push(newBill);
            saveStoredBills();

            // Update cabinet cash display after creating bill
            if (typeof updateCabinetCashDisplay === 'function') {
                updateCabinetCashDisplay();
            }
            
            // Update daily agenda to refresh cash entry badge
            if (typeof renderDailyAgenda === 'function') {
                renderDailyAgenda();
            }

            return newBill;
        }

        function saveStoredBills() {
            localStorage.setItem('healthcareBills', JSON.stringify(storedBills));
            console.log('Bills saved to localStorage');
        }

        function loadStoredBills() {
            const saved = localStorage.getItem('healthcareBills');
            console.log('Loading bills from localStorage:', saved);
            if (saved) {
                storedBills = JSON.parse(saved);
                console.log('Loaded bills:', storedBills);
            } else {
                console.log('No saved bills found');
            }
        }

        function generatePrintableBill(bill) {
            const billDate = new Date(bill.billDate).toLocaleDateString();
            const dueDate = new Date(bill.dueDate).toLocaleDateString();
            const createdDate = new Date(bill.createdAt).toLocaleDateString();
            
            // Get current language
            const lang = currentLanguage || 'en';
            
            // Define translation function for the bill
            const t = (key, fallback) => {
                if (window.t) {
                    return window.t(key, fallback);
                }
                // Fallback to inline translations if window.t is not available
                if (translations[lang] && translations[lang][key]) {
                    return translations[lang][key];
                }
                return fallback || key;
            };

            const billHTML = `
                <!DOCTYPE html>
                <html lang="${lang}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Bill - ${bill.id}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 20px;
                            background: #f5f5f5;
                        }
                        .printable-bill {
                            max-width: 800px;
                            margin: 0 auto;
                            background: white;
                            padding: 2rem;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .bill-header {
                            display: flex;
                            align-items: center;
                            gap: 1rem;
                            border-bottom: 3px solid #2563eb;
                            padding-bottom: 1rem;
                            margin-bottom: 2rem;
                        }
                        .bill-logo svg { display:block; }
                        .bill-header-text { display:flex; flex-direction:column; }
                        .bill-title {
                            font-size: 2rem;
                            font-weight: bold;
                            color: #2563eb;
                            margin-bottom: 0.5rem;
                        }
                        .bill-subtitle {
                            color: #666;
                            font-size: 1.1rem;
                        }
                        .bill-info {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 2rem;
                            margin-bottom: 2rem;
                        }
                        .bill-section {
                            background: #f8fafc;
                            padding: 1rem;
                            border-radius: 0.5rem;
                        }
                        .bill-section h3 {
                            margin: 0 0 0.5rem 0;
                            color: #2563eb;
                            font-size: 1.1rem;
                        }
                        .bill-section p {
                            margin: 0.25rem 0;
                            font-size: 0.9rem;
                        }
                        .bill-items-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 2rem 0;
                        }
                        .bill-items-table th,
                        .bill-items-table td {
                            padding: 0.75rem;
                            text-align: left;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .bill-items-table th {
                            background: #f3f4f6;
                            font-weight: 600;
                            color: #374151;
                        }
                        .bill-items-table .text-right {
                            text-align: right;
                        }
                        .bill-items-table .text-center {
                            text-align: center;
                        }
                        .bill-totals {
                            margin-top: 2rem;
                            text-align: right;
                        }
                        .bill-total-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 0.5rem 0;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .bill-total-row.final {
                            font-weight: bold;
                            font-size: 1.2rem;
                            color: #059669;
                            border-top: 2px solid #059669;
                            margin-top: 1rem;
                            padding-top: 1rem;
                        }
                        .bill-footer {
                            margin-top: 3rem;
                            text-align: center;
                            color: #666;
                            font-size: 0.9rem;
                        }
                        .bill-notes {
                            margin-top: 2rem;
                            padding: 1rem;
                            background: #f0f9ff;
                            border-left: 4px solid #0ea5e9;
                        }
                        .bill-notes h4 {
                            margin: 0 0 0.5rem 0;
                            color: #0c4a6e;
                        }
                        .print-actions {
                            text-align: center;
                            margin: 2rem 0;
                        }
                        .btn {
                            display: inline-block;
                            padding: 0.75rem 1.5rem;
                            margin: 0 0.5rem;
                            background: #2563eb;
                            color: white;
                            text-decoration: none;
                            border-radius: 0.5rem;
                            border: none;
                            cursor: pointer;
                            font-size: 1rem;
                        }
                        .btn:hover {
                            background: #1d4ed8;
                        }
                        .btn-secondary {
                            background: #6b7280;
                        }
                        .btn-secondary:hover {
                            background: #4b5563;
                        }
                        @media print {
                            .print-actions {
                                display: none !important;
                            }
                            .printable-bill {
                                margin: 0;
                                padding: 1rem;
                                box-shadow: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="printable-bill">
                        <div class="bill-header">
                            <div class="bill-logo" aria-hidden="true">${(function(){
                                try {
                                    const s = getCabinetSettings();
                                    if (s && s.logo && /^data:image\//.test(s.logo)) {
                                        return `<img src="${s.logo}" alt="Logo" style="width:48px;height:48px;object-fit:contain;"/>`;
                                    }
                                } catch(e) {}
                                return `<svg width="48" height="48" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><path d="M28 8 L22 34 L40 34 Z" fill="#2563eb"/><path d="M28 8 L26 34 L34 34 Z" fill="#3b82f6" opacity="0.85"/><path d="M12 42 Q22 36 28 42 Q34 36 44 42 Q34 48 28 42 Q22 48 12 42 Z" fill="#2563eb"/></svg>`;
                            })()}</div>
                            <div class="bill-header-text">
                                ${(function(){
                                    try {
                                        const s = getCabinetSettings();
                                        const name = (s && s.name && s.name.trim()) ? s.name : 'Medical Center';
                                        const address = (s && s.address && s.address.trim()) ? s.address : '';
                                        const phone = (s && s.phone && s.phone.trim()) ? s.phone : '';
                                        return `<div class="bill-title">${name}</div><div class="bill-subtitle">${address}</div><div style="color:#6b7280;font-size:0.9rem;">${phone ? `Tel: ${phone}` : ''}</div>`;
                                    } catch(e) {
                                        return `<div class="bill-title">Medical Center</div>`;
                                    }
                                })()}
                            </div>
                        </div>
                        
                        <div class="bill-info">
                            <div class="bill-section">
                                <h3>${t('bill_to', 'Bill To:')}</h3>
                                <p><strong>${bill.patientName}</strong></p>
                                <p>${bill.patientEmail}</p>
                                <p>${bill.patientPhone}</p>
                            </div>
                            
                            <div class="bill-section">
                                <h3>${t('bill_information', 'Bill Information:')}</h3>
                                <p><strong>${t('bill_id', 'Bill ID')}:</strong> ${bill.id}</p>
                                <p><strong>${t('bill_date', 'Bill Date')}:</strong> ${billDate}</p>
                                <p><strong>${t('due_date', 'Due Date')}:</strong> ${dueDate}</p>
                                <p><strong>Status:</strong> ${bill.status}</p>
                            </div>
                        </div>
                        
                        <table class="bill-items-table">
                            <thead>
                                <tr>
                                    <th>${t('description', 'Description')}</th>
                                    <th class="text-right">${t('price', 'Price')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bill.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td class="text-right">${item.price.toFixed(2)} TND</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div class="bill-totals">
                            <div class="bill-total-row">
                                <span>${t('subtotal', 'Subtotal')}:</span>
                                <span>${bill.subtotal.toFixed(2)} TND</span>
                            </div>
                            <div class="bill-total-row">
                                <span>${t('tax', 'Tax')} (8%):</span>
                                <span>${bill.tax.toFixed(2)} TND</span>
                            </div>
                            <div class="bill-total-row final">
                                <span>${t('total_amount', 'Total Amount')}:</span>
                                <span>${bill.total.toFixed(2)} TND</span>
                            </div>
                        </div>
                        
                        ${bill.notes ? `
                            <div class="bill-notes">
                                <h4>${t('notes', 'Notes')}:</h4>
                                <p>${bill.notes}</p>
                            </div>
                        ` : ''}
                        
                        <div class="bill-footer">
                            <p>${t('thank_you_message', 'Thank you for choosing our healthcare services.')}</p>
                            <p>${t('for_questions_contact', 'For questions about this bill, please contact us at')} (555) 123-4567</p>
                            <p>${t('generated_on', 'Generated on')} ${createdDate}</p>
                        </div>
                    </div>
                    
                    <div class="print-actions">
                        <button class="btn" onclick="window.print()">🖨️ ${t('print_bill', 'Print Bill')}</button>
                        <button class="btn btn-secondary" onclick="window.close()">${t('close', 'Close')}</button>
                    </div>
                </body>
                </html>
            `;

            return billHTML;
        }

        function showPrintableBill(bill) {
            console.log('showPrintableBill called with bill:', bill);

            try {
                const billHTML = generatePrintableBill(bill);
                console.log('Generated bill HTML length:', billHTML.length);

                // Try to open new window
                let printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                console.log('Print window opened:', printWindow);

                if (!printWindow || printWindow.closed || typeof printWindow.closed == 'undefined') {
                    // Popup blocked, show alternative
                    console.log('Popup blocked, using alternative method');
                    showTranslatedAlert('popup_blocked');
                    showAlternativePrint(bill);
                    return;
                }

                printWindow.document.write(billHTML);
                printWindow.document.close();
                console.log('Content written to print window');

                // Wait for content to load, then print
                printWindow.onload = function () {
                    console.log('Print window loaded, triggering print');
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                    }, 1000);
                };

            } catch (error) {
                console.error('Error opening print window:', error);
                showTranslatedAlert('print_error');
                showAlternativePrint(bill);
            }
        }

        function showAlternativePrint(bill) {
            // Create a modal with the printable bill
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 90%; max-height: 90%; overflow-y: auto;">
                    <div class="modal-header">
                        <h2 class="modal-title" data-translate="printable_bill">Printable Bill - ${bill.id}</h2>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div style="padding: 1rem;">
                        ${generatePrintableBillContent(bill)}
                        <div style="text-align: center; margin-top: 2rem;">
                            <button class="btn btn-primary" onclick="printCurrentPage()">🖨️ Print This Page</button>
                            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }
        function generatePrintableBillContent(bill) {
            const billDate = new Date(bill.billDate).toLocaleDateString();
            const dueDate = new Date(bill.dueDate).toLocaleDateString();
            const createdDate = new Date(bill.createdAt).toLocaleDateString();
            
            // Get current language
            const lang = currentLanguage || 'en';
            
            // Define translation function for the bill
            const t = (key, fallback) => {
                if (window.t) {
                    return window.t(key, fallback);
                }
                // Fallback to inline translations if window.t is not available
                if (translations[lang] && translations[lang][key]) {
                    return translations[lang][key];
                }
                return fallback || key;
            };

            return `
                <div class="printable-bill">
                    <div class="bill-header" style="display:flex;align-items:center;gap:1rem;border-bottom:3px solid #2563eb;padding-bottom:1rem;margin-bottom:2rem;">
                        <div class="bill-logo" aria-hidden="true">${(function(){
                            try {
                                const s = getCabinetSettings();
                                if (s && s.logo && /^data:image\//.test(s.logo)) {
                                    return `<img src="${s.logo}" alt="Logo" style="width:48px;height:48px;object-fit:contain;"/>`;
                                }
                            } catch(e) {}
                            return `<svg width=\"48\" height=\"48\" viewBox=\"0 0 56 56\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M28 8 L22 34 L40 34 Z\" fill=\"#2563eb\"/><path d=\"M28 8 L26 34 L34 34 Z\" fill=\"#3b82f6\" opacity=\"0.85\"/><path d=\"M12 42 Q22 36 28 42 Q34 36 44 42 Q34 48 28 42 Q22 48 12 42 Z\" fill=\"#2563eb\"/></svg>`;
                        })()}</div>
                        <div class="bill-header-text" style="display:flex;flex-direction:column;">
                            ${(function(){
                                try {
                                    const s = getCabinetSettings();
                                    const name = (s && s.name && s.name.trim()) ? s.name : 'Medical Center';
                                    const address = (s && s.address && s.address.trim()) ? s.address : '';
                                    const phone = (s && s.phone && s.phone.trim()) ? s.phone : '';
                                    return `<div class=\"bill-title\" style=\"font-weight:700;color:#1e40af;font-size:1.5rem;\">${name}</div><div class=\"bill-subtitle\" style=\"color:#2563eb;\">${address}</div><div style=\"color:#6b7280;font-size:0.9rem;\">${phone ? `Tel: ${phone}` : ''}</div>`;
                                } catch(e) {
                                    return `<div class=\"bill-title\" style=\"font-weight:700;color:#1e40af;font-size:1.5rem;\">Medical Center</div>`;
                                }
                            })()}
                        </div>
                    </div>
                    
                    <div class="bill-info">
                        <div class="bill-section">
                            <h3>${t('bill_to', 'Bill To:')}</h3>
                            <p><strong>${bill.patientName}</strong></p>
                            <p>${bill.patientEmail}</p>
                            <p>${bill.patientPhone}</p>
                        </div>
                        
                        <div class="bill-section">
                            <h3>${t('bill_information', 'Bill Information:')}</h3>
                            <p><strong>${t('bill_id', 'Bill ID')}:</strong> ${bill.id}</p>
                            <p><strong>${t('bill_date', 'Bill Date')}:</strong> ${billDate}</p>
                            <p><strong>${t('due_date', 'Due Date')}:</strong> ${dueDate}</p>
                            <p><strong>Status:</strong> ${bill.status}</p>
                        </div>
                    </div>
                    
                    <table class="bill-items-table">
                        <thead>
                            <tr>
                                <th>${t('description', 'Description')}</th>
                                <th class="text-right">${t('price', 'Price')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bill.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td class="text-right">${item.price.toFixed(2)} TND</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="bill-totals">
                        <div class="bill-total-row">
                            <span>${t('subtotal', 'Subtotal')}:</span>
                            <span>${bill.subtotal.toFixed(2)} TND</span>
                        </div>
                        <div class="bill-total-row">
                            <span>${t('tax', 'Tax')} (8%):</span>
                            <span>${bill.tax.toFixed(2)} TND</span>
                        </div>
                        <div class="bill-total-row final">
                            <span>${t('total_amount', 'Total Amount')}:</span>
                            <span>${bill.total.toFixed(2)} TND</span>
                        </div>
                    </div>
                    
                    ${bill.notes ? `
                        <div class="bill-notes">
                            <h4>${t('notes', 'Notes')}:</h4>
                            <p>${bill.notes}</p>
                        </div>
                    ` : ''}
                    
                    <div class="bill-footer">
                        <p>${t('thank_you_message', 'Thank you for choosing our healthcare services.')}</p>
                        <p>${t('for_questions_contact', 'For questions about this bill, please contact us at')} (555) 123-4567</p>
                        <p>${t('generated_on', 'Generated on')} ${createdDate}</p>
                    </div>
                </div>
            `;
        }

        function printCurrentPage() {
            window.print();
        }

        function testPrintFunction() {
            // Create a test bill for testing the print functionality
            const testBill = {
                id: 'test-bill-123',
                patientId: 'test-patient',
                patientName: 'Test Patient',
                patientEmail: 'test@example.com',
                patientPhone: '(555) 123-4567',
                billDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                items: [
                    {
                        description: 'Test Consultation',
                        quantity: 1,
                        price: 150.00,
                        total: 150.00
                    },
                    {
                        description: 'Test Lab Work',
                        quantity: 2,
                        price: 75.00,
                        total: 150.00
                    }
                ],
                subtotal: 300.00,
                tax: 24.00,
                total: 324.00,
                notes: 'This is a test bill for testing the print functionality.',
                status: 'Pending',
                createdAt: new Date().toISOString()
            };

            console.log('Testing print function with test bill:', testBill);
            showPrintableBill(testBill);
        }

        // Billing form submission
        document.getElementById('billingForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                patientId: document.getElementById('billPatientId').value,
                patientName: document.getElementById('billPatientFullName').value,
                patientEmail: document.getElementById('billPatientEmailAddress').value,
                patientPhone: document.getElementById('billPatientPhoneNumber').value,
                billDate: new Date().toISOString().split('T')[0],
                dueDate: document.getElementById('billDueDate').value,
                notes: document.getElementById('billNotes').value,
                consultationId: document.getElementById('billConsultationId').value || null
            };

            if (!formData.patientId) {
                showTranslatedAlert('select_patient_bill');
                return;
            }

            try {
                const newBill = createBill(formData);
                console.log('Bill created successfully:', newBill);

                // Show success message with print option
                const printBill = showTranslatedConfirm('bill_created_success', newBill.id, newBill.patientName, newBill.total.toFixed(2));

                if (printBill) {
                    console.log('Attempting to show printable bill:', newBill);
                    showPrintableBill(newBill);
                } else {
                    // Still show the bill in a modal for review
                    showAlternativePrint(newBill);
                }
            } catch (error) {
                console.error('Error creating bill:', error);
                showTranslatedAlert('error_creating_bill', error.message);
                return;
            }

            // Refresh ready bills if the modal is open
            const readyBillsModal = document.getElementById('readyBillsModal');
            if (readyBillsModal && readyBillsModal.classList.contains('active')) {
                if (typeof renderReadyBills === 'function') {
                    renderReadyBills();
                }
            }

            closeBillingModal();
        });

        // Add Bill Description Form Submission
        document.getElementById('addDescriptionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('newDescriptionName').value.trim();
            const price = parseFloat(document.getElementById('newDescriptionPrice').value);
            
            if (!name || isNaN(price) || price < 0) {
                alert('Please provide valid service name and price.');
                return;
            }
            
            const descriptions = getBillDescriptions();
            const newId = descriptions.length > 0 ? Math.max(...descriptions.map(d => d.id)) + 1 : 1;
            
            descriptions.push({
                id: newId,
                name: name,
                price: price
            });
            
            saveBillDescriptions(descriptions);
            renderBillDescriptionsList();
            
            // Clear form
            document.getElementById('newDescriptionName').value = '';
            document.getElementById('newDescriptionPrice').value = '';
            
            const successMessage = translations[currentLanguage].service_added || 'Service added successfully!';
            showTranslatedAlert('service_added', successMessage);
        });

        // Edit Bill Description Form Submission
        document.getElementById('editDescriptionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = parseInt(document.getElementById('editDescriptionId').value);
            const name = document.getElementById('editDescriptionName').value.trim();
            const price = parseFloat(document.getElementById('editDescriptionPrice').value);
            
            if (!name || isNaN(price) || price < 0) {
                alert('Please provide valid service name and price.');
                return;
            }
            
            const descriptions = getBillDescriptions();
            const index = descriptions.findIndex(d => d.id === id);
            
            if (index !== -1) {
                descriptions[index].name = name;
                descriptions[index].price = price;
                saveBillDescriptions(descriptions);
                renderBillDescriptionsList();
                closeEditDescriptionModal();
                
                const successMessage = translations[currentLanguage].service_updated || 'Service updated successfully!';
                showTranslatedAlert('service_updated', successMessage);
            }
        });

        // Add Medicine Form Submission
        const addMedicineForm = document.getElementById('addMedicineForm');
        if (addMedicineForm) {
            addMedicineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const name = document.getElementById('newMedicineName').value.trim();
                const dosage = document.getElementById('newMedicineDosage').value.trim();
                
                if (!name) {
                    alert('Please provide medicine name.');
                    return;
                }
                
                const medicines = getMedicines();
                const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
                
                medicines.push({
                    id: newId,
                    name: name,
                    dosage: dosage || ''
                });
                
                saveMedicines(medicines);
                renderMedicinesList();
                
                // Clear form
                document.getElementById('newMedicineName').value = '';
                document.getElementById('newMedicineDosage').value = '';
                
                const successMessage = window.t ? window.t('medicine_added', 'Medicine added successfully!') : 'Medicine added successfully!';
                showTranslatedAlert('medicine_added', successMessage);
            });
        }

        // Edit Medicine Form Submission
        const editMedicineForm = document.getElementById('editMedicineForm');
        if (editMedicineForm) {
            editMedicineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const id = parseInt(document.getElementById('editMedicineId').value);
                const name = document.getElementById('editMedicineName').value.trim();
                const dosage = document.getElementById('editMedicineDosage').value.trim();
                
                if (!name) {
                    alert('Please provide medicine name.');
                    return;
                }
                
                const medicines = getMedicines();
                const index = medicines.findIndex(m => m.id === id);
                
                if (index !== -1) {
                    medicines[index].name = name;
                    medicines[index].dosage = dosage || '';
                    saveMedicines(medicines);
                    renderMedicinesList();
                    closeEditMedicineModal();
                    
                    // Update prescription dropdown if it exists
                    updatePrescriptionMedicineDropdown();
                    
                    const successMessage = window.t ? window.t('medicine_updated', 'Medicine updated successfully!') : 'Medicine updated successfully!';
                    showTranslatedAlert('medicine_updated', successMessage);
                }
            });
        }

        // Prescription medicines list
        let prescriptionMedicines = [];

        // Function to update prescription medicine dropdown
        function updatePrescriptionMedicineDropdown() {
            const select = document.getElementById('prescriptionMedicineSelect');
            if (!select) return;
            
            const medicines = getMedicines();
            const currentValue = select.value;
            
            select.innerHTML = '<option value="" data-translate="select_medicine">Select medicine...</option>';
            
            medicines.forEach(med => {
                const option = document.createElement('option');
                option.value = med.id;
                option.textContent = med.name + (med.dosage ? ` (${med.dosage})` : '');
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        }

        // Function to render prescription medicines list
        function renderPrescriptionMedicinesList() {
            const container = document.getElementById('prescriptionListContainer');
            if (!container) return;
            
            if (prescriptionMedicines.length === 0) {
                container.innerHTML = '';
                return;
            }
            
            const medicines = getMedicines();
            
            container.innerHTML = prescriptionMedicines.map((item, index) => {
                const med = medicines.find(m => m.id === item.medicineId);
                const medName = med ? med.name : 'Unknown Medicine';
                const dosage = item.dosage || med?.dosage || '';
                const instructions = item.instructions || '';
                
                return `
                    <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div class="flex-1">
                            <div class="font-semibold text-gray-900">${medName}</div>
                            ${dosage ? `<div class=\"text-sm text-gray-600\">${window.t ? window.t('dosage', 'Dosage') : 'Dosage'}: ${dosage}</div>` : ''}
                            ${instructions ? `<div class=\"text-sm text-gray-600\">${window.t ? window.t('instructions', 'Instructions') : 'Instructions'}: ${instructions}</div>` : ''}
                        </div>
                        <button type="button" onclick="removeMedicineFromPrescription(${index})" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <span data-translate="remove">${window.t ? window.t('remove', 'Remove') : 'Remove'}</span>
                        </button>
                    </div>
                `;
            }).join('');
            
            // Update prescription textarea with formatted list
            updatePrescriptionTextarea();
        }

        // Function to update prescription textarea
        function updatePrescriptionTextarea() {
            const textarea = document.getElementById('consultPrescription');
            if (!textarea) return;
            
            const medicines = getMedicines();
            
            if (prescriptionMedicines.length > 0) {
                const prescriptionText = prescriptionMedicines.map((item, index) => {
                    const med = medicines.find(m => m.id === item.medicineId);
                    const medName = med ? med.name : 'Unknown Medicine';
                    const dosage = item.dosage || med?.dosage || '';
                    const instructions = item.instructions || '';
                    const details = [dosage, instructions].filter(Boolean).join('; ');
                    return `${index + 1}. ${medName}${details ? ' - ' + details : ''}`;
                }).join('\n');
                
                textarea.value = prescriptionText;
            }
        }

        // Function to add medicine to prescription
        window.addMedicineToPrescription = function() {
            const select = document.getElementById('prescriptionMedicineSelect');
            const dosageInput = document.getElementById('prescriptionDosage');
            const instructionsInput = document.getElementById('prescriptionInstructions');
            
            if (!select || !dosageInput) return;
            
            const medicineId = parseInt(select.value);
            const dosage = dosageInput.value.trim();
            const instructions = instructionsInput ? instructionsInput.value.trim() : '';
            
            if (!medicineId) {
                alert('Please select a medicine.');
                return;
            }
            
            prescriptionMedicines.push({
                medicineId: medicineId,
                dosage: dosage,
                instructions: instructions
            });
            
            renderPrescriptionMedicinesList();
            
            // Clear inputs
            select.value = '';
            dosageInput.value = '';
            if (instructionsInput) instructionsInput.value = '';
        }

        // Function to remove medicine from prescription
        window.removeMedicineFromPrescription = function(index) {
            if (index >= 0 && index < prescriptionMedicines.length) {
                prescriptionMedicines.splice(index, 1);
                renderPrescriptionMedicinesList();
            }
        }

        // Add event listener for add medicine button
        const addMedicineToPrescriptionBtn = document.getElementById('addMedicineToPrescriptionBtn');
        if (addMedicineToPrescriptionBtn) {
            addMedicineToPrescriptionBtn.addEventListener('click', addMedicineToPrescription);
        }

        // Prescription dropdown will be updated when prescription section is shown
        // This is handled in the showConsultSection function below

        // Cabinet Settings Form Submission
        document.getElementById('cabinetSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('cabinetName').value.trim();
            
            if (!name) {
                alert('Cabinet name is required.');
                return;
            }
            
            // Get logo (either from file input or existing preview)
            let logo = null;
            const logoPreview = document.getElementById('logoPreview');
            const logoImg = logoPreview.querySelector('img');
            if (logoImg) {
                logo = logoImg.src;
            }
            
            // Build timetable object
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const timetable = {};
            
            days.forEach(day => {
                timetable[day] = {
                    enabled: document.getElementById(`${day}_enabled`).checked,
                    open: document.getElementById(`${day}_open`).value,
                    close: document.getElementById(`${day}_close`).value
                };
            });
            
            // Build settings object
            const addressValue = document.getElementById('cabinetAddress').value.trim();
            const phoneValue = document.getElementById('cabinetPhone').value.trim();
            
            const settings = {
                name: name,
                address: addressValue || 'Tunis, Tunisia',
                phone: phoneValue || '00 000 000',
                logo: logo,
                timetable: timetable
            };
            
            // Save settings
            saveCabinetSettings(settings);
            
            // Close modal
            closeCabinetSettings();
            
            // Show success message
            const successMessage = translations[currentLanguage].settings_saved || 'Settings saved successfully!';
            showTranslatedAlert('settings_saved', successMessage);
        });

        // Add User Form Submission
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('newUserName').value.trim();
            const email = document.getElementById('newUserEmail').value.trim();
            const username = document.getElementById('newUserUsername').value.trim();
            const password = document.getElementById('newUserPassword').value;
            const role = document.getElementById('newUserRole').value;
            const status = document.getElementById('newUserStatus').value;
            
            if (!name || !email || !username || !password || !role) {
                alert('Please fill in all required fields.');
                return;
            }
            
            const users = getSystemUsers();
            
            // Check if username already exists
            if (users.some(u => u.username === username)) {
                const errorMessage = translations[currentLanguage].username_exists || 'Username already exists!';
                alert(errorMessage);
                return;
            }
            
            // Check if email already exists
            if (users.some(u => u.email === email)) {
                const errorMessage = translations[currentLanguage].email_exists || 'Email already exists!';
                alert(errorMessage);
                return;
            }
            
            // Collect permissions
            const permissionKeys = [
                'view_patients', 'add_patients', 'delete_patients',
                'view_appointments', 'add_appointments', 'delete_appointments',
                'view_bills', 'create_bills', 'manage_bills',
                'view_consultations', 'add_consultations', 'delete_consultations',
                'view_reports', 'export_reports',
                'view_expenses', 'manage_expenses',
                'access_settings', 'manage_users'
            ];
            
            const permissions = {};
            permissionKeys.forEach(key => {
                const checkbox = document.getElementById(`newPerm_${key}`);
                if (checkbox) {
                    permissions[key] = checkbox.checked;
                }
            });
            
            // Create new user
            const newUser = {
                id: 'user_' + Date.now(),
                name: name,
                email: email,
                username: username,
                password: password, // In production, this should be hashed
                role: role,
                status: status,
                permissions: permissions,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveSystemUsers(users);
            
            // Clear form
            document.getElementById('addUserForm').reset();
            
            // Refresh list
            renderUsersList();
            
            // Show success message
            const successMessage = translations[currentLanguage].user_added || 'User added successfully!';
            showTranslatedAlert('user_added', successMessage);
        });

        // Edit User Form Submission
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('editUserId').value;
            const name = document.getElementById('editUserName').value.trim();
            const email = document.getElementById('editUserEmail').value.trim();
            const username = document.getElementById('editUserUsername').value.trim();
            const password = document.getElementById('editUserPassword').value;
            const role = document.getElementById('editUserRole').value;
            const status = document.getElementById('editUserStatus').value;
            
            if (!name || !email || !username || !role) {
                alert('Please fill in all required fields.');
                return;
            }
            
            const users = getSystemUsers();
            const index = users.findIndex(u => u.id === userId);
            
            if (index === -1) {
                alert('User not found.');
                return;
            }
            
            // Check if username already exists (excluding current user)
            if (users.some(u => u.username === username && u.id !== userId)) {
                const errorMessage = translations[currentLanguage].username_exists || 'Username already exists!';
                alert(errorMessage);
                return;
            }
            
            // Check if email already exists (excluding current user)
            if (users.some(u => u.email === email && u.id !== userId)) {
                const errorMessage = translations[currentLanguage].email_exists || 'Email already exists!';
                alert(errorMessage);
                return;
            }
            
            // Collect permissions
            const permissionKeys = [
                'view_patients', 'add_patients', 'delete_patients',
                'view_appointments', 'add_appointments', 'delete_appointments',
                'view_bills', 'create_bills', 'manage_bills',
                'view_consultations', 'add_consultations', 'delete_consultations',
                'view_reports', 'export_reports',
                'access_settings', 'manage_users'
            ];
            
            const permissions = {};
            permissionKeys.forEach(key => {
                const checkbox = document.getElementById(`editPerm_${key}`);
                if (checkbox) {
                    permissions[key] = checkbox.checked;
                }
            });
            
            // Update user
            users[index].name = name;
            users[index].email = email;
            users[index].username = username;
            users[index].role = role;
            users[index].status = status;
            users[index].permissions = permissions;
            
            // Update password only if provided
            if (password) {
                users[index].password = password;
            }
            
            saveSystemUsers(users);
            
            // If the edited user is the one currently logged in, update the session permissions immediately
            try {
                const currentSession = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
                if (currentSession && currentSession.userId === userId) {
                    currentSession.permissions = permissions;
                    localStorage.setItem('medconnect_session', JSON.stringify(currentSession));
                    // Re-apply permission-based UI so new menu items appear without reload
                    if (typeof applyPermissionBasedUI === 'function') {
                        applyPermissionBasedUI();
                    }
                }
            } catch (e) {
                console.error('Failed to update session after saving user permissions:', e);
            }
            
            // Close modal
            closeEditUserModal();
            
            // Refresh list
            renderUsersList();
            
            // Show success message
            const successMessage = translations[currentLanguage].user_updated || 'User updated successfully!';
            showTranslatedAlert('user_updated', successMessage);
        });


        // ========================================
        // Permission-based UI Functions
        // ========================================

        function getUserPermissions() {
            let session = null;
            try { 
                session = JSON.parse(localStorage.getItem('medconnect_session')); 
            } catch (error) {
                console.error('Error loading session:', error);
                return {};
            }

            if (!session) {
                return {};
            }

            const permissions = session.permissions || {};
            const isDoctor = session.role === 'doctor';
            const isAdmin = session.role === 'admin';

            // For doctors and admins, grant all permissions by default if not set
            if (isDoctor || isAdmin) {
                const defaultPermissions = {
                    view_patients: true,
                    add_patients: true,
                    delete_patients: true,
                    view_appointments: true,
                    add_appointments: true,
                    delete_appointments: true,
                    view_bills: true,
                    create_bills: true,
                    manage_bills: true,
                    view_consultations: true,
                    add_consultations: true,
                    delete_consultations: true,
                    view_reports: true,
                    export_reports: true,
                    // Expenses
                    view_expenses: true,
                    manage_expenses: true,
                    access_settings: true,
                    manage_users: true
                };
                
                // Merge with existing permissions
                Object.keys(defaultPermissions).forEach(key => {
                    if (!(key in permissions)) {
                        permissions[key] = defaultPermissions[key];
                    }
                });
            }

            // Reasonable defaults for secretary role if permissions not explicitly set
            if (session.role === 'secretary') {
                const secretaryDefaults = {
                    view_patients: true,
                    add_appointments: true,
                    view_appointments: true,
                    view_bills: true,
                    create_bills: true,
                    view_reports: true,
                    // Allow expenses by default for secretary
                    view_expenses: true,
                };
                Object.keys(secretaryDefaults).forEach(key => {
                    if (!(key in permissions)) {
                        permissions[key] = secretaryDefaults[key];
                    }
                });
            }

            return permissions;
        }

        function hasPermission(permission) {
            const permissions = getUserPermissions();
            return permissions[permission] === true;
        }

        function applyPermissionBasedUI() {
            const permissions = getUserPermissions();

            // Apply permissions to menu items
            const menuItems = document.querySelectorAll('[data-permission]');
            menuItems.forEach(item => {
                const requiredPermission = item.getAttribute('data-permission');
                
                if (requiredPermission && !permissions[requiredPermission]) {
                    // User doesn't have this permission - hide the menu item
                    item.style.display = 'none';
                } else {
                    // User has permission - show the menu item
                    // Don't change display for doctor dashboard link - it has its own logic
                    if (item.id !== 'doctorDashboardLink' && item.id !== 'doctorDashboardLinkMobile') {
                        item.style.display = '';
                    }
                }
            });

            console.log('Permissions applied:', permissions);
        }
        // Initialize the application
        document.addEventListener('DOMContentLoaded', () => {
            loadStoredAppointments();
            loadStoredPatients();
            loadStoredBills();
            initializeLanguage();

            // Fix user roles if needed
            const users = getSystemUsers();
            let needsUpdate = false;
            users.forEach(user => {
                if (user.id === 'user_default_1' && user.username === 'doctor' && user.role !== 'doctor') {
                    user.role = 'doctor';
                    needsUpdate = true;
                } else if (user.id === 'user_default_2' && user.username === 'secretary' && user.role !== 'secretary') {
                    user.role = 'secretary';
                    needsUpdate = true;
                }
            });
            if (needsUpdate) {
                saveSystemUsers(users);
                console.log('Fixed user roles');
            }
            
            // Wait for i18n system to be ready before rendering
            const renderDashboard = () => {
            renderCalendar();
            renderDailyAgenda();
            loadDoctorDashboard();
            // Update cabinet cash display
            if (typeof updateCabinetCashDisplay === 'function') {
                updateCabinetCashDisplay();
            }
            // Update today's summary with today's data only
            if (typeof updateTodaySummary === 'function') {
                updateTodaySummary();
            }
            // Update waiting room with today's validated appointments
            if (typeof updateWaitingRoom === 'function') {
                updateWaitingRoom();
            }
            
            // Apply translations to static elements
            if (typeof applyTranslations === 'function') {
                applyTranslations(document);
            }
            };
            
            // If i18n is available, wait for it to initialize
            if (window.I18n) {
                // Small delay to ensure i18n is fully initialized
                setTimeout(renderDashboard, 100);
            } else {
                renderDashboard();
            }
            
            // Apply permission-based UI
            applyPermissionBasedUI();

            // Re-apply doctor dashboard visibility after permissions
            loadDoctorDashboard();

            // Role-based UI
            let session = null;
            try { session = JSON.parse(localStorage.getItem('medconnect_session')); } catch { }
            
            // Define isDoctor variable for use in event listeners
            const isDoctor = session && session.role === 'doctor';
            
            // Debug: Log session data
            console.log('Session data:', session);
            
            // Function to update user profile
            function updateUserProfile() {
                if (session && session.role) {
                // Update profile UI
                const nameEl = document.querySelector('.user-name');
                const roleEl = document.querySelector('.user-role');
                const avatarEl = document.querySelector('.user-avatar');
                    
                if (nameEl && session.name) nameEl.textContent = session.name;
                    
                    if (roleEl) {
                        // Set role based on actual session role
                        if (session.role === 'doctor') {
                            roleEl.textContent = window.t ? window.t('doctor', 'Doctor') : 'Doctor';
                        } else if (session.role === 'secretary') {
                            roleEl.textContent = window.t ? window.t('secretary', 'Secretary') : 'Secretary';
                        } else {
                            roleEl.textContent = session.role; // fallback to raw role
                        }
                    }
                    
                    if (avatarEl && session.name) {
                        avatarEl.textContent = (session.name.match(/\b([A-Z])/gi) || ['U', 'S']).slice(0, 2).join('').toUpperCase();
                    }
                }
            }
            
            // Update profile immediately
            updateUserProfile();
            
            // Also update after any translation updates (with a small delay to ensure DOM is ready)
            setTimeout(updateUserProfile, 100);
            
            // Make updateUserProfile globally available for other parts of the code
            window.updateUserProfile = updateUserProfile;

            // Consultation modal handlers
            const consultationModal = document.getElementById('consultationModal');
            const consultationForm = document.getElementById('consultationForm');

            window.showConsultationModal = function () {
                if (!isDoctor) {
                    showTranslatedAlert('consultations_doctors_only');
                    return;
                }
                // Reset patient input
                const patientInput = document.getElementById('consultPatient');
                const patientIdInput = document.getElementById('consultPatientId');
                if (patientInput) {
                    patientInput.value = '';
                }
                // Clear prescription medicines list
                prescriptionMedicines = [];
                renderPrescriptionMedicinesList();
                if (patientIdInput) {
                    patientIdInput.value = '';
                }

                // Hide all sections and show consultation by default
                const allSections = document.querySelectorAll('.consult-section');
                allSections.forEach(section => section.classList.add('hidden'));
                
                // Show consultation section by default
                const consultSection = document.getElementById('consultSectionConsultation');
                if (consultSection) consultSection.classList.remove('hidden');
                
                // Set consultation button as active
                const menuButtons = document.querySelectorAll('.consult-menu-btn');
                menuButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.opacity = '0.8';
                    if (btn.getAttribute('data-section') === 'consultation') {
                        btn.classList.add('active');
                        btn.style.opacity = '1';
                    }
                });
                
                // Update consultation menu buttons translation
                setTimeout(() => {
                    updateConsultMenuButtons();
                }, 100);

                // Setup live IMC (BMI) calculation
                const heightInput = document.getElementById('consultHeight');
                const weightInput = document.getElementById('consultWeight');
                const imcEl = document.getElementById('consultIMCValue');
                const bmiCatEl = document.getElementById('consultBMICategory');

                const getBMICategory = (bmi) => {
                    if (!isFinite(bmi)) return '';
                    if (bmi < 18.5) return 'Underweight';
                    if (bmi < 25) return 'Normal';
                    if (bmi < 30) return 'Overweight';
                    return 'Obesity';
                };

                const getBMICategoryStyle = (cat) => {
                    switch (cat) {
                        case 'Underweight':
                            return 'badge bg-yellow-100 text-yellow-800';
                        case 'Normal':
                            return 'badge bg-green-100 text-green-800';
                        case 'Overweight':
                            return 'badge bg-orange-100 text-orange-800';
                        case 'Obesity':
                            return 'badge bg-red-100 text-red-800';
                        default:
                            return 'text-sm text-gray-500';
                    }
                };

                const updateIMC = () => {
                    if (!imcEl) return;
                    const heightValue = heightInput?.value?.trim() || '';
                    const weightValue = weightInput?.value?.trim() || '';
                    const h = parseFloat(heightValue.replace(',', '.'));
                    const w = parseFloat(weightValue.replace(',', '.'));
                    if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) {
                        imcEl.textContent = '—';
                        if (bmiCatEl) {
                            bmiCatEl.textContent = '';
                            bmiCatEl.className = 'text-sm text-gray-500';
                        }
                        return;
                    }
                    // Convert cm to meters and compute BMI
                    const m = h / 100;
                    const bmi = w / (m * m);
                    imcEl.textContent = bmi.toFixed(1);
                    if (bmiCatEl) {
                        const cat = getBMICategory(bmi);
                        bmiCatEl.textContent = cat;
                        bmiCatEl.className = getBMICategoryStyle(cat);
                    }
                };

                if (heightInput && weightInput) {
                    // Remove any existing listeners to avoid duplicates
                    heightInput.removeEventListener('input', updateIMC);
                    weightInput.removeEventListener('input', updateIMC);
                    // Attach fresh listeners
                    heightInput.addEventListener('input', updateIMC);
                    weightInput.addEventListener('input', updateIMC);
                    // Trigger initial calculation
                    setTimeout(() => updateIMC(), 50);
                } else {
                    console.warn('Height or Weight input not found in consultation modal');
                }

                // Enable the patient dropdown for normal consultation
                patientSelect.disabled = false;
                
                // Update modal translations
                updateModalTranslations();
                
                // Check if dashboard modal is active and set higher z-index
                const dashboardModal = document.getElementById('doctorDashboardModal');
                if (dashboardModal && dashboardModal.classList.contains('active')) {
                    consultationModal.style.zIndex = '3000';
                } else {
                    consultationModal.style.zIndex = '';
                }
                
                // Show modal first
                consultationModal.classList.add('active');
                
                // Re-attach IMC listeners after modal is visible (ensures DOM is ready)
                setTimeout(() => {
                    const h = document.getElementById('consultHeight');
                    const w = document.getElementById('consultWeight');
                    const imc = document.getElementById('consultIMCValue');
                    const cat = document.getElementById('consultBMICategory');
                    
                    console.log('IMC Setup Check:', { h: !!h, w: !!w, imc: !!imc, cat: !!cat });
                    
                    if (h && w && imc) {
                        const calcIMC = () => {
                            const heightVal = h.value?.trim() || '';
                            const weightVal = w.value?.trim() || '';
                            const height = parseFloat(heightVal.replace(',', '.'));
                            const weight = parseFloat(weightVal.replace(',', '.'));
                            
                            console.log('IMC Calculation:', { height, weight });
                            
                            if (!isFinite(height) || !isFinite(weight) || height <= 0 || weight <= 0) {
                                imc.textContent = '—';
                                if (cat) {
                                    cat.textContent = '';
                                    cat.className = 'text-sm text-gray-500';
                                }
                                return;
                            }
                            
                            const meters = height / 100;
                            const bmi = weight / (meters * meters);
                            imc.textContent = bmi.toFixed(1);
                            
                            if (cat) {
                                let category = '';
                                let style = 'text-sm text-gray-500';
                                if (bmi < 18.5) {
                                    category = 'Underweight';
                                    style = 'badge bg-yellow-100 text-yellow-800';
                                } else if (bmi < 25) {
                                    category = 'Normal';
                                    style = 'badge bg-green-100 text-green-800';
                                } else if (bmi < 30) {
                                    category = 'Overweight';
                                    style = 'badge bg-orange-100 text-orange-800';
                                } else {
                                    category = 'Obesity';
                                    style = 'badge bg-red-100 text-red-800';
                                }
                                cat.textContent = category;
                                cat.className = style;
                            }
                            
                            console.log('IMC Result:', bmi.toFixed(1));
                        };
                        
                        h.addEventListener('input', calcIMC);
                        w.addEventListener('input', calcIMC);
                        calcIMC(); // Initial calculation
                    } else {
                        console.error('IMC elements not found!');
                    }
                }, 100);
            };

            window.closeConsultationModal = function () {
                consultationModal.classList.remove('active');
                consultationModal.style.zIndex = ''; // Reset z-index when closing
                if (consultationForm) consultationForm.reset();
                const imcEl = document.getElementById('consultIMCValue');
                if (imcEl) imcEl.textContent = '—';
                const bmiCatEl = document.getElementById('consultBMICategory');
                if (bmiCatEl) {
                    bmiCatEl.textContent = '';
                    bmiCatEl.className = 'text-sm text-gray-500';
                }
                // Clear prescription medicines list
                prescriptionMedicines = [];
                if (typeof renderPrescriptionMedicinesList === 'function') {
                    renderPrescriptionMedicinesList();
                }
                // Hide all sections
                const allSections = document.querySelectorAll('.consult-section');
                allSections.forEach(section => section.classList.add('hidden'));
                
                // Show consultation section by default
                const consultSection = document.getElementById('consultSectionConsultation');
                if (consultSection) consultSection.classList.remove('hidden');
            };

            if (consultationForm) {
                consultationForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (!isDoctor) {
                        showTranslatedAlert('consultations_doctors_only');
                        return;
                    }
                    // Resolve patientId; if hidden field is empty, try to infer from displayed text
                    let patientId = document.getElementById('consultPatientId')?.value || '';
                    if (!patientId) {
                        const display = (document.getElementById('consultPatient')?.value || '').trim();
                        if (display) {
                            try {
                                const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                                // Extract name before '(' or ' - '
                                const namePart = display.split('(')[0].split(' - ')[0].trim();
                                const match = patients.find(p => (p.fullName || '').trim().toLowerCase() === namePart.toLowerCase());
                                if (match) {
                                    patientId = match.id;
                                    const hidden = document.getElementById('consultPatientId');
                                    if (hidden) hidden.value = patientId;
                                }
                            } catch {}
                        }
                        // Final fallback: use currentConsultationPatientId if available
                        if (!patientId && currentConsultationPatientId) {
                            patientId = currentConsultationPatientId;
                            const hidden = document.getElementById('consultPatientId');
                            if (hidden) hidden.value = patientId;
                        }
                    }
                    const heightVal = document.getElementById('consultHeight')?.value;
                    const weightVal = document.getElementById('consultWeight')?.value;
                    const tempVal = document.getElementById('consultTemperature')?.value;
                    const heartRateVal = document.getElementById('consultHeartRate')?.value;
                    const bloodSugarVal = document.getElementById('consultBloodSugar')?.value;
                    const bpInputVal = document.getElementById('consultBloodPressure')?.value;
                    const vitalNotes = document.getElementById('consultVitalNotes')?.value.trim() || '';
                    const notes = document.getElementById('consultNotes').value.trim();
                    const radiologyResult = document.getElementById('radiologyResult')?.value.trim() || '';
                    const radiologyDiagnostics = document.getElementById('radiologyDiagnostics')?.value.trim() || '';
                    const labResults = document.getElementById('labResults')?.value.trim() || '';
                    const labNotes = document.getElementById('labNotes')?.value.trim() || '';
                    // Get prescription from textarea or generate from medicines list
                    let prescription = document.getElementById('consultPrescription').value.trim();
                    if (!prescription && prescriptionMedicines.length > 0) {
                        const medicines = getMedicines();
                        prescription = prescriptionMedicines.map((item, index) => {
                            const med = medicines.find(m => m.id === item.medicineId);
                            const medName = med ? med.name : 'Unknown Medicine';
                            const dosage = item.dosage || med?.dosage || '';
                            return `${index + 1}. ${medName}${dosage ? ' - ' + dosage : ''}`;
                        }).join('\n');
                    }
                    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked')?.value || 'paying';

                    if (!patientId) {
                        showTranslatedAlert('select_patient_first', 'Please select a patient first.');
                        return;
                    }

                    const height = heightVal ? parseFloat(heightVal) : null;
                    const weight = weightVal ? parseFloat(weightVal) : null;
                    const temperature = tempVal ? parseFloat(tempVal) : null;
                    const heartRate = heartRateVal ? parseInt(heartRateVal, 10) : null;
                    const bloodSugar = bloodSugarVal ? parseInt(bloodSugarVal, 10) : null;
                    // Parse blood pressure in the form "120/80" into systolic/diastolic
                    let bpSystolic = null, bpDiastolic = null;
                    if (bpInputVal && typeof bpInputVal === 'string') {
                        const bpMatch = bpInputVal.trim().match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
                        if (bpMatch) {
                            bpSystolic = parseInt(bpMatch[1], 10);
                            bpDiastolic = parseInt(bpMatch[2], 10);
                        }
                    }
                    let imc = null; let bmiCategory = null;
                    if (height && weight) {
                        const m = height / 100;
                        imc = +(weight / (m * m)).toFixed(1);
                        // same thresholds as UI
                        if (imc < 18.5) bmiCategory = 'Underweight';
                        else if (imc < 25) bmiCategory = 'Normal';
                        else if (imc < 30) bmiCategory = 'Overweight';
                        else bmiCategory = 'Obesity';
                    }

                    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                    let id = editingConsultationId || ('CONS-' + Date.now());
                    if (editingConsultationId) {
                        const idx = consultations.findIndex(c => c.id === editingConsultationId);
                        if (idx !== -1) {
                            const existing = consultations[idx];
                            // If updating from an appointment, update the createdAt date to today
                            const shouldUpdateDate = currentConsultationAppointmentId || window.currentConsultationAppointmentId;
                            consultations[idx] = {
                                ...existing,
                                patientId,
                                height,
                                weight,
                                temperature,
                                heartRate,
                                bloodSugar,
                                bpSystolic,
                                bpDiastolic,
                                imc,
                                bmiCategory,
                                vitalNotes,
                                notes,
                                radiologyResult,
                                radiologyDiagnostics,
                                labResults,
                                labNotes,
                                prescription,
                                paymentStatus,
                                doctor: session?.name || existing.doctor || 'Doctor',
                                // Update createdAt to today if coming from appointment
                                createdAt: shouldUpdateDate ? new Date().toISOString() : existing.createdAt
                            };
                        }
                    } else {
                    consultations.push({
                        id,
                        patientId,
                        height,
                        weight,
                        temperature,
                        heartRate,
                        bloodSugar,
                        bpSystolic,
                        bpDiastolic,
                        imc,
                        bmiCategory,
                        vitalNotes,
                        notes,
                        radiologyResult,
                        radiologyDiagnostics,
                        labResults,
                        labNotes,
                        prescription,
                        paymentStatus,
                        doctor: session?.name || 'Doctor',
                        createdAt: new Date().toISOString()
                    });
                    }
                    localStorage.setItem('consultations', JSON.stringify(consultations));
                    
                    // Set consultation ID in certificate form for linking certificates
                    const consultCertConsultationIdInput = document.getElementById('consultCertConsultationId');
                    if (consultCertConsultationIdInput) {
                        consultCertConsultationIdInput.value = id;
                    }
                    
                    editingConsultationId = null;
                    
                    // Link any temporary lab assessments to this consultation
                    try {
                        const labAssessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
                        const updatedAssessments = labAssessments.map(assessment => {
                            // If this assessment was created for a temporary consultation with the same patient
                            if (assessment.consultationId.startsWith('temp_consult_') && currentConsultationPatientId === patientId) {
                                return { ...assessment, consultationId: id };
                            }
                            return assessment;
                        });
                        localStorage.setItem('lab_assessments', JSON.stringify(updatedAssessments));
                    } catch (error) {
                        console.error('Error linking lab assessments:', error);
                    }
                    
                    // Link any temporary medical certificates to this consultation
                    try {
                        const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
                        const updatedCertificates = certificates.map(cert => {
                            // If this certificate was created for a temporary consultation with the same patient
                            if (cert.consultationId.startsWith('temp_cert_consult_') && currentConsultationPatientId === patientId) {
                                return { ...cert, consultationId: id };
                            }
                            return cert;
                        });
                        localStorage.setItem('medical_certificates', JSON.stringify(updatedCertificates));
                        currentConsultationPatientId = null; // Reset
                    } catch (error) {
                        console.error('Error linking medical certificates:', error);
                    }

                    // Optionally update the patient's latest height/weight
                    try {
                        const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                        const idx = patients.findIndex(p => p.id === patientId);
                        if (idx !== -1) {
                            if (height !== null) patients[idx].height = height;
                            if (weight !== null) patients[idx].weight = weight;
                            if (temperature !== null) patients[idx].temperature = temperature;
                            if (heartRate !== null) patients[idx].heartRate = heartRate;
                            if (bloodSugar !== null) patients[idx].bloodSugar = bloodSugar;
                            if (bpSystolic !== null) patients[idx].bpSystolic = bpSystolic;
                            if (bpDiastolic !== null) patients[idx].bpDiastolic = bpDiastolic;
                            // Append vitals history entry
                            const entry = { date: new Date().toISOString(), height, weight, imc, temperature, heartRate, bloodSugar, bpSystolic, bpDiastolic };
                            if (!Array.isArray(patients[idx].vitalsHistory)) patients[idx].vitalsHistory = [];
                            // Only add if at least one of the values is present
                            if (height !== null || weight !== null || imc !== null || temperature !== null || heartRate !== null || bloodSugar !== null || bpSystolic !== null || bpDiastolic !== null) {
                                patients[idx].vitalsHistory.push(entry);
                            }
                            patients[idx].lastUpdated = new Date().toISOString();
                            // Persist to localStorage and sync in-memory list so UI reflects immediately
                            localStorage.setItem('healthcarePatients', JSON.stringify(patients));
                            storedPatients = patients;
                        }
                    } catch { }

                    showTranslatedAlert('consultation_saved');

                    // Clear prescription medicines list after saving
                    prescriptionMedicines = [];
                    if (typeof renderPrescriptionMedicinesList === 'function') {
                        renderPrescriptionMedicinesList();
                    }

                    // If this consultation came from an appointment, mark/remove it
                    try {
                        if (currentConsultationAppointmentId || window.currentConsultationAppointmentId) {
                            const appointmentId = currentConsultationAppointmentId || window.currentConsultationAppointmentId;
                            const appointments = JSON.parse(localStorage.getItem('healthcareAppointments') || '[]');
                            const idx = appointments.findIndex(a => a.id === appointmentId);
                            if (idx !== -1) {
                                // Remove from the array to ensure it disappears from today's list
                                appointments.splice(idx, 1);
                                localStorage.setItem('healthcareAppointments', JSON.stringify(appointments));
                                // Sync in-memory cache if present
                                if (typeof storedAppointments !== 'undefined') {
                                    storedAppointments = appointments;
                                }
                            }
                            // Reset trackers
                            currentConsultationAppointmentId = null;
                            window.currentConsultationAppointmentId = null;
                        }
                    } catch {}

                    // Refresh today's lists in doctor dashboard if it's open
                    const dashboardModal = document.getElementById('doctorDashboardModal');
                    if (dashboardModal && dashboardModal.classList.contains('active')) {
                        if (typeof loadTodayAppointments === 'function') loadTodayAppointments();
                        if (typeof loadTodayConsultations === 'function') loadTodayConsultations();
                    }
                    
                    // Update today's summary after consultation completion
                    if (typeof updateTodaySummary === 'function') {
                        updateTodaySummary();
                    }
                    
                    // Update waiting room after consultation completion
                    if (typeof updateWaitingRoom === 'function') {
                        updateWaitingRoom();
                    }
                    
                    // Update daily agenda to refresh consultation badge
                    if (typeof renderDailyAgenda === 'function') {
                        renderDailyAgenda();
                    }

                    // Check if certificate fields are filled and automatically generate certificate
                    const certTypeEl = document.getElementById('consultCertType');
                    const certStartDateEl = document.getElementById('consultCertStartDate');
                    const certEndDateEl = document.getElementById('consultCertEndDate');
                    const certRestPeriodEl = document.getElementById('consultCertRestPeriod');
                    const certNotesEl = document.getElementById('consultCertNotes');
                    
                    const certType = certTypeEl?.value || '';
                    const certStartDate = certStartDateEl?.value || '';
                    const certEndDate = certEndDateEl?.value || '';
                    const certRestPeriod = certRestPeriodEl?.value || '';
                    const certNotes = certNotesEl?.value.trim() || '';
                    
                    // If any certificate field is filled, automatically save and generate certificate
                    if (certType || certStartDate || certEndDate || certRestPeriod) {
                        // Use the saved consultation ID
                        const consultCertConsultationIdInput = document.getElementById('consultCertConsultationId');
                        if (consultCertConsultationIdInput) {
                            consultCertConsultationIdInput.value = id;
                        }
                        
                        // Save certificate directly (without needing to read form fields after closing)
                        try {
                            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
                            
                            // Get patient and doctor info for certificate
                            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                            const patient = patients.find(p => p.id === patientId);
                            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
                            
                            // Check if a certificate already exists for this consultation
                            const existingCertIndex = certificates.findIndex(cert => cert.consultationId === id);
                            
                            let certificateToSave;
                            
                            if (existingCertIndex !== -1) {
                                // Update existing certificate
                                certificateToSave = {
                                    ...certificates[existingCertIndex],
                                    certType: certType,
                                    restPeriod: certRestPeriod ? parseInt(certRestPeriod) : null,
                                    startDate: certStartDate,
                                    endDate: certEndDate || null,
                                    notes: certNotes,
                                    patientName: patient ? patient.fullName : certificates[existingCertIndex].patientName || '-',
                                    doctorName: session?.name || certificates[existingCertIndex].doctorName || 'Doctor'
                                };
                                certificates[existingCertIndex] = certificateToSave;
                            } else {
                                // Create new certificate
                                certificateToSave = {
                                    id: 'cert_' + Date.now(),
                                    consultationId: id,
                                    patientId: patientId,
                                    patientName: patient ? patient.fullName : '-',
                                    doctorName: session?.name || 'Doctor',
                                    certType: certType,
                                    restPeriod: certRestPeriod ? parseInt(certRestPeriod) : null,
                                    startDate: certStartDate,
                                    endDate: certEndDate || null,
                                    notes: certNotes,
                                    createdAt: new Date().toISOString()
                                };
                                certificates.push(certificateToSave);
                            }
                            
                            localStorage.setItem('medical_certificates', JSON.stringify(certificates));
                            
                            // Close modal
                    window.closeConsultationModal();
                        } catch (error) {
                            console.error('Error saving certificate:', error);
                            window.closeConsultationModal();
                        }
                    } else {
                        window.closeConsultationModal();
                    }
                });
            }
        });

        // Doctor Dashboard Functions
        window.loadDoctorDashboard = function() {
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const isDoctor = session && session.role === 'doctor';
            
            console.log('loadDoctorDashboard called');
            console.log('Session:', session);
            console.log('Is Doctor:', isDoctor);
            
            if (isDoctor) {
                // Show doctor dashboard menu links
                const dashboardLink = document.getElementById('doctorDashboardLink');
                const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
                console.log('Dashboard link found:', dashboardLink);
                console.log('Mobile dashboard link found:', dashboardLinkMobile);
                if (dashboardLink) dashboardLink.style.display = '';
                if (dashboardLinkMobile) dashboardLinkMobile.style.display = '';
                console.log('Doctor dashboard links shown');
            } else {
                // Hide doctor dashboard menu links
                const dashboardLink = document.getElementById('doctorDashboardLink');
                const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
                console.log('Dashboard link found:', dashboardLink);
                console.log('Mobile dashboard link found:', dashboardLinkMobile);
                if (dashboardLink) dashboardLink.style.display = 'none';
                if (dashboardLinkMobile) dashboardLinkMobile.style.display = 'none';
                console.log('Doctor dashboard links hidden');
            }
        }

        // Debug function to check session
        window.debugSession = function() {
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            console.log('Current session:', session);
            console.log('Role:', session.role);
            console.log('Is Doctor:', session && session.role === 'doctor');
            return session;
        };

        // Debug function to manually show consultation menu
        window.showConsultationMenu = function() {
            const dashboardLink = document.getElementById('doctorDashboardLink');
            const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
            if (dashboardLink) dashboardLink.style.display = '';
            if (dashboardLinkMobile) dashboardLinkMobile.style.display = '';
            console.log('Consultation menu manually shown');
        };

        // Comprehensive debug function
        window.debugConsultationMenu = function() {
            console.log('=== CONSULTATION MENU DEBUG ===');
            
            // Check session
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            console.log('Session:', session);
            console.log('Role:', session.role);
            console.log('Is Doctor:', session && session.role === 'doctor');
            
            // Check permissions
            const permissions = getUserPermissions();
            console.log('Permissions:', permissions);
            console.log('Has view_consultations:', permissions.view_consultations);
            
            // Check elements
            const dashboardLink = document.getElementById('doctorDashboardLink');
            const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
            console.log('Desktop link found:', !!dashboardLink);
            console.log('Mobile link found:', !!dashboardLinkMobile);
            
            if (dashboardLink) {
                console.log('Desktop link display:', dashboardLink.style.display);
                console.log('Desktop link computed display:', window.getComputedStyle(dashboardLink).display);
            }
            
            if (dashboardLinkMobile) {
                console.log('Mobile link display:', dashboardLinkMobile.style.display);
                console.log('Mobile link computed display:', window.getComputedStyle(dashboardLinkMobile).display);
            }
            
            console.log('=== END DEBUG ===');
        };

        window.showDoctorDashboard = function() {
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const isDoctor = session && session.role === 'doctor';
            
            if (!isDoctor) {
                showTranslatedAlert('consultations_doctors_only');
                return;
            }
            
            loadTodayAppointments();
            loadTodayConsultations();
            updateModalTranslations();
            
            const modal = document.getElementById('doctorDashboardModal');
            if (modal) modal.classList.add('active');
        };

        window.closeDoctorDashboard = function() {
            const modal = document.getElementById('doctorDashboardModal');
            if (modal) modal.classList.remove('active');
        };

        window.startConsultation = function(appointmentId, patientName) {
            // Check if user is doctor
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const isDoctor = session && session.role === 'doctor';
            
            if (!isDoctor) {
                showTranslatedAlert('consultations_doctors_only');
                return;
            }
            
            // Remember which appointment initiated this consultation
            currentConsultationAppointmentId = appointmentId || null;

            // Close the doctor dashboard modal
            closeDoctorDashboard();
            
            // Find the patient by name in storedPatients
            const patient = storedPatients.find(p => p.fullName === patientName);
            if (!patient) {
                showTranslatedAlert('Patient not found in system. Please add patient first.');
                return;
            }
            
            // Open consultation modal directly
            const consultationModal = document.getElementById('consultationModal');
            if (consultationModal) {
                // Set patient textbox value
                const patientInput = document.getElementById('consultPatient');
                const patientIdInput = document.getElementById('consultPatientId');
                const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
                const patientDisplay = `${patient.fullName}${age !== null ? ` (${age})` : ''} - ${patient.phone || ''}`;
                if (patientInput) {
                    patientInput.value = patientDisplay;
                }
                if (patientIdInput) {
                    patientIdInput.value = patient.id;
                }
                
                // Update modal translations
                updateModalTranslations();
                
                // Update consultation menu buttons translation
                setTimeout(() => {
                    updateConsultMenuButtons();
                }, 100);
                
                // Show the modal
                consultationModal.classList.add('active');
                
                // Setup IMC calculation for this modal
                setTimeout(() => {
                    const heightInput = document.getElementById('consultHeight');
                    const weightInput = document.getElementById('consultWeight');
                    const imcEl = document.getElementById('consultIMCValue');
                    const bmiCatEl = document.getElementById('consultBMICategory');

                    if (heightInput && weightInput && imcEl) {
                        const calculateBMI = () => {
                            const heightValue = heightInput.value?.trim() || '';
                            const weightValue = weightInput.value?.trim() || '';
                            
                            const height = parseFloat(heightValue.replace(',', '.'));
                            const weight = parseFloat(weightValue.replace(',', '.'));
                            
                            if (!isFinite(height) || !isFinite(weight) || height <= 0 || weight <= 0) {
                                imcEl.textContent = '—';
                                if (bmiCatEl) {
                                    bmiCatEl.textContent = '';
                                    bmiCatEl.className = 'text-sm text-gray-500';
                                }
                                return;
                            }
                            
                            const meters = height / 100;
                            const bmi = weight / (meters * meters);
                            imcEl.textContent = bmi.toFixed(1);
                            
                            if (bmiCatEl) {
                                let category = '';
                                let style = 'text-sm text-gray-500';
                                
                                if (bmi < 18.5) {
                                    category = 'Underweight';
                                    style = 'badge bg-yellow-100 text-yellow-800';
                                } else if (bmi < 25) {
                                    category = 'Normal';
                                    style = 'badge bg-green-100 text-green-800';
                                } else if (bmi < 30) {
                                    category = 'Overweight';
                                    style = 'badge bg-orange-100 text-orange-800';
                                } else {
                                    category = 'Obesity';
                                    style = 'badge bg-red-100 text-red-800';
                                }
                                
                                bmiCatEl.textContent = category;
                                bmiCatEl.className = style;
                            }
                        };

                        // Remove existing listeners
                        heightInput.removeEventListener('input', calculateBMI);
                        weightInput.removeEventListener('input', calculateBMI);
                        
                        // Add new listeners
                        heightInput.addEventListener('input', calculateBMI);
                        weightInput.addEventListener('input', calculateBMI);
                        
                        // Initial calculation
                        calculateBMI();
                    }
                }, 200);
                
                // Display patient details
                setTimeout(() => {
                    const detailsBox = document.getElementById('consultPatientDetails');
                    const detailsInfo = document.getElementById('consultPatientDetailsInfo');
                    const histEl = document.getElementById('consultPatientHistory');
                    
                    if (detailsBox && detailsInfo) {
                        // Calculate number of visits (consultations)
                        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                        const visitsCount = consultations.filter(c => c.patientId === patient.id).length;
                        
                        const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
                        const genderText = patient.gender ? (window.t ? window.t(patient.gender.toLowerCase(), patient.gender) : patient.gender) : 'N/A';
                        
                        detailsInfo.innerHTML = `
                            <div class="space-y-2">
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('full_name', 'Full Name') : 'Full Name'}:</span>
                                    <span class="text-gray-900">${patient.fullName || 'N/A'}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('file_number', 'File Number') : 'File Number'}:</span>
                                    <span class="text-gray-900">${patient.fileNumber || 'N/A'}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('cin_passport', 'CIN/Passport') : 'CIN/Passport'}:</span>
                                    <span class="text-gray-900">${patient.cinPassport || 'N/A'}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('email', 'Email') : 'Email'}:</span>
                                    <span class="text-gray-900">${patient.email || 'N/A'}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('phone', 'Phone') : 'Phone'}:</span>
                                    <span class="text-gray-900">${patient.phone || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('date_of_birth', 'Date of Birth') : 'Date of Birth'}:</span>
                                    <span class="text-gray-900">${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('age', 'Age') : 'Age'}:</span>
                                    <span class="text-gray-900">${age}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('gender', 'Gender') : 'Gender'}:</span>
                                    <span class="text-gray-900">${genderText}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('address', 'Address') : 'Address'}:</span>
                                    <span class="text-gray-900">${patient.address || 'N/A'}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('number_of_visits', 'Number of Visits') : 'Number of Visits'}:</span>
                                    <span class="font-bold text-blue-600">${visitsCount}</span>
                                </div>
                                <div class="flex items-start">
                                    <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('registered', 'Registered') : 'Registered'}:</span>
                                    <span class="text-gray-900">${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        `;
                        
                        if (histEl) {
                            histEl.textContent = (patient.medicalHistory && patient.medicalHistory.trim()) ? patient.medicalHistory : (window.t ? window.t('no_history_available', 'No history available.') : 'No history available.');
                        }
                        
                        // Patient details are loaded but section remains hidden until user clicks the button
                        // The section will show when user clicks "Patient Information" menu button
                    }
                }, 100);
            }
        };
        
        // Function to translate and update consultation menu buttons
        function updateConsultMenuButtons() {
            const buttonTranslations = {
                'patient': 'patient_information',
                'consultation': 'consultation',
                'lab': 'lab_assessment',
                'radiology': 'radiology_results',
                'prescription': 'medical_prescription',
                'documents': 'documents',
                'certificate': 'work_certificate'
            };
            
            Object.keys(buttonTranslations).forEach(section => {
                const button = document.querySelector(`.consult-menu-btn[data-section="${section}"]`);
                if (button) {
                    const translationKey = buttonTranslations[section];
                    const translatedText = window.t ? window.t(translationKey, button.textContent.trim()) : button.textContent.trim();
                    
                    // Split text into two lines if it contains multiple words
                    const words = translatedText.split(' ');
                    if (words.length > 1) {
                        // For two words, split them
                        if (words.length === 2) {
                            button.innerHTML = `<span style="display: block;">${words[0]}</span><span style="display: block;">${words[1]}</span>`;
                        } else {
                            // For more words, try to split evenly or by common patterns
                            const mid = Math.ceil(words.length / 2);
                            const firstLine = words.slice(0, mid).join(' ');
                            const secondLine = words.slice(mid).join(' ');
                            button.innerHTML = `<span style="display: block;">${firstLine}</span><span style="display: block;">${secondLine}</span>`;
                        }
                    } else {
                        // Single word - keep on one line
                        button.innerHTML = `<span style="display: block;">${translatedText}</span>`;
                    }
                }
            });
        }
        
        // Function to show/hide consultation sections
        window.showConsultSection = function(sectionName) {
            // Hide all sections
            const sections = document.querySelectorAll('.consult-section');
            sections.forEach(section => {
                section.classList.add('hidden');
            });
            
            // Remove active class from all menu buttons
            const menuButtons = document.querySelectorAll('.consult-menu-btn');
            menuButtons.forEach(btn => {
                btn.classList.remove('active');
                // Reset opacity for non-active buttons
                btn.style.opacity = '0.8';
                // Ensure button maintains size
                btn.style.flex = '1';
                btn.style.minWidth = '0';
            });
            
            // Show selected section
            const selectedSection = document.getElementById('consultSection' + sectionName.charAt(0).toUpperCase() + sectionName.slice(1));
            if (selectedSection) {
                selectedSection.classList.remove('hidden');
                
                // Update prescription dropdown when prescription section is shown
                if (sectionName === 'prescription') {
                    if (typeof updatePrescriptionMedicineDropdown === 'function') {
                        updatePrescriptionMedicineDropdown();
                    }
                    if (typeof renderPrescriptionMedicinesList === 'function') {
                        renderPrescriptionMedicinesList();
                    }
                }
            }
            
            // Add active class to clicked button
            const clickedButton = document.querySelector(`.consult-menu-btn[data-section="${sectionName}"]`);
            if (clickedButton) {
                clickedButton.classList.add('active');
                clickedButton.style.opacity = '1';
                // Ensure active button maintains same size
                clickedButton.style.flex = '1';
                clickedButton.style.minWidth = '0';
            }
        };
        
        // Edit radiology result - focus on textarea
        window.editRadiologyResult = function() {
            const textarea = document.getElementById('radiologyResult');
            if (textarea) {
                textarea.focus();
            }
        };
        
        // Edit diagnostics - focus on textarea
        window.editDiagnostics = function() {
            const textarea = document.getElementById('radiologyDiagnostics');
            if (textarea) {
                textarea.focus();
            }
        };
        
        // Edit lab results - focus on textarea
        window.editLabResults = function() {
            const textarea = document.getElementById('labResults');
            if (textarea) {
                textarea.focus();
            }
        };
        
        // Edit lab notes - focus on textarea
        window.editLabNotes = function() {
            const textarea = document.getElementById('labNotes');
            if (textarea) {
                textarea.focus();
            }
        };
        
        // Load documents for the current consultation patient
        function loadConsultationDocuments() {
            const documentsList = document.getElementById('consultDocumentsList');
            if (!documentsList) return;
            
            // Get patient ID from consultation form
            const patientId = document.getElementById('consultPatientId')?.value || currentConsultationPatientId;
            
            if (!patientId) {
                documentsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <p data-translate="select_patient_first">Please select a patient first.</p>
                    </div>
                `;
                if (window.I18n && window.I18n.walkAndTranslate) {
                    window.I18n.walkAndTranslate();
                }
                return;
            }
            
            // Load certificates for this patient
            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            const patientCertificates = certificates.filter(cert => cert.patientId === patientId);
            
            if (patientCertificates.length === 0) {
                documentsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p data-translate="no_documents_found">No documents found for this patient.</p>
                    </div>
                `;
                if (window.I18n && window.I18n.walkAndTranslate) {
                    window.I18n.walkAndTranslate();
                }
                return;
            }
            
            // Sort by date (newest first)
            patientCertificates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Render certificates
            documentsList.innerHTML = patientCertificates.map(cert => {
                const certType = cert.certType ? cert.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Medical Certificate';
                const certDate = new Date(cert.createdAt);
                const dateStr = certDate.toLocaleDateString();
                const timeStr = certDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50 cursor-pointer" onclick="previewPatientDocument('certificate', '${cert.id}', '${cert.consultationId || ''}')">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <span class="font-semibold text-gray-900">${certType}</span>
                            </div>
                            <span class="text-xs text-gray-500">${dateStr} ${timeStr}</span>
                        </div>
                        <div class="text-sm text-gray-600 mt-2 flex justify-between items-center">
                            <span>
                                <strong data-translate="document_id">Document ID:</strong> ${cert.id}
                            </span>
                            <span class="text-blue-600 text-xs font-medium" data-translate="click_to_preview">Click to preview</span>
                        </div>
                        ${cert.restPeriod ? `
                            <div class="mt-2 text-sm text-gray-600">
                                <strong data-translate="rest_period">Rest Period:</strong> ${cert.restPeriod} ${window.t ? window.t('days', 'days') : 'days'}
                            </div>
                        ` : ''}
                        ${cert.startDate || cert.endDate ? `
                            <div class="mt-2 text-sm text-gray-600">
                                ${cert.startDate ? `<strong data-translate="start_date">Start Date:</strong> ${new Date(cert.startDate).toLocaleDateString()}` : ''}
                                ${cert.startDate && cert.endDate ? ' | ' : ''}
                                ${cert.endDate ? `<strong data-translate="end_date">End Date:</strong> ${new Date(cert.endDate).toLocaleDateString()}` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        window.rejectConsultation = function(appointmentId) {
            if (showTranslatedConfirm('Are you sure you want to reject this consultation?')) {
                // Update appointment status to rejected
                const appointments = JSON.parse(localStorage.getItem('healthcareAppointments') || '[]');
                const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
                
                if (appointmentIndex !== -1) {
                    appointments[appointmentIndex].status = 'rejected';
                    localStorage.setItem('healthcareAppointments', JSON.stringify(appointments));
                    
                    // Update stored appointments in memory
                    storedAppointments = appointments;
                    
                    // Refresh the dashboard
                    loadTodayAppointments();
                    
                    showTranslatedAlert('Consultation rejected successfully.');
                } else {
                    showTranslatedAlert('Appointment not found.');
                }
            }
        };

        window.loadTodayAppointments = function() {
            const today = new Date();
            const todayStr = formatDateForStorage(today);
            const allAppointments = getAppointmentsForDate(today);
            
            // Filter only validated appointments for doctor dashboard
            const appointments = allAppointments.filter(appointment => 
                appointment.status && appointment.status.toLowerCase() === 'validated'
            );
            
            const appointmentCountEl = document.getElementById('appointmentCount');
            const appointmentsListEl = document.getElementById('todayAppointmentsList');
            
            appointmentCountEl.textContent = appointments.length;
            
            if (appointments.length === 0) {
                appointmentsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_appointments_today">${window.t ? window.t('no_appointments_today', 'No appointments scheduled for today.') : 'No appointments scheduled for today.'}</p>`;
                return;
            }
            
            // Get all consultations to check if patient has past consultations
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            
            appointmentsListEl.innerHTML = appointments.map(appointment => {
                const patientName = appointment.clientName || 'Unknown Patient';
                const statusColor = getStatusColor(appointment.status);
                
                // Find patient by name
                const patient = storedPatients.find(p => p.fullName === patientName);
                
                // Check if patient has any consultations
                let hasConsultations = false;
                if (patient) {
                    const patientConsultations = consultations.filter(c => c.patientId === patient.id);
                    hasConsultations = patientConsultations.length > 0;
                }
                
                return `
                    <div class="appointment-item">
                        <div class="patient-name">${patientName}</div>
                        <div class="appointment-time">${appointment.time} (${appointment.duration} min)</div>
                        <div class="flex items-center gap-2 mb-3">
                            <span class="badge ${statusColor}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                            ${appointment.notes ? `<span class="text-sm text-gray-600">${appointment.notes}</span>` : ''}
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-primary" onclick="startConsultation('${appointment.id}', '${patientName}')" data-translate="new_consultation">${window.t ? window.t('new_consultation', 'New Consultation') : 'New Consultation'}</button>
                            ${hasConsultations ? `<button class="btn btn-sm btn-secondary" onclick="updateLastConsultation('${appointment.id}', '${patientName}')" data-translate="update_last_consultation">${window.t ? window.t('update_last_consultation', 'Update Last Consultation') : 'Update Last Consultation'}</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        window.loadTodayConsultations = function() {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Filter consultations for today
            const todayConsultations = consultations.filter(consultation => {
                const consultationDate = new Date(consultation.createdAt).toISOString().split('T')[0];
                return consultationDate === todayStr;
            });
            
            const consultationCountEl = document.getElementById('consultationCount');
            const consultationsListEl = document.getElementById('todayConsultationsList');
            
            consultationCountEl.textContent = todayConsultations.length;
            
            if (todayConsultations.length === 0) {
                consultationsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_consultations_today">${window.t ? window.t('no_consultations_today', 'No consultations conducted today.') : 'No consultations conducted today.'}</p>`;
                return;
            }
            
            consultationsListEl.innerHTML = todayConsultations.map(consultation => {
                const patient = storedPatients.find(p => p.id === consultation.patientId);
                const patientName = patient ? patient.fullName : 'Unknown Patient';
                const consultationTime = new Date(consultation.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <div class="consultation-item">
                        <div class="patient-name">${patientName}</div>
                        <div class="consultation-time">${consultationTime}</div>
                        <div class="consultation-notes">${consultation.notes.substring(0, 100)}${consultation.notes.length > 100 ? '...' : ''}</div>
                        <div class="flex gap-2 mt-3 flex-wrap">
                            <button class="btn btn-sm btn-primary" onclick="viewConsultationDetail('${consultation.id}')" data-translate="view_details">View Details</button>
                            <button class="btn btn-sm btn-secondary" onclick="editConsultation('${consultation.id}')" data-translate="update">${window.t ? window.t('update', 'Update') : 'Update'}</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Consultation Detail Modal Functions
        window.viewConsultationDetail = function(consultationId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const consultation = consultations.find(c => c.id === consultationId);
            
            if (!consultation) {
                showTranslatedAlert('Consultation not found.');
                return;
            }
            
            const patient = storedPatients.find(p => p.id === consultation.patientId);
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            const consultationTime = new Date(consultation.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const detailContent = document.getElementById('consultationDetailContent');
            detailContent.innerHTML = `
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4 text-gray-900">${window.t ? window.t('patient_information', 'Patient Information') : 'Patient Information'}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><strong>${window.t ? window.t('patient_name', 'Patient Name') : 'Patient Name'}:</strong> ${patientName}</div>
                        <div><strong>${window.t ? window.t('date_time', 'Date & Time') : 'Date & Time'}:</strong> ${consultationTime}</div>
                        <div><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${consultation.doctor || 'N/A'}</div>
                        <div><strong>${window.t ? window.t('payment_status', 'Payment Status') : 'Payment Status'}:</strong> ${consultation.paymentStatus === 'paying' ? (window.t ? window.t('paying_patient', 'Paying Patient') : 'Paying Patient') : (window.t ? window.t('non_paying_patient', 'Non-Paying Patient') : 'Non-Paying Patient')}</div>
                    </div>
                </div>
                
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4 text-gray-900">${window.t ? window.t('vital_signs', 'Vital Signs') : 'Vital Signs'}</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        ${consultation.height ? `<div><strong>${window.t ? window.t('height', 'Height') : 'Height'}:</strong> ${consultation.height} cm</div>` : ''}
                        ${consultation.weight ? `<div><strong>${window.t ? window.t('weight', 'Weight') : 'Weight'}:</strong> ${consultation.weight} kg</div>` : ''}
                        ${consultation.imc ? `<div><strong>${window.t ? window.t('bmi', 'IMC/BMI') : 'IMC/BMI'}:</strong> ${consultation.imc} (${consultation.bmiCategory || 'N/A'})</div>` : ''}
                        ${consultation.temperature ? `<div><strong>${window.t ? window.t('temperature', 'Temperature') : 'Temperature'}:</strong> ${consultation.temperature} °C</div>` : ''}
                        ${consultation.heartRate ? `<div><strong>${window.t ? window.t('heart_rate', 'Heart Rate') : 'Heart Rate'}:</strong> ${consultation.heartRate} bpm</div>` : ''}
                        ${consultation.bloodSugar ? `<div><strong>${window.t ? window.t('blood_sugar', 'Blood Sugar') : 'Blood Sugar'}:</strong> ${consultation.bloodSugar} mg/dL</div>` : ''}
                        ${consultation.bpSystolic && consultation.bpDiastolic ? `<div><strong>${window.t ? window.t('blood_pressure', 'Blood Pressure') : 'Blood Pressure'}:</strong> ${consultation.bpSystolic}/${consultation.bpDiastolic} mmHg</div>` : ''}
                    </div>
                    ${consultation.vitalNotes ? `
                        <div class="mt-4 pt-4 border-t border-gray-200">
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">${window.t ? window.t('vital_notes', 'Vital Notes') : 'Vital Notes'}</h4>
                            <div class="text-sm text-gray-700 whitespace-pre-wrap">${consultation.vitalNotes}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-3 text-gray-900">${window.t ? window.t('clinical_notes', 'Clinical Note') : 'Clinical Note'}</h3>
                    <div class="text-sm text-gray-700 whitespace-pre-wrap">${consultation.notes || (window.t ? window.t('no_notes_provided', 'No notes provided.') : 'No notes provided.')}</div>
                </div>
                
                ${consultation.radiologyResult || consultation.radiologyDiagnostics ? `
                    <div class="card p-4">
                        <h3 class="text-lg font-semibold mb-4 text-gray-900">${window.t ? window.t('radiology_results', 'Radiology Results') : 'Radiology Results'}</h3>
                        ${consultation.radiologyResult ? `
                            <div class="mb-4">
                                <h4 class="text-sm font-semibold text-gray-700 mb-2">${window.t ? window.t('radiology_result', 'Radiology Result') : 'Radiology Result'}</h4>
                                <div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.radiologyResult}</div>
                            </div>
                        ` : ''}
                        ${consultation.radiologyDiagnostics ? `
                            <div>
                                <h4 class="text-sm font-semibold text-gray-700 mb-2">${window.t ? window.t('diagnostics', 'Diagnostics') : 'Diagnostics'}</h4>
                                <div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.radiologyDiagnostics}</div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${consultation.labResults || consultation.labNotes ? `
                    <div class="card p-4">
                        <h3 class="text-lg font-semibold mb-4 text-gray-900">${window.t ? window.t('lab_assessment', 'Lab Assessment') : 'Lab Assessment'}</h3>
                        ${consultation.labResults ? `
                            <div class="mb-4">
                                <h4 class="text-sm font-semibold text-gray-700 mb-2">${window.t ? window.t('lab_results', 'Lab Results') : 'Lab Results'}</h4>
                                <div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.labResults}</div>
                            </div>
                        ` : ''}
                        ${consultation.labNotes ? `
                            <div>
                                <h4 class="text-sm font-semibold text-gray-700 mb-2">${window.t ? window.t('lab_notes', 'Lab Notes') : 'Lab Notes'}</h4>
                                <div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.labNotes}</div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${consultation.prescription ? `
                    <div class="card p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-lg font-semibold text-gray-900">Prescription</h3>
                            <button data-consultation-id="${consultationId}" class="btn-print-prescription btn btn-sm btn-primary" type="button">
                                <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                </svg>
                                ${window.t ? window.t('print_prescription', 'Print Prescription') : 'Print Prescription'}
                            </button>
                        </div>
                        <div class="text-sm text-gray-700 whitespace-pre-wrap">${consultation.prescription}</div>
                    </div>
                ` : ''}
            `;
            
            // Add medical certificates section
            const medicalCertificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            // Filter certificates that match THIS consultation ID only
            const consultationCertificates = medicalCertificates.filter(c => c.consultationId === consultationId);
            
            if (consultationCertificates.length > 0) {
                detailContent.innerHTML += `
                    <div class="card p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">${window.t ? window.t('medical_certificates', 'Medical Certificates') : 'Medical Certificates'}</h3>
                        </div>
                        <div class="space-y-3">
                            ${consultationCertificates.map((cert, index) => `
                                <div class="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span class="font-semibold text-gray-700">${cert.certType ? cert.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Medical Certificate'}</span>
                                        </div>
                                        <span class="text-xs text-gray-500">${new Date(cert.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                        ${cert.startDate ? `
                                            <div><strong>${window.t ? window.t('start_date', 'Start Date') : 'Start Date'}:</strong> ${new Date(cert.startDate).toLocaleDateString()}</div>
                                        ` : ''}
                                        ${cert.endDate ? `
                                            <div><strong>${window.t ? window.t('end_date', 'End Date') : 'End Date'}:</strong> ${new Date(cert.endDate).toLocaleDateString()}</div>
                                        ` : ''}
                                        ${cert.restPeriod ? `
                                            <div><strong>${window.t ? window.t('rest_period', 'Rest Period') : 'Rest Period'}:</strong> ${cert.restPeriod} ${window.t ? window.t('days', 'days') : 'days'}</div>
                                        ` : ''}
                                    </div>
                                    ${cert.notes ? `
                                        <div class="text-sm mb-2">
                                            <strong>${window.t ? window.t('notes', 'Notes') : 'Notes'}:</strong>
                                            <div class="mt-1 text-gray-600">${cert.notes}</div>
                                        </div>
                                    ` : ''}
                                    <div class="mt-3 pt-3 border-t border-green-200">
                                        <button data-cert-id="${cert.id}" class="btn-print-certificate btn btn-sm btn-primary" type="button">
                                            <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                            </svg>
                                            ${window.t ? window.t('print_certificate', 'Print Certificate') : 'Print Certificate'}
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Show button to add first certificate
                detailContent.innerHTML += `
                    <div class="card p-4 border-dashed border-2 border-gray-300 bg-gray-50">
                        <div class="text-center py-3">
                            <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-gray-600 mb-3">${window.t ? window.t('no_certificates_yet', 'No medical certificates yet') : 'No medical certificates yet'}</p>
                        </div>
                    </div>
                `;
            }
            
            updateModalTranslations();
            
            const modal = document.getElementById('consultationDetailModal');
            if (modal) {
                // Ensure it appears above other modals
                modal.style.zIndex = '10000';
                modal.classList.add('active');
                // Focus content for accessibility
                const content = document.getElementById('consultationDetailModalContent') || modal.querySelector('.modal-content');
                if (content && typeof content.focus === 'function') {
                    setTimeout(() => content.focus(), 0);
                }
                
                // Add event delegation for print certificate and prescription buttons on the modal content
                setTimeout(() => {
                    const detailContent = document.getElementById('consultationDetailContent');
                    if (detailContent) {
                        // Remove any existing click listeners by cloning
                        detailContent.removeEventListener('click', handlePrintCertificateClick);
                        detailContent.removeEventListener('click', handlePrintPrescriptionClick);
                        
                        // Add new event listeners
                        detailContent.addEventListener('click', handlePrintCertificateClick);
                        detailContent.addEventListener('click', handlePrintPrescriptionClick);
                    }
                }, 100);
            }
        };
        
        // Event handler for print certificate buttons
        function handlePrintCertificateClick(e) {
            const printButton = e.target.closest('.btn-print-certificate');
            if (printButton) {
                e.preventDefault();
                e.stopPropagation();
                const certId = printButton.getAttribute('data-cert-id');
                if (certId) {
                    if (typeof window.printMedicalCertificate === 'function') {
                        window.printMedicalCertificate(certId);
                    } else {
                        console.error('printMedicalCertificate function not available');
                        alert('Print function is not available. Please refresh the page.');
                    }
                } else {
                    console.error('Certificate ID not found');
                }
            }
        }
        
        // Event handler for print prescription buttons
        function handlePrintPrescriptionClick(e) {
            const printButton = e.target.closest('.btn-print-prescription');
            if (printButton) {
                e.preventDefault();
                e.stopPropagation();
                const consultationId = printButton.getAttribute('data-consultation-id');
                if (consultationId) {
                    if (typeof window.printPrescription === 'function') {
                        window.printPrescription(consultationId);
                    } else {
                        console.error('printPrescription function not available');
                        alert('Print function is not available. Please refresh the page.');
                    }
                } else {
                    console.error('Consultation ID not found');
                }
            }
        }

        // Open consultation modal pre-filled for editing
        window.editConsultation = function(consultationId) {
            try {
                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                const c = consultations.find(x => x.id === consultationId);
                if (!c) {
                    showTranslatedAlert('Consultation not found.');
                    return;
                }
                editingConsultationId = consultationId;

                // Set patient display and hidden id
                const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                const p = patients.find(pt => pt.id === c.patientId);
                const patientInput = document.getElementById('consultPatient');
                const patientIdInput = document.getElementById('consultPatientId');
                if (p && patientInput) {
                    const age = p.dateOfBirth ? calculateAge(p.dateOfBirth) : null;
                    patientInput.value = `${p.fullName}${age != null ? ` (${age})` : ''} - ${p.phone || ''}`;
                }
                if (patientIdInput) patientIdInput.value = c.patientId;

                // Set consultation ID in certificate form for linking certificates
                const consultCertConsultationIdInput = document.getElementById('consultCertConsultationId');
                if (consultCertConsultationIdInput) {
                    consultCertConsultationIdInput.value = consultationId;
                }

                // Fill vitals and fields
                const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = (val ?? '') }; 
                set('consultHeight', c.height);
                set('consultWeight', c.weight);
                set('consultTemperature', c.temperature);
                set('consultHeartRate', c.heartRate);
                set('consultBloodSugar', c.bloodSugar);
                set('consultBloodPressure', c.bpSystolic && c.bpDiastolic ? `${c.bpSystolic}/${c.bpDiastolic}` : '');
                set('consultVitalNotes', c.vitalNotes || '');
                set('consultNotes', c.notes);
                set('consultPrescription', c.prescription);
                set('radiologyResult', c.radiologyResult || '');
                set('radiologyDiagnostics', c.radiologyDiagnostics || '');
                set('labResults', c.labResults || '');
                set('labNotes', c.labNotes || '');
                
                const payingRadio = document.getElementById('payingPatient');
                const nonPayingRadio = document.getElementById('nonPayingPatient');
                if (c.paymentStatus === 'non-paying') {
                    if (nonPayingRadio) nonPayingRadio.checked = true;
                } else {
                    if (payingRadio) payingRadio.checked = true;
                }

                // Populate patient details section
                if (p) {
                    setTimeout(() => {
                        const detailsBox = document.getElementById('consultPatientDetails');
                        const detailsInfo = document.getElementById('consultPatientDetailsInfo');
                        const histEl = document.getElementById('consultPatientHistory');
                        
                        if (detailsBox && detailsInfo) {
                            // Calculate number of visits (consultations)
                            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                            const visitsCount = consultations.filter(c => c.patientId === p.id).length;
                            
                            const age = p.dateOfBirth ? calculateAge(p.dateOfBirth) : 'N/A';
                            const genderText = p.gender ? (window.t ? window.t(p.gender.toLowerCase(), p.gender) : p.gender) : 'N/A';
                            
                            detailsInfo.innerHTML = `
                                <div class="space-y-2">
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('full_name', 'Full Name') : 'Full Name'}:</span>
                                        <span class="text-gray-900">${p.fullName || 'N/A'}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('file_number', 'File Number') : 'File Number'}:</span>
                                        <span class="text-gray-900">${p.fileNumber || 'N/A'}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('cin_passport', 'CIN/Passport') : 'CIN/Passport'}:</span>
                                        <span class="text-gray-900">${p.cinPassport || 'N/A'}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('email', 'Email') : 'Email'}:</span>
                                        <span class="text-gray-900">${p.email || 'N/A'}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('phone', 'Phone') : 'Phone'}:</span>
                                        <span class="text-gray-900">${p.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('date_of_birth', 'Date of Birth') : 'Date of Birth'}:</span>
                                        <span class="text-gray-900">${p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('age', 'Age') : 'Age'}:</span>
                                        <span class="text-gray-900">${age}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('gender', 'Gender') : 'Gender'}:</span>
                                        <span class="text-gray-900">${genderText}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('address', 'Address') : 'Address'}:</span>
                                        <span class="text-gray-900">${p.address || 'N/A'}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('number_of_visits', 'Number of Visits') : 'Number of Visits'}:</span>
                                        <span class="font-bold text-blue-600">${visitsCount}</span>
                                    </div>
                                    <div class="flex items-start">
                                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('registered', 'Registered') : 'Registered'}:</span>
                                        <span class="text-gray-900">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            `;
                            
                            if (histEl) {
                                histEl.textContent = (p.medicalHistory && p.medicalHistory.trim()) ? p.medicalHistory : (window.t ? window.t('no_history_available', 'No history available.') : 'No history available.');
                            }
                        }
                    }, 100);
                }

                // Load existing certificate for this consultation if it exists
                try {
                    const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
                    const existingCertificate = certificates.find(cert => cert.consultationId === consultationId);
                    
                    if (existingCertificate) {
                        // Populate certificate fields
                        const setCert = (id, val) => { 
                            const el = document.getElementById(id); 
                            if (el && val !== null && val !== undefined) {
                                // Format dates for date inputs
                                if (id.includes('Date') && val) {
                                    const date = new Date(val);
                                    if (!isNaN(date.getTime())) {
                                        el.value = date.toISOString().split('T')[0];
                                    }
                                } else {
                                    el.value = val;
                                }
                            }
                        };
                        
                        setCert('consultCertType', existingCertificate.certType);
                        setCert('consultCertRestPeriod', existingCertificate.restPeriod);
                        setCert('consultCertStartDate', existingCertificate.startDate);
                        setCert('consultCertEndDate', existingCertificate.endDate);
                        setCert('consultCertNotes', existingCertificate.notes);
                    } else {
                        // Clear certificate fields if no certificate exists
                        const clearCert = (id) => { 
                            const el = document.getElementById(id); 
                            if (el && id !== 'consultCertConsultationId') el.value = ''; 
                        };
                        clearCert('consultCertType');
                        clearCert('consultCertRestPeriod');
                        clearCert('consultCertStartDate');
                        clearCert('consultCertEndDate');
                        clearCert('consultCertNotes');
                    }
                } catch (error) {
                    console.error('Error loading certificate for consultation:', error);
                }

                // Update consultation menu buttons translation
                setTimeout(() => {
                    updateConsultMenuButtons();
                }, 100);

                // Show patient details section and modal
                const allSections = document.querySelectorAll('.consult-section');
                allSections.forEach(sec => sec.classList.add('hidden'));
                const patientSection = document.getElementById('consultSectionPatient');
                if (patientSection) patientSection.classList.remove('hidden');
                
                // Set patient information button as active
                const menuButtons = document.querySelectorAll('.consult-menu-btn');
                menuButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.opacity = '0.8';
                    if (btn.getAttribute('data-section') === 'patient') {
                        btn.classList.add('active');
                        btn.style.opacity = '1';
                    }
                });
                
                const consultationModal = document.getElementById('consultationModal');
                if (consultationModal) {
                    // Check if dashboard modal is active and set higher z-index
                    const dashboardModal = document.getElementById('doctorDashboardModal');
                    if (dashboardModal && dashboardModal.classList.contains('active')) {
                        consultationModal.style.zIndex = '3000';
                    } else {
                        consultationModal.style.zIndex = '';
                    }
                    consultationModal.classList.add('active');
                }
            } catch (e) {
                console.error('editConsultation error', e);
            }
        };
        
        window.closeConsultationDetail = function() {
            const modal = document.getElementById('consultationDetailModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.zIndex = '';
            }
        };

        // Update last consultation for a patient from appointment
        window.updateLastConsultation = function(appointmentId, patientName) {
            try {
                // Check if user is doctor
                const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
                const isDoctor = session && session.role === 'doctor';
                
                if (!isDoctor) {
                    showTranslatedAlert('consultations_doctors_only');
                    return;
                }

                // Find the patient by name
                const patient = storedPatients.find(p => p.fullName === patientName);
                if (!patient) {
                    showTranslatedAlert('Patient not found in system. Please add patient first.');
                    return;
                }

                // Find all consultations for this patient
                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                const patientConsultations = consultations.filter(c => c.patientId === patient.id);
                
                if (patientConsultations.length === 0) {
                    showTranslatedAlert('No consultations found for this patient.');
                    return;
                }

                // Sort by date (newest first) and get the last one
                patientConsultations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                const lastConsultation = patientConsultations[0];

                // Store appointment ID so we can mark it as completed after consultation is saved
                window.currentConsultationAppointmentId = appointmentId;

                // Use the existing editConsultation function to open the modal
                if (lastConsultation && lastConsultation.id) {
                    window.editConsultation(lastConsultation.id);
                } else {
                    showTranslatedAlert('Last consultation not found.');
                }
            } catch (e) {
                console.error('updateLastConsultation error', e);
                showTranslatedAlert('Error updating last consultation.');
            }
        };

        // Reason, Diagnosis, Clinical Exam Modal Functions
        window.openReasonModal = function() {
            const modal = document.getElementById('reasonModal');
            if (modal) modal.classList.add('active');
        };

        window.closeReasonModal = function() {
            const modal = document.getElementById('reasonModal');
            if (modal) modal.classList.remove('active');
        };

        window.saveReason = function() {
            const text = document.getElementById('reasonText').value;
            // Store or process the reason text
            console.log('Reason saved:', text);
            showTranslatedAlert('Reason documented successfully');
            closeReasonModal();
        };

        window.openDiagnosisModal = function() {
            const modal = document.getElementById('diagnosisModal');
            if (modal) modal.classList.add('active');
        };

        window.closeDiagnosisModal = function() {
            const modal = document.getElementById('diagnosisModal');
            if (modal) modal.classList.remove('active');
        };

        window.saveDiagnosis = function() {
            const text = document.getElementById('diagnosisText').value;
            // Store or process the diagnosis text
            console.log('Diagnosis saved:', text);
            showTranslatedAlert('Diagnosis documented successfully');
            closeDiagnosisModal();
        };

        window.openClinicalExamModal = function() {
            const modal = document.getElementById('clinicalExamModal');
            if (modal) modal.classList.add('active');
        };

        window.closeClinicalExamModal = function() {
            const modal = document.getElementById('clinicalExamModal');
            if (modal) modal.classList.remove('active');
        };

        window.saveClinicalExam = function() {
            const text = document.getElementById('clinicalExamText').value;
            // Store or process the clinical exam text
            console.log('Clinical Exam saved:', text);
            showTranslatedAlert('Clinical examination documented successfully');
            closeClinicalExamModal();
        };

        // Laboratory Assessment Functions - REMOVED (modal removed)

        // ========================================
        // Medical Certificate Functions
        // ========================================



        // Consultation Certificate Form Submission
        // Function to save and generate certificate
        window.saveAndGenerateCertificate = function(showAlert = true) {
            const patientId = document.getElementById('consultPatientId')?.value;
            if (!patientId) {
                if (showAlert) {
                alert('Please select a patient first.');
                }
                return;
            }
            
            // Get consultation ID - check if we're editing an existing consultation first
            let consultationId = document.getElementById('consultCertConsultationId')?.value || '';
            
            // If no consultation ID set, check if we're editing a consultation
            if (!consultationId && editingConsultationId) {
                consultationId = editingConsultationId;
            }
            
            // If still no ID, try to get from the most recent consultation for this patient
            if (!consultationId) {
                try {
                    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                    const patientId = document.getElementById('consultPatientId')?.value;
                    if (patientId) {
                        const patientConsultations = consultations.filter(c => c.patientId === patientId);
                        if (patientConsultations.length > 0) {
                            // Get the most recent consultation
                            const mostRecent = patientConsultations.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))[0];
                            consultationId = mostRecent.id;
                            // Update the hidden input
                            const consultCertConsultationIdInput = document.getElementById('consultCertConsultationId');
                            if (consultCertConsultationIdInput) {
                                consultCertConsultationIdInput.value = consultationId;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error finding consultation ID:', error);
                }
            }
            
            // If still no ID, use temp ID (for new consultations not yet saved)
            if (!consultationId) {
                consultationId = 'temp_cert_consult_' + Date.now();
            }
            
            const certType = document.getElementById('consultCertType').value;
            const restPeriod = document.getElementById('consultCertRestPeriod').value;
            const startDate = document.getElementById('consultCertStartDate').value;
            const endDate = document.getElementById('consultCertEndDate').value;
            const notes = document.getElementById('consultCertNotes')?.value.trim() || '';
            
            // Don't proceed if no certificate fields are filled
            if (!certType && !startDate && !endDate && !restPeriod) {
                return;
            }
            
            // Save certificate
            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            
            // Get patient and doctor info for certificate
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const patient = patients.find(p => p.id === patientId);
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
        
            // Check if a certificate already exists for this consultation
            const existingCertIndex = certificates.findIndex(cert => cert.consultationId === consultationId);
            
            let certificateToSave;
            
            if (existingCertIndex !== -1) {
                // Update existing certificate
                certificateToSave = {
                    ...certificates[existingCertIndex],
                    certType: certType,
                    restPeriod: restPeriod ? parseInt(restPeriod) : null,
                    startDate: startDate,
                    endDate: endDate || null,
                    notes: notes,
                    patientName: patient ? patient.fullName : certificates[existingCertIndex].patientName || '-',
                    doctorName: session?.name || certificates[existingCertIndex].doctorName || 'Doctor'
                };
                certificates[existingCertIndex] = certificateToSave;
            } else {
                // Create new certificate
                certificateToSave = {
                id: 'cert_' + Date.now(),
                consultationId: consultationId,
                    patientId: patientId,
                    patientName: patient ? patient.fullName : '-',
                    doctorName: session?.name || 'Doctor',
                certType: certType,
                restPeriod: restPeriod ? parseInt(restPeriod) : null,
                startDate: startDate,
                endDate: endDate || null,
                notes: notes,
                createdAt: new Date().toISOString()
            };
                certificates.push(certificateToSave);
            }
            
            localStorage.setItem('medical_certificates', JSON.stringify(certificates));
            
            // Show success message only if called manually (not automatically)
            if (showAlert) {
            const successMessage = translations[currentLanguage].certificate_saved || 'Medical certificate saved successfully!';
            showTranslatedAlert('certificate_saved', successMessage);
            }
            
            // Don't automatically print certificate when saving from consultation form
            // Certificate can be printed manually from the Documents section or consultation details
            
            // Refresh consultation detail if it's open
            const detailModal = document.getElementById('consultationDetailModal');
            if (detailModal && detailModal.classList.contains('active')) {
                // Try to get consultation ID from the certificate
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const consultation = consultations.find(c => c.id === consultationId);
                if (consultation) {
                    setTimeout(() => {
                viewConsultationDetail(consultationId);
                    }, 100);
                }
            }
            
            // Reset form
            const consultCertForm = document.getElementById('consultCertificateForm');
            if (consultCertForm) {
                const formInputs = consultCertForm.querySelectorAll('input, select, textarea');
                formInputs.forEach(input => {
                    if (input.id !== 'consultCertConsultationId') {
                        input.value = '';
                    }
                });
            }
        };

        // Certificate form submit handler removed - certificates are now generated automatically when consultation is saved
        
        // Auto-calculate end date for consultation certificate form
        const consultCertForm = document.getElementById('consultCertificateForm');
        if (consultCertForm) {
            const consultRestPeriodInput = document.getElementById('consultCertRestPeriod');
            const consultStartDateInput = document.getElementById('consultCertStartDate');
            const consultEndDateInput = document.getElementById('consultCertEndDate');
            
            if (consultRestPeriodInput && consultStartDateInput && consultEndDateInput) {
                let isUpdating = false; // Flag to prevent circular updates
                
                const updateConsultEndDate = function() {
                    if (isUpdating) return; // Prevent circular updates
                    const startDate = consultStartDateInput.value;
                    const restPeriod = parseInt(consultRestPeriodInput.value);
                    
                    if (startDate && restPeriod > 0) {
                        isUpdating = true;
                        const start = new Date(startDate);
                        start.setDate(start.getDate() + restPeriod);
                        consultEndDateInput.value = start.toISOString().split('T')[0];
                        isUpdating = false;
            }
                };
                
                const updateConsultStartDate = function() {
                    if (isUpdating) return; // Prevent circular updates
                    const endDate = consultEndDateInput.value;
                    const restPeriod = parseInt(consultRestPeriodInput.value);
                    
                    if (endDate && restPeriod > 0) {
                        isUpdating = true;
                        const end = new Date(endDate);
                        // Subtract (restPeriod - 1) days to get the start date
                        // This ensures the period includes both start and end dates
                        end.setDate(end.getDate() - (restPeriod - 1));
                        consultStartDateInput.value = end.toISOString().split('T')[0];
                        isUpdating = false;
                    }
                };
                
                const updateConsultRestPeriod = function() {
                    if (isUpdating) return; // Prevent circular updates
                    const startDate = consultStartDateInput.value;
                    const endDate = consultEndDateInput.value;
                    
                    if (startDate && endDate) {
                        isUpdating = true;
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        
                        if (end >= start) {
                            // Calculate difference in days (inclusive of both dates)
                            const diffTime = end - start;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            consultRestPeriodInput.value = diffDays;
                        }
                        isUpdating = false;
                    }
                };
                
                consultRestPeriodInput.addEventListener('input', updateConsultEndDate);
                consultStartDateInput.addEventListener('change', function() {
                    updateConsultEndDate();
                    updateConsultRestPeriod();
                });
                consultEndDateInput.addEventListener('change', function() {
                    updateConsultStartDate();
                    updateConsultRestPeriod();
                });
            }
        }


        window.printMedicalCertificate = function(certificateId) {
            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            const cert = certificates.find(c => c.id === certificateId);
            
            if (!cert) {
                alert('Certificate not found.');
                return;
            }
            
            // Get patient information
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const patient = cert.patientId ? patients.find(p => p.id === cert.patientId) : null;
            
            // Get consultation date
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const consultation = cert.consultationId ? consultations.find(c => c.id === cert.consultationId) : null;
            const consultationDate = consultation ? consultation.createdAt : cert.createdAt;
            
            // Get cabinet settings
            const cabinetSettings = getCabinetSettings();
            
            // Format dates in French format
            const formatDateFR = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return day + '/' + month + '/' + year;
            };
            
            const consultationDateFR = formatDateFR(consultationDate);
            const startDateFR = formatDateFR(cert.startDate);
            const endDateFR = formatDateFR(cert.endDate);
            const certificateDateFR = formatDateFR(cert.createdAt);
            const patientBirthDateFR = patient && patient.dateOfBirth ? formatDateFR(patient.dateOfBirth) : '';
            
            // Determine patient title (M./Mme) based on gender
            const patientTitle = patient && patient.gender ? 
                (patient.gender.toLowerCase() === 'male' || patient.gender.toLowerCase() === 'homme' ? 'M.' : 'Mme') : 
                'M.';
            
            // Calculate rest period in days
            const restDays = cert.restPeriod || (cert.startDate && cert.endDate ? 
                Math.ceil((new Date(cert.endDate) - new Date(cert.startDate)) / (1000 * 60 * 60 * 24)) : 0);
            
            // Get cabinet location
            const cabinetLocation = cabinetSettings.address ? 
                (cabinetSettings.address.split(',')[0] || cabinetSettings.address) : 'Tunis';
            
            // Create printable certificate
            const printWindow = window.open('', '_blank');
            
            let certificateHTML = '<!DOCTYPE html><html><head>';
            certificateHTML += '<title>Certificat Médical - ' + cert.patientName + '</title>';
            certificateHTML += '<meta charset="UTF-8">';
            certificateHTML += '<style>';
            certificateHTML += 'body { font-family: "Times New Roman", serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.8; font-size: 14px; }';
            certificateHTML += '.certificate-title { font-weight: bold; font-size: 18px; margin-bottom: 30px; }';
            certificateHTML += '.cert-body { text-align: justify; margin: 20px 0; }';
            certificateHTML += '.cert-body p { margin: 15px 0; }';
            certificateHTML += '.signature-section { margin-top: 60px; }';
            certificateHTML += '.signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }';
            certificateHTML += '.signature-box { margin-top: 30px; }';
            certificateHTML += '.signature-box div { margin: 5px 0; }';
            certificateHTML += '@media print { body { padding: 20px; } }';
            certificateHTML += '</style></head><body>';
            
            // Title
            certificateHTML += '<div class="certificate-title">CERTIFICAT MÉDICAL</div>';
            
            // Certificate body
            certificateHTML += '<div class="cert-body">';
            
            // Doctor declaration
            certificateHTML += '<p>Je soussigné(e), Dr ' + cert.doctorName + ', Médecin généraliste, certifie que :</p>';
            
            // Patient and consultation info
            certificateHTML += '<p>' + patientTitle + ' ' + cert.patientName;
            if (patientBirthDateFR) {
                certificateHTML += ', né(e) le ' + patientBirthDateFR;
            }
            certificateHTML += ', a consulté mon cabinet en date du ' + consultationDateFR + '.</p>';
            
            // Medical finding and rest period
            if (restDays > 0) {
                const restDaysText = restDays === 1 ? 'un (1) jour' : restDays + ' (' + restDays + ') jours';
                certificateHTML += '<p>Après examen médical, il/elle présente un état de santé nécessitant un repos complet de ' + restDaysText + ' à compter de la date de la consultation.</p>';
            }
            
            // Recommendation
            if (cert.startDate && cert.endDate) {
                certificateHTML += '<p>Je recommande donc à mon patient de prendre un repos total du ' + startDateFR + ' au ' + endDateFR + '.</p>';
            } else if (cert.startDate) {
                certificateHTML += '<p>Je recommande donc à mon patient de prendre un repos total à compter du ' + startDateFR + '.</p>';
            }
            
            // Closing statement
            certificateHTML += '<p>Je reste à votre disposition pour toute information complémentaire.</p>';
            
            // Location and date
            certificateHTML += '<p>Fait à ' + cabinetLocation + ', le ' + certificateDateFR + '.</p>';
            
            certificateHTML += '</div>';
            
            // Signature section
            certificateHTML += '<div class="signature-section">';
            certificateHTML += '<div class="signature-line"></div>';
            certificateHTML += '<div class="signature-box">';
            certificateHTML += '<div><strong>Signature :</strong></div>';
            certificateHTML += '<div>' + cert.doctorName + '</div>';
            certificateHTML += '<div>[Numéro d\'inscription à l\'Ordre des Médecins]</div>';
            if (cabinetSettings.address) {
                certificateHTML += '<div>' + cabinetSettings.address + '</div>';
            }
            if (cabinetSettings.phone) {
                certificateHTML += '<div>Tél: ' + cabinetSettings.phone + '</div>';
            }
            certificateHTML += '</div>';
            certificateHTML += '</div>';
            
            certificateHTML += '<scr' + 'ipt>window.onload = function() { window.print(); };</scr' + 'ipt>';
            certificateHTML += '</body></html>';
            
            printWindow.document.write(certificateHTML);
            printWindow.document.close();
        };

        // Print Prescription for a consultation
        window.printPrescription = function(consultationId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const c = consultations.find(x => x.id === consultationId);
            if (!c || !c.prescription) {
                alert('Prescription not found.');
                return;
            }
            
            // Patient info
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const patient = patients.find(p => p.id === c.patientId);
            
            // Cabinet settings (header/footer)
            const cabinetSettings = JSON.parse(localStorage.getItem('cabinetSettings') || '{}');
            
            const t = (k, d) => (window.t ? window.t(k, d) : d);
            const title = t('medical_prescription', 'Medical Prescription');
            
            const printHTML = `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
                        .cabinet-header { display:flex; align-items:center; gap:16px; border-bottom:2px solid #2563eb; padding-bottom:16px; margin-bottom:24px; }
                        .cabinet-logo { width:64px; height:64px; object-fit:contain; flex-shrink:0; }
                        .cabinet-info { flex:1; }
                        .cabinet-name { font-size:24px; font-weight:700; color:#1e40af; margin-bottom:4px; }
                        .cabinet-details { font-size:13px; color:#4b5563; line-height:1.6; }
                        .cabinet-details div { margin-bottom:2px; }
                        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
                        .clinic { font-size:18px; font-weight:700; color:#111827; }
                        .address { font-size:12px; color:#6b7280; }
                        .section { margin-top:12px; }
                        .section h3 { margin:0 0 6px 0; font-size:16px; }
                        .box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px; white-space:pre-wrap; }
                        .meta { font-size:12px; color:#374151; }
                        .footer { margin-top:24px; display:flex; justify-content:space-between; font-size:12px; color:#374151; }
                        .sign { margin-top:32px; text-align:right; }
                    </style>
                </head>
                <body>
                    <div class="cabinet-header">
                        ${cabinetSettings.logo && /^data:image\//.test(cabinetSettings.logo) ? `
                            <img src="${cabinetSettings.logo}" alt="Logo" class="cabinet-logo" />
                        ` : ''}
                        <div class="cabinet-info">
                            <div class="cabinet-name">${cabinetSettings.name || 'Medical Center'}</div>
                            <div class="cabinet-details">
                                ${cabinetSettings.address ? `<div>${cabinetSettings.address}</div>` : ''}
                                ${cabinetSettings.phone ? `<div>${t('phone','Phone')}: ${cabinetSettings.phone}</div>` : ''}
                                ${cabinetSettings.email ? `<div>${t('email','Email')}: ${cabinetSettings.email}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="header">
                        <div>
                            <div class="clinic">${title}</div>
                        </div>
                        <div class="meta">
                            <div><strong>${t('date','Date')}:</strong> ${new Date(c.createdAt).toLocaleDateString()}</div>
                            ${patient ? `<div><strong>${t('patient','Patient')}:</strong> ${patient.fullName}</div>` : ''}
                        </div>
                    </div>
                    ${c.notes ? `
                    <div class="section">
                        <h3>${t('clinical_notes','Clinical Notes')}</h3>
                        <div class="box">${c.notes}</div>
                    </div>
                    ` : ''}
                    <div class="section">
                        <h3>${t('prescription','Prescription')}</h3>
                        <div class="box">${c.prescription}</div>
                    </div>
                    <div class="sign">
                        <div>${t('doctor','Doctor')}: ${c.doctor || ''}</div>
                    </div>
                    <div class="footer">
                        <div>${t('generated_on','Generated on')} ${new Date().toLocaleString()}</div>
                    </div>
                    <script>window.onload = function(){ window.print(); }<\/script>
                </body>
                </html>`;
            
            const w = window.open('', '_blank');
            if (!w) { alert('Popup blocked. Please allow popups to print.'); return; }
            w.document.open();
            w.document.write(printHTML);
            w.document.close();
        };

        // Logout function
        window.logout = function () {
            try {
                const ok = (typeof showTranslatedConfirm === 'function')
                    ? showTranslatedConfirm('logout_confirm')
                    : confirm('Are you sure you want to logout?');
                if (!ok) return;

                // Clear session data
                localStorage.removeItem('medconnect_session');

                // Optional data clears can be added here if desired

                // Redirect to login page (use replace to avoid back navigation into app)
                window.location.replace('loginForm.html');
            } catch (e) {
                console.error('Logout error:', e);
                // Fallback redirect
                window.location.href = 'loginForm.html';
            }
        };

        // ========================================
        // Expenses Management Functions
        // ========================================

        // Initialize expenses array
        var storedExpenses = [];
        var editingExpenseId = null;

        // Load expenses from localStorage
        function loadExpenses() {
            try {
                storedExpenses = JSON.parse(localStorage.getItem('healthcareExpenses') || '[]');
            } catch (error) {
                console.error('Error loading expenses:', error);
                storedExpenses = [];
            }
        }

        // Save expenses to localStorage
        function saveExpenses() {
            localStorage.setItem('healthcareExpenses', JSON.stringify(storedExpenses));
        }

        // Calculate total expenses for today
        function calculateTodayExpenses() {
            loadExpenses();
            const today = new Date();
            // Use local date string format (YYYY-MM-DD) instead of UTC
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const todayExpenses = storedExpenses.filter(expense => {
                // Handle both ISO string and date string formats
                const expenseDate = expense.date ? expense.date.split('T')[0] : null;
                return expenseDate === todayStr;
            });
            
            return todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        }

        // Update expenses display in cabinet cash card
        function updateExpensesDisplay() {
            const totalExpenses = calculateTodayExpenses();
            const expensesDisplay = document.querySelector('#cabinetCashDisplay .font-semibold.text-gray-800');
            const allExpenseDisplays = document.querySelectorAll('#cabinetCashDisplay .font-semibold.text-gray-800');
            
            if (allExpenseDisplays.length >= 2) {
                allExpenseDisplays[1].textContent = totalExpenses.toFixed(2) + ' TND';
            }
        }

        // Show expenses modal
        window.showExpensesModal = function() {
            const modal = document.getElementById('expensesModal');
            if (modal) {
                loadExpenses();
                switchExpenseTab('add');
                modal.classList.add('active');
                updateModalTranslations();
            }
        };

        // Close expenses modal
        window.closeExpensesModal = function() {
            const modal = document.getElementById('expensesModal');
            if (modal) {
                modal.classList.remove('active');
                // Reset form
                const form = document.getElementById('expenseForm');
                if (form) form.reset();
                editingExpenseId = null;
                // Update button text
                const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
                if (submitBtn) submitBtn.textContent = window.t ? window.t('add_expense', 'Add Expense') : 'Add Expense';
            }
        };

        // Switch between add and view tabs
        window.switchExpenseTab = function(tab) {
            const addContent = document.getElementById('addExpenseContent');
            const viewContent = document.getElementById('viewExpensesContent');
            const addTab = document.getElementById('addExpenseTab');
            const viewTab = document.getElementById('viewExpensesTab');

            if (tab === 'add') {
                addContent.style.display = 'block';
                viewContent.style.display = 'none';
                addTab.className = 'btn btn-primary';
                viewTab.className = 'btn btn-secondary';
            } else {
                addContent.style.display = 'none';
                viewContent.style.display = 'block';
                addTab.className = 'btn btn-secondary';
                viewTab.className = 'btn btn-primary';
                loadExpensesList();
            }
        };

        // Load expenses list
        function loadExpensesList() {
            loadExpenses();
            const expenseList = document.getElementById('expenseList');
            
            if (!expenseList) return;
            
            if (storedExpenses.length === 0) {
                expenseList.innerHTML = '<p class="text-gray-500 text-center py-8" data-translate="no_expenses_found">No expenses found.</p>';
                return;
            }
            
            // Sort by date (newest first)
            const sortedExpenses = [...storedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            expenseList.innerHTML = sortedExpenses.map(expense => `
                <div class="card p-4 mb-3 expense-item" data-expense-id="${expense.id}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="font-semibold text-gray-900 mb-1">${expense.description}</div>
                            <div class="text-sm text-gray-600">${new Date(expense.date).toLocaleDateString()}</div>
                        </div>
                        <div class="text-right ml-4">
                            <div class="text-lg font-bold text-gray-900">${expense.amount.toFixed(2)} TND</div>
                        </div>
                    </div>
                    <div class="flex gap-2 mt-3">
                        <button class="btn btn-sm btn-outline" onclick="editExpense('${expense.id}')" data-translate="edit">${window.t ? window.t('edit', 'Edit') : 'Edit'}</button>
                        <button class="btn btn-sm btn-outline text-red-600" onclick="deleteExpense('${expense.id}')" data-translate="delete">${window.t ? window.t('delete', 'Delete') : 'Delete'}</button>
                    </div>
                </div>
            `).join('');
        }

        // Edit expense
        window.editExpense = function(expenseId) {
            const expense = storedExpenses.find(e => e.id === expenseId);
            if (!expense) return;
            
            editingExpenseId = expenseId;
            
            // Fill form
            document.getElementById('expenseDescription').value = expense.description;
            document.getElementById('expenseAmount').value = expense.amount;
            
            // Switch to add tab and update button
            switchExpenseTab('add');
            const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
            if (submitBtn) submitBtn.textContent = window.t ? window.t('save_changes', 'Save Changes') : 'Save Changes';
        };

        // Delete expense
        window.deleteExpense = function(expenseId) {
            if (!showTranslatedConfirm('confirm_delete_expense')) return;
            
            storedExpenses = storedExpenses.filter(e => e.id !== expenseId);
            saveExpenses();
            loadExpensesList();
            updateExpensesDisplay();
            updateCabinetCashDisplay();
            
            // Update daily agenda to refresh expenses badge
            if (typeof renderDailyAgenda === 'function') {
                renderDailyAgenda();
            }
            
            showTranslatedAlert('expense_deleted');
        };

        // Filter expenses
        window.filterExpenses = function() {
            const searchTerm = document.getElementById('expenseSearch').value.toLowerCase();
            const expenseItems = document.querySelectorAll('.expense-item');
            
            expenseItems.forEach(item => {
                const description = item.querySelector('.font-semibold').textContent.toLowerCase();
                const matches = description.includes(searchTerm);
                item.style.display = matches ? 'block' : 'none';
            });
        };

        // Handle expense form submission
        document.addEventListener('DOMContentLoaded', function() {
            const expenseForm = document.getElementById('expenseForm');
            if (expenseForm) {
                expenseForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const description = document.getElementById('expenseDescription').value.trim();
                    const amount = parseFloat(document.getElementById('expenseAmount').value);
                    
                    if (!description || !amount || amount <= 0) {
                        alert('Please fill in all fields with valid values.');
                        return;
                    }
                    
                    loadExpenses();
                    
                    if (editingExpenseId) {
                        // Update existing expense
                        const index = storedExpenses.findIndex(e => e.id === editingExpenseId);
                        if (index !== -1) {
                            storedExpenses[index].description = description;
                            storedExpenses[index].amount = amount;
                            storedExpenses[index].updatedAt = new Date().toISOString();
                            saveExpenses();
                            showTranslatedAlert('expense_updated');
                        }
                        editingExpenseId = null;
                    } else {
                        // Add new expense
                        const newExpense = {
                            id: 'EXP-' + Date.now(),
                            description: description,
                            amount: amount,
                            date: new Date().toISOString(),
                            createdAt: new Date().toISOString()
                        };
                        storedExpenses.push(newExpense);
                        saveExpenses();
                        showTranslatedAlert('expense_added');
                    }
                    
                    // Reset form
                    expenseForm.reset();
                    const submitBtn = expenseForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.textContent = window.t ? window.t('add_expense', 'Add Expense') : 'Add Expense';
                    
                    // Reload expenses list
                    loadExpensesList();
                    
                    // Update displays
                    updateExpensesDisplay();
                    updateCabinetCashDisplay();
                    
                    // Update daily agenda to refresh expenses badge
                    if (typeof renderDailyAgenda === 'function') {
                        renderDailyAgenda();
                    }
                    
                    // Switch back to view tab
                    switchExpenseTab('view');
                });
            }
            
            // Initialize expenses on page load
            loadExpenses();
        });