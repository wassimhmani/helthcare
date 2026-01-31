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

// Load patients (no longer from localStorage; rely on API via fetchPatientsFromAPI)
const loadStoredPatients = () => {
    // Keep storedPatients as-is; patients will be populated by fetchPatientsFromAPI.
    console.log('Patients are now loaded from API, not localStorage');
    if (!Array.isArray(storedPatients)) {
        storedPatients = [];
    }
};

// Get patients function (alias for loadStoredPatients result)
const getPatients = () => {
    return storedPatients;
};

// Alias for backward compatibility in case somewhere getPatient() is called instead of getPatients()
const getPatient = () => {
    return getPatients();
};

// Make these functions globally available
window.getPatients = getPatients;
window.getPatient = getPatient;

// Load appointments from API (no longer using localStorage)
const loadStoredAppointments = () => {
    // Appointments are now loaded from API when needed
    // This function is kept for compatibility but does nothing
    storedAppointments = [];
    console.log('Appointments are now loaded from API, not localStorage');
};

// Save appointments to API (no longer using localStorage)
const saveStoredAppointments = () => {
    // Appointments are now saved directly to API via syncAppointmentToDatabase
    // This function is kept for compatibility but does nothing
    console.log('Appointments are now saved to API, not localStorage');
};

// Save patients (no longer persisted to localStorage; database is source of truth)
const saveStoredPatients = () => {
    console.log('Patients are now stored only in the database, not localStorage');
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

    // Get patient ID from selection
    const patientSelect = document.getElementById('patientSelection');
    const patientId = patientSelect ? patientSelect.value : (appointmentData.patientId || '');

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
        patientId: patientId,
        date: formattedDate
    };

    console.log('New appointment object:', newAppointment);
    // Add to in-memory cache for immediate UI updates
    storedAppointments.push(newAppointment);
    console.log('Total appointments after adding:', storedAppointments.length);
    console.log('All stored appointments:', storedAppointments);
    console.log('=== APPOINTMENT ADDED ===');

    // Sync to backend database (primary storage)
    if (typeof syncAppointmentToDatabase === 'function') {
        syncAppointmentToDatabase(newAppointment);
    }

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

// getConsultationsForDate now provided by consultation.js

// Function to get cash entry (total payments) for a specific date, based on consultations
const getCashEntryForDate = (date) => {
    const dateStr = formatDateForStorage(date);

    try {
        // Load consultations snapshot from localStorage
        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');

        // Load bill descriptions so we can compute consultation tariffs when needed
        let billDescriptions = [];
        try {
            if (typeof window.getBillDescriptions === 'function') {
                const desc = window.getBillDescriptions();
                if (Array.isArray(desc)) {
                    billDescriptions = desc;
                }
            }
        } catch (e) {
            console.error('Error loading bill descriptions for cash entry:', e);
        }

        const computePaidForConsultationOnDate = (consultation, targetDateStr) => {
            if (!consultation) return 0;

            // Only consider consultations created on the target date
            const created = new Date(consultation.createdAt || consultation.date || 0);
            if (isNaN(created)) return 0;
            const consultDateStr = created.toISOString().split('T')[0];
            if (consultDateStr !== targetDateStr) return 0;

            // Compute consultation total amount with tax (8%)
            let amount = null;
            try {
                const rawActs = consultation.consultationAct || '';
                const actNames = rawActs
                    ? rawActs.split('|').map(s => s.trim()).filter(Boolean)
                    : [];
                const hasActs = actNames.length > 0;

                if (hasActs && Array.isArray(billDescriptions) && billDescriptions.length > 0) {
                    actNames.forEach((actName) => {
                        const match = billDescriptions.find((d) => d && d.name === actName);
                        if (match) {
                            const price = typeof match.price === 'number'
                                ? match.price
                                : Number(match.price || 0);
                            if (!isNaN(price)) {
                                if (amount === null) amount = 0;
                                amount += price;
                            }
                        }
                    });
                }

                if (amount === null && typeof consultation.consultationAmount === 'number' && !isNaN(consultation.consultationAmount)) {
                    amount = consultation.consultationAmount;
                }

                // If no act and no explicit amount, treat consultation as free (0 TND)
                if (!hasActs && amount === null) {
                    amount = 0;
                }
            } catch (e) {
                console.error('Error computing consultation amount for cash entry:', e);
            }

            let totalWithTax = 0;
            if (amount !== null) {
                const taxRate = 0.08;
                totalWithTax = amount + (amount * taxRate);
            }

            // Normalize payment status into paid / partial / unpaid
            let normalizedStatus = 'unpaid';
            try {
                if (typeof normalizeConsultationPaymentStatusForReports === 'function') {
                    normalizedStatus = normalizeConsultationPaymentStatusForReports(consultation);
                } else {
                    const rawStatus = (consultation.paymentStatus || '').toLowerCase();
                    const hasAct = !!(consultation.consultationAct && String(consultation.consultationAct).trim());
                    if (!hasAct) {
                        normalizedStatus = 'paid';
                    } else if (rawStatus === 'paid') {
                        normalizedStatus = 'paid';
                    } else if (rawStatus === 'partial' || rawStatus === 'partially_paid') {
                        normalizedStatus = 'partial';
                    }
                }
            } catch (e) {
                console.error('Error normalizing payment status for cash entry:', e);
            }

            let paidAmount = 0;

            if (normalizedStatus === 'paid') {
                // Fully paid consultation contributes its full amount (with tax)
                paidAmount = totalWithTax;
            } else if (normalizedStatus === 'partial') {
                // Partially paid: use partialPaymentAmount, clamped to full amount
                let partialAmount = null;
                if (typeof consultation.partialPaymentAmount === 'number' && !isNaN(consultation.partialPaymentAmount)) {
                    partialAmount = consultation.partialPaymentAmount;
                } else if (consultation.partialPaymentAmount !== undefined && consultation.partialPaymentAmount !== null && consultation.partialPaymentAmount !== '') {
                    const parsedPartial = Number(consultation.partialPaymentAmount);
                    if (!isNaN(parsedPartial)) {
                        partialAmount = parsedPartial;
                    }
                }

                if (partialAmount !== null && partialAmount > 0) {
                    if (totalWithTax > 0) {
                        paidAmount = Math.min(partialAmount, totalWithTax);
                    } else {
                        paidAmount = partialAmount;
                    }
                }
            }

            return paidAmount > 0 ? paidAmount : 0;
        };

        let totalPaidForDate = 0;
        consultations.forEach((c) => {
            const paid = computePaidForConsultationOnDate(c, dateStr);
            if (paid > 0) {
                totalPaidForDate += paid;
            }
        });

        return totalPaidForDate;
    } catch (error) {
        console.error('Error calculating cash entry from consultations for date:', error);
        return 0;
    }
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

// Generate time slots (08:00 → 22:00, matching API HH:MM format)
const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8;   // 08:00
    const endHour = 17;    // 17:00 
    for (let hour = startHour; hour <= endHour; hour++) {
        const h = String(hour).padStart(2, '0'); // Ensure HH format (e.g., 08, 09)
        slots.push(`${h}:00`);
        // Add :30 slots for all hours except the final closing hour
        if (hour < endHour) {
            slots.push(`${h}:30`);
        }
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
// Uses in-memory appointments immediately, then refines with API data
const populateAvailableTimes = () => {
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    if (!dateInput || !timeSelect) return;

    // Compute selected date string (YYYY-MM-DD)
    const selectedDateStr = dateInput.value || (selectedDate ? formatDateForStorage(selectedDate) : '');

    const allSlots = generateTimeSlots();

    const rebuildOptions = (unavailableSet) => {
        timeSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = window.t ? window.t('select_time', 'Select time') : 'Select time';
        timeSelect.appendChild(placeholder);

        allSlots
            .filter(slot => !unavailableSet.has(slot))
            .forEach(slot => {
                const opt = document.createElement('option');
                opt.value = slot;
                opt.textContent = slot; // 24h HH:MM
                timeSelect.appendChild(opt);
            });
    };

    // 1) Start with local in-memory appointments (newly added in this session)
    const localUnavailable = getUnavailableTimesForDate(selectedDateStr);
    rebuildOptions(localUnavailable);

    // 2) If we have a valid date, refine with backend appointments so DB is source of truth
    if (!selectedDateStr) return;

    fetch(`api/get_today_appointments.php?date=${selectedDateStr}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch appointments for available time slots');
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.status !== 'ok' || !Array.isArray(data.appointments)) {
                console.warn('populateAvailableTimes: unexpected API response', data);
                return;
            }

            const apiUnavailable = new Set(
                data.appointments
                    .filter(apt => (apt.status || '').toString().trim().toLowerCase() !== 'cancelled')
                    .map(apt => apt.time)
            );

            const mergedUnavailable = new Set([...localUnavailable, ...apiUnavailable]);
            rebuildOptions(mergedUnavailable);
        })
        .catch(err => {
            console.error('populateAvailableTimes: error fetching appointments from API:', err);
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
    const dateStr = formatDateForStorage(selectedDate);
    console.log('Selected date formatted for storage:', dateStr);

    // Fetch appointments from API for the selected date
    fetch(`api/get_today_appointments.php?date=${dateStr}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok' && Array.isArray(data.appointments)) {
                // Use appointments from API
                const apiAppointments = data.appointments;
                console.log('Appointments from API:', apiAppointments);
                console.log('Total appointments from API:', apiAppointments.length);

                const localForDate = (Array.isArray(storedAppointments) ? storedAppointments : [])
                    .filter(apt => apt.date === dateStr);
                const existingIds = new Set(apiAppointments.map(a => a.id));
                const mergedAppointments = apiAppointments.concat(
                    localForDate.filter(apt => !existingIds.has(apt.id))
                );

                // Render agenda with API appointments
                renderAgendaWithAppointments(mergedAppointments, dateStr);
            } else {
                console.error('Invalid API response:', data);
                // Fallback to localStorage
                const appointments = getAppointmentsForDate(selectedDate);
                renderAgendaWithAppointments(appointments, dateStr);
            }
        })
        .catch(error => {
            console.error('Error fetching appointments from API:', error);
            // Fallback to localStorage on error
            const appointments = getAppointmentsForDate(selectedDate);
            renderAgendaWithAppointments(appointments, dateStr);
        });
};

// Helper function to render agenda with appointments
const renderAgendaWithAppointments = (appointments, dateStr) => {
    console.log('Rendering agenda with appointments:', appointments.length);
    const timeSlots = generateTimeSlots();

    const appointmentCount = appointments.length;
    const preValidationCount = appointments.filter(apt => (apt.status || '').toLowerCase() === 'pre-validation').length;
    const confirmedCount = appointments.filter(apt => (apt.status || '').toLowerCase() === 'validated').length;
    const cancelledCount = appointments.filter(apt => (apt.status || '').toLowerCase() === 'cancelled').length;

    // Get consultations count for the selected date
    let consultationsCount = 0;
    if (typeof window.getConsultationsForDate === 'function') {
        consultationsCount = window.getConsultationsForDate(selectedDate);
    } else {
        // Fallback: calculate directly if function not available
        try {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            consultationsCount = consultations.filter(consultation => {
                const d = new Date(consultation.createdAt);
                return d.toISOString().split('T')[0] === dateStr;
            }).length;
        } catch (e) {
            console.error('Error getting consultations count:', e);
        }
    }
    const cashEntryAmount = getCashEntryForDate(selectedDate);
    const expensesAmount = getExpensesForDate(selectedDate);
    const cabinetCashAmount = getCabinetCashForDate(selectedDate);

    const badgeConfigs = [
        {
            key: 'total_appointments',
            label: window.t ? window.t('total', 'Total') : 'Total',
            value: appointmentCount,
            classes: 'bg-slate-900 text-white',
            iconBg: 'bg-slate-800 bg-opacity-60 text-white',
            icon: '<svg viewBox="0 0 24 24" class="w-4 h-4"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a1 1 0 0 1-1.447.894L12 16.618l-7.553 3.276A1 1 0 0 1 3 19V5a2 2 0 0 1 2-2Z"/></svg>'
        },
        {
            key: 'pre_validation',
            label: window.t ? window.t('pre_validation', 'Pre-validation') : 'Pre-validation',
            value: preValidationCount,
            classes: 'bg-orange-100 text-orange-800'
        },
        {
            key: 'validated',
            label: window.t ? window.t('validated', 'Validated') : 'Validated',
            value: confirmedCount,
            classes: 'bg-green-100 text-green-800'
        },
        {
            key: 'cancelled',
            label: window.t ? window.t('cancelled', 'Cancelled') : 'Cancelled',
            value: cancelledCount,
            classes: 'bg-red-100 text-red-800'
        },
        {
            key: 'consultations_done',
            label: window.t ? window.t('consultations_done', 'Consultations Done') : 'Consultations Done',
            value: consultationsCount,
            classes: 'bg-purple-100 text-purple-800'
        },
        {
            key: 'cash_entry',
            label: window.t ? window.t('cash_entry', 'Cash Entry') : 'Cash Entry',
            value: `${cashEntryAmount.toFixed(2)} TND`,
            classes: 'bg-blue-100 text-blue-800'
        },
        {
            key: 'expenses',
            label: window.t ? window.t('expenses', 'Expenses') : 'Expenses',
            value: `${expensesAmount.toFixed(2)} TND`,
            classes: 'bg-gray-100 text-gray-800'
        },
        {
            key: 'cabinet_cash',
            label: window.t ? window.t('cabinet_cash', 'Cabinet Cash') : 'Cabinet Cash',
            value: `${cabinetCashAmount.toFixed(2)} TND`,
            classes: 'bg-indigo-100 text-indigo-800'
        }
    ];

    const summaryBadgesHTML = `
                <div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
                    ${badgeConfigs.map(cfg => `
                        <div class="rounded-lg px-2 py-2 shadow-sm border border-gray-200 ${cfg.classes}" data-summary-key="${cfg.key || ''}">
                            <div class="text-[0.6rem] uppercase tracking-wide font-semibold opacity-75 mb-1">${cfg.label}</div>
                            <div class="text-sm font-semibold" data-summary-value-for="${cfg.key || ''}">${cfg.value}</div>
                        </div>
                    `).join('')}
                </div>
            `;

    let summaryHTMLForAgenda = summaryBadgesHTML;
    const summaryContainer = document.getElementById('dailySummaryContainer');
    const fallbackContainer = document.getElementById('dailySummaryFallback');
    if (summaryContainer) {
        summaryContainer.innerHTML = summaryBadgesHTML;
        summaryHTMLForAgenda = '';
        if (fallbackContainer) {
            fallbackContainer.classList.add('hidden');
        }
    } else if (fallbackContainer) {
        fallbackContainer.classList.remove('hidden');
        fallbackContainer.innerHTML = summaryBadgesHTML;
        summaryHTMLForAgenda = '';
    }

    // After rendering the summary, refine the consultations_done value using the
    // consultations API (database is the source of truth) and fall back to
    // localStorage helper if the API is not available.
    if (dateStr) {
        try {
            fetch(`api/get_consultations.php?date=${encodeURIComponent(dateStr)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch consultations for summary');
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data || data.status !== 'ok' || !Array.isArray(data.consultations)) {
                        return;
                    }
                    const apiConsultationsCount = data.consultations.length;

                    const updateContainer = (container) => {
                        if (!container) return;
                        const valueNode = container.querySelector('[data-summary-value-for="consultations_done"]');
                        if (valueNode) {
                            valueNode.textContent = apiConsultationsCount;
                        }
                    };

                    updateContainer(summaryContainer);
                    if (!summaryContainer) {
                        updateContainer(fallbackContainer);
                    }
                })
                .catch(err => {
                    console.error('Error fetching consultations count for summary:', err);

                    // Fallback: use local consultations helper if available
                    if (typeof window.getConsultationsForDate === 'function') {
                        try {
                            const localCount = window.getConsultationsForDate(dateStr);
                            const updateContainer = (container) => {
                                if (!container) return;
                                const valueNode = container.querySelector('[data-summary-value-for="consultations_done"]');
                                if (valueNode) {
                                    valueNode.textContent = localCount;
                                }
                            };

                            updateContainer(summaryContainer);
                            if (!summaryContainer) {
                                updateContainer(fallbackContainer);
                            }
                        } catch (e) {
                            console.error('Error using local consultations count for summary:', e);
                        }
                    }
                });
        } catch (err) {
            console.error('Exception while updating consultations_done summary from API:', err);
        }
    }

    window.openClinicalExaminationModal = function () {
        const modal = document.getElementById('clinicalExamModal');
        if (modal) modal.classList.add('active');
    };

    window.openMedicalDiagnosisModal = function () {
        const modal = document.getElementById('diagnosisModal');
        if (modal) modal.classList.add('active');
    };

    window.openNotesObservationsModal = function () {
        const modal = document.getElementById('notesObservationsModal');
        if (modal) modal.classList.add('active');
    };

    window.closeNotesObservationsModal = function () {
        const modal = document.getElementById('notesObservationsModal');
        if (modal) modal.classList.remove('active');
    };

    let agendaHTML = `
                <div class="space-y-4">
                    ${summaryHTMLForAgenda}
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
    } catch { }
};
// Function to update today's summary with today's data only
const updateTodaySummary = () => {
    const todayDate = new Date();
    const todayDateStr = formatDateForStorage(todayDate);

    // Fetch total appointments from API (all statuses)
    fetch(`api/get_today_appointments.php?date=${todayDateStr}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }
            return response.json();
        })
        .then(data => {
            console.log('API response for total appointments:', data);
            console.log('API total field:', data.total);
            console.log('API count field:', data.count);
            console.log('API appointments array length:', data.appointments ? data.appointments.length : 'N/A');

            if (data.status === 'ok' && Array.isArray(data.appointments)) {
                // Use total from API response (preferred), then count, then appointments.length
                let totalAppointments = (data.total !== undefined && data.total !== null)
                    ? data.total
                    : ((data.count !== undefined && data.count !== null) ? data.count : data.appointments.length);

                console.log('Calculated total appointments:', totalAppointments);

                let sourceAppointments = data.appointments;

                // If API reports 0 but we have local in-memory appointments for today, use them instead
                const localToday = (Array.isArray(storedAppointments) ? storedAppointments : []).filter(apt => apt.date === todayDateStr);
                if (totalAppointments === 0 && localToday.length > 0) {
                    console.log('API returned 0 appointments but local cache has', localToday.length, 'for today; using local data for summary.');
                    sourceAppointments = localToday;
                    totalAppointments = localToday.length;
                }

                const preValidationCount = sourceAppointments.filter(apt => (apt.status || '').toLowerCase() === 'pre-validation').length;
                const confirmedCount = sourceAppointments.filter(apt => (apt.status || '').toLowerCase() === 'validated').length;
                const cancelledCount = sourceAppointments.filter(apt => (apt.status || '').toLowerCase() === 'cancelled').length;

                // Update stats with chosen data source
                const totalAppointmentsEl = document.getElementById('totalAppointments');
                if (totalAppointmentsEl) {
                    totalAppointmentsEl.textContent = totalAppointments;
                    console.log('Successfully updated totalAppointments badge to:', totalAppointments);
                } else {
                    console.warn('totalAppointments element not found in DOM');
                }

                const preValidationEl = document.getElementById('preValidationAppointments');
                if (preValidationEl) preValidationEl.textContent = preValidationCount;

                const confirmedEl = document.getElementById('confirmedAppointments');
                if (confirmedEl) confirmedEl.textContent = confirmedCount;

                const cancelledEl = document.getElementById('cancelledAppointments');
                if (cancelledEl) cancelledEl.textContent = cancelledCount;
            } else {
                // Fallback to localStorage if API fails or returns unexpected format
                const todayAppointments = storedAppointments.filter(apt => apt.date === todayDateStr);
                const appointmentCount = todayAppointments.length;
                const preValidationCount = todayAppointments.filter(apt => apt.status === 'pre-validation').length;
                const confirmedCount = todayAppointments.filter(apt => apt.status === 'validated').length;
                const cancelledCount = todayAppointments.filter(apt => apt.status === 'cancelled').length;

                const totalAppointmentsEl = document.getElementById('totalAppointments');
                if (totalAppointmentsEl) totalAppointmentsEl.textContent = appointmentCount;

                const preValidationEl = document.getElementById('preValidationAppointments');
                if (preValidationEl) preValidationEl.textContent = preValidationCount;

                const confirmedEl = document.getElementById('confirmedAppointments');
                if (confirmedEl) confirmedEl.textContent = confirmedCount;

                const cancelledEl = document.getElementById('cancelledAppointments');
                if (cancelledEl) cancelledEl.textContent = cancelledCount;
            }
        })
        .catch(error => {
            console.error('Error fetching total appointments from API:', error);
            console.error('Error details:', error.message, error.stack);
            // Fallback to localStorage on error
            const todayAppointments = storedAppointments.filter(apt => apt.date === todayDateStr);
            const appointmentCount = todayAppointments.length;
            const preValidationCount = todayAppointments.filter(apt => apt.status === 'pre-validation').length;
            const confirmedCount = todayAppointments.filter(apt => apt.status === 'validated').length;
            const cancelledCount = todayAppointments.filter(apt => apt.status === 'cancelled').length;

            const totalAppointmentsEl = document.getElementById('totalAppointments');
            if (totalAppointmentsEl) {
                totalAppointmentsEl.textContent = appointmentCount;
                console.log('Updated totalAppointments badge (fallback) to:', appointmentCount);
            } else {
                console.warn('totalAppointments element not found (fallback)');
            }

            const preValidationEl = document.getElementById('preValidationAppointments');
            if (preValidationEl) preValidationEl.textContent = preValidationCount;

            const confirmedEl = document.getElementById('confirmedAppointments');
            if (confirmedEl) confirmedEl.textContent = confirmedCount;

            const cancelledEl = document.getElementById('cancelledAppointments');
            if (cancelledEl) cancelledEl.textContent = cancelledCount;
        });

    // Don't update immediately - wait for API response to ensure accurate data
    // The API call above will update all badges when it completes
};
// Expose updateTodaySummary to global scope
window.updateTodaySummary = updateTodaySummary;
// Function to update waiting room with today's validated appointments
const updateWaitingRoom = () => {
    const today = new Date();
    const todayStr = formatDateForStorage(today);
    const waitingRoomCountEl = document.getElementById('waitingRoomCount');
    const waitingRoomListEl = document.getElementById('waitingRoomList');

    // Show a lightweight loading state
    if (waitingRoomListEl) {
        waitingRoomListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="loading">${window.t ? window.t('loading', 'Loading...') : 'Loading...'}</p>`;
    }

    // Prefer API as the primary source
    fetch(`api/get_today_appointments.php?date=${todayStr}&status=validated`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch waiting room appointments');
            return res.json();
        })
        .then(data => {
            let appts = [];
            if (data && data.status === 'ok' && Array.isArray(data.appointments)) {
                // API already filtered by validated; trust but normalize just in case
                appts = data.appointments.filter(a => (a.status || '').toString().trim().toLowerCase() === 'validated');
            }

            // Update count
            if (waitingRoomCountEl) waitingRoomCountEl.textContent = appts.length;

            // Render list
            if (!waitingRoomListEl) return;
            if (appts.length === 0) {
                waitingRoomListEl.innerHTML = `
                            <p class="text-gray-500 text-center py-4" data-translate="no_patients_waiting">
                                ${window.t ? window.t('no_patients_waiting', 'No patients waiting') : 'No patients waiting'}
                            </p>
                        `;
                if (window.I18n && window.I18n.walkAndTranslate) window.I18n.walkAndTranslate();
                return;
            }

            waitingRoomListEl.innerHTML = appts.map(appointment => `
                        <div class="flex items-center justify-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">${appointment.clientName || ''}</div>
                                    <div class="text-sm text-gray-600">${appointment.time} (${appointment.duration} min)</div>
                                </div>
                            </div>
                        </div>
                    `).join('');

            if (window.I18n && window.I18n.walkAndTranslate) window.I18n.walkAndTranslate();
        })
        .catch(err => {
            console.error('Waiting room API error:', err);
            // Robust fallback to in-memory/local data
            const waitingAppointments = (Array.isArray(storedAppointments) ? storedAppointments : []).filter(apt =>
                apt.date === todayStr && (apt.status || '').toString().trim().toLowerCase() === 'validated'
            );

            if (waitingRoomCountEl) waitingRoomCountEl.textContent = waitingAppointments.length;

            if (!waitingRoomListEl) return;
            if (waitingAppointments.length === 0) {
                waitingRoomListEl.innerHTML = `
                            <p class="text-gray-500 text-center py-4" data-translate="no_patients_waiting">
                                ${window.t ? window.t('no_patients_waiting', 'No patients waiting') : 'No patients waiting'}
                            </p>
                        `;
                if (window.I18n && window.I18n.walkAndTranslate) window.I18n.walkAndTranslate();
                return;
            }

            waitingRoomListEl.innerHTML = waitingAppointments.map(appointment => `
                        <div class="flex items-center justify-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">${appointment.clientName}</div>
                                    <div class="text-sm text-gray-600">${appointment.time} (${appointment.duration} min)</div>
                                </div>
                            </div>
                        </div>
                    `).join('');

            if (window.I18n && window.I18n.walkAndTranslate) window.I18n.walkAndTranslate();
        });
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

// Function to calculate today's cabinet cash based on consultation payments
const calculateTodayCabinetCash = () => {
    try {
        const today = new Date();
        const todayStr = formatDateForStorage(today);

        // Load consultations snapshot from localStorage
        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');

        // Load bill descriptions once so we can compute consultation tariffs
        let billDescriptions = [];
        try {
            if (typeof window.getBillDescriptions === 'function') {
                const desc = window.getBillDescriptions();
                if (Array.isArray(desc)) {
                    billDescriptions = desc;
                }
            }
        } catch (e) {
            console.error('Error loading bill descriptions for cabinet cash:', e);
        }

        const computePaidForConsultation = (consultation) => {
            if (!consultation) return 0;

            // Only consider consultations created today
            const created = new Date(consultation.createdAt || consultation.date || 0);
            if (isNaN(created)) return 0;
            const consultDateStr = created.toISOString().split('T')[0];
            if (consultDateStr !== todayStr) return 0;

            // Compute consultation total amount with tax (8%), mirroring payment/report logic
            let amount = null;
            try {
                const rawActs = consultation.consultationAct || '';
                const actNames = rawActs
                    ? rawActs.split('|').map(s => s.trim()).filter(Boolean)
                    : [];
                const hasActs = actNames.length > 0;

                if (hasActs && Array.isArray(billDescriptions) && billDescriptions.length > 0) {
                    actNames.forEach((actName) => {
                        const match = billDescriptions.find((d) => d && d.name === actName);
                        if (match) {
                            const price = typeof match.price === 'number'
                                ? match.price
                                : Number(match.price || 0);
                            if (!isNaN(price)) {
                                if (amount === null) amount = 0;
                                amount += price;
                            }
                        }
                    });
                }

                if (amount === null && typeof consultation.consultationAmount === 'number' && !isNaN(consultation.consultationAmount)) {
                    amount = consultation.consultationAmount;
                }

                // If no act and no explicit amount, treat consultation as free (0 TND)
                if (!hasActs && amount === null) {
                    amount = 0;
                }
            } catch (e) {
                console.error('Error computing consultation amount for cabinet cash:', e);
            }

            let totalWithTax = 0;
            if (amount !== null) {
                const taxRate = 0.08;
                totalWithTax = amount + (amount * taxRate);
            }

            // Normalize payment status into paid / partial / unpaid
            let normalizedStatus = 'unpaid';
            try {
                if (typeof normalizeConsultationPaymentStatusForReports === 'function') {
                    normalizedStatus = normalizeConsultationPaymentStatusForReports(consultation);
                } else {
                    const rawStatus = (consultation.paymentStatus || '').toLowerCase();
                    const hasAct = !!(consultation.consultationAct && String(consultation.consultationAct).trim());
                    if (!hasAct) {
                        normalizedStatus = 'paid';
                    } else if (rawStatus === 'paid') {
                        normalizedStatus = 'paid';
                    } else if (rawStatus === 'partial' || rawStatus === 'partially_paid') {
                        normalizedStatus = 'partial';
                    }
                }
            } catch (e) {
                console.error('Error normalizing payment status for cabinet cash:', e);
            }

            let paidAmount = 0;

            if (normalizedStatus === 'paid') {
                // Fully paid consultation contributes its full amount (with tax)
                paidAmount = totalWithTax;
            } else if (normalizedStatus === 'partial') {
                // Partially paid: use partialPaymentAmount, clamped to full amount
                let partialAmount = null;
                if (typeof consultation.partialPaymentAmount === 'number' && !isNaN(consultation.partialPaymentAmount)) {
                    partialAmount = consultation.partialPaymentAmount;
                } else if (consultation.partialPaymentAmount !== undefined && consultation.partialPaymentAmount !== null && consultation.partialPaymentAmount !== '') {
                    const parsedPartial = Number(consultation.partialPaymentAmount);
                    if (!isNaN(parsedPartial)) {
                        partialAmount = parsedPartial;
                    }
                }

                if (partialAmount !== null && partialAmount > 0) {
                    if (totalWithTax > 0) {
                        paidAmount = Math.min(partialAmount, totalWithTax);
                    } else {
                        paidAmount = partialAmount;
                    }
                }
            }

            return paidAmount > 0 ? paidAmount : 0;
        };

        let totalPaidToday = 0;
        let paidConsultationsCount = 0;

        consultations.forEach((c) => {
            const paid = computePaidForConsultation(c);
            if (paid > 0) {
                totalPaidToday += paid;
                paidConsultationsCount += 1;
            }
        });

        return {
            total: totalPaidToday,
            count: paidConsultationsCount,
            // Keep the property for backward compatibility, even though
            // it now conceptually represents payments from consultations.
            bills: []
        };
    } catch (error) {
        console.error("Error calculating today's cabinet cash from consultations:", error);
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
window.renderDailyAgenda = renderDailyAgenda;

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
    } catch { }

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

async function deleteUserFromDatabase(userId) {
    try {
        if (!userId) return;

        const res = await fetch('api/delete_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId })
        });

        let data;
        try { data = await res.json(); } catch (_) { data = null; }

        if (!res.ok || !data || data.status !== 'ok') {
            console.error('Delete user API failed:', res.status, data);
            return;
        }

        console.log('Delete user API success:', data);
    } catch (e) {
        console.error('Delete user API error:', e);
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

    // Clear edit patient documents
    window.editPatientDocuments = [];
    const editDocsList = document.getElementById('editPatientDocumentsList');
    if (editDocsList) editDocsList.innerHTML = '';

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

    // Force refresh the agenda display for the appointment date
    console.log('Refreshing agenda after appointment creation...');
    try {
        if (formData.appointmentDate) {
            const appointmentJsDate = new Date(formData.appointmentDate);
            if (!isNaN(appointmentJsDate.getTime())) {
                // Update selected date and calendar context to the appointment date
                selectedDate = new Date(appointmentJsDate);
                currentCalendarDate = new Date(appointmentJsDate);
            }
        }
    } catch (e) {
        console.error('Error updating selected date after appointment creation:', e);
    }
    // Re-render calendar and daily agenda using the (possibly updated) selectedDate
    renderCalendar();
    renderDailyAgenda();

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

    // Update appointment status directly in database via API
    if (typeof updateAppointmentStatusInDatabase === 'function') {
        updateAppointmentStatusInDatabase(appointmentId, newStatus)
            .then(() => {
                // Fetch the updated appointment to get full details for success message
                // First, try to get it from the current date's appointments
                const dateStr = formatDateForStorage(selectedDate);
                return fetch(`api/get_today_appointments.php?date=${dateStr}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch appointments');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.status === 'ok' && Array.isArray(data.appointments)) {
                            const appointment = data.appointments.find(apt => apt.id === appointmentId);
                            if (appointment) {
                                // Update appointment status in the found appointment object
                                appointment.status = newStatus;

                                // Show success message
                                showStatusUpdateMessage(appointment, newStatus);
                            } else {
                                // If not found in today's appointments, create a minimal appointment object for the message
                                showStatusUpdateMessage({
                                    id: appointmentId,
                                    clientName: 'Appointment',
                                    time: '',
                                    status: newStatus
                                }, newStatus);
                            }
                        } else {
                            // Fallback: show success message without full details
                            showStatusUpdateMessage({
                                id: appointmentId,
                                clientName: 'Appointment',
                                time: '',
                                status: newStatus
                            }, newStatus);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching appointment details:', error);
                        // Still show success message
                        showStatusUpdateMessage({
                            id: appointmentId,
                            clientName: 'Appointment',
                            time: '',
                            status: newStatus
                        }, newStatus);
                    });
            })
            .catch(error => {
                console.error('Error updating appointment status:', error);
                showTranslatedAlert('appointment_update_failed', 'Failed to update appointment status. Please try again.');
            });
    } else {
        console.error('updateAppointmentStatusInDatabase function not available');
        showTranslatedAlert('appointment_update_failed', 'Failed to update appointment status. Please try again.');
    }

    // Refresh the agenda after a short delay to allow API update to complete
    setTimeout(() => {
        renderDailyAgenda();

        // Update today's summary after status change
        if (typeof updateTodaySummary === 'function') {
            updateTodaySummary();
        }

        // Update waiting room after status change
        if (typeof updateWaitingRoom === 'function') {
            updateWaitingRoom();
        }
    }, 500);
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
    // Clear patient documents when switching to add tab
    if (tab === 'add') {
        window.patientDocuments = [];
        setTimeout(() => {
            loadPatientFormDocuments();
        }, 100);
    }
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
window.toggleAccordion = function (accordionId) {
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

async function viewPatientDetails(patientId) {
    currentPatientDetailsId = patientId;
    const modal = document.getElementById('patientDetailsModal');

    // Prefer in-memory patients loaded from API
    let patient = Array.isArray(storedPatients) ? storedPatients.find(p => p.id === patientId) : null;

    // If not found yet, try fetching from API once
    if (!patient && typeof fetchPatientsFromAPI === 'function') {
        try {
            await fetchPatientsFromAPI();
        } catch (e) {
            console.error('Error fetching patients from API for details view:', e);
        }
        patient = Array.isArray(storedPatients) ? storedPatients.find(p => p.id === patientId) : null;
    }

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
async function loadPatientConsultations(patientId) {
    const consultationsList = document.getElementById('patientConsultationsList');
    if (!consultationsList) return;

    // Lightweight loading state while fetching consultations
    consultationsList.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <span data-translate="loading_consultations">Loading consultations...</span>
                </div>
            `;

    let consultations = [];
    try {
        const response = await fetch('api/get_consultations.php?all=1');
        if (!response.ok) {
            throw new Error('Failed to fetch consultations for patient details: ' + response.status);
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.consultations)) {
            consultations = data.consultations;
            // Cache latest consultations so other views (bills, reports) see up-to-date data
            try {
                localStorage.setItem('consultations', JSON.stringify(consultations));
            } catch (e) {
                console.error('Error caching consultations to localStorage from patient details:', e);
            }
        } else {
            consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
        }
    } catch (err) {
        console.error('Error loading consultations for patient details, falling back to localStorage:', err);
        consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    }

    const patientConsultations = consultations
        .filter(c => String(c.patientId) === String(patientId))
        .sort((a, b) => {
            const dateB = new Date(b.createdAt || b.date || b.consultationDate || 0);
            const dateA = new Date(a.createdAt || a.date || a.consultationDate || 0);
            return dateB - dateA;
        });

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
        const consultationDateObj = new Date(consultation.createdAt || consultation.date || consultation.consultationDate || 0);
        const consultationDate = isNaN(consultationDateObj.getTime())
            ? ''
            : consultationDateObj.toLocaleDateString();
        const consultationTime = isNaN(consultationDateObj.getTime())
            ? ''
            : consultationDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const doctorName = consultation.doctorName || consultation.doctor || 'N/A';

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
                                    <strong data-translate="doctor">Doctor:</strong> ${doctorName}
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

async function loadPatientBills(patientId) {
    const billsList = document.getElementById('patientBillsList');
    if (!billsList) return;

    // Lightweight loading state while fetching bills
    billsList.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <span data-translate="loading_bills">Loading bills...</span>
                </div>
            `;

    let bills = [];
    try {
        const response = await fetch('api/get_bills.php');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.bills)) {
            bills = data.bills;
            // Keep bills in localStorage so other features (view/print) keep working
            try {
                localStorage.setItem('healthcareBills', JSON.stringify(bills));
            } catch (e) {
                console.error('Error caching bills to localStorage from patient details:', e);
            }
        } else {
            bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
        }
    } catch (err) {
        // On error, fall back to any locally stored bills
        console.error('Error loading bills for patient details, falling back to localStorage:', err);
        bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
    }

    const patientBills = bills
        .filter(b => String(b.patientId) === String(patientId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

    // Build a quick lookup for consultations by ID so we can compute paid/remaining amounts
    let consultationsByIdForPatientBills = {};
    try {
        const localConsultationsRaw = localStorage.getItem('consultations') || '[]';
        const localConsultations = JSON.parse(localConsultationsRaw);
        if (Array.isArray(localConsultations)) {
            localConsultations.forEach(function (c) {
                if (c && c.id != null) {
                    consultationsByIdForPatientBills[String(c.id)] = c;
                }
            });
        }
    } catch (e) {
        console.error('Error loading consultations for patient bills:', e);
    }

    if (Array.isArray(window.readyConsultationsCache)) {
        window.readyConsultationsCache.forEach(function (c) {
            if (c && c.id != null) {
                const key = String(c.id);
                if (!Object.prototype.hasOwnProperty.call(consultationsByIdForPatientBills, key)) {
                    consultationsByIdForPatientBills[key] = c;
                }
            }
        });
    }

    const groupedBills = {
        paid: [],
        partial: [],
        unpaid: []
    };

    patientBills.forEach(function (bill) {
        const billDate = new Date(bill.billDate).toLocaleDateString();
        const dueDate = new Date(bill.dueDate).toLocaleDateString();
        const createdDate = new Date(bill.createdAt).toLocaleDateString();

        // Status badge styling (based on bill.status as before)
        let statusClass = 'bg-yellow-100 text-yellow-800';
        if (bill.status === 'Paid') {
            statusClass = 'bg-green-100 text-green-800';
        } else if (bill.status === 'Overdue') {
            statusClass = 'bg-red-100 text-red-800';
        } else if (bill.status === 'Cancelled') {
            statusClass = 'bg-gray-100 text-gray-800';
        }

        // Detect pre-invoice bills (used for partial payments)
        const rawStatus = (bill.status || '').toString().toLowerCase();
        const idStr = (bill.id || '').toString().toLowerCase();
        const isPreInvoiceBill = rawStatus === 'preinvoice' || idStr.indexOf('pre-') === 0;
        const consultation = bill.consultationId
            ? consultationsByIdForPatientBills[String(bill.consultationId)]
            : null;

        // Compute paid and remaining amounts for pre-invoice bills when a linked consultation exists
        let paidAmountDisplay = null;
        let remainingAmountDisplay = null;
        if (isPreInvoiceBill && consultation) {
            try {
                let totalAmount = (typeof bill.total === 'number' && !isNaN(bill.total))
                    ? bill.total
                    : (Number(bill.total || 0) || 0);

                let paidAmount = 0;
                const status = (consultation.paymentStatus || '').toLowerCase();
                if (status === 'paid') {
                    paidAmount = totalAmount;
                } else if (status === 'partial' || status === 'partially_paid') {
                    if (typeof consultation.partialPaymentAmount === 'number' && !isNaN(consultation.partialPaymentAmount)) {
                        paidAmount = consultation.partialPaymentAmount;
                    } else if (consultation.partialPaymentAmount !== undefined && consultation.partialPaymentAmount !== null && consultation.partialPaymentAmount !== '') {
                        const parsedPartial = Number(consultation.partialPaymentAmount);
                        if (!isNaN(parsedPartial)) {
                            paidAmount = parsedPartial;
                        }
                    }
                }

                paidAmountDisplay = paidAmount;
                remainingAmountDisplay = Math.max(0, totalAmount - paidAmount);
            } catch (e) {
                console.error('Error computing paid/remaining amounts for pre-invoice bill in patient details:', e);
            }
        }

        const paymentSummaryHtml = (function () {
            if (!isPreInvoiceBill || paidAmountDisplay === null || remainingAmountDisplay === null) return '';
            const paidLabel = window.t ? window.t('paid_amount', 'Montant payé') : 'Montant payé';
            const remainingLabel = window.t ? window.t('remaining_amount', 'Montant restant') : 'Montant restant';
            return `
                            <div class="mt-2 space-y-1 text-sm text-gray-600">
                                <div class="flex justify-between">
                                    <span><strong>${paidLabel}:</strong></span>
                                    <span>${paidAmountDisplay.toFixed(2)} TND</span>
                                </div>
                                <div class="flex justify-between">
                                    <span><strong>${remainingLabel}:</strong></span>
                                    <span>${remainingAmountDisplay.toFixed(2)} TND</span>
                                </div>
                            </div>
                        `;
        })();

        // Choose appropriate label and translation key for view button
        const viewButtonTranslateKey = isPreInvoiceBill ? 'view_full_pre_invoice' : 'view_full_bill';
        const viewButtonLabel = (function () {
            if (typeof window !== 'undefined' && window.t) {
                if (isPreInvoiceBill) {
                    return window.t('view_full_pre_invoice', 'Voir la pré-facture complète');
                }
                return window.t('view_full_bill', 'View Full Bill');
            }
            return isPreInvoiceBill ? 'Voir la pré-facture complète' : 'View Full Bill';
        })();

        // Determine normalized payment status for grouping (paid / partial / unpaid)
        let normalizedStatus = null;
        if (consultation && typeof normalizeConsultationPaymentStatusForReports === 'function') {
            try {
                normalizedStatus = normalizeConsultationPaymentStatusForReports(consultation);
            } catch (e) {
                console.error('Error normalizing consultation payment status for patient bill:', e);
            }
        }

        if (!normalizedStatus) {
            const lowerBillStatus = (bill.status || '').toString().toLowerCase();
            if (lowerBillStatus === 'paid') {
                normalizedStatus = 'paid';
            } else {
                normalizedStatus = 'unpaid';
            }
        }

        const cardHtml = `
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
                            ${paymentSummaryHtml}
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
                                <span data-translate="${viewButtonTranslateKey}">${viewButtonLabel}</span>
                            </button>
                        </div>
                    </div>
                `;

        if (normalizedStatus === 'paid') {
            groupedBills.paid.push(cardHtml);
        } else if (normalizedStatus === 'partial') {
            groupedBills.partial.push(cardHtml);
        } else {
            groupedBills.unpaid.push(cardHtml);
        }
    });

    const sections = [];

    function pushBillSection(key, defaultTitle, items) {
        if (!items || items.length === 0) return;
        const titleText = window.t ? window.t(key, defaultTitle) : defaultTitle;
        sections.push(`
                    <details class="mb-4 border border-gray-200 rounded-lg" data-bill-group="${key}">
                        <summary class="flex items-center justify-between px-3 py-2 cursor-pointer select-none">
                            <span class="text-sm font-semibold text-gray-700" data-translate="${key}">${titleText}</span>
                            <span class="text-gray-400 text-xs">▾</span>
                        </summary>
                        <div class="space-y-3 px-3 pb-3 pt-1">
                            ${items.join('')}
                        </div>
                    </details>
                `);
    }

    // Build sections in the requested order
    pushBillSection('paid_invoices', 'Paid invoices', groupedBills.paid);
    pushBillSection('partially_paid_invoices', 'Partially paid invoices', groupedBills.partial);
    pushBillSection('unpaid_invoices', 'Unpaid invoices', groupedBills.unpaid);

    billsList.innerHTML = sections.join('');

    // Ensure only one bill group accordion is open at a time
    try {
        const accordions = billsList.querySelectorAll('details[data-bill-group]');
        accordions.forEach(function (detailsEl) {
            if (detailsEl.__billGroupHandlerAttached) return;
            detailsEl.__billGroupHandlerAttached = true;
            detailsEl.addEventListener('toggle', function () {
                if (!detailsEl.open) return;
                accordions.forEach(function (other) {
                    if (other !== detailsEl && other.open) {
                        other.open = false;
                    }
                });
            });
        });
    } catch (e) {
        console.error('Error wiring bill group accordions:', e);
    }

    // Update translations after rendering
    if (window.I18n && window.I18n.walkAndTranslate) {
        window.I18n.walkAndTranslate();
    }
}

// Load and display documents in the Edit Patient form
function loadEditPatientDocuments() {
    const documentsList = document.getElementById('editPatientDocumentsList');
    if (!documentsList) return;

    if (!window.editPatientDocuments || window.editPatientDocuments.length === 0) {
        documentsList.innerHTML = `
            <div class="text-center py-4 text-gray-500 text-sm">
                <p data-translate="no_documents_uploaded">No documents uploaded yet.</p>
            </div>
        `;
        if (window.I18n && window.I18n.walkAndTranslate) {
            window.I18n.walkAndTranslate();
        }
        return;
    }

    documentsList.innerHTML = window.editPatientDocuments.map(doc => {
        const docDate = new Date(doc.uploadedAt || doc.createdAt || Date.now());
        const isImage = doc.type && doc.type.startsWith('image/');
        const fileIcon = isImage
            ? '<svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'
            : '<svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';

        const safeId = doc.id || '';

        return `
            <div class="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                    <div class="flex items-center flex-1 min-w-0">
                        ${fileIcon}
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-900 truncate">${doc.name || safeId || 'Document'}</div>
                            <div class="text-sm text-gray-500">${(doc.size ? (doc.size / 1024).toFixed(1) + ' KB • ' : '')}${docDate.toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 ml-3">
                        <button type="button" onclick="previewPatientDocument('patient_doc', '${safeId}', '')" class="btn btn-sm btn-secondary" title="Preview">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                        <button type="button" onclick="removeEditPatientDocument('${safeId}')" class="btn btn-sm btn-danger" title="Remove">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.I18n && window.I18n.walkAndTranslate) {
        window.I18n.walkAndTranslate();
    }
}

// Handle document upload for Edit Patient form
window.handleEditPatientDocumentUpload = function (event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('file_too_large', `File ${file.name} is too large. Maximum size is 10MB.`);
            } else {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const id = 'DOC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
            const documentData = {
                id,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                data: e.target.result
            };

            if (!window.editPatientDocuments) {
                window.editPatientDocuments = [];
            }
            window.editPatientDocuments.push(documentData);

            loadEditPatientDocuments();

            // Clear the file input
            event.target.value = '';
        };
        reader.onerror = function () {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('file_upload_error', `Error reading file ${file.name}`);
            } else {
                alert(`Error reading file ${file.name}`);
            }
        };
        reader.readAsDataURL(file);
    });
};

// Remove document from Edit Patient form
window.removeEditPatientDocument = function (documentId) {
    if (!window.editPatientDocuments) return;

    if (typeof window.showTranslatedConfirm === 'function') {
        if (!window.showTranslatedConfirm('confirm_delete_document', 'Are you sure you want to remove this document?')) {
            return;
        }
    } else {
        if (!confirm('Are you sure you want to remove this document?')) {
            return;
        }
    }

    window.editPatientDocuments = window.editPatientDocuments.filter(doc => doc.id !== documentId);
    loadEditPatientDocuments();
};
function loadPatientDocuments(patientId) {
    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
    const labAssessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
    const documentsList = document.getElementById('patientDocumentsList');

    if (!documentsList) return;

    // Collect all documents for this patient
    const allDocuments = [];
    const seenDocIds = new Set();
    
    // Get patient data from in-memory cache
    const patient = Array.isArray(storedPatients) ? storedPatients.find(p => p.id === patientId) : null;

    // 1) Add patient documents from in-memory/local `documents` array (e.g. newly uploaded docs)
    if (patient && Array.isArray(patient.documents) && patient.documents.length > 0) {
        patient.documents.forEach((doc, index) => {
            const id = doc.id || `patient-doc-${patientId}-local-${index}`;
            if (seenDocIds.has(id)) return;
            seenDocIds.add(id);
            const baseTitle = doc.name || `Patient Document ${index + 1}`;
            allDocuments.push({
                type: 'patient_doc',
                title: `Patient doc - ${baseTitle}`,
                id,
                date: doc.uploadedAt || doc.createdAt || patient.createdAt || new Date().toISOString(),
                data: doc,
                isPatientDoc: true
            });
        });
    }

    // 2) Add patient documents from stored JSON field (supports both patientDoc and patient_doc)
    const patientDocSource = patient ? (patient.patientDoc !== undefined ? patient.patientDoc : patient.patient_doc) : '';
    if (patientDocSource) {
        let normalizedDocs = [];

        // If already an array (rare but possible), use directly
        if (Array.isArray(patientDocSource)) {
            normalizedDocs = patientDocSource;
        } else if (typeof patientDocSource === 'string') {
            const raw = patientDocSource.trim();
            if (raw) {
                const parsePatientDocJson = (jsonText) => {
                    let parsed = JSON.parse(jsonText);

                    // Handle double-encoded JSON (string that itself contains JSON)
                    if (typeof parsed === 'string') {
                        try {
                            const second = JSON.parse(parsed);
                            parsed = second;
                        } catch (_) {
                            // leave as string
                        }
                    }

                    if (Array.isArray(parsed)) {
                        return parsed;
                    } else if (parsed && typeof parsed === 'object') {
                        return [parsed];
                    } else if (typeof parsed === 'string') {
                        // Legacy format: plain string stored inside JSON
                        return [{ id: parsed, name: parsed }];
                    }
                    return [];
                };

                try {
                    normalizedDocs = parsePatientDocJson(raw);
                } catch (e) {
                    console.error('Error parsing patient_doc JSON (raw):', e);

                    // Helper: try to salvage basic metadata from a possibly truncated JSON string
                    const buildMetaFromRaw = (text) => {
                        const search = text.replace(/\\"/g, '"');
                        const meta = {};

                        const idMatch = search.match(/"id"\s*:\s*"([^"\\]+)"/);
                        const nameMatch = search.match(/"name"\s*:\s*"([^"\\]+)"/);
                        const typeMatch = search.match(/"type"\s*:\s*"([^"\\]+)"/);
                        const sizeMatch = search.match(/"size"\s*:\s*(\d+)/);
                        const uploadedAtMatch = search.match(/"uploadedAt"\s*:\s*"([^"\\]+)"/);

                        if (idMatch) meta.id = idMatch[1];
                        if (nameMatch) meta.name = nameMatch[1];
                        if (typeMatch) meta.type = typeMatch[1];
                        if (sizeMatch) meta.size = parseInt(sizeMatch[1], 10);
                        if (uploadedAtMatch) meta.uploadedAt = uploadedAtMatch[1];

                        if (!meta.id && text) meta.id = text.slice(0, 50);
                        if (!meta.name) meta.name = 'Patient Document';

                        return meta;
                    };

                    // Some legacy records may have escaped quotes, e.g. [{\"id\":\"...\"}]
                    if (raw.includes('\\"')) {
                        try {
                            const cleaned = raw.replace(/\\"/g, '"');
                            normalizedDocs = parsePatientDocJson(cleaned);
                        } catch (e2) {
                            console.error('Error parsing patient_doc JSON (cleaned):', e2);
                            // Fallback: build a minimal doc object from the raw string
                            normalizedDocs = [buildMetaFromRaw(raw)];
                        }
                    } else {
                        // Fallback: build a minimal doc object from the raw string
                        normalizedDocs = [buildMetaFromRaw(raw)];
                    }
                }
            }
        } else if (patientDocSource && typeof patientDocSource === 'object') {
            // Single object stored directly
            normalizedDocs = [patientDocSource];
        }

        if (Array.isArray(normalizedDocs) && normalizedDocs.length > 0) {
            normalizedDocs.forEach((doc, index) => {
                const id = (doc && doc.id) || `patient-doc-${patientId}-${index}`;
                if (seenDocIds.has(id)) return;
                seenDocIds.add(id);
                const baseTitle = (doc && doc.name) || `Patient Document ${index + 1}`;
                allDocuments.push({
                    type: 'patient_doc',
                    title: `Patient doc - ${baseTitle}`,
                    // Prefer the actual document id if present so preview can find it reliably
                    id,
                    date: (doc && (doc.uploadedAt || doc.createdAt)) || (patient && patient.createdAt) || new Date().toISOString(),
                    data: doc,
                    isPatientDoc: true
                });
            });
        }
    }

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

        // Get uploaded documents from consultation (including radiology and lab files)
        if (consultation.documents && Array.isArray(consultation.documents)) {
            consultation.documents.forEach(doc => {
                if (doc.source === 'radiology') {
                    allDocuments.push({
                        type: 'radiology',
                        title: `Radiology - ${doc.section === 'diagnostics' ? 'Diagnostics' : 'Result'}`,
                        id: doc.id,
                        date: doc.uploadedAt || consultation.createdAt,
                        consultationId: consultation.id,
                        data: doc
                    });
                } else if (doc.source === 'lab') {
                    allDocuments.push({
                        type: 'lab_upload',
                        title: `Lab - ${doc.section === 'notes' ? 'Notes' : 'Results'}`,
                        id: doc.id,
                        date: doc.uploadedAt || consultation.createdAt,
                        consultationId: consultation.id,
                        data: doc
                    });
                } else if (!doc.source || doc.source === 'uploaded') {
                    // Regular uploaded documents (already handled elsewhere, but include here too)
                    allDocuments.push({
                        type: 'uploaded',
                        title: doc.name || 'Uploaded Document',
                        id: doc.id,
                        date: doc.uploadedAt || consultation.createdAt,
                        consultationId: consultation.id,
                        data: doc
                    });
                }
            });
        }

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

        switch (doc.type) {
            case 'certificate':
                docIcon = '<svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                bgColor = 'bg-blue-50';
                break;
            case 'lab':
            case 'lab_upload':
                docIcon = '<svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>';
                bgColor = 'bg-green-50';
                break;
            case 'radiology':
                docIcon = '<svg class="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>';
                bgColor = 'bg-red-50';
                break;
            case 'prescription':
                docIcon = '<svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>';
                bgColor = 'bg-purple-50';
                break;
            case 'uploaded':
                docIcon = '<svg class="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                bgColor = 'bg-orange-50';
                break;
            case 'notes':
                docIcon = '<svg class="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
                bgColor = 'bg-orange-50';
                break;
            case 'patient_doc':
                docIcon = '<svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                bgColor = 'bg-indigo-50';
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
window.previewPatientDocument = function (docType, docId, consultIdFromDoc) {
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
    switch (docType) {
        case 'patient_doc': {
            // Handle patient documents stored on the patient record (from in-memory patients)
            const currentPatient = Array.isArray(storedPatients)
                ? storedPatients.find(p => p.id === currentPatientDetailsId)
                : null;

            if (currentPatient) {
                const hasInMemoryDocs = Array.isArray(currentPatient.documents) && currentPatient.documents.length > 0;
                const patientDocSource = currentPatient.patientDoc !== undefined ? currentPatient.patientDoc : currentPatient.patient_doc;

                if (hasInMemoryDocs || patientDocSource) {
                    try {
                        const allPatientDocs = [];

                        // 1) In-memory documents array (newly uploaded and not yet synced)
                        if (hasInMemoryDocs) {
                            currentPatient.documents.forEach(doc => {
                                if (doc) allPatientDocs.push(doc);
                            });
                        }

                        // 2) Documents from stored JSON field (supports both patientDoc and patient_doc)
                        if (patientDocSource) {
                            let normalizedDocs = [];

                            // If already an array (rare but possible), use directly
                            if (Array.isArray(patientDocSource)) {
                                normalizedDocs = patientDocSource;
                            } else if (typeof patientDocSource === 'string') {
                                const raw = patientDocSource.trim();
                                if (raw) {
                                    const parsePatientDocJson = (jsonText) => {
                                        let parsed = JSON.parse(jsonText);

                                        // Handle double-encoded JSON (string that itself contains JSON)
                                        if (typeof parsed === 'string') {
                                            try {
                                                const second = JSON.parse(parsed);
                                                parsed = second;
                                            } catch (_) {
                                                // leave as string
                                            }
                                        }

                                        if (Array.isArray(parsed)) {
                                            return parsed;
                                        } else if (parsed && typeof parsed === 'object') {
                                            return [parsed];
                                        } else if (typeof parsed === 'string') {
                                            // Legacy format: plain string stored inside JSON
                                            return [{ id: parsed, name: parsed }];
                                        }
                                        return [];
                                    };

                                    try {
                                        normalizedDocs = parsePatientDocJson(raw);
                                    } catch (e) {
                                        console.error('Error parsing patient_doc JSON in preview (raw):', e);

                                        // Some legacy records may have escaped quotes, e.g. [{\"id\":\"...\"}]
                                        if (raw.includes('\\"')) {
                                            try {
                                                const cleaned = raw.replace(/\\"/g, '"');
                                                normalizedDocs = parsePatientDocJson(cleaned);
                                            } catch (e2) {
                                                console.error('Error parsing patient_doc JSON in preview (cleaned):', e2);
                                                normalizedDocs = [{ id: raw, name: raw }];
                                            }
                                        } else {
                                            normalizedDocs = [{ id: raw, name: raw }];
                                        }
                                    }
                                }
                            } else if (patientDocSource && typeof patientDocSource === 'object') {
                                // Single object stored directly
                                normalizedDocs = [patientDocSource];
                            }

                            if (Array.isArray(normalizedDocs) && normalizedDocs.length > 0) {
                                normalizedDocs.forEach(doc => {
                                    if (doc) allPatientDocs.push(doc);
                                });
                            }
                        }

                        if (allPatientDocs.length > 0) {
                            // First try to find by real document id
                            if (docId) {
                                documentData = allPatientDocs.find(d => d && d.id === docId) || null;
                            }

                            // Fallback: if not found by id, try index encoded in synthetic id "patient-doc-<patientId>-<index>"
                            if (!documentData && typeof docId === 'string') {
                                const match = docId.match(/patient-doc-[^-]+-(\d+)$/);
                                if (match) {
                                    const index = parseInt(match[1], 10);
                                    if (!Number.isNaN(index) && index >= 0 && index < allPatientDocs.length) {
                                        documentData = allPatientDocs[index];
                                    }
                                }
                            }
                        }

                        if (documentData) {
                            documentTitle = documentData.name || 'Patient Document';

                            const isImage = documentData.type && documentData.type.startsWith('image/');
                            const imageSrc = documentData.data || documentData.url || '';

                            if (isImage && imageSrc) {
                                // Inline image preview
                                documentHTML = `
                        <div class="space-y-4">
                            <div class="border-b pb-3">
                                <h4 class="font-semibold text-lg mb-2">${documentTitle}</h4>
                                <div class="text-sm text-gray-600">
                                    <strong>ID:</strong> ${documentData.id || ''}<br>
                                    <strong>Type:</strong> Image<br>
                                    ${documentData.size ? `<strong>Size:</strong> ${(documentData.size / 1024).toFixed(2)} KB<br>` : ''}
                                </div>
                            </div>
                            <div class="mt-4 flex justify-center">
                                <img src="${imageSrc}" alt="${documentTitle}" class="max-w-full h-auto border border-gray-300 rounded-lg shadow-md">
                            </div>
                            ${documentData.notes ? `
                            <div class="mt-4">
                                <p class="font-medium">Notes:</p>
                                <p class="whitespace-pre-line">${documentData.notes}</p>
                            </div>
                            ` : ''}
                        </div>
                    `;
                            } else {
                                // Non-image document: show link / basic info
                                documentHTML = `
                        <div class="space-y-4">
                            <div class="border-b pb-3">
                                <h4 class="font-semibold text-lg mb-2">${documentTitle}</h4>
                                <div class="text-sm text-gray-600">
                                    <strong>ID:</strong> ${documentData.id || ''}<br>
                                    <strong>Type:</strong> ${documentData.type || 'Document'}<br>
                                    ${documentData.size ? `<strong>Size:</strong> ${(documentData.size / 1024).toFixed(2)} KB<br>` : ''}
                                </div>
                            </div>
                            ${imageSrc ? `
                            <div class="mt-4">
                                <a href="${imageSrc}" target="_blank" download="${documentTitle}" class="btn btn-primary">
                                    <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    Download Document
                                </a>
                            </div>
                            ` : ''}
                            ${documentData.notes ? `
                            <div class="mt-4">
                                <p class="font-medium">Notes:</p>
                                <p class="whitespace-pre-line">${documentData.notes}</p>
                            </div>
                            ` : ''}
                        </div>
                    `;
                            }
                        } else {
                            documentHTML = '<p class="text-gray-500">Document not found.</p>';
                        }
                    } catch (e) {
                        console.error('Error parsing patient document:', e);
                        documentHTML = '<p class="text-red-500">Error loading document. Please try again.</p>';
                    }
                } else {
                    documentHTML = '<p class="text-gray-500">Document not found.</p>';
                }
            } else {
                documentHTML = '<p class="text-gray-500">Document not found.</p>';
            }
            break;
        }
        case 'radiology':
        case 'lab_upload':
        case 'uploaded':
            // Find document in consultation documents
            if (consultIdFromDoc) {
                const consultation = consultations.find(c => c.id === consultIdFromDoc);
                if (consultation && consultation.documents && Array.isArray(consultation.documents)) {
                    documentData = consultation.documents.find(doc => doc.id === docId);
                    if (documentData) {
                        documentTitle = documentData.name || 'Document';
                        // Check if it's an image
                        if (documentData.type && documentData.type.startsWith('image/') && documentData.data) {
                            documentHTML = `
                                        <div class="space-y-4">
                                            <div class="border-b pb-3">
                                                <h4 class="font-semibold text-lg mb-2">${documentTitle}</h4>
                                                <div class="text-sm text-gray-600">
                                                    <strong>ID:</strong> ${documentData.id}<br>
                                                    <strong>Type:</strong> ${docType === 'radiology' ? 'Radiology' : (docType === 'lab_upload' ? 'Lab' : 'Uploaded')}<br>
                                                    <strong>Date:</strong> ${new Date(documentData.uploadedAt || Date.now()).toLocaleString()}
                                                </div>
                                            </div>
                                            <div class="mt-4">
                                                <img src="${documentData.data}" alt="${documentTitle}" class="max-w-full h-auto border border-gray-300 rounded-lg shadow-md">
                                            </div>
                                        </div>
                                    `;
                        } else if (documentData.data) {
                            // For non-image files, provide download link
                            documentHTML = `
                                        <div class="space-y-4">
                                            <div class="border-b pb-3">
                                                <h4 class="font-semibold text-lg mb-2">${documentTitle}</h4>
                                                <div class="text-sm text-gray-600">
                                                    <strong>ID:</strong> ${documentData.id}<br>
                                                    <strong>Type:</strong> ${docType === 'radiology' ? 'Radiology' : (docType === 'lab_upload' ? 'Lab' : 'Uploaded')}<br>
                                                    <strong>File Type:</strong> ${documentData.type || 'Unknown'}<br>
                                                    <strong>Size:</strong> ${(documentData.size / 1024).toFixed(2)} KB<br>
                                                    <strong>Date:</strong> ${new Date(documentData.uploadedAt || Date.now()).toLocaleString()}
                                                </div>
                                            </div>
                                            <div class="mt-4">
                                                <a href="${documentData.data}" download="${documentTitle}" class="btn btn-primary">
                                                    <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                                    </svg>
                                                    Download Document
                                                </a>
                                            </div>
                                        </div>
                                    `;
                        }
                    }
                }
            }
            break;

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
window.closePatientDocumentPreviewModal = function () {
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

    // Detect if this is a pre-invoice bill (used for partial payments)
    const rawStatus = (bill.status || '').toString().toLowerCase();
    const idStr = (bill.id || '').toString().toLowerCase();
    const isPreInvoiceBill = rawStatus === 'preinvoice' || idStr.indexOf('pre-') === 0;

    if (isPreInvoiceBill) {
        // For pre-invoices, reuse the dedicated pre-invoice preview/print layout
        if (typeof printPreInvoiceFromBill === 'function') {
            printPreInvoiceFromBill(bill);
        } else {
            alert(`Bill ID: ${bill.id}\nTotal: ${bill.total.toFixed(2)} TND\nStatus: ${bill.status}`);
        }
        return;
    }

    // For normal bills, use the standard printable bill view when available
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
        // Preserve the current patient ID before closing the modal,
        // because closePatientDetailsModal() resets currentPatientDetailsId to null.
        const patientId = currentPatientDetailsId;
        closePatientDetailsModal();
        editPatient(patientId);
    }
}

function downloadPatientFile(patientId, fileIndex) {
    const patient = storedPatients.find(p => p.id === patientId);

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
        medicalHistory: document.getElementById('patientMedicalHistory').value,
        documents: (window.patientDocuments && Array.isArray(window.patientDocuments)) ? window.patientDocuments : []
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
    // Clear patient documents
    window.patientDocuments = [];
    loadPatientFormDocuments();
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
        const existingSet = new Set([
            ...((storedPatients || []).map(p => p && p.fileNumber).filter(Boolean))
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
    } catch { }

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
        const updatedDocuments = (window.editPatientDocuments && Array.isArray(window.editPatientDocuments))
            ? window.editPatientDocuments
            : (editingPatient.documents || []);
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
            documents: updatedDocuments,
            updatedAt: new Date().toISOString()
        };

        // Find and update patient in storage
        const patientIndex = storedPatients.findIndex(p => p.id === editingPatient.id);
        if (patientIndex !== -1) {
            storedPatients[patientIndex] = updatedPatient;
            saveStoredPatients();
            // Sync to backend database
            if (typeof syncPatientToDatabase === 'function') {
                syncPatientToDatabase(updatedPatient);
            }

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

// Sync a consultation record to backend database (Access via consultation_sync.php)
function syncConsultationToDatabase(consultation) {
    try {
        const payload = {
            id: consultation.id || '',
            patientId: consultation.patientId || '',
            height: consultation.height !== null && consultation.height !== undefined ? consultation.height : null,
            weight: consultation.weight !== null && consultation.weight !== undefined ? consultation.weight : null,
            temperature: consultation.temperature !== null && consultation.temperature !== undefined ? consultation.temperature : null,
            heartRate: consultation.heartRate !== null && consultation.heartRate !== undefined ? consultation.heartRate : null,
            bloodSugar: consultation.bloodSugar !== null && consultation.bloodSugar !== undefined ? consultation.bloodSugar : null,
            bloodPressure: consultation.bloodPressure
                ? consultation.bloodPressure
                : (consultation.bpSystolic !== null && consultation.bpSystolic !== undefined &&
                   consultation.bpDiastolic !== null && consultation.bpDiastolic !== undefined
                      ? `${consultation.bpSystolic}/${consultation.bpDiastolic}`
                      : null),
            imc: consultation.imc !== null && consultation.imc !== undefined ? consultation.imc : null,
            bmiCategory: consultation.bmiCategory || null,
            consultationAct: consultation.consultationAct || null,
            clinicalNote: consultation.clinicalNote || consultation.vitalNotes || '',
            radiologyResult: consultation.radiologyResult || '',
            radiologyDiagnostics: consultation.radiologyDiagnostics || '',
            labResults: consultation.labResults || '',
            labNotes: consultation.labNotes || '',
            prescription: consultation.prescription || '',
            paymentStatus: consultation.paymentStatus || 'paying',
            documents: consultation.documents && Array.isArray(consultation.documents) ? consultation.documents : [],
            doctor: consultation.doctor || '',
            createdAt: consultation.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/consultation_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok) {
                    console.error('Consultation sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Consultation sync success:', data);
            })
            .catch(err => {
                console.error('Consultation sync error:', err);
            });
    } catch (e) {
        console.error('Consultation sync exception:', e);
    }
}

function syncRadiologyResultToDatabase(consultation, radiologyFiles) {
    try {
        if (!consultation || !consultation.id || !consultation.patientId) {
            return;
        }

        const hasResult = typeof consultation.radiologyResult === 'string' && consultation.radiologyResult.trim() !== '';
        const hasDiagnostics = typeof consultation.radiologyDiagnostics === 'string' && consultation.radiologyDiagnostics.trim() !== '';
        const hasFiles = Array.isArray(radiologyFiles) && radiologyFiles.length > 0;

        if (!hasResult && !hasDiagnostics && !hasFiles) {
            return;
        }

        const payload = {
            id: 'rad_' + consultation.id,
            consultationId: consultation.id,
            patientId: consultation.patientId,
            examType: 'Radiology Exam',
            examDate: new Date().toISOString(),
            radiologyResult: consultation.radiologyResult || '',
            radiologyDiagnostics: consultation.radiologyDiagnostics || '',
            notes: '',
            documents: hasFiles ? JSON.stringify(radiologyFiles) : null,
            doctor: consultation.doctor || '',
            createdAt: consultation.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/radiology_result_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok) {
                    console.error('Radiology result sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Radiology result sync success:', data);
            })
            .catch(err => {
                console.error('Radiology result sync error:', err);
            });
    } catch (e) {
        console.error('Radiology result sync exception:', e);
    }
}

function syncLabAssessmentToDatabase(consultation, labFiles) {
    try {
        if (!consultation || !consultation.id || !consultation.patientId) {
            return;
        }

        const hasResults = typeof consultation.labResults === 'string' && consultation.labResults.trim() !== '';
        const hasNotes = typeof consultation.labNotes === 'string' && consultation.labNotes.trim() !== '';
        const hasFiles = Array.isArray(labFiles) && labFiles.length > 0;

        if (!hasResults && !hasNotes && !hasFiles) {
            return;
        }

        const payload = {
            id: 'lab_' + consultation.id,
            consultationId: consultation.id,
            patientId: consultation.patientId,
            assessmentType: 'Lab Assessment',
            labDate: new Date().toISOString(),
            results: consultation.labResults || '',
            notes: consultation.labNotes || '',
            documents: hasFiles ? JSON.stringify(labFiles) : null,
            doctor: consultation.doctor || '',
            createdAt: consultation.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/lab_assessment_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok) {
                    console.error('Lab assessment sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Lab assessment sync success:', data);
            })
            .catch(err => {
                console.error('Lab assessment sync error:', err);
            });
    } catch (e) {
        console.error('Lab assessment sync exception:', e);
    }
}

// Update an existing consultation record in backend database (Access via update_consultation.php)
function updateConsultationInDatabase(consultation) {
    try {
        const payload = {
            id: consultation.id || '',
            patientId: consultation.patientId || '',
            height: consultation.height !== null && consultation.height !== undefined ? consultation.height : null,
            weight: consultation.weight !== null && consultation.weight !== undefined ? consultation.weight : null,
            temperature: consultation.temperature !== null && consultation.temperature !== undefined ? consultation.temperature : null,
            heartRate: consultation.heartRate !== null && consultation.heartRate !== undefined ? consultation.heartRate : null,
            bloodSugar: consultation.bloodSugar !== null && consultation.bloodSugar !== undefined ? consultation.bloodSugar : null,
            bloodPressure: consultation.bloodPressure
                ? consultation.bloodPressure
                : (consultation.bpSystolic !== null && consultation.bpSystolic !== undefined &&
                   consultation.bpDiastolic !== null && consultation.bpDiastolic !== undefined
                      ? `${consultation.bpSystolic}/${consultation.bpDiastolic}`
                      : null),
            imc: consultation.imc !== null && consultation.imc !== undefined ? consultation.imc : null,
            bmiCategory: consultation.bmiCategory || null,
            consultationAct: consultation.consultationAct || null,
            clinicalNote: consultation.clinicalNote || consultation.vitalNotes || '',
            radiologyResult: consultation.radiologyResult || '',
            radiologyDiagnostics: consultation.radiologyDiagnostics || '',
            labResults: consultation.labResults || '',
            labNotes: consultation.labNotes || '',
            prescription: consultation.prescription || '',
            paymentStatus: consultation.paymentStatus || 'paying',
            documents: consultation.documents && Array.isArray(consultation.documents) ? consultation.documents : [],
            doctor: consultation.doctor || ''
        };

        fetch('api/update_consultation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok) {
                    console.error('Consultation update failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Consultation update success:', data);
            })
            .catch(err => {
                console.error('Consultation update error:', err);
            });
    } catch (e) {
        console.error('Consultation update exception:', e);
    }
}

// Sync a bill record to backend database (Access via bill_sync.php)
function syncBillToDatabase(bill) {
    try {
        const payload = {
            id: bill.id || '',
            patientId: bill.patientId || '',
            patientName: bill.patientName || '',
            patientEmail: bill.patientEmail || '',
            patientPhone: bill.patientPhone || '',
            billDate: bill.billDate || new Date().toISOString().split('T')[0],
            dueDate: bill.dueDate || new Date().toISOString().split('T')[0],
            items: bill.items && Array.isArray(bill.items) ? bill.items : [],
            subtotal: bill.subtotal || 0,
            tax: bill.tax || 0,
            total: bill.total || 0,
            notes: bill.notes || '',
            status: bill.status || 'Paid',
            consultationId: bill.consultationId || null,
            createdAt: bill.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/bill_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok) {
                    console.error('Bill sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Bill sync success:', data);
            })
            .catch(err => {
                console.error('Bill sync error:', err);
            });
    } catch (e) {
        console.error('Bill sync exception:', e);
    }
}

// Update appointment status in backend database (Access via update_appointment_status.php)
function updateAppointmentStatusInDatabase(appointmentId, newStatus) {
    return new Promise((resolve, reject) => {
        try {
            const payload = {
                id: appointmentId,
                status: newStatus || 'consulted'
            };

            fetch('api/update_appointment_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(async res => {
                    let data;
                    try { data = await res.json(); } catch (_) { data = null; }
                    if (!res.ok) {
                        console.error('Appointment status update failed:', res.status, data || await res.text());
                        reject(new Error(data?.message || 'Failed to update appointment status'));
                        return;
                    }
                    console.log('Appointment status updated successfully:', data);
                    resolve(data);
                })
                .catch(err => {
                    console.error('Appointment status update error:', err);
                    reject(err);
                });
        } catch (e) {
            console.error('Appointment status update exception:', e);
            reject(e);
        }
    });
}

// Sync a patient record to backend database (Access via patient_sync.php)
function syncAppointmentToDatabase(appointment) {
    try {
        const payload = {
            id: appointment.id || '',
            date: appointment.date || '',
            time: appointment.time || '',
            duration: appointment.duration || '30',
            clientName: appointment.clientName || '',
            clientPhone: appointment.clientPhone || '',
            clientEmail: appointment.clientEmail || '',
            type: appointment.type || '',
            status: appointment.status || 'pre-validation',
            notes: appointment.notes || '',
            doctor: appointment.doctor || '',
            patientId: appointment.patientId || appointment.patient_id || '',
            createdAt: appointment.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/appointment_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok) {
                    console.error('Appointment sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Appointment sync success:', data);
            })
            .catch(err => {
                console.error('Appointment sync error:', err);
            });
    } catch (e) {
        console.error('Appointment sync exception:', e);
    }
}

function syncPatientToDatabase(patient) {
    try {
        const payload = {
            id: patient.id,
            fileNumber: patient.fileNumber || patient.file_number || '',
            cinPassport: patient.cinPassport || patient.cin_passport || '',
            fullName: patient.fullName || patient.full_name || '',
            email: patient.email || '',
            phone: patient.phone || '',
            dateOfBirth: patient.dateOfBirth || patient.date_of_birth || '',
            gender: patient.gender || '',
            address: patient.address || '',
            medicalHistory: patient.medicalHistory || patient.medical_history || '',
            patientDoc: JSON.stringify(patient.documents || []), // Include patient documents
            createdAt: patient.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/patient_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok) {
                    console.error('Patient sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Patient sync success:', data);
            })
            .catch(err => {
                console.error('Patient sync error:', err);
            });
    } catch (e) {
        console.error('Patient sync exception:', e);
    }
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
        documents: (patientData.documents && Array.isArray(patientData.documents)) ? patientData.documents : [],
        createdAt: new Date().toISOString()
    };

    console.log('Adding patient:', newPatient);
    storedPatients.push(newPatient);
    saveStoredPatients();
    console.log('Stored patients:', storedPatients);

    // Sync to backend database if integration available
    if (typeof syncPatientToDatabase === 'function') {
        syncPatientToDatabase(newPatient);
    }

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
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #065f46; margin: 0;">${window.t ? window.t('patient_added', 'Patient Added Successfully!') : 'Patient Added Successfully!'}</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
                        <p><strong>${window.t ? window.t('name', 'Name') : 'Name'}:</strong> ${patient.fullName}</p>
                        <p><strong>${window.t ? window.t('email', 'Email') : 'Email'}:</strong> ${patient.email}</p>
                        <p><strong>${window.t ? window.t('phone', 'Phone') : 'Phone'}:</strong> ${patient.phone}</p>
                    </div>
                    <p style="font-size: 0.875rem; color: #059669; margin: 0;">
                        ${window.t ? window.t('patient_added_to_system', 'The patient has been added to the system. You can now schedule appointments for this patient.') : 'The patient has been added to the system. You can now schedule appointments for this patient.'}
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
// Fetch patients from API
async function fetchPatientsFromAPI() {
    try {
        const response = await fetch('api/get_patients.php');
        const data = await response.json();

        if (data.status === 'ok' && Array.isArray(data.patients)) {
            // Merge API patients into existing in-memory patients by id
            const apiPatients = data.patients;
            const byId = new Map();
            // Start with API patients from the database
            apiPatients.forEach(p => {
                if (p && p.id) {
                    byId.set(p.id, p);
                }
            });
            // Overlay any already-loaded patients (e.g. newly added or edited in this session)
            if (Array.isArray(storedPatients)) {
                storedPatients.forEach(p => {
                    if (p && p.id) {
                        byId.set(p.id, p);
                    }
                });
            }
            storedPatients = Array.from(byId.values());
            saveStoredPatients(); // no-op: patients are stored only in the database now

            // Refresh consultation patient dropdown if modal is open
            if (typeof window.populateConsultationPatientDropdown === 'function') {
                window.populateConsultationPatientDropdown();
            }
            return true;
        } else {
            console.warn('API returned unexpected format:', data);
            return false;
        }
    } catch (error) {
        console.error('Error fetching patients from API:', error);
        return false;
    }
}

function loadPatientsList() {
    const patientsList = document.getElementById('patientsList');
    if (!patientsList) return;

    // If we already have patients in memory, render them immediately
    if (Array.isArray(storedPatients) && storedPatients.length > 0) {
        renderPatientsList();
    } else {
        // Show loading state while we fetch from API
        patientsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-8 h-8 mx-auto mb-4 text-gray-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <p>Loading patients...</p>
            </div>
        `;
    }

    // Fetch from API, then render with freshest data
    fetchPatientsFromAPI().then(() => {
        renderPatientsList();
    }).catch(() => {
        // If API fails, still try to render from storedPatients
        renderPatientsList();
    });
}

function renderPatientsList() {
    const patientsList = document.getElementById('patientsList');
    if (!patientsList) return;

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
    // Build a set of existing numbers
    const existingNumbers = new Set();
    (storedPatients || []).forEach(p => { if (p && p.fileNumber) existingNumbers.add(p.fileNumber); });

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
	let patient = Array.isArray(storedPatients) ? storedPatients.find(p => p.id === patientId) : null;
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

    // Load patient documents into edit array
    try {
        let docs = [];
        if (Array.isArray(patient.documents)) {
            docs = patient.documents;
        } else if (patient.patientDoc || patient.patient_doc) {
            const raw = patient.patientDoc || patient.patient_doc;
            if (typeof raw === 'string' && raw.trim()) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) docs = parsed;
            }
        }
        window.editPatientDocuments = docs;
    } catch (e) {
        console.error('Error loading edit patient documents:', e);
        window.editPatientDocuments = [];
    }

    if (typeof loadEditPatientDocuments === 'function') {
        loadEditPatientDocuments();
    }

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
    } catch { }
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
    const paymentContent = document.getElementById('paymentBillsContent');
    const readyContent = document.getElementById('readyBillsContent');
    const doneContent = document.getElementById('doneBillsContent');

    const paymentTab = document.getElementById('paymentBillsTab');
    const readyTab = document.getElementById('readyBillsTab');
    const doneTab = document.getElementById('doneBillsTab');

    if (tab === 'payment') {
        if (paymentContent) paymentContent.style.display = 'block';
        if (readyContent) readyContent.style.display = 'none';
        if (doneContent) doneContent.style.display = 'none';

        if (paymentTab) paymentTab.className = 'btn btn-primary';
        if (readyTab) readyTab.className = 'btn btn-secondary';
        if (doneTab) doneTab.className = 'btn btn-secondary';

        if (typeof window.renderPaymentConsultations === 'function') {
            window.renderPaymentConsultations();
        }
    } else if (tab === 'ready') {
        if (paymentContent) paymentContent.style.display = 'none';
        if (readyContent) readyContent.style.display = 'block';
        if (doneContent) doneContent.style.display = 'none';

        if (paymentTab) paymentTab.className = 'btn btn-secondary';
        if (readyTab) readyTab.className = 'btn btn-primary';
        if (doneTab) doneTab.className = 'btn btn-secondary';

        renderReadyBills();
    } else if (tab === 'done') {
        if (paymentContent) paymentContent.style.display = 'none';
        if (readyContent) readyContent.style.display = 'none';
        if (doneContent) doneContent.style.display = 'block';

        if (paymentTab) paymentTab.className = 'btn btn-secondary';
        if (readyTab) readyTab.className = 'btn btn-secondary';
        if (doneTab) doneTab.className = 'btn btn-primary';

        renderDoneBills();
    }
}
async function renderReadyBills() {
    const container = document.getElementById('readyBillsContainer');
    if (!container) return;

    // Lightweight loading state
    container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <span data-translate="loading_ready_bills">Loading consultations ready for billing...</span>
                </div>
            `;

    let readyConsultations = [];

    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const response = await fetch('api/get_ready_bill.php?date=' + encodeURIComponent(today));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.consultations)) {
            readyConsultations = data.consultations;
        } else {
            throw new Error('Invalid response structure from get_ready_bill.php');
        }
    } catch (err) {
        console.error('Error loading ready bills from API, falling back to localStorage:', err);

        // Fallback to previous localStorage-based logic
        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
        const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');

        const consultationIdsWithBills = new Set(
            bills.filter(b => b.consultationId).map(b => b.consultationId)
        );

        readyConsultations = consultations.filter(c => {
            const hasBill = consultationIdsWithBills.has(c.id);
            return !hasBill;
        });
    }

    // Keep consultations that are ready for billing: paid, partially paid, or unpaid (no bill yet).
    // Backend may store unpaid as NULL or 'paying', so treat those as unpaid as well.
    readyConsultations = readyConsultations.filter(c => {
        const status = (c.paymentStatus || '').toLowerCase();
        return status === 'paid'
            || status === 'partial'
            || status === 'partially_paid'
            || status === 'unpaid'
            || status === 'paying'
            || status === '';
    });

    // Cache ready consultations so actions can fall back when localStorage is missing data
    window.readyConsultationsCache = readyConsultations;

    // Sort by most recent
    const patients = Array.isArray(storedPatients) ? storedPatients : [];

    const sorted = readyConsultations.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-6" data-translate="no_consultations_today">No consultations conducted today.</p>';
        return;
    }

    container.innerHTML = sorted.map(c => {
        const patient = patients.find(p => String(p.id) === String(c.patientId));
        const patientName = patient ? patient.fullName : 'Unknown Patient';
        const created = new Date(c.createdAt);
        const dateStr = isNaN(created) ? '' : created.toLocaleString();

        // Compute consultation amount similar to payment tab
        let consultationAmountLabel = '-';
        try {
            const rawActs = c.consultationAct || '';
            const actNames = rawActs
                ? rawActs.split('|').map(function (s) { return s.trim(); }).filter(function (v) { return v; })
                : [];
            const hasActs = actNames.length > 0;
            let amount = null;

            if (hasActs && typeof window.getBillDescriptions === 'function') {
                const descriptions = window.getBillDescriptions();
                if (Array.isArray(descriptions)) {
                    actNames.forEach(function (actName) {
                        const match = descriptions.find(function (d) {
                            return d && d.name === actName;
                        });
                        if (match) {
                            const price = typeof match.price === 'number' ? match.price : Number(match.price || 0);
                            if (!isNaN(price)) {
                                if (amount === null) amount = 0;
                                amount += price;
                            }
                        }
                    });
                }
            }

            // Fallback: use any amount stored directly on consultation
            if (amount === null && typeof c.consultationAmount === 'number' && !isNaN(c.consultationAmount)) {
                amount = c.consultationAmount;
            }

            // If no act and no explicit amount, treat consultation as free (0 TND)
            if (!hasActs && amount === null) {
                amount = 0;
            }

            // Apply 8% tax to the consultation base amount (align with bill total)
            if (amount !== null) {
                const taxRate = 0.08;
                const totalWithTax = amount + (amount * taxRate);
                consultationAmountLabel = totalWithTax.toFixed(2) + ' TND';
            }
        } catch (e) {
            console.error('Error computing consultation amount in ready bills:', e);
        }

        // Normalize payment status similar to payment tab (paid / partial / unpaid)
        const rawStatus = (c.paymentStatus || '').toLowerCase();
        let normalizedStatus = 'unpaid';
        if (rawStatus === 'paid') {
            normalizedStatus = 'paid';
        } else if (rawStatus === 'partial' || rawStatus === 'partially_paid') {
            normalizedStatus = 'partial';
        }

        const paymentStatusLabel = (function () {
            if (normalizedStatus === 'paid') {
                return window.t ? window.t('paid_status', 'Paid') : 'Paid';
            }
            if (normalizedStatus === 'partial') {
                return window.t ? window.t('partially_paid_status', 'Partially Paid') : 'Partially Paid';
            }
            return window.t ? window.t('unpaid_status', 'Unpaid') : 'Unpaid';
        })();

        const paymentStatusClass = normalizedStatus === 'paid'
            ? 'bg-green-100 text-green-800'
            : (normalizedStatus === 'partial'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800');

        const isPreInvoice = normalizedStatus === 'partial' || normalizedStatus === 'unpaid';

        const createBillTranslateKey = isPreInvoice
            ? 'create_pre_invoice'
            : 'create_bill';
        const createBillLabel = isPreInvoice
            ? (window.t ? window.t('create_pre_invoice', 'Créer pré-facture') : 'Créer pré-facture')
            : (window.t ? window.t('create_bill', 'Créer une facture') : 'Créer une facture');
        const createBillOnClick = isPreInvoice
            ? `createPreInvoiceFromConsultation('${c.id}')`
            : `createBillFromConsultation('${c.id}')`;

        return `
                    <div class="card p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-semibold">${patientName}</div>
                                <div class="text-sm text-gray-600">Consultation • ${dateStr}</div>
                                <div class="text-xs text-gray-500">${window.t ? window.t('consultation_amount', 'Consultation Amount') : 'Consultation Amount'}: ${consultationAmountLabel}</div>
                                <div class="text-xs mt-1">
                                    <span class="font-medium">${window.t ? window.t('payment_status', 'Payment Status') : 'Payment Status'}:</span>
                                    <span class="ml-1 px-2 py-0.5 rounded-full ${paymentStatusClass}">${paymentStatusLabel}</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button class="btn btn-secondary" onclick="viewConsultationDetails('${c.id}')" data-translate="view">${window.t ? window.t('view', 'View') : 'View'}</button>
                                <button class="btn btn-primary" onclick="${createBillOnClick}" data-translate="${createBillTranslateKey}">${createBillLabel}</button>
                            </div>
                        </div>
                    </div>
                `;
    }).join('');
}

async function renderDoneBills(searchTerm = '') {
    const container = document.getElementById('doneBillsContainer');
    if (!container) return;

    // Show a lightweight loading state while fetching from API
    container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <span data-translate="loading_bills">Loading bills...</span>
                </div>
            `;

    let bills = [];
    let patients = [];

    try {
        const response = await fetch('api/get_bills.php');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.bills)) {
            bills = data.bills;
            // Keep bills in localStorage so other features (view/print) keep working
            localStorage.setItem('healthcareBills', JSON.stringify(bills));
        } else {
            bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
        }
    } catch (err) {
        // On error, fall back to any locally stored bills
        bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
    }

    // Load consultations so we can reflect their payment status on bills
    let consultationsById = {};
    try {
        const consultResponse = await fetch('api/get_consultations.php?all=1');
        if (consultResponse.ok) {
            const consultData = await consultResponse.json();
            if (consultData && consultData.status === 'ok' && Array.isArray(consultData.consultations)) {
                consultData.consultations.forEach(function (c) {
                    consultationsById[String(c.id)] = c;
                });
            }
        }
    } catch (e) {
        console.error('Error loading consultations for done bills:', e);
    }

    // Sort by creation date (newest first)
    let sortedBills = bills.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply search filter if provided
    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        sortedBills = sortedBills.filter(bill =>
            (bill.patientName || '').toLowerCase().includes(searchTerm) ||
            (bill.id || '').toLowerCase().includes(searchTerm) ||
            (bill.status || '').toLowerCase().includes(searchTerm)
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
        const consultation = bill.consultationId ? consultationsById[String(bill.consultationId)] : null;

        // Derive payment status primarily from linked consultation when available
        let normalizedConsultStatus = null;
        let paidAmountDisplay = null;
        let remainingAmountDisplay = null;
        if (consultation && typeof normalizeConsultationPaymentStatusForReports === 'function') {
            normalizedConsultStatus = normalizeConsultationPaymentStatusForReports(consultation);
        }

        let statusClass;
        let statusLabel;

        if (normalizedConsultStatus) {
            statusLabel = (function () {
                if (normalizedConsultStatus === 'paid') {
                    return window.t ? window.t('paid_status', 'Paid') : 'Paid';
                }
                if (normalizedConsultStatus === 'partial') {
                    return window.t ? window.t('partially_paid_status', 'Partially Paid') : 'Partially Paid';
                }
                return window.t ? window.t('unpaid_status', 'Unpaid') : 'Unpaid';
            })();

            statusClass = normalizedConsultStatus === 'paid'
                ? 'bg-green-100 text-green-800'
                : (normalizedConsultStatus === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800');
        } else {
            // Fallback to bill.status when no linked consultation is available
            const rawBillStatus = (bill.status || '').trim();
            const lowerStatus = rawBillStatus.toLowerCase();

            statusClass = 'bg-yellow-100 text-yellow-800';
            if (lowerStatus === 'paid') {
                statusClass = 'bg-green-100 text-green-800';
            } else if (lowerStatus === 'overdue') {
                statusClass = 'bg-red-100 text-red-800';
            } else if (lowerStatus === 'cancelled') {
                statusClass = 'bg-gray-100 text-gray-800';
            }

            statusLabel = window.t ? window.t(lowerStatus, rawBillStatus) : rawBillStatus;
        }

        // Get patient info
        const patient = patients.find(p => p.id === bill.patientId);
        const patientFileNumber = patient ? patient.fileNumber : 'N/A';

        const isPaid = normalizedConsultStatus
            ? normalizedConsultStatus === 'paid'
            : (bill.status === 'Paid');
        const isPreInvoiceBill = (function () {
            const rawStatus = (bill.status || '').toString().toLowerCase();
            const idStr = (bill.id || '').toString().toLowerCase();
            return rawStatus === 'preinvoice' || idStr.indexOf('pre-') === 0;
        })();

        if (isPreInvoiceBill && consultation) {
            try {
                let totalAmount = (typeof bill.total === 'number' && !isNaN(bill.total))
                    ? bill.total
                    : (Number(bill.total || 0) || 0);

                let paidAmount = 0;
                const status = (consultation.paymentStatus || '').toLowerCase();
                if (status === 'paid') {
                    paidAmount = totalAmount;
                } else if (status === 'partial' || status === 'partially_paid') {
                    if (typeof consultation.partialPaymentAmount === 'number' && !isNaN(consultation.partialPaymentAmount)) {
                        paidAmount = consultation.partialPaymentAmount;
                    } else if (consultation.partialPaymentAmount !== undefined && consultation.partialPaymentAmount !== null && consultation.partialPaymentAmount !== '') {
                        const parsedPartial = Number(consultation.partialPaymentAmount);
                        if (!isNaN(parsedPartial)) {
                            paidAmount = parsedPartial;
                        }
                    }
                }

                paidAmountDisplay = paidAmount;
                remainingAmountDisplay = Math.max(0, totalAmount - paidAmount);
            } catch (e) {
                console.error('Error computing paid/remaining amounts for pre-invoice bill in done bills:', e);
            }
        }

        const paymentSummaryHtml = (function () {
            if (!isPreInvoiceBill || paidAmountDisplay === null || remainingAmountDisplay === null) return '';
            const paidLabel = window.t ? window.t('paid_amount', 'Montant payé') : 'Montant payé';
            const remainingLabel = window.t ? window.t('remaining_amount', 'Montant restant') : 'Montant restant';
            return `
                                    <div class="text-sm text-gray-600">
                                        <strong>${paidLabel}:</strong> ${paidAmountDisplay.toFixed(2)} TND
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        <strong>${remainingLabel}:</strong> ${remainingAmountDisplay.toFixed(2)} TND
                                    </div>
                                `;
        })();

        const actionsHtml = isPaid
            ? `
                                <button onclick="printBill('${bill.id}')" class="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                    </svg>
                                    <span data-translate="print">Print</span>
                                </button>
                            `
            : (isPreInvoiceBill
                ? `
                                <button onclick="if (window.Payment && Payment.selectBillForPayment) { Payment.selectBillForPayment('${bill.id}'); }" class="btn btn-sm bg-green-600 hover:bg-green-700 text-white">
                                    <span data-translate="payment_section">Payment</span>
                                </button>
                                <button onclick="printBill('${bill.id}')" class="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                    </svg>
                                    <span data-translate="print">Print</span>
                                </button>
                            `
                : `
                                <button onclick="if (window.Payment && Payment.selectBillForPayment) { Payment.selectBillForPayment('${bill.id}'); }" class="btn btn-sm bg-green-600 hover:bg-green-700 text-white">
                                    <span data-translate="payment_section">Payment</span>
                                </button>
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
                            `);

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
                                    ${paymentSummaryHtml}
                                </div>
                            </div>
                            <span class="badge ${statusClass} px-3 py-1 rounded-full text-xs font-semibold ml-4">
                                ${statusLabel}
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
                                ${actionsHtml}
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

    const rawStatus = (bill.status || '').toString().toLowerCase();
    const idStr = (bill.id || '').toString().toLowerCase();
    const isPreInvoiceBill = rawStatus === 'preinvoice' || idStr.indexOf('pre-') === 0;

    if (isPreInvoiceBill) {
        printPreInvoiceFromBill(bill);
        return;
    }

    // Use existing bill display function if available
    if (typeof showPrintableBill === 'function') {
        showPrintableBill(bill);
    } else {
        window.print();
    }
}

function printPreInvoiceFromBill(bill) {
    try {
        const totalAmount = (function () {
            if (typeof bill.total === 'number' && !isNaN(bill.total)) return bill.total;
            const parsed = Number(bill.total || 0);
            return isNaN(parsed) ? 0 : parsed;
        })();

        const subtotal = (function () {
            if (typeof bill.subtotal === 'number' && !isNaN(bill.subtotal)) return bill.subtotal;
            const parsed = Number(bill.subtotal || 0);
            return isNaN(parsed) ? 0 : parsed;
        })();

        const taxAmount = (function () {
            if (typeof bill.tax === 'number' && !isNaN(bill.tax)) return bill.tax;
            const parsed = Number(bill.tax || 0);
            return isNaN(parsed) ? 0 : parsed;
        })();

        let createdAt = bill.createdAt || bill.billDate || new Date().toISOString();
        let paidAmount = 0;

        let consultation = null;
        if (bill.consultationId) {
            try {
                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                consultation = consultations.find(function (c) {
                    return c && String(c.id) === String(bill.consultationId);
                });
            } catch (e) {
                console.error('Error loading consultations from localStorage for pre-invoice print:', e);
            }

            if (!consultation && Array.isArray(window.readyConsultationsCache)) {
                consultation = window.readyConsultationsCache.find(function (c) {
                    return c && String(c.id) === String(bill.consultationId);
                });
            }

            if (consultation) {
                createdAt = consultation.createdAt || consultation.date || createdAt;
                try {
                    const status = (consultation.paymentStatus || '').toLowerCase();
                    if (status === 'paid') {
                        paidAmount = totalAmount;
                    } else if (status === 'partial' || status === 'partially_paid') {
                        if (typeof consultation.partialPaymentAmount === 'number' && !isNaN(consultation.partialPaymentAmount)) {
                            paidAmount = consultation.partialPaymentAmount;
                        } else if (consultation.partialPaymentAmount !== undefined && consultation.partialPaymentAmount !== null && consultation.partialPaymentAmount !== '') {
                            const parsedPartial = Number(consultation.partialPaymentAmount);
                            if (!isNaN(parsedPartial)) {
                                paidAmount = parsedPartial;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error computing paid amount for pre-invoice from bill:', e);
                }
            }
        }

        if (!paidAmount || isNaN(paidAmount)) {
            paidAmount = 0;
        }

        const remainingAmount = Math.max(0, totalAmount - paidAmount);

        const pre = {
            consultationId: bill.consultationId || null,
            patientId: bill.patientId,
            patientName: bill.patientName || '',
            createdAt: createdAt,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount,
            subtotal: subtotal,
            taxAmount: taxAmount,
            items: Array.isArray(bill.items)
                ? bill.items.map(function (item) {
                    const basePrice = (function () {
                        if (typeof item.price === 'number' && !isNaN(item.price)) return item.price;
                        const parsed = Number(item.price || 0);
                        return isNaN(parsed) ? 0 : parsed;
                    })();
                    const qty = (typeof item.quantity === 'number' && !isNaN(item.quantity))
                        ? item.quantity
                        : (Number(item.quantity || 1) || 1);

                    const lineTotal = basePrice * qty;
                    const label = qty > 1
                        ? (item.description || '') + ' (x' + qty + ')'
                        : (item.description || '');

                    return {
                        name: label,
                        price: lineTotal
                    };
                })
                : []
        };

        const createdDate = new Date(pre.createdAt);
        const createdStr = isNaN(createdDate) ? '' : createdDate.toLocaleString();

        const lang = currentLanguage || 'fr';
        const t = (key, fallback) => {
            if (window.t) return window.t(key, fallback);
            return fallback || key;
        };

        let cabinetPhone = '';
        try {
            const s = getCabinetSettings && getCabinetSettings();
            if (s && s.phone && s.phone.trim()) {
                cabinetPhone = s.phone.trim();
            }
        } catch (e) { }

        const itemsHtml = (Array.isArray(pre.items) && pre.items.length > 0)
            ? pre.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td style="text-align:right;">${(item.price || 0).toFixed(2)} TND</td>
                        </tr>
                    `).join('')
            : `<tr><td colspan="2">${t('no_items', 'Aucun acte défini')}</td></tr>`;

        const html = `
                <!DOCTYPE html>
                <html lang="${lang}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${t('pre_invoice_title', 'Pré-facture')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
                        .printable-bill { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        .bill-header { display: flex; align-items: center; gap: 1rem; border-bottom: 3px solid #2563eb; padding-bottom: 1rem; margin-bottom: 2rem; }
                        .bill-header-text { display: flex; flex-direction: column; }
                        .bill-title { font-size: 2rem; font-weight: bold; color: #2563eb; margin-bottom: 0.5rem; }
                        .bill-subtitle { color: #666; font-size: 1.1rem; }
                        .bill-section { background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
                        .bill-section h3 { margin: 0 0 0.5rem 0; color: #2563eb; font-size: 1.1rem; }
                        table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
                        th, td { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
                        th { text-align: left; background: #eff6ff; }
                        .totals-row td { font-weight: bold; }
                        .text-right { text-align: right; }
                        .mt-4 { margin-top: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="printable-bill">
                        <div class="bill-header">
                            <div class="bill-header-text">
                                <div class="bill-title">${t('pre_invoice_title', 'Pré-facture')}</div>
                                <div class="bill-subtitle">${t('post_bill_subtitle', 'Document de pré-facturation (Non définitif)')}</div>
                            </div>
                        </div>

                        <div class="bill-section">
                            <h3>${t('patient_information', 'Informations patient')}</h3>
                            <p><strong>${t('patient', 'Patient')}:</strong> ${pre.patientName || ''}</p>
                            <p><strong>${t('consultation_date', 'Date de consultation')}:</strong> ${createdStr}</p>
                        </div>

                        <div class="bill-section">
                            <h3>${t('bill_items', 'Éléments de facture')}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>${t('description', 'Description')}</th>
                                        <th class="text-right">${t('price', 'Prix')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                        </div>

                        <div class="bill-section">
                            <h3>${t('bill_summary', 'Résumé de la facture')}</h3>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>${t('subtotal', 'Sous-total')}</td>
                                        <td class="text-right">${(pre.subtotal || 0).toFixed(2)} TND</td>
                                    </tr>
                                    <tr>
                                        <td>${t('tax_8_percent', 'Taxe (8%)')}</td>
                                        <td class="text-right">${(pre.taxAmount || 0).toFixed(2)} TND</td>
                                    </tr>
                                    <tr class="totals-row">
                                        <td>${t('total', 'Total')}</td>
                                        <td class="text-right">${(pre.totalAmount || 0).toFixed(2)} TND</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="bill-section">
                            <h3>${t('payment_status', 'Statut de paiement')}</h3>
                            <p><strong>${t('amount_paid', 'Montant payé')}:</strong> ${(pre.paidAmount || 0).toFixed(2)} TND</p>
                            <p><strong>${t('amount_remaining', 'Montant restant')}:</strong> ${(pre.remainingAmount || 0).toFixed(2)} TND</p>
                        </div>

                        <div class="mt-4" style="font-size: 0.85rem; color: #6b7280;">
                            ${t('pre_invoice_footer_notice', 'Ce document est une pré-facture et ne constitue pas une facture finale.')}<br>
                            ${cabinetPhone ? t('contact_phone', 'Téléphone du cabinet') + ': ' + cabinetPhone : ''}
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); };
                    <\/script>
                </body>
                </html>
            `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            console.error('Unable to open print window for pre-invoice bill');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    } catch (e) {
        console.error('Error printing pre-invoice from bill:', e);
    }
}

function viewConsultationDetails(consultationId) {
    try {
        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
        let c = consultations.find(x => String(x.id) === String(consultationId));

        // Fallback: use ready consultations loaded from API if not present in localStorage
        if (!c && Array.isArray(window.readyConsultationsCache)) {
            c = window.readyConsultationsCache.find(x => String(x.id) === String(consultationId));
        }

        if (!c) return;
        // Reuse existing detail modal when available
        const modal = document.getElementById('consultationDetailModal');
        const content = document.getElementById('consultationDetailContent');
        if (modal && content) {
            const patients = Array.isArray(storedPatients) ? storedPatients : [];
            const patient = patients.find(p => String(p.id) === String(c.patientId));
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
    } catch (e) {
        console.error('Error viewing consultation details:', e);
    }
}

function createBillFromConsultation(consultationId) {
    try {
        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
        const patients = Array.isArray(storedPatients) ? storedPatients : [];
        let c = consultations.find(x => String(x.id) === String(consultationId));

        // Fallback: use ready consultations loaded from API if not present in localStorage
        if (!c && Array.isArray(window.readyConsultationsCache)) {
            c = window.readyConsultationsCache.find(x => String(x.id) === String(consultationId));
        }

        if (!c) return;

        // Open billing modal and link this consultation
        if (typeof closeReadyBillsModal === 'function') {
            closeReadyBillsModal();
        }
        if (typeof showBillingModal === 'function') {
            showBillingModal();
        }

        // Store the consultation ID for linking the bill to this consultation
        const consultationIdField = document.getElementById('billConsultationId');
        if (consultationIdField) {
            consultationIdField.value = consultationId;
        }

        // Prefill patient on the billing form
        const patient = patients.find(p => String(p.id) === String(c.patientId));
        if (patient) {
            const billPatientIdInput = document.getElementById('billPatientId');
            if (billPatientIdInput) {
                billPatientIdInput.value = patient.id;
            }
            if (typeof handleBillPatientSelection === 'function') {
                setTimeout(() => {
                    handleBillPatientSelection();
                }, 100);
            }
        }

        // Fill bill items from consultation acts (one bill item per act)
        setTimeout(() => {
            try {
                const billItemsContainer = document.getElementById('billItems');
                if (!billItemsContainer) return;

                const rawActs = c.consultationAct || '';
                const actNames = rawActs
                    ? rawActs.split('|').map(s => s.trim()).filter(Boolean)
                    : [];

                if (actNames.length > 0) {
                    // Ensure there are at least as many bill items as acts
                    let existingItems = billItemsContainer.querySelectorAll('.bill-item').length;
                    while (existingItems < actNames.length) {
                        if (typeof addBillItem === 'function') {
                            addBillItem();
                        }
                        existingItems = billItemsContainer.querySelectorAll('.bill-item').length;
                    }

                    const descSelects = billItemsContainer.querySelectorAll('select[id^="itemDescription"]');
                    const qtyInputs = billItemsContainer.querySelectorAll('input[id^="itemQuantity"]');

                    actNames.forEach((actName, index) => {
                        const descSelect = descSelects[index];
                        if (descSelect) {
                            descSelect.value = actName;
                            if (typeof autoFillPrice === 'function') {
                                autoFillPrice(descSelect);
                            }
                        }

                        const qtyInput = qtyInputs[index];
                        if (qtyInput) {
                            qtyInput.value = 1;
                        }
                    });

                    if (typeof calculateBillTotal === 'function') {
                        calculateBillTotal();
                    }
                } else {
                    // Fallback: keep legacy behaviour when no acts are defined
                    const desc = document.getElementById('itemDescription1');
                    const qty = document.getElementById('itemQuantity1');
                    const price = document.getElementById('itemPrice1');

                    if (desc) {
                        const generalConsultOption = Array.from(desc.options).find(o => o.value === 'General Consultation');
                        if (generalConsultOption) {
                            desc.value = 'General Consultation';
                            if (typeof autoFillPrice === 'function') autoFillPrice(desc);
                        }
                    }
                    if (qty) qty.value = 1;
                    if (price && !price.value) price.value = 50;
                    if (typeof calculateBillTotal === 'function') calculateBillTotal();
                }
            } catch (e) {
                console.error('Error pre-filling bill from consultation acts:', e);
            }
        }, 250);
    } catch (e) {
        console.error('Error creating bill from consultation:', e);
    }
}

function createPreInvoiceFromConsultation(consultationId) {
    try {
        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
        const patients = Array.isArray(storedPatients) ? storedPatients : [];
        let c = consultations.find(x => String(x.id) === String(consultationId));

        if (!c && Array.isArray(window.readyConsultationsCache)) {
            c = window.readyConsultationsCache.find(x => String(x.id) === String(consultationId));
        }

        if (!c) return;

        const patient = patients.find(p => String(p.id) === String(c.patientId));

        const amountInfo = (function () {
            // Reuse the same billing logic to compute subtotal, tax and total with tax,
            // as well as a list of line items for display in the pre-invoice modal.
            let subtotal = 0;
            let taxAmount = 0;
            let totalAmount = 0;
            let lineItems = [];
            try {
                const rawActs = c.consultationAct || '';
                const actNames = rawActs
                    ? rawActs.split('|').map(s => s.trim()).filter(Boolean)
                    : [];
                const hasActs = actNames.length > 0;
                let amount = null;

                if (hasActs && typeof window.getBillDescriptions === 'function') {
                    const descriptions = window.getBillDescriptions();
                    if (Array.isArray(descriptions)) {
                        actNames.forEach(actName => {
                            const match = descriptions.find(d => d && d.name === actName);
                            if (match) {
                                const price = typeof match.price === 'number' ? match.price : Number(match.price || 0);
                                if (!isNaN(price)) {
                                    if (amount === null) amount = 0;
                                    amount += price;
                                    lineItems.push({ name: actName, price });
                                }
                            }
                        });
                    }
                }

                if (amount === null && typeof c.consultationAmount === 'number' && !isNaN(c.consultationAmount)) {
                    amount = c.consultationAmount;
                }

                if (!hasActs && amount === null) {
                    amount = 0;
                }

                if (amount !== null) {
                    const taxRate = 0.08;
                    subtotal = amount;
                    totalAmount = amount + (amount * taxRate);
                    taxAmount = totalAmount - subtotal;
                }
            } catch (e) {
                console.error('Error computing consultation amount for pre-invoice:', e);
            }

            let paidAmount = 0;
            try {
                const status = (c.paymentStatus || '').toLowerCase();
                if (status === 'paid') {
                    paidAmount = totalAmount;
                } else if (status === 'partial' || status === 'partially_paid') {
                    if (typeof c.partialPaymentAmount === 'number' && !isNaN(c.partialPaymentAmount)) {
                        paidAmount = c.partialPaymentAmount;
                    } else if (c.partialPaymentAmount !== undefined && c.partialPaymentAmount !== null && c.partialPaymentAmount !== '') {
                        const parsedPartial = Number(c.partialPaymentAmount);
                        if (!isNaN(parsedPartial)) {
                            paidAmount = parsedPartial;
                        }
                    }
                }
            } catch (e) {
                console.error('Error computing paid amount for pre-invoice:', e);
            }

            const remainingAmount = Math.max(0, totalAmount - paidAmount);
            return { totalAmount, paidAmount, remainingAmount, subtotal, taxAmount, lineItems };
        })();

        const modal = document.getElementById('preInvoiceModal');
        if (!modal) {
            console.error('preInvoiceModal not found in DOM');
            return;
        }

        const nameSpan = document.getElementById('preInvoicePatientName');
        const dateSpan = document.getElementById('preInvoiceConsultationDate');
        const itemsContainer = document.getElementById('preInvoiceItemsContainer');
        const subtotalSpan = document.getElementById('preInvoiceSubtotal');
        const taxSpan = document.getElementById('preInvoiceTax');
        const totalSummarySpan = document.getElementById('preInvoiceTotalSummary');
        const paidSpan = document.getElementById('preInvoicePaid');
        const remainingSpan = document.getElementById('preInvoiceRemaining');

        if (nameSpan) nameSpan.textContent = patient ? (patient.fullName || patient.name || '-') : (c.patientName || c.patientFullName || '-');

        try {
            const created = new Date(c.createdAt || c.date);
            dateSpan && (dateSpan.textContent = isNaN(created) ? '-' : created.toLocaleString());
        } catch {
            if (dateSpan) dateSpan.textContent = '-';
        }

        if (itemsContainer) {
            if (Array.isArray(amountInfo.lineItems) && amountInfo.lineItems.length > 0) {
                itemsContainer.innerHTML = amountInfo.lineItems.map(item => `
                            <div class="flex justify-between">
                                <span>${item.name}</span>
                                <span>${item.price.toFixed(2)} TND</span>
                            </div>
                        `).join('');
            } else {
                itemsContainer.innerHTML = '<p class="text-gray-500" data-translate="no_items">Aucun acte défini</p>';
            }
        }

        if (subtotalSpan) subtotalSpan.textContent = amountInfo.subtotal.toFixed(2) + ' TND';
        if (taxSpan) taxSpan.textContent = amountInfo.taxAmount.toFixed(2) + ' TND';
        if (totalSummarySpan) totalSummarySpan.textContent = amountInfo.totalAmount.toFixed(2) + ' TND';
        if (paidSpan) paidSpan.textContent = amountInfo.paidAmount.toFixed(2) + ' TND';
        if (remainingSpan) remainingSpan.textContent = amountInfo.remainingAmount.toFixed(2) + ' TND';

        // Persist info for printing/export
        window.currentPreInvoice = {
            consultationId: c.id,
            patientId: c.patientId,
            patientName: nameSpan ? nameSpan.textContent : '',
            createdAt: c.createdAt || c.date || new Date().toISOString(),
            totalAmount: amountInfo.totalAmount,
            paidAmount: amountInfo.paidAmount,
            remainingAmount: amountInfo.remainingAmount,
            subtotal: amountInfo.subtotal,
            taxAmount: amountInfo.taxAmount,
            items: amountInfo.lineItems
        };

        modal.classList.add('active');
        if (window.I18n && window.I18n.walkAndTranslate) {
            window.I18n.walkAndTranslate();
        }
    } catch (e) {
        console.error('Error creating pre-invoice from consultation:', e);
    }
}

function savePreInvoiceAsBill(pre) {
    try {
        if (!pre || !pre.consultationId) {
            return;
        }

        const patients = Array.isArray(window.storedPatients) ? window.storedPatients : [];
        const patient = patients.find(function (p) {
            return p && String(p.id) === String(pre.patientId);
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const billId = 'pre-' + String(pre.consultationId);

        const billItems = Array.isArray(pre.items)
            ? pre.items.map(function (item) {
                const priceNumber = typeof item.price === 'number' ? item.price : Number(item.price || 0);
                return {
                    description: item.name || '',
                    quantity: 1,
                    price: isNaN(priceNumber) ? 0 : priceNumber
                };
            })
            : [];

        const bill = {
            id: billId,
            patientId: pre.patientId || (patient ? patient.id : ''),
            patientName: pre.patientName || (patient ? (patient.fullName || patient.name || '') : ''),
            patientEmail: patient ? (patient.email || '') : '',
            patientPhone: patient ? (patient.phone || '') : '',
            billDate: todayStr,
            dueDate: todayStr,
            items: billItems,
            subtotal: pre.subtotal || 0,
            tax: pre.taxAmount || 0,
            total: pre.totalAmount || 0,
            notes: 'Pre-invoice',
            status: 'PreInvoice',
            consultationId: pre.consultationId || null,
            createdAt: pre.createdAt || new Date().toISOString()
        };

        // Backend requires a patient id and dates; if missing, skip persistence
        if (!bill.patientId) {
            console.warn('Skipping pre-invoice persistence because patientId is missing');
            return;
        }

        if (typeof syncBillToDatabase === 'function') {
            syncBillToDatabase(bill);
        }

        // Keep a local copy so Done Bills can show it even before the next API refresh
        try {
            const existingBills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const index = existingBills.findIndex(function (b) { return b && b.id === bill.id; });
            if (index === -1) {
                existingBills.push(bill);
            } else {
                existingBills[index] = bill;
            }
            localStorage.setItem('healthcareBills', JSON.stringify(existingBills));
        } catch (cacheErr) {
            console.error('Error caching pre-invoice bill locally:', cacheErr);
        }
    } catch (e) {
        console.error('Error saving pre-invoice as bill:', e);
    }
}

function printPreInvoiceModal() {
    try {
        const pre = window.currentPreInvoice;
        if (!pre) {
            console.warn('No current pre-invoice data available to print');
            return;
        }

        // Persist pre-invoice as a bill so it appears in the Done Bills list
        savePreInvoiceAsBill(pre);

        const preInvoiceModal = document.getElementById('preInvoiceModal');
        if (preInvoiceModal) {
            preInvoiceModal.classList.remove('active');
        }

        const createdDate = new Date(pre.createdAt);
        const createdStr = isNaN(createdDate) ? '' : createdDate.toLocaleString();

        const lang = currentLanguage || 'fr';
        const t = (key, fallback) => {
            if (window.t) return window.t(key, fallback);
            return fallback || key;
        };

        let cabinetPhone = '';
        try {
            const s = getCabinetSettings && getCabinetSettings();
            if (s && s.phone && s.phone.trim()) {
                cabinetPhone = s.phone.trim();
            }
        } catch (e) { }

        const itemsHtml = (Array.isArray(pre.items) && pre.items.length > 0)
            ? pre.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td style="text-align:right;">${(item.price || 0).toFixed(2)} TND</td>
                        </tr>
                    `).join('')
            : `<tr><td colspan="2">${t('no_items', 'Aucun acte défini')}</td></tr>`;

        const html = `
                <!DOCTYPE html>
                <html lang="${lang}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${t('pre_invoice_title', 'Pré-facture')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
                        .printable-bill { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        .bill-header { display: flex; align-items: center; gap: 1rem; border-bottom: 3px solid #2563eb; padding-bottom: 1rem; margin-bottom: 2rem; }
                        .bill-header-text { display: flex; flex-direction: column; }
                        .bill-title { font-size: 2rem; font-weight: bold; color: #2563eb; margin-bottom: 0.5rem; }
                        .bill-subtitle { color: #666; font-size: 1.1rem; }
                        .bill-section { background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
                        .bill-section h3 { margin: 0 0 0.5rem 0; color: #2563eb; font-size: 1.1rem; }
                        table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
                        th, td { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
                        th { text-align: left; background: #eff6ff; }
                        .totals-row td { font-weight: bold; }
                        .text-right { text-align: right; }
                        .mt-4 { margin-top: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="printable-bill">
                        <div class="bill-header">
                            <div class="bill-header-text">
                                <div class="bill-title">${t('pre_invoice_title', 'Pré-facture')}</div>
                                <div class="bill-subtitle">${t('post_bill_subtitle', 'Document de pré-facturation (Non définitif)')}</div>
                            </div>
                        </div>

                        <div class="bill-section">
                            <h3>${t('patient_information', 'Informations patient')}</h3>
                            <p><strong>${t('patient', 'Patient')}:</strong> ${pre.patientName || ''}</p>
                            <p><strong>${t('consultation_date', 'Date de consultation')}:</strong> ${createdStr}</p>
                        </div>

                        <div class="bill-section">
                            <h3>${t('bill_items', 'Éléments de facture')}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>${t('description', 'Description')}</th>
                                        <th class="text-right">${t('price', 'Prix')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                        </div>

                        <div class="bill-section">
                            <h3>${t('bill_summary', 'Résumé de la facture')}</h3>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>${t('subtotal', 'Sous-total')}</td>
                                        <td class="text-right">${(pre.subtotal || 0).toFixed(2)} TND</td>
                                    </tr>
                                    <tr>
                                        <td>${t('tax_8_percent', 'Taxe (8%)')}</td>
                                        <td class="text-right">${(pre.taxAmount || 0).toFixed(2)} TND</td>
                                    </tr>
                                    <tr class="totals-row">
                                        <td>${t('total', 'Total')}</td>
                                        <td class="text-right">${(pre.totalAmount || 0).toFixed(2)} TND</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="bill-section">
                            <h3>${t('payment_status', 'Statut de paiement')}</h3>
                            <p><strong>${t('amount_paid', 'Montant payé')}:</strong> ${(pre.paidAmount || 0).toFixed(2)} TND</p>
                            <p><strong>${t('amount_remaining', 'Montant restant')}:</strong> ${(pre.remainingAmount || 0).toFixed(2)} TND</p>
                        </div>

                        <div class="mt-4" style="font-size: 0.85rem; color: #6b7280;">
                            ${t('pre_invoice_footer_notice', 'Ce document est une pré-facture et ne constitue pas une facture finale.')}<br>
                            ${cabinetPhone ? t('contact_phone', 'Téléphone du cabinet') + ': ' + cabinetPhone : ''}
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); };
                    </script>
                </body>
                </html>
            `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            console.error('Unable to open print window for pre-invoice');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    } catch (e) {
        console.error('Error printing pre-invoice:', e);
    }
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

function syncUserToDatabase(user) {
    try {
        if (!user || !user.id || !user.username) return;

        const payload = {
            id: user.id,
            username: user.username,
            password: user.password || '',
            role: user.role || '',
            name: user.name || '',
            email: (user.email || '').toLowerCase(),
            status: user.status || 'active',
            // Store permissions as JSON string for the API/table
            permissions: JSON.stringify(user.permissions || {}),
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/user_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('User sync failed:', res.status, data || (await res.text?.()));
                    return;
                }
                console.log('User sync success:', data);
            })
            .catch(err => {
                console.error('User sync error:', err);
            });
    } catch (e) {
        console.error('User sync exception:', e);
    }
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

async function fetchUsersFromAPI() {
    try {
        const res = await fetch('api/get_users.php');
        let data;
        try { data = await res.json(); } catch (_) { data = null; }
        if (!res.ok || !data || data.status !== 'ok' || !Array.isArray(data.users)) {
            console.warn('get_users API returned unexpected response:', res.status, data);
            return;
        }

        const dbUsers = data.users.map(u => ({
            id: u.id,
            username: u.username || '',
            password: u.password || '',
            role: u.role || '',
            name: u.name || '',
            email: (u.email || '').toLowerCase(),
            status: u.status || 'active',
            permissions: u.permissions && typeof u.permissions === 'object' ? u.permissions : {},
            createdAt: u.createdAt || null,
            updatedAt: u.updatedAt || null
        }));

        if (!dbUsers.length) return;

        saveSystemUsers(dbUsers);

        // If user management modal is open, refresh list
        const userModal = document.getElementById('userManagementModal');
        if (userModal && userModal.classList.contains('active')) {
            renderUsersList();
        }
    } catch (e) {
        console.error('Failed to fetch users from API:', e);
    }
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

    // Also remove from backend database
    if (typeof deleteUserFromDatabase === 'function') {
        deleteUserFromDatabase(userId);
    }

    const successMessage = translations[currentLanguage].user_deleted || 'User deleted successfully!';
    showTranslatedAlert('user_deleted', successMessage);
}

// ========================================
// Cabinet Settings Functions
// ========================================

function getCabinetSettings() {
    // If we already have an in-memory cache, return it immediately
    if (window.cabinetSettingsCache) {
        return window.cabinetSettingsCache;
    }

    // Default structure
    const defaultSettings = {
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

    // Start with whatever was last cached in localStorage
    let local = null;
    try {
        const stored = localStorage.getItem('cabinet_settings');
        if (stored) {
            local = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading cabinet settings from localStorage:', e);
    }

    if (!local) {
        local = defaultSettings;
    }

    // Asynchronously refresh from API and update cache/localStorage
    try {
        fetch('api/get_cabinet_settings.php')
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Failed to load cabinet settings from API:', res.status, data || await res.text());
                    return;
                }

                if (!data.cabinet) {
                    return; // nothing stored yet in DB
                }

                const c = data.cabinet;

                let timetable = defaultSettings.timetable;
                if (c.workingHours) {
                    try {
                        const parsed = JSON.parse(c.workingHours);
                        if (parsed && typeof parsed === 'object') {
                            timetable = Object.assign({}, defaultSettings.timetable, parsed);
                        }
                    } catch (e) {
                        console.error('Error parsing workingHours JSON from API:', e);
                    }
                }

                const settingsFromDb = {
                    id: c.id || 'cabinet-default',
                    name: c.name || '',
                    address: c.address || '',
                    phone: c.phone || '',
                    logo: c.logoPath || null,
                    timetable: timetable,
                    createdAt: c.createdAt || null,
                    updatedAt: c.updatedAt || null
                };

                try {
                    localStorage.setItem('cabinet_settings', JSON.stringify(settingsFromDb));
                } catch (e) {
                    console.error('Error saving cabinet settings to localStorage:', e);
                }

                window.cabinetSettingsCache = settingsFromDb;

                // If the modal is open, immediately update form fields from DB
                if (typeof applyCabinetSettingsToForm === 'function') {
                    try { applyCabinetSettingsToForm(settingsFromDb); } catch (e) { }
                }

                // Refresh cabinet info display if function exists
                if (window.updateCabinetInfo) {
                    try { window.updateCabinetInfo(); } catch (e) { }
                }
            })
            .catch(err => {
                console.error('Error fetching cabinet settings from API:', err);
            });
    } catch (e) {
        console.error('Exception while fetching cabinet settings from API:', e);
    }

    window.cabinetSettingsCache = local;
    return local;
}

function saveCabinetSettings(settings) {
    localStorage.setItem('cabinet_settings', JSON.stringify(settings));
    // Refresh cabinet info display after saving
    if (window.updateCabinetInfo) {
        window.updateCabinetInfo();
    }
}

function closeCabinetSettings() {
    const modal = document.getElementById('cabinetSettingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function toggleDaySchedule(day) {
    const enabledCheckbox = document.getElementById(`${day}_enabled`);
    const openInput = document.getElementById(`${day}_open`);
    const closeInput = document.getElementById(`${day}_close`);

    if (!enabledCheckbox) return;
    const isEnabled = !!enabledCheckbox.checked;

    if (openInput) openInput.disabled = !isEnabled;
    if (closeInput) closeInput.disabled = !isEnabled;
}

function handleLogoUpload(input) {
    if (!input || !input.files || !input.files.length) return;
    const file = input.files[0];

    // Basic size guard: skip very large files (e.g. > 5MB)
    if (file.size > 5 * 1024 * 1024) {
        if (typeof showTranslatedAlert === 'function') {
            showTranslatedAlert('file_too_large', `Logo file is too large. Maximum size is 5MB.`);
        } else {
            alert('Logo file is too large. Maximum size is 5MB.');
        }
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const dataUrl = e.target && e.target.result;
        if (!dataUrl) return;

        const preview = document.getElementById('logoPreview');
        if (!preview) return;

        let img = preview.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            img.alt = 'Cabinet Logo';
            img.style.maxWidth = '80px';
            img.style.maxHeight = '80px';
            img.style.objectFit = 'contain';
            preview.innerHTML = '';
            preview.appendChild(img);
        }
        img.src = dataUrl;
    };

    reader.onerror = function () {
        if (typeof showTranslatedAlert === 'function') {
            showTranslatedAlert('file_upload_error', 'Error reading logo file.');
        } else {
            alert('Error reading logo file.');
        }
    };

    reader.readAsDataURL(file);
}

function syncCabinetSettingsToDatabase(settings) {
    try {
        if (!settings || !settings.name) return;

        const payload = {
            id: settings.id || 'cabinet-default',
            name: settings.name || '',
            address: settings.address || '',
            phone: settings.phone || '',
            logoPath: settings.logo || null,
            workingHours: JSON.stringify(settings.timetable || {}),
            createdAt: settings.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/cabinet-settings_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Cabinet settings sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Cabinet settings sync success:', data);
            })
            .catch(err => {
                console.error('Cabinet settings sync error:', err);
            });
    } catch (e) {
        console.error('Cabinet settings sync exception:', e);
    }
}

function loadCabinetSettingsForm() {
    // Get the best-known settings (local cache and async API refresh)
    const settings = getCabinetSettings();
    // Immediately apply whatever we have locally; API callback in
    // getCabinetSettings will re-apply fresher data when it arrives.
    applyCabinetSettingsToForm(settings);
}

function showCabinetSettingsModal() {
    const modal = document.getElementById('cabinetSettingsModal');
    modal.classList.add('active');

    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');

    // Load existing settings (cache immediately, DB as soon as it returns)
    loadCabinetSettingsForm();
    updateModalTranslations();
}

function applyCabinetSettingsToForm(settings) {

    if (!settings) return;

    const nameInput = document.getElementById('cabinetName');
    const addressInput = document.getElementById('cabinetAddress');
    const phoneInput = document.getElementById('cabinetPhone');

    // If modal/form is not present (e.g. not open), do nothing
    if (!nameInput || !addressInput || !phoneInput) return;

    // Load basic info
    nameInput.value = settings.name || '';
    addressInput.value = settings.address || 'Tunis, Tunisia';
    phoneInput.value = settings.phone || '00 000 000';
    window.updateCabinetInfo();
}


function syncCabinetSettingsToDatabase(settings) {
    try {
        if (!settings || !settings.name) return;

        const payload = {
            id: settings.id || 'cabinet-default',
            name: settings.name || '',
            address: settings.address || '',
            phone: settings.phone || '',
            logoPath: settings.logo || null,
            workingHours: JSON.stringify(settings.timetable || {}),
            createdAt: settings.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/cabinet-settings_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Cabinet settings sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Cabinet settings sync success:', data);
            })
            .catch(err => {
                console.error('Cabinet settings sync error:', err);
            });
    } catch (e) {
        console.error('Cabinet settings sync exception:', e);
    }
}

function showCabinetSettingsModal() {
    const modal = document.getElementById('cabinetSettingsModal');
    modal.classList.add('active');

    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');

    // Load existing settings (cache immediately, DB as soon as it returns)
    loadCabinetSettingsForm();
    updateModalTranslations();
}

function applyCabinetSettingsToForm(settings) {
    if (!settings) return;

    const nameInput = document.getElementById('cabinetName');
    const addressInput = document.getElementById('cabinetAddress');
    const phoneInput = document.getElementById('cabinetPhone');

    // If modal/form is not present (e.g. not open), do nothing
    if (!nameInput || !addressInput || !phoneInput) return;

    // Load basic info
    nameInput.value = settings.name || '';
    addressInput.value = settings.address || 'Tunis, Tunisia';
    phoneInput.value = settings.phone || '00 000 000';

    // Load logo
    if (settings.logo) {
        if (typeof displayLogoPreview === 'function') {
            displayLogoPreview(settings.logo);
        } else {
            const preview = document.getElementById('logoPreview');
            if (preview) {
                let img = preview.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    img.alt = 'Cabinet Logo';
                    img.style.maxWidth = '80px';
                    img.style.maxHeight = '80px';
                    img.style.objectFit = 'contain';
                    preview.innerHTML = '';
                    preview.appendChild(img);
                }

                const logoSrc = settings.logo;
                const looksValid = (
                    /^data:image\//.test(logoSrc) ||
                    /^https?:\/\//.test(logoSrc) ||
                    logoSrc.startsWith('/')
                );

                if (looksValid) {
                    img.src = logoSrc;
                } else {
                    console.warn('Cabinet logo value does not look like a valid image URL:', logoSrc);
                }
            }
        }
    }
}

// Load bill/service descriptions with database as source of truth.
// Always fetch from get_bill_descriptions.php; use in-memory cache only (no localStorage dependency).
function getBillDescriptions() {
    if (!Array.isArray(window.billDescriptionsCache)) {
        window.billDescriptionsCache = [];
    }

    // Always refresh from API (database is source of truth), but avoid parallel fetches
    if (!window.billDescriptionsFetchInProgress) {
        window.billDescriptionsFetchInProgress = true;
        try {
            fetch('api/get_bill_descriptions.php')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch bill descriptions');
                    return res.json();
                })
                .then(data => {
                    if (data && data.status === 'ok' && Array.isArray(data.services)) {
                        const descriptions = data.services.map(s => ({
                            id: s.id,
                            name: s.name,
                            price: typeof s.defaultPrice === 'number' ? s.defaultPrice : Number(s.defaultPrice) || 0,
                            notes: s.notes || '',
                            createdAt: s.createdAt || '',
                            updatedAt: s.updatedAt || ''
                        }));

                        window.billDescriptionsCache = descriptions;

                        // Re-render settings UI if open
                        if (typeof renderBillDescriptionsList === 'function') {
                            renderBillDescriptionsList();
                        }

                        // Refresh consultation act dropdown if present
                        if (typeof window.populateConsultationActSelect === 'function') {
                            window.populateConsultationActSelect();
                        }
                    } else {
                        console.warn('get_bill_descriptions.php returned no services');
                        window.billDescriptionsCache = [];
                    }
                })
                .catch(err => {
                    console.error('Error fetching bill descriptions from API:', err);
                })
                .finally(() => {
                    window.billDescriptionsFetchInProgress = false;
                });
        } catch (e) {
            console.error('Exception while fetching bill descriptions from API:', e);
            window.billDescriptionsFetchInProgress = false;
        }
    }

    // Always return the in-memory cache; it will be updated when the API call completes.
    return window.billDescriptionsCache;
}

function saveBillDescriptions(descriptions) {
    try {
        window.billDescriptionsCache = Array.isArray(descriptions) ? descriptions : [];
    } catch (e) {
        console.error('Error updating bill descriptions cache:', e);
    }
}

// Sync a single bill description (service) to backend via bill_description_sync.php
function syncBillDescriptionToDatabase(desc) {
    try {
        if (!desc || desc.id === undefined || desc.id === null) return;

        const payload = {
            id: String(desc.id),
            name: desc.name || '',
            defaultPrice: Number(desc.price) || 0,
            notes: desc.notes || '',
            createdAt: desc.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/bill_description_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Bill description sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Bill description sync success:', data);

                // After a successful sync, reload bill descriptions from API
                // so the UI (existing services list and consultation acts)
                // reflects the latest database state.
                if (typeof getBillDescriptions === 'function') {
                    getBillDescriptions();
                }
            })
            .catch(err => {
                console.error('Bill description sync error:', err);
            });
    } catch (e) {
        console.error('Bill description sync exception:', e);
    }
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
                        <button onclick="editBillDescription('${desc.id}')" class="btn btn-sm btn-outline">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            <span data-translate="edit">${translations[currentLanguage].edit || 'Edit'}</span>
                        </button>
                        <button onclick="deleteBillDescription('${desc.id}')" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">
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
    const desc = descriptions.find(d => String(d.id) === String(id));
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

    // Call backend to delete from database
    try {
        fetch('api/delete_bill_description.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: String(id) })
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Failed to delete bill description from database:', res.status, data || await res.text());
                    return;
                }

                console.log('Bill description deleted from database:', data);

                if (typeof getBillDescriptions === 'function') {
                    getBillDescriptions();
                } else {
                    const current = Array.isArray(window.billDescriptionsCache) ? window.billDescriptionsCache : [];
                    const filtered = current.filter(d => String(d.id) !== String(id));
                    if (typeof saveBillDescriptions === 'function') {
                        saveBillDescriptions(filtered);
                    } else {
                        window.billDescriptionsCache = filtered;
                    }
                    if (typeof renderBillDescriptionsList === 'function') {
                        renderBillDescriptionsList();
                    }
                    if (typeof window.populateConsultationActSelect === 'function') {
                        window.populateConsultationActSelect();
                    }
                }

                const successMessage = translations[currentLanguage].service_deleted || 'Service deleted successfully!';
                showTranslatedAlert('service_deleted', successMessage);
            })
            .catch(err => {
                console.error('Error calling delete_bill_description API:', err);
            });
    } catch (e) {
        console.error('Exception while deleting bill description from database:', e);
    }
}

// ========================================
// Medicines Management Functions
// ========================================

function getMedicines() {

    // If we already have an in-memory cache, return it immediately
    if (Array.isArray(window.medicinesCache)) {
        return window.medicinesCache;
    }

    // Start with localStorage as a fast cache
    let local = [];
    try {
        const stored = localStorage.getItem('medicines');
        if (stored) {
            local = JSON.parse(stored) || [];
        }
    } catch (e) {
        console.error('Error reading medicines from localStorage:', e);
        local = [];
    }

    // Asynchronously refresh from API and update cache/localStorage
    try {
        fetch('api/get_medicines.php')
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Failed to load medicines from API:', res.status, data || await res.text());
                    return;
                }

                const apiMeds = Array.isArray(data.medicines) ? data.medicines : [];

                // Normalise to the structure used in the UI (id may be numeric or string)
                window.medicinesCache = apiMeds.map(m => ({
                    id: isNaN(m.id) ? m.id : Number(m.id),
                    name: m.name || '',
                    dosage: m.dosage || '',
                    notes: m.notes || '',
                    createdAt: m.createdAt || null,
                    updatedAt: m.updatedAt || null
                }));

                // Persist to localStorage for offline/next-load usage
                saveMedicines(window.medicinesCache);

                // Re-render lists/dropdowns that depend on medicines
                try { renderMedicinesList(); } catch (e) { }
                try { updatePrescriptionMedicineDropdown(); } catch (e) { }
            })
            .catch(err => {
                console.error('Error fetching medicines from API:', err);
            });
    } catch (e) {
        console.error('Exception while fetching medicines from API:', e);
    }

    // Use local cache for this call; will be updated once API returns
    window.medicinesCache = local;
    return local;
}

// Persist medicines to localStorage and keep in-memory cache in sync
function saveMedicines(medicines) {
    try {
        localStorage.setItem('medicines', JSON.stringify(medicines || []));
        window.medicinesCache = Array.isArray(medicines) ? medicines : [];
    } catch (e) {
        console.error('Error saving medicines to localStorage:', e);
    }
}

// Sync a single medicine to backend database via medicine_sync.php
function syncMedicineToDatabase(medicine) {
    try {
        if (!medicine || medicine.id === undefined || medicine.id === null) return;

        const payload = {
            id: String(medicine.id),
            name: medicine.name || '',
            dosage: medicine.dosage || '',
            notes: medicine.notes || '',
            createdAt: medicine.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetch('api/medicine_sync.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Medicine sync failed:', res.status, data || await res.text());
                    return;
                }
                console.log('Medicine sync success:', data);
            })
            .catch(err => {
                console.error('Medicine sync error:', err);
            });
    } catch (e) {
        console.error('Medicine sync exception:', e);
    }
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
                        <button onclick="editMedicine('${med.id}')" class="btn btn-sm btn-outline">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            <span data-translate="edit">${window.t ? window.t('edit', 'Edit') : 'Edit'}</span>
                        </button>
                        <button onclick="deleteMedicine('${med.id}')" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">
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
window.editMedicine = function (id) {
    const medicines = getMedicines();
    const med = medicines.find(m => String(m.id) === String(id));
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

window.deleteMedicine = function (id) {
    const confirmMessage = window.t ? window.t('confirm_delete_medicine', 'Are you sure you want to delete this medicine?') : 'Are you sure you want to delete this medicine?';
    if (!confirm(confirmMessage)) return;

    const medicines = getMedicines();
    const filtered = medicines.filter(m => String(m.id) !== String(id));
    saveMedicines(filtered);

    // Call backend to delete from database
    try {
        fetch('api/delete_medicine.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: String(id) })
        })
            .then(async res => {
                let data;
                try { data = await res.json(); } catch (_) { data = null; }
                if (!res.ok || !data || data.status !== 'ok') {
                    console.error('Failed to delete medicine from database:', res.status, data || await res.text());
                } else {
                    console.log('Medicine deleted from database:', data);
                }
            })
            .catch(err => {
                console.error('Error calling delete_medicine API:', err);
            });
    } catch (e) {
        console.error('Exception while deleting medicine from database:', e);
    }

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

    const unpaidPatientsMonth = document.getElementById('unpaidPatientsMonth');
    const unpaidPatientsYear = document.getElementById('unpaidPatientsYear');
    if (unpaidPatientsMonth) unpaidPatientsMonth.value = String(today.getMonth());
    if (unpaidPatientsYear) unpaidPatientsYear.value = String(today.getFullYear());

    const inProgressPaymentsMonth = document.getElementById('inProgressPaymentsMonth');
    const inProgressPaymentsYear = document.getElementById('inProgressPaymentsYear');
    if (inProgressPaymentsMonth) inProgressPaymentsMonth.value = String(today.getMonth());
    if (inProgressPaymentsYear) inProgressPaymentsYear.value = String(today.getFullYear());

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

    const unpaidPatientsContent = document.getElementById('unpaidPatientsContent');
    const inProgressPaymentsContent = document.getElementById('inProgressPaymentsContent');

    const dailyTab = document.getElementById('dailyReportTab');
    const weeklyTab = document.getElementById('weeklyReportTab');
    const monthlyTab = document.getElementById('monthlyReportTab');

    const unpaidPatientsTab = document.getElementById('unpaidPatientsTab');
    const inProgressPaymentsTab = document.getElementById('inProgressPaymentsTab');

    // Hide all content
    dailyContent.style.display = 'none';
    weeklyContent.style.display = 'none';
    monthlyContent.style.display = 'none';

    if (unpaidPatientsContent) unpaidPatientsContent.style.display = 'none';
    if (inProgressPaymentsContent) inProgressPaymentsContent.style.display = 'none';

    // Reset all tabs
    dailyTab.className = 'btn btn-secondary';
    weeklyTab.className = 'btn btn-secondary';
    monthlyTab.className = 'btn btn-secondary';

    if (unpaidPatientsTab) unpaidPatientsTab.className = 'btn btn-secondary';
    if (inProgressPaymentsTab) inProgressPaymentsTab.className = 'btn btn-secondary';

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
    } else if (tab === 'unpaidPatients' && unpaidPatientsContent && unpaidPatientsTab) {
        unpaidPatientsContent.style.display = 'block';
        unpaidPatientsTab.className = 'btn btn-primary';
        if (typeof renderUnpaidPatientsReport === 'function') {
            renderUnpaidPatientsReport();
        }
    } else if (tab === 'inProgressPayments' && inProgressPaymentsContent && inProgressPaymentsTab) {
        inProgressPaymentsContent.style.display = 'block';
        inProgressPaymentsTab.className = 'btn btn-primary';
        if (typeof renderInProgressPaymentsReport === 'function') {
            renderInProgressPaymentsReport();
        }
    }
}

function initializeYearsDropdown() {
    const currentYear = new Date().getFullYear();
    const yearSelects = [
        document.getElementById('monthlyReportYear'),
        document.getElementById('unpaidPatientsYear'),
        document.getElementById('inProgressPaymentsYear')
    ].filter(function (el) { return !!el; });

    // Add years from 5 years ago to current year
    yearSelects.forEach(function (yearSelect) {
        yearSelect.innerHTML = '';
        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    });
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

function normalizeConsultationPaymentStatusForReports(consultation) {
    const rawStatus = (consultation.paymentStatus || '').toLowerCase();
    const hasAct = !!(consultation.consultationAct && String(consultation.consultationAct).trim());
    let normalizedStatus = 'unpaid';

    if (!hasAct) {
        normalizedStatus = 'paid';
    } else if (rawStatus === 'paid') {
        normalizedStatus = 'paid';
    } else if (rawStatus === 'partial' || rawStatus === 'partially_paid') {
        normalizedStatus = 'partial';
    }

    return normalizedStatus;
}

function buildConsultationPaymentRowForReports(consultation, patients) {
    const patient = patients.find(function (p) {
        if (!p) return false;
        return String(p.id) === String(consultation.patientId);
    });

    let patientName = consultation.patientName || consultation.patientFullName || '';
    if (!patientName && patient) {
        patientName = patient.fullName || patient.name || '';
    }
    if (!patientName && consultation.patient && typeof consultation.patient === 'object') {
        patientName = consultation.patient.fullName || consultation.patient.name || '';
    }
    if (!patientName) {
        patientName = 'Unknown Patient';
    }

    const normalizedStatus = normalizeConsultationPaymentStatusForReports(consultation);

    const paymentStatusLabel = (function () {
        if (normalizedStatus === 'paid') {
            return window.t ? window.t('paid_status', 'Paid') : 'Paid';
        }
        if (normalizedStatus === 'partial') {
            return window.t ? window.t('partially_paid_status', 'Partially Paid') : 'Partially Paid';
        }
        return window.t ? window.t('unpaid_status', 'Unpaid') : 'Unpaid';
    })();

    const paymentStatusClass = normalizedStatus === 'paid'
        ? 'bg-green-100 text-green-800'
        : (normalizedStatus === 'partial'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800');

    const created = new Date(consultation.createdAt || consultation.date);
    const dateStr = isNaN(created) ? '' : created.toLocaleString();

    let consultationAmountLabel = '-';
    let numericAmount = null;
    try {
        const rawActs = consultation.consultationAct || '';
        const actNames = rawActs
            ? rawActs.split('|').map(function (s) { return s.trim(); }).filter(function (v) { return v; })
            : [];
        const hasActs = actNames.length > 0;
        let amount = null;

        if (hasActs && typeof window.getBillDescriptions === 'function') {
            const descriptions = window.getBillDescriptions();
            if (Array.isArray(descriptions)) {
                actNames.forEach(function (actName) {
                    const match = descriptions.find(function (d) {
                        return d && d.name === actName;
                    });
                    if (match) {
                        const price = typeof match.price === 'number' ? match.price : Number(match.price || 0);
                        if (!isNaN(price)) {
                            if (amount === null) amount = 0;
                            amount += price;
                        }
                    }
                });
            }
        }

        if (amount === null && typeof consultation.consultationAmount === 'number' && !isNaN(consultation.consultationAmount)) {
            amount = consultation.consultationAmount;
        }

        if (!hasActs && amount === null) {
            amount = 0;
        }

        // Apply 8% tax to the consultation base amount (align with bill total)
        if (amount !== null) {
            const taxRate = 0.08;
            const totalWithTax = amount + (amount * taxRate);
            numericAmount = totalWithTax;
            consultationAmountLabel = totalWithTax.toFixed(2) + ' TND';
        }
    } catch (e) {
        console.error('Error computing consultation amount in reports tab:', e);
    }

    let partialProgressHtml = '';
    let partialAmount = null;
    if (typeof consultation.partialPaymentAmount === 'number' && !isNaN(consultation.partialPaymentAmount)) {
        partialAmount = consultation.partialPaymentAmount;
    } else if (consultation.partialPaymentAmount !== undefined && consultation.partialPaymentAmount !== null && consultation.partialPaymentAmount !== '') {
        const parsedPartial = Number(consultation.partialPaymentAmount);
        if (!isNaN(parsedPartial)) {
            partialAmount = parsedPartial;
        }
    }

    if (normalizedStatus === 'partial' && numericAmount !== null && numericAmount > 0 && partialAmount !== null && partialAmount >= 0) {
        const clampedPartial = Math.min(partialAmount, numericAmount);
        const progressPercent = Math.round((clampedPartial / numericAmount) * 100);
        const paidLabel = clampedPartial.toFixed(2) + ' / ' + numericAmount.toFixed(2) + ' TND';
        const progressLabel = window.t ? window.t('partial_payment_progress', 'Payment progress') : 'Payment progress';

        partialProgressHtml = `
                        <div class="mt-2">
                            <div class="flex justify-between text-[11px] text-gray-500 mb-1">
                                <span>${progressLabel}</span>
                                <span>${paidLabel}</span>
                            </div>
                            <div class="w-full h-1 bg-gray-200 rounded overflow-hidden">
                                <div class="h-1 bg-yellow-400 rounded" style="width: ${progressPercent}%;"></div>
                            </div>
                        </div>
                    `;
    }

    return `
        <div class="border-b border-gray-200 py-3 px-4 flex flex-col gap-2">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <div class="font-semibold text-gray-900">${patientName}</div>
                    <div class="text-xs text-gray-500">${dateStr}</div>
                    <div class="text-xs text-gray-500">${window.t ? window.t('consultation_amount', 'Consultation Amount') : 'Consultation Amount'}: ${consultationAmountLabel}</div>
                </div>
                <div class="text-right">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${paymentStatusClass}">${paymentStatusLabel}</span>
                </div>
            </div>
            ${partialProgressHtml}
            <div class="mt-1">
                <button class="btn btn-sm btn-outline" onclick="viewConsultationDetail('${consultation.id}')">${window.t ? window.t('view_details', 'View Details') : 'View Details'}</button>
            </div>
        </div>
    `;
}

async function renderUnpaidPatientsReport() {
    const container = document.getElementById('unpaidPatientsContainer');
    if (!container) return;

    const monthSelect = document.getElementById('unpaidPatientsMonth');
    const yearSelect = document.getElementById('unpaidPatientsYear');
    const today = new Date();

    let month;
    let year;
    if (monthSelect && yearSelect && yearSelect.value) {
        month = monthSelect.value !== '' ? parseInt(monthSelect.value, 10) : today.getMonth();
        year = parseInt(yearSelect.value, 10) || today.getFullYear();
    } else {
        month = today.getMonth();
        year = today.getFullYear();
        if (monthSelect) monthSelect.value = String(month);
        if (yearSelect) yearSelect.value = String(year);
    }

    const startDate = new Date(year, month, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <span>${window.t ? window.t('loading_unpaid_patients', 'Loading unpaid patients...') : 'Loading unpaid patients...'}</span>
            </div>
        `;

    let consultations = [];
    try {
        const response = await fetch('api/get_consultations.php?all=1');
        if (!response.ok) {
            throw new Error('Failed to fetch consultations for unpaid patients report: ' + response.status);
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.consultations)) {
            consultations = data.consultations;
        }
    } catch (err) {
        console.error('Error loading consultations for unpaid patients report:', err);
        consultations = [];
    }

    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    const doctorName = session.name || '';

    const filtered = consultations.filter(function (c) {
        const consultDate = new Date(c.createdAt || c.date || 0);
        if (!(consultDate >= startDate && consultDate <= endDate)) return false;

        const consultDoctor = c.doctor || c.doctorName || '';
        const isByThisDoctor = !doctorName
            ? true
            : (consultDoctor === doctorName || consultDoctor.includes(doctorName) || doctorName.includes(consultDoctor));

        if (!isByThisDoctor) return false;

        const status = normalizeConsultationPaymentStatusForReports(c);
        return status === 'unpaid';
    });

    const patients = Array.isArray(window.storedPatients)
        ? window.storedPatients
        : (typeof window.getPatients === 'function' ? window.getPatients() : []);

    // Compute aggregate partial paid and outstanding amounts for this period
    let totalPartialPaid = 0;
    let totalExpectedAmount = 0;

    // Use current bill descriptions to compute consultation tariff-based amounts
    let billDescriptions = [];
    try {
        if (typeof window.getBillDescriptions === 'function') {
            const desc = window.getBillDescriptions();
            if (Array.isArray(desc)) billDescriptions = desc;
        }
    } catch (e) {
        console.error('Error loading bill descriptions for in-progress payments report:', e);
    }

    filtered.forEach(function (c) {
        // Compute consultation total with tax similarly to payment tab
        let numericAmount = null;
        try {
            const rawActs = c.consultationAct || '';
            const actNames = rawActs
                ? rawActs.split('|').map(function (s) { return s.trim(); }).filter(function (v) { return v; })
                : [];
            const hasActs = actNames.length > 0;
            let amount = null;

            if (hasActs && Array.isArray(billDescriptions) && billDescriptions.length > 0) {
                actNames.forEach(function (actName) {
                    const match = billDescriptions.find(function (d) {
                        return d && d.name === actName;
                    });
                    if (match) {
                        const price = typeof match.price === 'number' ? match.price : Number(match.price || 0);
                        if (!isNaN(price)) {
                            if (amount === null) amount = 0;
                            amount += price;
                        }
                    }
                });
            }

            if (amount === null && typeof c.consultationAmount === 'number' && !isNaN(c.consultationAmount)) {
                amount = c.consultationAmount;
            }

            if (!hasActs && amount === null) {
                amount = 0;
            }

            if (amount !== null) {
                const taxRate = 0.08;
                const totalWithTax = amount + (amount * taxRate);
                numericAmount = totalWithTax;
            }
        } catch (e) {
            console.error('Error computing consultation amount for in-progress payments aggregate:', e);
        }

        let partialAmount = null;
        if (typeof c.partialPaymentAmount === 'number' && !isNaN(c.partialPaymentAmount)) {
            partialAmount = c.partialPaymentAmount;
        } else if (c.partialPaymentAmount !== undefined && c.partialPaymentAmount !== null && c.partialPaymentAmount !== '') {
            const parsedPartial = Number(c.partialPaymentAmount);
            if (!isNaN(parsedPartial)) {
                partialAmount = parsedPartial;
            }
        }

        if (numericAmount !== null && numericAmount > 0 && partialAmount !== null && partialAmount > 0) {
            const clampedPartial = Math.min(partialAmount, numericAmount);
            totalPartialPaid += clampedPartial;
            totalExpectedAmount += numericAmount;
        }
    });

    const totalOutstandingAmount = Math.max(totalExpectedAmount - totalPartialPaid, 0);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-6" data-translate="no_data_for_period">' + (window.t ? window.t('no_data_for_period', 'No data for this period') : 'No data for this period') + '</p>';
        if (typeof applyTranslations === 'function') {
            applyTranslations(container);
        }
        return;
    }

    const sorted = filtered.slice().sort(function (a, b) {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
    });

    container.innerHTML = `
            <div class="mt-4">
                ${sorted.map(function (c) { return buildConsultationPaymentRowForReports(c, patients); }).join('')}
            </div>
        `;

    if (typeof applyTranslations === 'function') {
        applyTranslations(container);
    }
}

async function renderInProgressPaymentsReport() {
    const container = document.getElementById('inProgressPaymentsContainer');
    if (!container) return;

    const monthSelect = document.getElementById('inProgressPaymentsMonth');
    const yearSelect = document.getElementById('inProgressPaymentsYear');
    const today = new Date();

    let month;
    let year;
    if (monthSelect && yearSelect && yearSelect.value) {
        month = monthSelect.value !== '' ? parseInt(monthSelect.value, 10) : today.getMonth();
        year = parseInt(yearSelect.value, 10) || today.getFullYear();
    } else {
        month = today.getMonth();
        year = today.getFullYear();
        if (monthSelect) monthSelect.value = String(month);
        if (yearSelect) yearSelect.value = String(year);
    }

    const startDate = new Date(year, month, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <span>${window.t ? window.t('loading_in_progress_payments', 'Loading patients with payments in progress...') : 'Loading patients with payments in progress...'}</span>
            </div>
        `;

    let consultations = [];
    try {
        const response = await fetch('api/get_consultations.php?all=1');
        if (!response.ok) {
            throw new Error('Failed to fetch consultations for in-progress payments report: ' + response.status);
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.consultations)) {
            consultations = data.consultations;
        }
    } catch (err) {
        console.error('Error loading consultations for in-progress payments report:', err);
        consultations = [];
    }

    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    const doctorName = session.name || '';

    const filtered = consultations.filter(function (c) {
        const consultDate = new Date(c.createdAt || c.date || 0);
        if (!(consultDate >= startDate && consultDate <= endDate)) return false;

        const consultDoctor = c.doctor || c.doctorName || '';
        const isByThisDoctor = !doctorName
            ? true
            : (consultDoctor === doctorName || consultDoctor.includes(doctorName) || doctorName.includes(consultDoctor));

        if (!isByThisDoctor) return false;

        const status = normalizeConsultationPaymentStatusForReports(c);
        return status === 'partial';
    });

    const patients = Array.isArray(window.storedPatients)
        ? window.storedPatients
        : (typeof window.getPatients === 'function' ? window.getPatients() : []);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-6" data-translate="no_data_for_period">' + (window.t ? window.t('no_data_for_period', 'No data for this period') : 'No data for this period') + '</p>';
        if (typeof applyTranslations === 'function') {
            applyTranslations(container);
        }
        return;
    }

    const sorted = filtered.slice().sort(function (a, b) {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
    });

    container.innerHTML = sorted.map(function (c) {
        return buildConsultationPaymentRowForReports(c, patients);
    }).join('');

    if (typeof applyTranslations === 'function') {
        applyTranslations(container);
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
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2"></path>
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

function printReport() {
    const t = function (key, fallback) {
        return window.t ? window.t(key, fallback) : (fallback || key);
    };

    // Special print for unpaid and in-progress payment tabs (consultation-based views)
    if (currentReportTab === 'unpaidPatients' || currentReportTab === 'inProgressPayments') {
        if (typeof printConsultationPaymentsReport === 'function') {
            printConsultationPaymentsReport(currentReportTab, t);
        }
        return;
    }

    if (!currentReportData || !Array.isArray(currentReportData.bills) || currentReportData.bills.length === 0) {
        if (typeof window.showTranslatedAlert === 'function') {
            window.showTranslatedAlert('no_data_for_period');
        } else if (window.t) {
            alert(window.t('no_data_for_period', 'No data for this period'));
        } else {
            alert('No data for this period');
        }
        return;
    }

    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    const doctorName = session.name || 'Doctor';
    const lang = (typeof currentLanguage !== 'undefined' && currentLanguage) ? currentLanguage : 'fr';

    const now = new Date();
    let rangeStart, rangeEnd, rangeLabel, reportTitle;

    if (currentReportTab === 'daily') {
        const dateInput = document.getElementById('dailyReportDate');
        const selectedDate = (dateInput && dateInput.value) ? new Date(dateInput.value) : now;
        rangeStart = new Date(selectedDate);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDate);
        rangeEnd.setHours(23, 59, 59, 999);
        rangeLabel = selectedDate.toLocaleDateString();
        reportTitle = t('daily_report', 'Daily Report');
    } else if (currentReportTab === 'weekly') {
        const dateInput = document.getElementById('weeklyReportDate');
        const selectedDate = (dateInput && dateInput.value) ? new Date(dateInput.value) : now;
        rangeStart = new Date(selectedDate);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDate);
        rangeEnd.setDate(rangeEnd.getDate() + 6);
        rangeEnd.setHours(23, 59, 59, 999);
        rangeLabel = rangeStart.toLocaleDateString() + ' - ' + rangeEnd.toLocaleDateString();
        reportTitle = t('weekly_report', 'Weekly Report');
    } else {
        const monthSelect = document.getElementById('monthlyReportMonth');
        const yearSelect = document.getElementById('monthlyReportYear');
        const month = monthSelect ? parseInt(monthSelect.value, 10) : now.getMonth();
        const year = yearSelect ? parseInt(yearSelect.value, 10) : now.getFullYear();
        rangeStart = new Date(year, month, 1, 0, 0, 0, 0);
        rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        const monthName = rangeStart.toLocaleString('default', { month: 'long' });
        rangeLabel = monthName + ' ' + year;
        reportTitle = t('monthly_report', 'Monthly Report');
    }

    const expensesForRange = getExpensesForPeriod(rangeStart, rangeEnd).total;
    const totalRevenueForRange = currentReportData.bills.reduce(function (sum, b) { return sum + b.total; }, 0);
    const netProfitForRange = totalRevenueForRange - expensesForRange;

    const docTitle = t('profit_reports', 'Profit Reports');

    const billsRowsHtml = currentReportData.bills.map(function (bill, index) {
        const created = new Date(bill.createdAt || bill.date || 0);
        const createdStr = isNaN(created) ? '' : created.toLocaleString();
        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${bill.patientName || ''}</td>
                    <td>${bill.id}</td>
                    <td>${createdStr}</td>
                    <td style="text-align:right;">${(bill.total || 0).toFixed(2)} TND</td>
                    <td style="text-align:right;">${Array.isArray(bill.items) ? bill.items.length : 0}</td>
                </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 20px; background: #f3f4f6; }
        .report-container { max-width: 900px; margin: 0 auto; background: #ffffff; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.08); }
        .report-header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
        .report-title { font-size: 24px; font-weight: 700; color: #2563eb; margin: 0 0 4px 0; }
        .report-subtitle { font-size: 16px; color: #4b5563; margin: 0; }
        .meta { font-size: 13px; color: #6b7280; margin-top: 8px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
        .summary-label { font-size: 12px; color: #6b7280; }
        .summary-value { font-size: 18px; font-weight: 700; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th, td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
        th { text-align: left; background: #eff6ff; font-weight: 600; color: #374151; }
        .mt-4 { margin-top: 16px; }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">${docTitle}</h1>
            <p class="report-subtitle">${reportTitle}</p>
            <div class="meta">
                <div><strong>${t('doctor', 'Doctor')}:</strong> ${doctorName}</div>
                <div><strong>${t('date', 'Date')}:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>${t('period', 'Period')}:</strong> ${rangeLabel}</div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-label">${t('total_consultations', 'Total Consultations')}</div>
                <div class="summary-value">${currentReportData.consultations.length}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${t('total_bills', 'Total Bills')}</div>
                <div class="summary-value">${currentReportData.bills.length}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${t('total_revenue', 'Total Revenue')}</div>
                <div class="summary-value">${totalRevenueForRange.toFixed(2)} TND</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${t('total_expenses', 'Total Expenses')}</div>
                <div class="summary-value">${expensesForRange.toFixed(2)} TND</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${t('net_profit', 'Net Profit')}</div>
                <div class="summary-value">${netProfitForRange.toFixed(2)} TND</div>
            </div>
        </div>

        <div class="mt-4">
            <h2 style="font-size:16px; font-weight:600; margin:0 0 6px 0;">${t('bill_details', 'Bill Details')}</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>${t('patient_name', 'Patient Name')}</th>
                        <th>${t('bill_id', 'Bill ID')}</th>
                        <th>${t('bill_date', 'Bill Date')}</th>
                        <th style="text-align:right;">${t('total', 'Total')}</th>
                        <th style="text-align:right;">${t('items', 'items')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${billsRowsHtml}
                </tbody>
            </table>
        </div>
    </div>
    <script>
        window.onload = function () { window.print(); };
    <\/script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        console.error('Unable to open print window for report');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}

function computeConsultationAmountsForReport(consultation, billDescriptions) {
    let numericAmount = null;

    try {
        const rawActs = consultation.consultationAct || '';
        const actNames = rawActs
            ? rawActs.split('|').map(function (s) { return s.trim(); }).filter(function (v) { return v; })
            : [];
        const hasActs = actNames.length > 0;
        let amount = null;

        if (hasActs && Array.isArray(billDescriptions) && billDescriptions.length > 0) {
            actNames.forEach(function (actName) {
                const match = billDescriptions.find(function (d) {
                    return d && d.name === actName;
                });
                if (match) {
                    const price = typeof match.price === 'number' ? match.price : Number(match.price || 0);
                    if (!isNaN(price)) {
                        if (amount === null) amount = 0;
                        amount += price;
                    }
                }
            });
        }

        if (amount === null && typeof consultation.consultationAmount === 'number' && !isNaN(consultation.consultationAmount)) {
            amount = consultation.consultationAmount;
        }

        if (!hasActs && amount === null) {
            amount = 0;
        }

        if (amount !== null) {
            const taxRate = 0.08;
            const totalWithTax = amount + (amount * taxRate);
            numericAmount = totalWithTax;
        }
    } catch (e) {
        console.error('Error computing consultation financials for export:', e);
    }

    let partialAmount = null;
    if (typeof consultation.partialPaymentAmount === 'number' && !isNaN(consultation.partialPaymentAmount)) {
        partialAmount = consultation.partialPaymentAmount;
    } else if (consultation.partialPaymentAmount !== undefined && consultation.partialPaymentAmount !== null && consultation.partialPaymentAmount !== '') {
        const parsedPartial = Number(consultation.partialPaymentAmount);
        if (!isNaN(parsedPartial)) {
            partialAmount = parsedPartial;
        }
    }

    if (numericAmount === null || isNaN(numericAmount) || numericAmount < 0) {
        numericAmount = 0;
    }

    let paid = 0;
    if (partialAmount !== null && !isNaN(partialAmount) && partialAmount > 0) {
        paid = Math.min(partialAmount, numericAmount);
    }
    const remaining = Math.max(numericAmount - paid, 0);

    return {
        total: numericAmount,
        paid: paid,
        remaining: remaining
    };
}

async function printConsultationPaymentsReport(mode, t) {
    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    const doctorName = session.name || 'Doctor';
    const lang = (typeof currentLanguage !== 'undefined' && currentLanguage) ? currentLanguage : 'fr';
    const now = new Date();

    const today = new Date();
    let monthSelectId;
    let yearSelectId;
    let reportTitleKey;

    if (mode === 'unpaidPatients') {
        monthSelectId = 'unpaidPatientsMonth';
        yearSelectId = 'unpaidPatientsYear';
        reportTitleKey = 'unpaid_patients';
    } else {
        monthSelectId = 'inProgressPaymentsMonth';
        yearSelectId = 'inProgressPaymentsYear';
        reportTitleKey = 'in_progress_payments';
    }

    const monthSelect = document.getElementById(monthSelectId);
    const yearSelect = document.getElementById(yearSelectId);

    let month;
    let year;
    if (monthSelect && yearSelect && yearSelect.value) {
        month = monthSelect.value !== '' ? parseInt(monthSelect.value, 10) : today.getMonth();
        year = parseInt(yearSelect.value, 10) || today.getFullYear();
    } else {
        month = today.getMonth();
        year = today.getFullYear();
    }

    const startDate = new Date(year, month, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    const monthName = startDate.toLocaleString('default', { month: 'long' });
    const rangeLabel = monthName + ' ' + year;

    let consultations = [];
    try {
        const response = await fetch('api/get_consultations.php?all=1');
        if (!response.ok) {
            throw new Error('Failed to fetch consultations for payments print: ' + response.status);
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.consultations)) {
            consultations = data.consultations;
        }
    } catch (err) {
        console.error('Error loading consultations for payments print:', err);
        consultations = [];
    }

    const doctorSessionName = session.name || '';

    const filtered = consultations.filter(function (c) {
        const consultDate = new Date(c.createdAt || c.date || 0);
        if (!(consultDate >= startDate && consultDate <= endDate)) return false;

        const consultDoctor = c.doctor || c.doctorName || '';
        const isByThisDoctor = !doctorSessionName
            ? true
            : (consultDoctor === doctorSessionName || consultDoctor.includes(doctorSessionName) || doctorSessionName.includes(consultDoctor));

        if (!isByThisDoctor) return false;

        const status = normalizeConsultationPaymentStatusForReports(c);
        if (mode === 'unpaidPatients') {
            return status === 'unpaid';
        }
        if (mode === 'inProgressPayments') {
            return status === 'partial';
        }
        return false;
    });

    if (filtered.length === 0) {
        if (typeof window.showTranslatedAlert === 'function') {
            window.showTranslatedAlert('no_data_for_period');
        } else if (window.t) {
            alert(window.t('no_data_for_period', 'No data for this period'));
        } else {
            alert('No data for this period');
        }
        return;
    }

    const patients = Array.isArray(window.storedPatients)
        ? window.storedPatients
        : (typeof window.getPatients === 'function' ? window.getPatients() : []);

    let billDescriptions = [];
    try {
        if (typeof window.getBillDescriptions === 'function') {
            const desc = window.getBillDescriptions();
            if (Array.isArray(desc)) billDescriptions = desc;
        }
    } catch (e) {
        console.error('Error loading bill descriptions for payments print:', e);
    }

    const docTitle = t('profit_reports', 'Profit Reports');
    const reportTitle = t(reportTitleKey, reportTitleKey === 'unpaid_patients' ? 'Unpaid Patients' : 'Patients with Payments in Progress');

    let totalPaid = 0;
    let totalRemaining = 0;
    let totalTotal = 0;

    const tableRowsHtml = filtered.map(function (c, index) {
        let patientName = c.patientName || c.patientFullName || '';
        const patient = patients.find(function (p) {
            if (!p) return false;
            return String(p.id) === String(c.patientId);
        });
        if (!patientName && patient) {
            patientName = patient.fullName || patient.name || '';
        }
        if (!patientName && c.patient && typeof c.patient === 'object') {
            patientName = c.patient.fullName || c.patient.name || '';
        }
        if (!patientName) {
            patientName = 'Unknown Patient';
        }

        const created = new Date(c.createdAt || c.date || 0);
        const dateStr = isNaN(created) ? '' : created.toLocaleString();

        const normalizedStatus = normalizeConsultationPaymentStatusForReports(c);
        let statusLabel;
        if (normalizedStatus === 'paid') {
            statusLabel = t('paid_status', 'Paid');
        } else if (normalizedStatus === 'partial') {
            statusLabel = t('partially_paid_status', 'Partially Paid');
        } else {
            statusLabel = t('unpaid_status', 'Unpaid');
        }

        const financials = computeConsultationAmountsForReport(c, billDescriptions);
        totalPaid += financials.paid;
        totalRemaining += financials.remaining;
        totalTotal += financials.total;

        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${patientName}</td>
                    <td>${dateStr}</td>
                    <td>${statusLabel}</td>
                    <td style="text-align:right;">${financials.paid.toFixed(2)} TND</td>
                    <td style="text-align:right;">${financials.remaining.toFixed(2)} TND</td>
                    <td style="text-align:right;">${financials.total.toFixed(2)} TND</td>
                </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 20px; background: #f3f4f6; }
        .report-container { max-width: 900px; margin: 0 auto; background: #ffffff; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.08); }
        .report-header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
        .report-title { font-size: 24px; font-weight: 700; color: #2563eb; margin: 0 0 4px 0; }
        .report-subtitle { font-size: 16px; color: #4b5563; margin: 0; }
        .meta { font-size: 13px; color: #6b7280; margin-top: 8px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
        .summary-label { font-size: 12px; color: #6b7280; }
        .summary-value { font-size: 18px; font-weight: 700; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th, td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
        th { text-align: left; background: #eff6ff; font-weight: 600; color: #374151; }
        .mt-4 { margin-top: 16px; }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">${docTitle}</h1>
            <p class="report-subtitle">${reportTitle}</p>
            <div class="meta">
                <div><strong>${t('doctor', 'Doctor')}:</strong> ${doctorName}</div>
                <div><strong>${t('date', 'Date')}:</strong> ${now.toLocaleString()}</div>
                <div><strong>${t('period', 'Period')}:</strong> ${rangeLabel}</div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-label">${t('total_consultations', 'Total Consultations')}</div>
                <div class="summary-value">${filtered.length}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${t('paid_amount', 'Paid')}</div>
                <div class="summary-value">${totalPaid.toFixed(2)} TND</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${t('remaining_amount', 'Remaining')}</div>
                <div class="summary-value">${totalRemaining.toFixed(2)} TND</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${t('total_amount', 'Total Amount')}</div>
                <div class="summary-value">${totalTotal.toFixed(2)} TND</div>
            </div>
        </div>

        <div class="mt-4">
            <h2 style="font-size:16px; font-weight:600; margin:0 0 6px 0;">${reportTitle}</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>${t('patient_name', 'Patient Name')}</th>
                        <th>${t('date', 'Date')}</th>
                        <th>${t('payment_status', 'Payment Status')}</th>
                        <th style="text-align:right;">${t('paid_amount', 'Paid')}</th>
                        <th style="text-align:right;">${t('remaining_amount', 'Remaining')}</th>
                        <th style="text-align:right;">${t('total_amount', 'Total Amount')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>
        </div>
    </div>
    <script>
        window.onload = function () { window.print(); };
    <\/script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        console.error('Unable to open print window for payments report');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}

async function exportConsultationPaymentsTextReport(mode, t) {
    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    const doctorName = session.name || 'Doctor';
    const now = new Date();

    const today = new Date();
    let monthSelectId;
    let yearSelectId;
    let reportTitleKey;

    if (mode === 'unpaidPatients') {
        monthSelectId = 'unpaidPatientsMonth';
        yearSelectId = 'unpaidPatientsYear';
        reportTitleKey = 'unpaid_patients';
    } else {
        monthSelectId = 'inProgressPaymentsMonth';
        yearSelectId = 'inProgressPaymentsYear';
        reportTitleKey = 'in_progress_payments';
    }

    const monthSelect = document.getElementById(monthSelectId);
    const yearSelect = document.getElementById(yearSelectId);

    let month;
    let year;
    if (monthSelect && yearSelect && yearSelect.value) {
        month = monthSelect.value !== '' ? parseInt(monthSelect.value, 10) : today.getMonth();
        year = parseInt(yearSelect.value, 10) || today.getFullYear();
    } else {
        month = today.getMonth();
        year = today.getFullYear();
    }

    const startDate = new Date(year, month, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    const monthName = startDate.toLocaleString('default', { month: 'long' });
    const rangeLabel = monthName + ' ' + year;

    let consultations = [];
    try {
        const response = await fetch('api/get_consultations.php?all=1');
        if (!response.ok) {
            throw new Error('Failed to fetch consultations for payments export: ' + response.status);
        }

        const data = await response.json();
        if (data && data.status === 'ok' && Array.isArray(data.consultations)) {
            consultations = data.consultations;
        }
    } catch (err) {
        console.error('Error loading consultations for payments export:', err);
        consultations = [];
    }

    const doctorSessionName = session.name || '';

    const filtered = consultations.filter(function (c) {
        const consultDate = new Date(c.createdAt || c.date || 0);
        if (!(consultDate >= startDate && consultDate <= endDate)) return false;

        const consultDoctor = c.doctor || c.doctorName || '';
        const isByThisDoctor = !doctorSessionName
            ? true
            : (consultDoctor === doctorSessionName || consultDoctor.includes(doctorSessionName) || doctorSessionName.includes(consultDoctor));

        if (!isByThisDoctor) return false;

        const status = normalizeConsultationPaymentStatusForReports(c);
        if (mode === 'unpaidPatients') {
            return status === 'unpaid';
        }
        if (mode === 'inProgressPayments') {
            return status === 'partial';
        }
        return false;
    });

    if (filtered.length === 0) {
        if (typeof window.showTranslatedAlert === 'function') {
            window.showTranslatedAlert('no_data_for_period');
        } else if (window.t) {
            alert(window.t('no_data_for_period', 'No data for this period'));
        } else {
            alert('No data for this period');
        }
        return;
    }

    const patients = Array.isArray(window.storedPatients)
        ? window.storedPatients
        : (typeof window.getPatients === 'function' ? window.getPatients() : []);

    let billDescriptions = [];
    try {
        if (typeof window.getBillDescriptions === 'function') {
            const desc = window.getBillDescriptions();
            if (Array.isArray(desc)) billDescriptions = desc;
        }
    } catch (e) {
        console.error('Error loading bill descriptions for payments export:', e);
    }

    const docTitle = t('profit_reports', 'Profit Reports');
    const reportTitle = t(reportTitleKey, reportTitleKey === 'unpaid_patients' ? 'Unpaid Patients' : 'Patients with Payments in Progress');

    let totalPaid = 0;
    let totalRemaining = 0;
    let totalTotal = 0;

    const lines = [];
    lines.push(`${docTitle} - ${doctorName}`);
    lines.push(`${t('generated_on', 'Generated on')}: ${now.toLocaleString()}`);
    lines.push(`${t('report_type', 'Report type')}: ${reportTitle}`);
    lines.push(`${t('period', 'Period')}: ${rangeLabel}`);
    lines.push('');
    lines.push('==========================================');
    lines.push('');
    lines.push(`${t('summary', 'Summary')}:`);
    lines.push(`${t('total_consultations', 'Total Consultations')}: ${filtered.length}`);
    lines.push('');

    // Table header
    const headerRow = [
        '#',
        t('patient_name', 'Patient Name'),
        t('date', 'Date'),
        t('payment_status', 'Payment Status'),
        t('paid_amount', 'Paid'),
        t('remaining_amount', 'Remaining'),
        t('total_amount', 'Total Amount')
    ];

    const tableRows = [];
    tableRows.push(headerRow);

    filtered.forEach(function (c, index) {
        let patientName = c.patientName || c.patientFullName || '';
        const patient = patients.find(function (p) {
            if (!p) return false;
            return String(p.id) === String(c.patientId);
        });
        if (!patientName && patient) {
            patientName = patient.fullName || patient.name || '';
        }
        if (!patientName && c.patient && typeof c.patient === 'object') {
            patientName = c.patient.fullName || c.patient.name || '';
        }
        if (!patientName) {
            patientName = 'Unknown Patient';
        }

        const created = new Date(c.createdAt || c.date || 0);
        const dateStr = isNaN(created) ? '' : created.toLocaleString();

        const normalizedStatus = normalizeConsultationPaymentStatusForReports(c);
        let statusLabel;
        if (normalizedStatus === 'paid') {
            statusLabel = t('paid_status', 'Paid');
        } else if (normalizedStatus === 'partial') {
            statusLabel = t('partially_paid_status', 'Partially Paid');
        } else {
            statusLabel = t('unpaid_status', 'Unpaid');
        }

        const financials = computeConsultationAmountsForReport(c, billDescriptions);
        totalPaid += financials.paid;
        totalRemaining += financials.remaining;
        totalTotal += financials.total;

        const paidStr = financials.paid.toFixed(2) + ' TND';
        const remainingStr = financials.remaining.toFixed(2) + ' TND';
        const totalStr = financials.total.toFixed(2) + ' TND';

        tableRows.push([
            String(index + 1),
            patientName,
            dateStr,
            statusLabel,
            paidStr,
            remainingStr,
            totalStr
        ]);
    });

    // Compute column widths for the ASCII table
    const colCount = headerRow.length;
    const colWidths = new Array(colCount).fill(0);
    tableRows.forEach(function (row) {
        for (let i = 0; i < colCount; i++) {
            const cell = row[i] != null ? String(row[i]) : '';
            if (cell.length > colWidths[i]) {
                colWidths[i] = cell.length;
            }
        }
    });

    function buildBorderLine() {
        // Use '*' as vertical separators and '-' to draw horizontal segments
        let line = '*';
        for (let i = 0; i < colCount; i++) {
            // +2 for the spaces added around each cell in buildTableRow
            line += '-'.repeat(colWidths[i] + 2) + '*';
        }
        return line;
    }

    function buildTableRow(row) {
        const cells = row.map(function (cell, idx) {
            const raw = cell != null ? String(cell) : '';
            const padding = colWidths[idx] - raw.length;
            return ' ' + raw + (padding > 0 ? ' '.repeat(padding) : '') + ' ';
        });
        return '*' + cells.join('*') + '*';
    }

    const borderLine = buildBorderLine();
    const headerLine = buildTableRow(tableRows[0]);

    // Top border and header
    lines.push(borderLine);
    lines.push(headerLine);
    lines.push(borderLine);

    // Data rows, each followed by a border to clearly separate rows and cells
    for (let i = 1; i < tableRows.length; i++) {
        lines.push(buildTableRow(tableRows[i]));
        lines.push(borderLine);
    }

    lines.push('');
    lines.push('------------------------------------------');
    lines.push(`${t('total', 'Total')}: ${t('paid_amount', 'Paid')} = ${totalPaid.toFixed(2)} TND, ${t('remaining_amount', 'Remaining')}: ${totalRemaining.toFixed(2)} TND, ${t('total_amount', 'Total Amount')}: ${totalTotal.toFixed(2)} TND`);

    const reportText = lines.join('\n');

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_report_${mode}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Translated success alert
    if (typeof window.showTranslatedAlert === 'function') {
        window.showTranslatedAlert('report_exported_successfully');
    } else if (window.t) {
        alert(window.t('report_exported_successfully', 'Report exported successfully!'));
    } else {
        alert('Report exported successfully!');
    }
}

async function exportReport() {
    const t = function (key, fallback) {
        return window.t ? window.t(key, fallback) : (fallback || key);
    };

    // Special export for unpaid and in-progress payment tabs (consultation-based views)
    if (currentReportTab === 'unpaidPatients' || currentReportTab === 'inProgressPayments') {
        await exportConsultationPaymentsTextReport(currentReportTab, t);
        return;
    }

    if (!currentReportData || !Array.isArray(currentReportData.bills) || currentReportData.bills.length === 0) {
        if (typeof window.showTranslatedAlert === 'function') {
            window.showTranslatedAlert('no_data_for_period');
        } else if (window.t) {
            alert(window.t('no_data_for_period', 'No data for this period'));
        } else {
            alert('No data for this period');
        }
        return;
    }

    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    const doctorName = session.name || 'Doctor';

    const now = new Date();
    let rangeStart, rangeEnd, rangeLabel, reportTitle;

    if (currentReportTab === 'daily') {
        const dateInput = document.getElementById('dailyReportDate');
        const selectedDate = (dateInput && dateInput.value) ? new Date(dateInput.value) : now;
        rangeStart = new Date(selectedDate);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDate);
        rangeEnd.setHours(23, 59, 59, 999);
        rangeLabel = selectedDate.toLocaleDateString();
        reportTitle = t('daily_report', 'Daily Report');
    } else if (currentReportTab === 'weekly') {
        const dateInput = document.getElementById('weeklyReportDate');
        const selectedDate = (dateInput && dateInput.value) ? new Date(dateInput.value) : now;
        rangeStart = new Date(selectedDate);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDate);
        rangeEnd.setDate(rangeEnd.getDate() + 6);
        rangeEnd.setHours(23, 59, 59, 999);
        rangeLabel = rangeStart.toLocaleDateString() + ' - ' + rangeEnd.toLocaleDateString();
        reportTitle = t('weekly_report', 'Weekly Report');
    } else {
        const monthSelect = document.getElementById('monthlyReportMonth');
        const yearSelect = document.getElementById('monthlyReportYear');
        const month = monthSelect ? parseInt(monthSelect.value, 10) : now.getMonth();
        const year = yearSelect ? parseInt(yearSelect.value, 10) : now.getFullYear();
        rangeStart = new Date(year, month, 1, 0, 0, 0, 0);
        rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        const monthName = rangeStart.toLocaleString('default', { month: 'long' });
        rangeLabel = monthName + ' ' + year;
        reportTitle = t('monthly_report', 'Monthly Report');
    }

    const expensesForRange = getExpensesForPeriod(rangeStart, rangeEnd).total;
    const totalRevenueForRange = currentReportData.bills.reduce(function (sum, b) {
        return sum + (b.total || 0);
    }, 0);
    const netProfitForRange = totalRevenueForRange - expensesForRange;

    const docTitle = t('profit_reports', 'Profit Reports');

    let reportText = `${docTitle} - ${doctorName}\n`;
    reportText += `${t('generated_on', 'Generated on')}: ${now.toLocaleString()}\n`;
    reportText += `${t('report_type', 'Report type')}: ${reportTitle}\n`;
    reportText += `${t('period', 'Period')}: ${rangeLabel}\n`;
    reportText += `\n==========================================\n\n`;

    reportText += `${t('summary', 'Summary')}:\n`;
    reportText += `${t('total_consultations', 'Total Consultations')}: ${currentReportData.consultations.length}\n`;
    reportText += `${t('total_bills', 'Total Bills')}: ${currentReportData.bills.length}\n`;
    reportText += `${t('total_revenue', 'Total Revenue')}: ${totalRevenueForRange.toFixed(2)} TND\n`;
    reportText += `${t('total_expenses', 'Total Expenses')}: ${expensesForRange.toFixed(2)} TND\n`;
    reportText += `${t('net_profit', 'Net Profit')}: ${netProfitForRange.toFixed(2)} TND\n`;
    reportText += `\n==========================================\n\n`;

    reportText += `${t('bill_details', 'Bill Details')}:\n`;
    currentReportData.bills.forEach(function (bill, index) {
        const created = new Date(bill.createdAt || bill.date || 0);
        const createdStr = isNaN(created) ? '' : created.toLocaleString();
        reportText += `\n${index + 1}. ${t('patient_name', 'Patient Name')}: ${bill.patientName || ''}\n`;
        reportText += `   ${t('bill_id', 'Bill ID')}: ${bill.id}\n`;
        reportText += `   ${t('bill_date', 'Bill Date')}: ${createdStr}\n`;
        reportText += `   ${t('total', 'Total')}: ${(bill.total || 0).toFixed(2)} TND\n`;
        reportText += `   ${t('items', 'items')}: ${Array.isArray(bill.items) ? bill.items.length : 0}\n`;
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

    // Translated success alert
    if (typeof window.showTranslatedAlert === 'function') {
        window.showTranslatedAlert('report_exported_successfully');
    } else if (window.t) {
        alert(window.t('report_exported_successfully', 'Report exported successfully!'));
    } else {
        alert('Report exported successfully!');
    }
}

function exportFullBackupForCurrentMonth() {
    try {
        const now = new Date();
        let year = now.getFullYear();
        let monthIndex = now.getMonth(); // 0-based

        const monthSelect = document.getElementById('monthlyReportMonth');
        const yearSelect = document.getElementById('monthlyReportYear');
        if (monthSelect && yearSelect && yearSelect.value) {
            const parsedYear = parseInt(yearSelect.value, 10);
            const parsedMonth = parseInt(monthSelect.value, 10);
            if (!isNaN(parsedYear)) year = parsedYear;
            if (!isNaN(parsedMonth)) monthIndex = parsedMonth;
        }

        const monthNumber = monthIndex + 1; // convert to 1-based month
        const monthStr = monthNumber < 10 ? '0' + monthNumber : String(monthNumber);

        const url = 'api/export_backup.php?year='
            + encodeURIComponent(year)
            + '&month='
            + encodeURIComponent(monthStr);

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error('Error triggering full backup export:', e);
        if (typeof window.showTranslatedAlert === 'function') {
            window.showTranslatedAlert('error_exporting_backup');
        }
    }
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

function populateConsultationActSelect() {
    try {
        const select = document.getElementById('consultationAct');
        if (!select) return;
        select.innerHTML = getBillDescriptionOptionsHTML();

        // Initialize advanced multi-select UI if wrapper exists
        if (typeof setupConsultationActAdvancedMultiSelect === 'function') {
            setupConsultationActAdvancedMultiSelect();
        }

        if (select.multiple && !select.dataset.clickToggleBound) {
            select.addEventListener('mousedown', function (e) {
                const option = e.target;
                if (!option || option.tagName !== 'OPTION') return;
                e.preventDefault();
                option.selected = !option.selected;
                const evt = new Event('change', { bubbles: true });
                select.dispatchEvent(evt);
            });
            select.dataset.clickToggleBound = '1';
        }
    } catch (e) {
        console.error('Error populating consultationAct select:', e);
    }
}

function setupConsultationActAdvancedMultiSelect() {
    try {
        const select = document.getElementById('consultationAct');
        const wrapper = document.getElementById('consultationActMultiWrapper');
        const display = document.getElementById('consultationActDisplay');
        const panel = document.getElementById('consultationActMultiPanel');
        const list = document.getElementById('consultationActMultiList');
        const searchInput = document.getElementById('consultationActMultiSearch');

        if (!select || !wrapper || !display || !panel || !list) {
            return;
        }

        // Build checkbox list from current select options (skip placeholder)
        list.innerHTML = '';
        const options = Array.from(select.options || []).filter(function (opt) {
            return !!opt.value;
        });

        options.forEach(function (opt, index) {
            const optionId = 'consultationActMultiOption_' + index;
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 text-sm cursor-pointer py-1';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            // Use app's styled checkbox appearance
            checkbox.className = 'form-checkbox';
            checkbox.value = opt.value;
            checkbox.checked = !!opt.selected;
            checkbox.id = optionId;

            checkbox.addEventListener('change', function () {
                opt.selected = checkbox.checked;
                refreshFromSelect();
            });

            const span = document.createElement('span');
            span.textContent = opt.textContent || opt.value;

            label.appendChild(checkbox);
            label.appendChild(span);
            list.appendChild(label);
        });

        function refreshFromSelect() {
            const selectedOptions = Array.from(select.options || []).filter(function (o) {
                return o.selected && o.value;
            });

            const checkboxes = list.querySelectorAll('input[type="checkbox"]');
            Array.from(checkboxes || []).forEach(function (cb) {
                const match = options.find(function (o) { return o.value === cb.value; });
                cb.checked = !!(match && match.selected);
            });

            const placeholderText = window.t
                ? window.t('select_service', 'Select service...')
                : 'Select service...';

            // Clear current chips / placeholder content
            display.innerHTML = '';

            if (selectedOptions.length === 0) {
                display.textContent = placeholderText;
                display.classList.add('text-gray-400');
            } else {
                display.classList.remove('text-gray-400');

                selectedOptions.forEach(function (opt) {
                    const name = opt.textContent || opt.value;

                    const chip = document.createElement('span');
                    chip.className = 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200';

                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = name;

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'ml-1 text-blue-500 hover:text-blue-700 focus:outline-none';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        opt.selected = false;
                        refreshFromSelect();
                    });

                    chip.appendChild(labelSpan);
                    chip.appendChild(removeBtn);
                    display.appendChild(chip);
                });
            }
        }

        if (!display.dataset.boundClick) {
            display.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                panel.classList.toggle('hidden');
            });
            display.dataset.boundClick = '1';
        }

        if (searchInput && !searchInput.dataset.boundInput) {
            searchInput.addEventListener('input', function () {
                const term = searchInput.value ? searchInput.value.toLowerCase() : '';
                const labels = list.querySelectorAll('label');
                Array.from(labels || []).forEach(function (labelEl) {
                    const text = (labelEl.textContent || '').toLowerCase();
                    labelEl.style.display = !term || text.indexOf(term) !== -1 ? '' : 'none';
                });
            });
            searchInput.dataset.boundInput = '1';
        }

        if (!window._consultationActOutsideClickBound) {
            document.addEventListener('click', function (e) {
                const wrapperEl = document.getElementById('consultationActMultiWrapper');
                const panelEl = document.getElementById('consultationActMultiPanel');
                if (!wrapperEl || !panelEl) return;
                if (!wrapperEl.contains(e.target)) {
                    panelEl.classList.add('hidden');
                }
            });
            window._consultationActOutsideClickBound = true;
        }

        // Expose refresh so editConsultation can sync UI after setting selected options
        window.refreshConsultationActMultiSelect = refreshFromSelect;

        refreshFromSelect();
    } catch (e) {
        console.error('Error setting up advanced consultation act multi-select:', e);
    }
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
    // Persist bill via backend API
    syncBillToDatabase(newBill);

    // Also keep a local copy so Ready Bills can immediately exclude this consultation
    try {
        const existingBills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
        existingBills.push(newBill);
        localStorage.setItem('healthcareBills', JSON.stringify(existingBills));
    } catch { }

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

    // Get cabinet phone for footer (fallback to empty string if unavailable)
    let cabinetPhone = '';
    try {
        const s = getCabinetSettings && getCabinetSettings();
        if (s && s.phone && s.phone.trim()) {
            cabinetPhone = s.phone.trim();
        }
    } catch (e) { }

    // Helper to translate bill status (e.g., pending/paid/overdue) using existing keys
    const formatBillStatus = (status) => {
        if (!status) return '';
        const key = status.toString().trim().toLowerCase().replace(/\s+/g, '_');
        return t(key, status);
    };

    const billHTML = `
                <!DOCTYPE html>
                <html lang="${lang}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title></title>
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
                            <div class="bill-logo" aria-hidden="true">${(function () {
            try {
                const s = getCabinetSettings();
                if (s && s.logo && /^data:image\//.test(s.logo)) {
                    return `<img src="${s.logo}" alt="Logo" style="width:48px;height:48px;object-fit:contain;"/>`;
                }
            } catch (e) { }
            return `<svg width="48" height="48" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><path d="M28 8 L22 34 L40 34 Z" fill="#2563eb"/><path d="M28 8 L26 34 L34 34 Z" fill="#3b82f6" opacity="0.85"/><path d="M12 42 Q22 36 28 42 Q34 36 44 42 Q34 48 28 42 Q22 48 12 42 Z" fill="#2563eb"/></svg>`;
        })()}</div>
                            <div class="bill-header-text">
                                ${(function () {
            try {
                const s = getCabinetSettings();
                const name = (s && s.name && s.name.trim()) ? s.name : 'Medical Center';
                const address = (s && s.address && s.address.trim()) ? s.address : '';
                const phone = (s && s.phone && s.phone.trim()) ? s.phone : '';
                return `<div class="bill-title">${name}</div><div class="bill-subtitle">${address}</div><div style="color:#6b7280;font-size:0.9rem;">${phone ? `Tel: ${phone}` : ''}</div>`;
            } catch (e) {
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
                                <p><strong>${t('bill_date', 'Bill Date')}:</strong> ${billDate}</p>
                                <p><strong>${t('due_date', 'Due Date')}:</strong> ${dueDate}</p>
                                <p><strong>${t('status', 'Status')}:</strong> ${formatBillStatus(bill.status)}</p>
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
                        
                        <div class="bill-footer">
                            <p>${t('thank_you_message', 'Thank you for choosing our healthcare services.')}</p>
                            <p>${t('for_questions_contact', 'For questions about this bill, please contact us at')} ${(function () {
            try {
                const s = getCabinetSettings();
                return s.phone;
            } catch (e) {
                return '';
            }
        })()}</p>
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
                        <h2 class="modal-title" data-translate="printable_bill">Printable Bill</h2>
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
                        <div class="bill-logo" aria-hidden="true">${(function () {
            try {
                const s = getCabinetSettings();
                if (s && s.logo && /^data:image\//.test(s.logo)) {
                    return `<img src="${s.logo}" alt="Logo" style="width:48px;height:48px;object-fit:contain;"/>`;
                }
            } catch (e) { }
            return `<svg width=\"48\" height=\"48\" viewBox=\"0 0 56 56\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M28 8 L22 34 L40 34 Z\" fill=\"#2563eb\"/><path d=\"M28 8 L26 34 L34 34 Z\" fill=\"#3b82f6\" opacity=\"0.85\"/><path d=\"M12 42 Q22 36 28 42 Q34 36 44 42 Q34 48 28 42 Q22 48 12 42 Z\" fill=\"#2563eb\"/></svg>`;
        })()}</div>
                        <div class="bill-header-text" style="display:flex;flex-direction:column;">
                            ${(function () {
            try {
                const s = getCabinetSettings();
                const name = (s && s.name && s.name.trim()) ? s.name : 'Medical Center';
                const address = (s && s.address && s.address.trim()) ? s.address : '';
                const phone = (s && s.phone && s.phone.trim()) ? s.phone : '';
                return `<div class=\"bill-title\" style=\"font-weight:700;color:#1e40af;font-size:1.5rem;\">${name}</div><div class=\"bill-subtitle\" style=\"color:#2563eb;\">${address}</div><div style=\"color:#6b7280;font-size:0.9rem;\">${phone ? `Tel: ${phone}` : ''}</div>`;
            } catch (e) {
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
                        <p>${t('for_questions_contact', 'For questions about this bill, please contact us at')} ${cabinetPhone || ''}</p>
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
        const printBill = showTranslatedConfirm('bill_created_success', newBill.patientName, newBill.total.toFixed(2));

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

    // Refresh Ready Bills list so the related consultation card disappears
    const readyBillsModal = document.getElementById('readyBillsModal');
    if (formData.consultationId) {
        // If the modal is already open, just re-render; otherwise reopen it
        if (readyBillsModal && readyBillsModal.classList.contains('active')) {
            if (typeof renderReadyBills === 'function') {
                renderReadyBills();
            }
        } else if (typeof showReadyBillsModal === 'function') {
            showReadyBillsModal();
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

    // Generate a unique string ID for the new service without relying
    // on the current in-memory list or a pre-fetch.
    const newId = 'svc-' + Date.now();

    const newDesc = {
        id: newId,
        name: name,
        price: price
    };

    // Sync to backend database; on success, the sync function will
    // trigger a fresh reload from the API so the list reflects
    // the actual database contents.
    syncBillDescriptionToDatabase(newDesc);

    // Clear form
    document.getElementById('newDescriptionName').value = '';
    document.getElementById('newDescriptionPrice').value = '';

    const successMessage = translations[currentLanguage].service_added || 'Service added successfully!';
    showTranslatedAlert('service_added', successMessage);
});

// Edit Bill Description Form Submission
document.getElementById('editDescriptionForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('editDescriptionId').value;
    const name = document.getElementById('editDescriptionName').value.trim();
    const price = parseFloat(document.getElementById('editDescriptionPrice').value);

    if (!name || isNaN(price) || price < 0) {
        alert('Please provide valid service name and price.');
        return;
    }

    const descriptions = getBillDescriptions();
    const existing = descriptions.find(d => String(d.id) === String(id));

    if (!existing) {
        console.warn('Bill description to edit not found in cache:', id);
        return;
    }

    // Build an updated description object, preserving fields like notes/createdAt
    const updatedDesc = {
        ...existing,
        name,
        price
    };

    // Sync updated description to backend; on success, syncBillDescriptionToDatabase
    // will call getBillDescriptions() which in turn refreshes the existing services
    // list and consultation act dropdown from the database.
    syncBillDescriptionToDatabase(updatedDesc);
    closeEditDescriptionModal();

    const successMessage = translations[currentLanguage].service_updated || 'Service updated successfully!';
    showTranslatedAlert('service_updated', successMessage);
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

        const newMedicine = {
            id: newId,
            name: name,
            dosage: dosage || ''
        };

        medicines.push(newMedicine);

        saveMedicines(medicines);
        // Sync to backend database
        syncMedicineToDatabase(newMedicine);
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

        const id = document.getElementById('editMedicineId').value;
        const name = document.getElementById('editMedicineName').value.trim();
        const dosage = document.getElementById('editMedicineDosage').value.trim();

        if (!name) {
            alert('Please provide medicine name.');
            return;
        }

        const medicines = getMedicines();
        const index = medicines.findIndex(m => String(m.id) === String(id));

        if (index !== -1) {
            medicines[index].name = name;
            medicines[index].dosage = dosage || '';
            saveMedicines(medicines);
            // Sync updated medicine to backend
            syncMedicineToDatabase(medicines[index]);
            renderMedicinesList();
            closeEditMedicineModal();

            // Update prescription dropdown if it exists
            updatePrescriptionMedicineDropdown();

            const successMessage = window.t ? window.t('medicine_updated', 'Medicine updated successfully!') : 'Medicine updated successfully!';
            showTranslatedAlert('medicine_updated', successMessage);
        }
    });
}
// Prescription UI and handlers moved to medicalPrescription.js

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

    // Save settings locally
    saveCabinetSettings(settings);

    // Sync settings to database
    if (typeof syncCabinetSettingsToDatabase === 'function') {
        syncCabinetSettingsToDatabase(settings);
    }

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

    // Sync to backend database
    if (typeof syncUserToDatabase === 'function') {
        syncUserToDatabase(newUser);
    }

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

    // Sync updated user to backend database
    if (typeof syncUserToDatabase === 'function') {
        syncUserToDatabase(users[index]);
    }

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
    loadStoredPatients(); // Load from localStorage first for immediate display
    // Fetch patients from API (database is the source of truth)
    fetchPatientsFromAPI().catch(err => {
        console.warn('Failed to fetch patients from API on page load:', err);
    });
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
    // Refresh system users from database if API is available
    if (typeof fetchUsersFromAPI === 'function') {
        fetchUsersFromAPI();
    }
    // Consultation handlers moved to consultation.js
});

// Doctor Dashboard Functions
window.loadDoctorDashboard = function () {
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
window.debugSession = function () {
    const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
    console.log('Current session:', session);
    console.log('Role:', session.role);
    console.log('Is Doctor:', session && session.role === 'doctor');
    return session;
};

// Debug function to manually show consultation menu
window.showConsultationMenu = function () {
    const dashboardLink = document.getElementById('doctorDashboardLink');
    const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
    if (dashboardLink) dashboardLink.style.display = '';
    if (dashboardLinkMobile) dashboardLinkMobile.style.display = '';
    console.log('Consultation menu manually shown');
};

// Comprehensive debug function
window.debugConsultationMenu = function () {
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
// showDoctorDashboard now provided by consultation.js

window.closeDoctorDashboard = function () {
    const modal = document.getElementById('doctorDashboardModal');
    if (modal) modal.classList.remove('active');
};
// startConsultation now provided by consultation.js
// updateConsultMenuButtons now provided by consultation.js

// showConsultSection now provided by consultation.js

const labSectionUploads = {
    notes: [],
    results: []
};

window.uploadLabSection = function (section) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.multiple = true;
    input.style.display = 'none';

    input.addEventListener('change', (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
            return;
        }

        // Initialize array if not exists
        if (!labSectionUploads[section]) {
            labSectionUploads[section] = [];
        }

        // Process each file and store as Base64
        let processedCount = 0;
        files.forEach(file => {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                if (typeof window.showTranslatedAlert === 'function') {
                    window.showTranslatedAlert('file_too_large', `File ${file.name} is too large. Maximum size is 10MB.`);
                } else {
                    alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const documentData = {
                    id: 'LAB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: e.target.result, // Base64 encoded data
                    section: section,
                    uploadedAt: new Date().toISOString()
                };
                labSectionUploads[section].push(documentData);
                processedCount++;

                if (processedCount === files.length) {
                    if (files.length > 0) {
                        showTranslatedAlert('lab_files_ready');
                    }
                    if (input.parentNode) {
                        input.parentNode.removeChild(input);
                    }
                }
            };
            reader.onerror = function () {
                if (typeof window.showTranslatedAlert === 'function') {
                    window.showTranslatedAlert('file_upload_error', `Error reading file ${file.name}`);
                } else {
                    alert(`Error reading file ${file.name}`);
                }
                processedCount++;
                if (processedCount === files.length && input.parentNode) {
                    input.parentNode.removeChild(input);
                }
            };
            reader.readAsDataURL(file);
        });
    });

    document.body.appendChild(input);
    input.click();
};

window.printLabSection = function (section) {
    const textareaId = section === 'results' ? 'labResults' : 'labNotes';
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
        showTranslatedAlert('lab_section_empty');
        return;
    }

    const titleKey = section === 'results' ? 'lab_results' : 'lab_notes';
    const fallbackTitle = section === 'results' ? 'Lab Results' : 'Lab Notes';
    const title = window.t ? window.t(titleKey, fallbackTitle) : fallbackTitle;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
        console.warn('Print window blocked by browser');
        return;
    }

    printWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 24px; line-height: 1.6; color: #1f2937; }
                            h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #1d4ed8; }
                            .content { white-space: pre-wrap; border: 1px solid #cbd5f5; padding: 16px; border-radius: 8px; background: #f8fafc; }
                        </style>
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <div class="content">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </body>
                </html>
            `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
};

window.saveLabSection = function (section) {
    const textareaId = section === 'results' ? 'labResults' : 'labNotes';
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    textarea.dataset.lastSavedAt = new Date().toISOString();
    showTranslatedAlert('lab_section_saved');
};

const radiologySectionUploads = {
    diagnostics: [],
    result: []
};

window.uploadRadiologySection = function (section) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.multiple = true;
    input.style.display = 'none';

    input.addEventListener('change', (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
            return;
        }

        // Initialize array if not exists
        if (!radiologySectionUploads[section]) {
            radiologySectionUploads[section] = [];
        }

        // Process each file and store as Base64
        let processedCount = 0;
        files.forEach(file => {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                if (typeof window.showTranslatedAlert === 'function') {
                    window.showTranslatedAlert('file_too_large', `File ${file.name} is too large. Maximum size is 10MB.`);
                } else {
                    alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const documentData = {
                    id: 'RAD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: e.target.result, // Base64 encoded data
                    section: section,
                    uploadedAt: new Date().toISOString()
                };
                radiologySectionUploads[section].push(documentData);
                processedCount++;

                if (processedCount === files.length) {
                    if (files.length > 0) {
                        showTranslatedAlert('lab_files_ready');
                    }
                    if (input.parentNode) {
                        input.parentNode.removeChild(input);
                    }
                }
            };
            reader.onerror = function () {
                if (typeof window.showTranslatedAlert === 'function') {
                    window.showTranslatedAlert('file_upload_error', `Error reading file ${file.name}`);
                } else {
                    alert(`Error reading file ${file.name}`);
                }
                processedCount++;
                if (processedCount === files.length && input.parentNode) {
                    input.parentNode.removeChild(input);
                }
            };
            reader.readAsDataURL(file);
        });
    });

    document.body.appendChild(input);
    input.click();
};

window.printRadiologySection = function (section) {
    const textareaId = section === 'result' ? 'radiologyResult' : 'radiologyDiagnostics';
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
        showTranslatedAlert('lab_section_empty');
        return;
    }

    const titleKey = section === 'result' ? 'radiology_result' : 'diagnostics';
    const fallbackTitle = section === 'result' ? 'Radiology Result' : 'Diagnostics';
    const title = window.t ? window.t(titleKey, fallbackTitle) : fallbackTitle;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
        console.warn('Print window blocked by browser');
        return;
    }

    printWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 24px; line-height: 1.6; color: #1f2937; }
                            h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #1d4ed8; }
                            .content { white-space: pre-wrap; border: 1px solid #cbd5f5; padding: 16px; border-radius: 8px; background: #f8fafc; }
                        </style>
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <div class="content">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </body>
                </html>
            `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
};

window.saveRadiologySection = function (section) {
    const textareaId = section === 'result' ? 'radiologyResult' : 'radiologyDiagnostics';
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    textarea.dataset.lastSavedAt = new Date().toISOString();
    showTranslatedAlert('lab_section_saved');
};

// Edit radiology result - focus on textarea
window.editRadiologyResult = function () {
    const textarea = document.getElementById('radiologyResult');
    if (textarea) {
        textarea.focus();
    }
};

// Edit diagnostics - focus on textarea
window.editDiagnostics = function () {
    const textarea = document.getElementById('radiologyDiagnostics');
    if (textarea) {
        textarea.focus();
    }
};

// Edit lab results - focus on textarea
window.editLabResults = function () {
    const textarea = document.getElementById('labResults');
    if (textarea) {
        textarea.focus();
    }
};

// Edit lab notes - focus on textarea
window.editLabNotes = function () {
    const textarea = document.getElementById('labNotes');
    if (textarea) {
        textarea.focus();
    }
};
// Global variable to store consultation documents temporarily
window.consultationDocuments = window.consultationDocuments || [];

// Handle document upload for consultation
window.handleConsultationDocumentUpload = function (event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('file_too_large', `File ${file.name} is too large. Maximum size is 10MB.`);
            } else {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const documentData = {
                id: 'DOC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result, // Base64 encoded data
                uploadedAt: new Date().toISOString()
            };

            // Add to temporary documents array
            if (!window.consultationDocuments) {
                window.consultationDocuments = [];
            }
            window.consultationDocuments.push(documentData);

            // Refresh the documents list
            loadConsultationDocuments();

            // Clear the file input
            event.target.value = '';
        };
        reader.onerror = function () {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('file_upload_error', `Error reading file ${file.name}`);
            } else {
                alert(`Error reading file ${file.name}`);
            }
        };
        reader.readAsDataURL(file);
    });
};

// Remove document from consultation
window.removeConsultationDocument = function (documentId) {
    if (!window.consultationDocuments) return;

    if (typeof window.showTranslatedConfirm === 'function') {
        if (!window.showTranslatedConfirm('confirm_delete_document', 'Are you sure you want to remove this document?')) {
            return;
        }
    } else {
        if (!confirm('Are you sure you want to remove this document?')) {
            return;
        }
    }

    window.consultationDocuments = window.consultationDocuments.filter(doc => doc.id !== documentId);
    loadConsultationDocuments();
};

// Preview consultation document
window.previewConsultationDocument = function (documentId) {
    if (!window.consultationDocuments) return;
    const doc = window.consultationDocuments.find(d => d.id === documentId);
    if (!doc) return;

    // Check if it's an image
    if (doc.type && doc.type.startsWith('image/')) {
        const previewWindow = window.open('', '_blank', 'width=900,height=700');
        if (previewWindow) {
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>${doc.name}</title>
                        <style>
                            body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }
                            img { max-width: 100%; max-height: 90vh; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        </style>
                    </head>
                    <body>
                        <img src="${doc.data}" alt="${doc.name}">
                    </body>
                </html>
            `);
            previewWindow.document.close();
        }
    } else {
        // For non-image files, try to open in new tab or download
        const link = document.createElement('a');
        link.href = doc.data;
        link.download = doc.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Initialize patient documents array for add form
window.patientDocuments = window.patientDocuments || [];
// Initialize documents array for edit patient form
window.editPatientDocuments = window.editPatientDocuments || [];

// Handle document upload for patient form
window.handlePatientDocumentUpload = function (event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('file_too_large', `File ${file.name} is too large. Maximum size is 10MB.`);
            } else {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const documentData = {
                id: 'DOC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result, // Base64 encoded data
                uploadedAt: new Date().toISOString()
            };

            // Add to temporary documents array
            if (!window.patientDocuments) {
                window.patientDocuments = [];
            }
            window.patientDocuments.push(documentData);

            // Refresh the documents list
            loadPatientFormDocuments();

            // Clear the file input
            event.target.value = '';
        };
        reader.onerror = function () {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('file_upload_error', `Error reading file ${file.name}`);
            } else {
                alert(`Error reading file ${file.name}`);
            }
        };
        reader.readAsDataURL(file);
    });
};

// Remove document from patient form
window.removePatientDocument = function (documentId) {
    if (!window.patientDocuments) return;

    if (typeof window.showTranslatedConfirm === 'function') {
        if (!window.showTranslatedConfirm('confirm_delete_document', 'Are you sure you want to remove this document?')) {
            return;
        }
    } else {
        if (!confirm('Are you sure you want to remove this document?')) {
            return;
        }
    }

    window.patientDocuments = window.patientDocuments.filter(doc => doc.id !== documentId);
    loadPatientFormDocuments();
};

// Preview patient document
window.previewPatientFormDocument = function (documentId) {
    if (!window.patientDocuments) return;
    const doc = window.patientDocuments.find(d => d.id === documentId);
    if (!doc) return;

    // Check if it's an image
    if (doc.type && doc.type.startsWith('image/')) {
        const previewWindow = window.open('', '_blank', 'width=900,height=700');
        if (previewWindow) {
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>${doc.name}</title>
                        <style>
                            body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }
                            img { max-width: 100%; max-height: 90vh; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        </style>
                    </head>
                    <body>
                        <img src="${doc.data}" alt="${doc.name}">
                    </body>
                </html>
            `);
            previewWindow.document.close();
        }
    } else {
        // For non-image files, try to open in new tab or download
        const link = document.createElement('a');
        link.href = doc.data;
        link.download = doc.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Load and display patient documents in the form
function loadPatientFormDocuments() {
    const documentsList = document.getElementById('patientFormDocumentsList');
    if (!documentsList) return;

    if (!window.patientDocuments || window.patientDocuments.length === 0) {
        documentsList.innerHTML = `
            <div class="text-center py-4 text-gray-500 text-sm">
                <p data-translate="no_documents_uploaded">No documents uploaded yet.</p>
            </div>
        `;
        if (window.I18n && window.I18n.walkAndTranslate) {
            window.I18n.walkAndTranslate();
        }
        return;
    }

    documentsList.innerHTML = window.patientDocuments.map(doc => {
        const docDate = new Date(doc.uploadedAt);
        const isImage = doc.type && doc.type.startsWith('image/');
        const fileIcon = isImage
            ? '<svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'
            : '<svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';

        return `
            <div class="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                    <div class="flex items-center flex-1 min-w-0">
                        ${fileIcon}
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-900 truncate">${doc.name}</div>
                            <div class="text-sm text-gray-500">${(doc.size / 1024).toFixed(1)} KB • ${docDate.toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 ml-3">
                        <button type="button" onclick="previewPatientFormDocument('${doc.id}')" class="btn btn-sm btn-secondary" title="Preview">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                        <button type="button" onclick="removePatientDocument('${doc.id}')" class="btn btn-sm btn-danger" title="Remove">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.I18n && window.I18n.walkAndTranslate) {
        window.I18n.walkAndTranslate();
    }
}

// Load documents for the current consultation patient















