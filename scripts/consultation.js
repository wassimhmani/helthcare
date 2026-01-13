// Global consultation module
// Expose showDoctorDashboard early to prevent timing issues
window.showDoctorDashboard = window.showDoctorDashboard || function() {
  console.warn('showDoctorDashboard placeholder - will be replaced when module loads');
};

(function(){
  function isDoctor(){
    try { const s = JSON.parse(localStorage.getItem('medconnect_session')||'{}'); return s && s.role === 'doctor'; } catch { return false; }
  }

  function closeDoctorDashboard(){
    const modal = document.getElementById('doctorDashboardModal');
    if (modal) modal.classList.remove('active');
  }

  // Populate patient's past consultations list (sidebar in patient details)
  function loadPatientConsultations(patientId){
    const consultations = getConsultations();
    const patientConsultations = consultations
      .filter(c => c.patientId === patientId)
      .sort((a,b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    const consultationsList = document.getElementById('patientConsultationsList');
    if (!consultationsList) return;
    if (patientConsultations.length === 0){
      consultationsList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p data-translate="no_consultations">${t('no_consultations','No consultations recorded for this patient yet.')}</p>
        </div>`;
      return;
    }
    consultationsList.innerHTML = patientConsultations.map(consultation => {
      const dt = new Date(consultation.createdAt || consultation.date);
      const consultationDate = dt.toLocaleDateString();
      const consultationTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                <strong data-translate="doctor">${t('doctor','Doctor')}:</strong> ${consultation.doctor || consultation.doctorName || 'N/A'}
              </div>
            </div>
            <span class="badge badge-secondary">ID: ${consultation.id}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
            ${consultation.height ? `<div class="flex items-center"><span><strong>${t('height','Height')}:</strong> ${consultation.height} cm</span></div>` : ''}
            ${consultation.weight ? `<div class="flex items-center"><span><strong>${t('weight','Weight')}:</strong> ${consultation.weight} kg</span></div>` : ''}
            ${consultation.bpSystolic && consultation.bpDiastolic ? `<div class="flex items-center"><span><strong>${t('blood_pressure','BP')}:</strong> ${consultation.bpSystolic}/${consultation.bpDiastolic}</span></div>` : ''}
            ${consultation.temperature ? `<div class="flex items-center"><span><strong>${t('temperature','Temp')}:</strong> ${consultation.temperature}°C</span></div>` : ''}
          </div>
          ${consultation.reason ? `<div class="mb-2"><span class="font-semibold text-gray-700" data-translate="reason">${t('reason','Reason')}:</span><p class="text-gray-600 text-sm mt-1">${consultation.reason}</p></div>` : ''}
          ${consultation.diagnosis ? `<div class="mb-2"><span class="font-semibold text-gray-700" data-translate="diagnosis">${t('diagnosis','Diagnosis')}:</span><p class="text-gray-600 text-sm mt-1">${consultation.diagnosis}</p></div>` : ''}
          ${consultation.clinicalExam ? `<div class="mb-2"><span class="font-semibold text-gray-700" data-translate="clinical_examination">${t('clinical_examination','Clinical Examination')}:</span><p class="text-gray-600 text-sm mt-1">${consultation.clinicalExam}</p></div>` : ''}
        </div>`;
    }).join('');
  }
  function t(key, fallback){ try { return (window.t ? window.t(key, fallback) : fallback); } catch { return fallback; } }

  function getPatients(){
    try { return JSON.parse(localStorage.getItem('healthcarePatients')||'[]'); } catch { return []; }
  }
  
  // Alias for backward compatibility in case somewhere getPatient() is called instead of getPatients()
  function getPatient(){
    return getPatients();
  }
  
  // Make these functions globally available
  window.getPatients = getPatients;
  window.getPatient = getPatient;
  window.todayConsultationsFromAPI = window.todayConsultationsFromAPI || [];
  function getConsultations(){
    try {
      const raw = JSON.parse(localStorage.getItem('consultations')||'[]') || [];
      let changed = false;
      const normalized = raw.map(c => {
        if (c && !c.clinicalNote) {
          const note = c.clinicalNote || c.vitalNotes || c.notes;
          if (note) {
            changed = true;
            return { ...c, clinicalNote: note };
          }
        }
        return c;
      });
      if (changed) {
        localStorage.setItem('consultations', JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  }
  function saveConsultations(list){ localStorage.setItem('consultations', JSON.stringify(list)); }

  function computeIMC(heightCm, weightKg){
    if (!heightCm || !weightKg) return { bmi: null, category: null };
    const m = heightCm / 100; const bmi = weightKg / (m*m);
    let cat = null;
    if (bmi < 18.5) cat = 'Underweight'; else if (bmi < 25) cat = 'Normal'; else if (bmi < 30) cat = 'Overweight'; else cat = 'Obesity';
    return { bmi: +bmi.toFixed(1), category: cat };
  }

  function updateConsultMenuButtons(){ if (typeof window.updateConsultMenuButtons === 'function') window.updateConsultMenuButtons(); }
  function updateModalTranslations(){ if (typeof window.updateModalTranslations === 'function') window.updateModalTranslations(); }

  function populateConsultationPatientDropdown(){
    const patientSelect = document.getElementById('consultPatientSelect');
    if (!patientSelect) return;
    
    const currentValue = patientSelect.value; // Save current selection
    
    patientSelect.innerHTML = `<option value="">${t('choose_patient', 'Choose a patient...')}</option>`;
    
    // Try to get patients from multiple sources
    let patients = getPatients();
    if (patients.length === 0 && typeof window.storedPatients !== 'undefined' && Array.isArray(window.storedPatients)) {
      patients = window.storedPatients;
    }
    
    if (patients.length === 0) {
      patientSelect.innerHTML = `<option value="">${t('no_patients_available', 'No patients available. Add a patient first.')}</option>`;
      return;
    }
    
    patients.forEach(patient => {
      const option = document.createElement('option');
      option.value = patient.id;
      option.textContent = `${patient.fullName} (${patient.fileNumber || 'No file#'}) - ${patient.phone || ''}`;
      patientSelect.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentValue) {
      patientSelect.value = currentValue;
    }
  }
  
  // Expose globally
  window.populateConsultationPatientDropdown = populateConsultationPatientDropdown;
  
  window.handleConsultationPatientSelection = function(){
    const patientSelect = document.getElementById('consultPatientSelect');
    const patientIdInput = document.getElementById('consultPatientId');
    const patientInput = document.getElementById('consultPatient');
    
    if (!patientSelect || !patientIdInput) return;
    
    const selectedPatientId = patientSelect.value;
    
    if (!selectedPatientId) {
      patientIdInput.value = '';
      if (patientInput) patientInput.value = '';
      loadConsultationPatientDetails();
      return;
    }
    
    const patients = getPatients();
    const selectedPatient = patients.find(p => String(p.id) === String(selectedPatientId));
    
    if (selectedPatient) {
      patientIdInput.value = selectedPatient.id;
      const age = selectedPatient.dateOfBirth ? (typeof window.calculateAge === 'function' ? window.calculateAge(selectedPatient.dateOfBirth) : null) : null;
      const patientDisplay = `${selectedPatient.fullName}${age != null ? ` (${age})` : ''} - ${selectedPatient.phone || ''}`;
      if (patientInput) patientInput.value = patientDisplay;
      
      // Load patient details
      loadConsultationPatientDetails();
    }
  };

  function showConsultationModal(){
    if (!isDoctor()) { if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('consultations_doctors_only'); return; }
    const consultationModal = document.getElementById('consultationModal');
    const patientInput = document.getElementById('consultPatient');
    const patientIdInput = document.getElementById('consultPatientId');
    
    // Only clear if not already set (preserve patient from previous modal)
    if (patientInput && !patientInput.value) patientInput.value='';
    if (patientIdInput && !patientIdInput.value) patientIdInput.value='';

    // Patient is now set from previous modal, no dropdown needed

    // Reset documents array for new consultation
    if (!window.editingConsultationId) {
      window.consultationDocuments = [];
      
      // Reset button text to "Save Consultation" for new consultations
      const submitButton = document.querySelector('#consultationForm button[type="submit"]');
      if (submitButton) {
        submitButton.setAttribute('data-translate', 'save_consultation');
        submitButton.textContent = window.t ? window.t('save_consultation', 'Save Consultation') : 'Save Consultation';
      }
    }

    // Reset prescription UI via module (kept separated)
    if (typeof window.renderPrescriptionMedicinesList==='function') window.renderPrescriptionMedicinesList();

    // Hide all sections then show consultation by default
    document.querySelectorAll('.consult-section').forEach(sec=>sec.classList.add('hidden'));
    const consultSection = document.getElementById('consultSectionConsultation');
    if (consultSection) consultSection.classList.remove('hidden');

    // Activate correct menu button
    document.querySelectorAll('.consult-menu-btn').forEach(btn=>{
      btn.classList.remove('active');
      btn.style.opacity='0.8';
      if (btn.getAttribute('data-section')==='consultation') { btn.classList.add('active'); btn.style.opacity='1'; }
    });

    // Wire BMI live updates
    const h = document.getElementById('consultHeight');
    const w = document.getElementById('consultWeight');
    const imcEl = document.getElementById('consultIMCValue');
    const catEl = document.getElementById('consultBMICategory');
    const onChange = ()=>{
      const hv = parseFloat((h?.value||'').toString().replace(',', '.'));
      const wv = parseFloat((w?.value||'').toString().replace(',', '.'));
      if (!isFinite(hv)||!isFinite(wv)||hv<=0||wv<=0){ if(imcEl) imcEl.textContent='—'; if(catEl){catEl.textContent=''; catEl.className='text-sm text-gray-500';} return; }
      const {bmi, category} = computeIMC(hv, wv);
      if (imcEl) imcEl.textContent = (bmi!=null? bmi.toFixed(1):'—');
      if (catEl) { catEl.textContent = category || ''; catEl.className = category ? ({Underweight:'badge bg-yellow-100 text-yellow-800',Normal:'badge bg-green-100 text-green-800',Overweight:'badge bg-orange-100 text-orange-800',Obesity:'badge bg-red-100 text-red-800'})[category] : 'text-sm text-gray-500'; }
    };
    if (h && w){ h.removeEventListener('input', onChange); w.removeEventListener('input', onChange); h.addEventListener('input', onChange); w.addEventListener('input', onChange); setTimeout(onChange, 50); }

    // Show modal with correct z-index when dashboard is open
    const dashboardModal = document.getElementById('doctorDashboardModal');
    if (consultationModal){ consultationModal.style.zIndex = (dashboardModal && dashboardModal.classList.contains('active')) ? '3000' : ''; consultationModal.classList.add('active'); }
    
    // Load patient details from API if patient ID is set
    if (patientIdInput && patientIdInput.value) {
      setTimeout(() => {
        loadConsultationPatientDetails();
      }, 300);
    }

    // Enable patient dropdown if exists (for appointment modal)
    const appointmentPatientSelect = document.getElementById('patientSelection') || document.getElementById('patientSelect');
    if (appointmentPatientSelect) appointmentPatientSelect.disabled = false;

    updateConsultMenuButtons();
    updateModalTranslations();
  }

  function closeConsultationModal(){
    const modal = document.getElementById('consultationModal');
    const form = document.getElementById('consultationForm');
    if (modal){ modal.classList.remove('active'); modal.style.zIndex=''; }
    if (form) form.reset();
    const imcEl = document.getElementById('consultIMCValue'); if (imcEl) imcEl.textContent='—';
    const cat = document.getElementById('consultBMICategory'); if (cat){ cat.textContent=''; cat.className='text-sm text-gray-500'; }
    if (typeof window.renderPrescriptionMedicinesList==='function') window.renderPrescriptionMedicinesList();
    document.querySelectorAll('.consult-section').forEach(sec=>sec.classList.add('hidden'));
    const consultSection = document.getElementById('consultSectionConsultation'); if (consultSection) consultSection.classList.remove('hidden');
    
    // Clear documents and editing state when closing
    window.consultationDocuments = [];
    window.editingConsultationId = null;
    
    // Reset button text to "Save Consultation"
    const submitButton = document.querySelector('#consultationForm button[type="submit"]');
    if (submitButton) {
      submitButton.setAttribute('data-translate', 'save_consultation');
      submitButton.textContent = window.t ? window.t('save_consultation', 'Save Consultation') : 'Save Consultation';
    }
  }

  // Load patient details into consultation modal
  function loadConsultationPatientDetails(){
    const patientIdInput = document.getElementById('consultPatientId');
    const patientId = patientIdInput ? patientIdInput.value : null;
    const detailsInfo = document.getElementById('consultPatientDetailsInfo');
    const histEl = document.getElementById('consultPatientHistory');
    
    if (!patientId || !detailsInfo) {
      if (detailsInfo) {
        detailsInfo.innerHTML = '<p class="text-gray-500 text-sm" data-translate="select_patient_first">Please select a patient first.</p>';
      }
      if (histEl) {
        histEl.textContent = t('no_history_available', 'No history available.');
      }
      return;
    }
    
    // Show loading state
    detailsInfo.innerHTML = '<p class="text-gray-500 text-sm" data-translate="loading">Loading...</p>';
    if (histEl) {
      histEl.textContent = '';
    }
    
    // Fetch patient details from API
    fetch(`api/get_patient.php?id=${encodeURIComponent(patientId)}`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Patient not found');
          }
          throw new Error('Failed to fetch patient details');
        }
        return response.json();
      })
      .then(data => {
        if (data.status === 'ok' && data.patient) {
          displayPatientDetailsInConsultation(data.patient, detailsInfo, histEl);
        } else {
          throw new Error(data.message || 'Patient not found');
        }
      })
      .catch(error => {
        console.error('Error fetching patient details:', error);
        detailsInfo.innerHTML = '<p class="text-gray-500 text-sm" data-translate="patient_not_found">Patient not found.</p>';
        if (histEl) histEl.textContent = t('no_history_available', 'No history available.');
      });
  }
  
  function displayPatientDetailsInConsultation(patient, detailsInfo, histEl){
    if (!patient || !detailsInfo) return;
    
    const consultations = getConsultations();
    const visitsCount = consultations.filter(c => c.patientId === patient.id).length;
    const age = patient.dateOfBirth ? (typeof window.calculateAge === 'function' ? window.calculateAge(patient.dateOfBirth) : null) : null;
    const genderText = patient.gender ? t(patient.gender.toLowerCase(), patient.gender) : 'N/A';
    
    detailsInfo.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('full_name','Full Name')}:</span><span class="text-gray-900">${patient.fullName||'N/A'}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('file_number','File Number')}:</span><span class="text-gray-900">${patient.fileNumber||'N/A'}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('cin_passport','CIN/Passport')}:</span><span class="text-gray-900">${patient.cinPassport||'N/A'}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('email','Email')}:</span><span class="text-gray-900">${patient.email||'N/A'}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('phone','Phone')}:</span><span class="text-gray-900">${patient.phone||'N/A'}</span></div>
      </div>
      <div class="space-y-2">
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('date_of_birth','Date of Birth')}:</span><span class="text-gray-900">${patient.dateOfBirth?new Date(patient.dateOfBirth).toLocaleDateString():'N/A'}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('age','Age')}:</span><span class="text-gray-900">${age??'N/A'}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('gender','Gender')}:</span><span class="text-gray-900">${genderText}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('address','Address')}:</span><span class="text-gray-900">${patient.address||'N/A'}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('number_of_visits','Number of Visits')}:</span><span class="font-bold text-blue-600">${visitsCount}</span></div>
        <div class="flex items-start"><span class="font-semibold text-gray-700 w-32">${t('registered','Registered')}:</span><span class="text-gray-900">${patient.createdAt?new Date(patient.createdAt).toLocaleDateString():'N/A'}</span></div>
      </div>`;
    
    if (histEl) {
      histEl.textContent = (patient.medicalHistory && patient.medicalHistory.trim()) ? patient.medicalHistory : t('no_history_available','No history available.');
    }
    
    // Load patient consultations
    if (typeof window.loadPatientConsultations === 'function') {
      window.loadPatientConsultations(patient.id);
    }
  }

  function showConsultSection(sectionName){
    const sections = document.querySelectorAll('.consult-section');
    sections.forEach(s=>s.classList.add('hidden'));
    const buttons = document.querySelectorAll('.consult-menu-btn');
    buttons.forEach(btn=>{ btn.classList.remove('active'); btn.style.opacity='0.8'; if (btn.getAttribute('data-section')===sectionName){ btn.classList.add('active'); btn.style.opacity='1'; }});
    
    // Load patient details when patient section is shown
    if (sectionName === 'patient') {
      setTimeout(() => {
        loadConsultationPatientDetails();
      }, 100);
    }
    
    // Load documents when documents section is shown
    if (sectionName === 'documents' && typeof window.loadConsultationDocuments === 'function') {
      setTimeout(() => {
        window.loadConsultationDocuments();
      }, 100);
    }
    const selectedId = 'consultSection' + sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    const selected = document.getElementById(selectedId);
    if (selected) selected.classList.remove('hidden');
  }

  function viewConsultationDetail(consultationId){
    const consultations = getConsultations();
    const consultation = consultations.find(c=>c.id===consultationId);
    if (!consultation){ if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('Consultation not found.'); return; }
    const patients = (window.storedPatients && Array.isArray(window.storedPatients)) ? window.storedPatients : getPatients();
    const patient = patients.find(p=>p.id===consultation.patientId);
    const patientName = patient ? patient.fullName : 'Unknown Patient';
    const consultationTime = new Date(consultation.createdAt).toLocaleString('en-US', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const content = document.getElementById('consultationDetailContent'); if (!content) return;
    content.innerHTML = `
      <div class="card p-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">${t('patient_information','Patient Information')}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><strong>${t('patient_name','Patient Name')}:</strong> ${patientName}</div>
          <div><strong>${t('date_time','Date & Time')}:</strong> ${consultationTime}</div>
          <div><strong>${t('doctor','Doctor')}:</strong> ${consultation.doctor || 'N/A'}</div>
          <div><strong>${t('payment_status','Payment Status')}:</strong> ${consultation.paymentStatus==='paying' ? t('paying_patient','Paying Patient') : t('non_paying_patient','Non-Paying Patient')}</div>
        </div>
      </div>
      <div class="card p-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">${t('vital_signs','Vital Signs')}</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          ${consultation.height ? `<div><strong>${t('height','Height')}:</strong> ${consultation.height} cm</div>` : ''}
          ${consultation.weight ? `<div><strong>${t('weight','Weight')}:</strong> ${consultation.weight} kg</div>` : ''}
          ${consultation.imc ? `<div><strong>${t('bmi','IMC/BMI')}:</strong> ${consultation.imc} (${consultation.bmiCategory || 'N/A'})</div>` : ''}
          ${consultation.temperature ? `<div><strong>${t('temperature','Temperature')}:</strong> ${consultation.temperature} °C</div>` : ''}
          ${consultation.heartRate ? `<div><strong>${t('heart_rate','Heart Rate')}:</strong> ${consultation.heartRate} bpm</div>` : ''}
          ${consultation.bloodSugar ? `<div><strong>${t('blood_sugar','Blood Sugar')}:</strong> ${consultation.bloodSugar} mg/dL</div>` : ''}
          ${consultation.bpSystolic && consultation.bpDiastolic ? `<div><strong>${t('blood_pressure','Blood Pressure')}:</strong> ${consultation.bpSystolic}/${consultation.bpDiastolic} mmHg</div>` : ''}
        </div>
      </div>
      <div class="card p-4">
        <h3 class="text-lg font-semibold mb-3 text-gray-900">${t('clinical_notes','Clinical Note')}</h3>
        <div class="text-sm text-gray-700 space-y-1">
          <div class="whitespace-pre-wrap">${consultation.clinicalNote}</div>
          ${consultation.consultationAct ? `<div><strong>${t('consultation_act','Consultation Act')}:</strong> ${consultation.consultationAct}</div>` : ''}
        </div>
      </div>
      <div id="consultationRadiologyContainer"></div>
      <div id="consultationLabAssessmentContainer"></div>
      ${consultation.prescription ? `
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-900">${t('prescription','Prescription')}</h3>
            <button data-consultation-id="${consultationId}" class="btn-print-prescription btn btn-sm btn-primary" type="button">${t('print_prescription','Print Prescription')}</button>
          </div>
          <div class="text-sm text-gray-700 whitespace-pre-wrap">${consultation.prescription}</div>
        </div>` : ''}
    `;

    // Load Radiology Results from API and render section, with fallback to consultation fields
    try {
      const radContainer = document.getElementById('consultationRadiologyContainer');
      if (radContainer) {
        const apiUrl = `api/get_radiology_results.php?consultation_id=${encodeURIComponent(consultationId)}`;
        fetch(apiUrl)
          .then(res => res.json().catch(() => null))
          .then(data => {
            if (!radContainer) return;

            const items = data && data.status === 'ok' && Array.isArray(data.radiologyResults)
              ? data.radiologyResults
              : [];

            if (items.length > 0) {
              radContainer.innerHTML = `
                <div class="card p-4">
                  <h3 class="text-lg font-semibold mb-4 text-gray-900">${t('radiology_results','Radiology Results')}</h3>
                  <div class="space-y-3">
                    ${items.map(r => `
                      <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div class="flex items-center justify-between mb-2 text-xs text-gray-600">
                          <span>${r.examType || t('radiology_results','Radiology Results')}</span>
                          ${r.examDate ? `<span>${new Date(r.examDate).toLocaleDateString()}</span>` : ''}
                        </div>
                        ${r.radiologyResult ? `<div class="mb-2"><h4 class="text-sm font-semibold text-gray-700 mb-1">${t('radiology_result','Radiology Result')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">${r.radiologyResult}</div></div>` : ''}
                        ${r.radiologyDiagnostics ? `<div class="mb-2"><h4 class="text-sm font-semibold text-gray-700 mb-1">${t('diagnostics','Diagnostics')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">${r.radiologyDiagnostics}</div></div>` : ''}
                        ${r.notes ? `<div><h4 class="text-sm font-semibold text-gray-700 mb-1">${t('notes','Notes')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">${r.notes}</div></div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            } else if (consultation.radiologyResult || consultation.radiologyDiagnostics) {
              // Fallback to local consultation fields when no DB records exist
              radContainer.innerHTML = `
                <div class="card p-4">
                  <h3 class="text-lg font-semibold mb-4 text-gray-900">${t('radiology_results','Radiology Results')}</h3>
                  ${consultation.radiologyResult ? `<div class="mb-4"><h4 class="text-sm font-semibold text-gray-700 mb-2">${t('radiology_result','Radiology Result')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.radiologyResult}</div></div>` : ''}
                  ${consultation.radiologyDiagnostics ? `<div><h4 class="text-sm font-semibold text-gray-700 mb-2">${t('diagnostics','Diagnostics')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.radiologyDiagnostics}</div></div>` : ''}
                </div>
              `;
            } else {
              radContainer.innerHTML = '';
            }
          })
          .catch(err => {
            console.error('Error loading radiology results:', err);
          });
      }
    } catch (e) {
      console.error('Exception while loading radiology results:', e);
    }

    // Load Lab Assessments from API and render section, with fallback to consultation fields
    try {
      const labContainer = document.getElementById('consultationLabAssessmentContainer');
      if (labContainer) {
        const apiUrl = `api/get_lab_assessments.php?consultation_id=${encodeURIComponent(consultationId)}`;
        fetch(apiUrl)
          .then(res => res.json().catch(() => null))
          .then(data => {
            if (!labContainer) return;

            const labAssessments = data && data.status === 'ok' && Array.isArray(data.labAssessments)
              ? data.labAssessments
              : [];

            if (labAssessments.length > 0) {
              labContainer.innerHTML = `
                <div class="card p-4">
                  <h3 class="text-lg font-semibold mb-4 text-gray-900">${t('lab_assessment','Lab Assessment')}</h3>
                  <div class="space-y-3">
                    ${labAssessments.map(a => `
                      <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div class="flex items-center justify-between mb-2 text-xs text-gray-600">
                          <span>${a.assessmentType || t('lab_assessment','Lab Assessment')}</span>
                          ${a.labDate ? `<span>${new Date(a.labDate).toLocaleDateString()}</span>` : ''}
                        </div>
                        ${a.results ? `<div class="mb-2"><h4 class="text-sm font-semibold text-gray-700 mb-1">${t('lab_results','Lab Results')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">${a.results}</div></div>` : ''}
                        ${a.notes ? `<div><h4 class="text-sm font-semibold text-gray-700 mb-1">${t('lab_notes','Lab Notes')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">${a.notes}</div></div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            } else if (consultation.labResults || consultation.labNotes) {
              // Fallback to local consultation fields when no DB records exist
              labContainer.innerHTML = `
                <div class="card p-4">
                  <h3 class="text-lg font-semibold mb-4 text-gray-900">${t('lab_assessment','Lab Assessment')}</h3>
                  ${consultation.labResults ? `<div class="mb-4"><h4 class="text-sm font-semibold text-gray-700 mb-2">${t('lab_results','Lab Results')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.labResults}</div></div>` : ''}
                  ${consultation.labNotes ? `<div><h4 class="text-sm font-semibold text-gray-700 mb-2">${t('lab_notes','Lab Notes')}</h4><div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${consultation.labNotes}</div></div>` : ''}
                </div>
              `;
            } else {
              labContainer.innerHTML = '';
            }
          })
          .catch(err => {
            console.error('Error loading lab assessments:', err);
          });
      }
    } catch (e) {
      console.error('Exception while loading lab assessments:', e);
    }

    // Certificates section
    try {
      const medicalCertificates = JSON.parse(localStorage.getItem('medical_certificates')||'[]');
      const consultationCertificates = medicalCertificates.filter(c=>c.consultationId===consultationId);
      if (consultationCertificates.length>0){
        content.innerHTML += `
          <div class="card p-4">
            <div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold text-gray-900">${t('medical_certificates','Medical Certificates')}</h3></div>
            <div class="space-y-3">
              ${consultationCertificates.map(cert=>`
                <div class="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2"><span class="font-semibold text-gray-700">${cert.certType ? cert.certType.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()) : 'Medical Certificate'}</span></div>
                    <span class="text-xs text-gray-500">${new Date(cert.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                    ${cert.startDate ? `<div><strong>${t('start_date','Start Date')}:</strong> ${new Date(cert.startDate).toLocaleDateString()}</div>` : ''}
                    ${cert.endDate ? `<div><strong>${t('end_date','End Date')}:</strong> ${new Date(cert.endDate).toLocaleDateString()}</div>` : ''}
                    ${cert.restPeriod ? `<div><strong>${t('rest_period','Rest Period')}:</strong> ${cert.restPeriod} ${t('days','days')}</div>` : ''}
                  </div>
                  ${cert.notes ? `<div class="text-sm mb-2"><strong>${t('notes','Notes')}:</strong><div class="mt-1 text-gray-600">${cert.notes}</div></div>` : ''}
                  <div class="mt-3 pt-3 border-t border-green-200">
                    <button data-cert-id="${cert.id}" class="btn-print-certificate btn btn-sm btn-primary" type="button">${t('print_certificate','Print Certificate')}</button>
                  </div>
                </div>`).join('')}
            </div>
          </div>`;
      }
    } catch {}

    updateModalTranslations();

    // Wire print buttons
    setTimeout(()=>{
      const detailContent = document.getElementById('consultationDetailContent');
      if (detailContent){
        const clickHandler = (e)=>{
          const certBtn = e.target.closest('.btn-print-certificate');
          if (certBtn){ e.preventDefault(); e.stopPropagation(); const certId = certBtn.getAttribute('data-cert-id'); if (certId && typeof window.printMedicalCertificate==='function') window.printMedicalCertificate(certId); }
          const rxBtn = e.target.closest('.btn-print-prescription');
          if (rxBtn){ e.preventDefault(); e.stopPropagation(); const cid = rxBtn.getAttribute('data-consultation-id'); if (cid && typeof window.printPrescription==='function') window.printPrescription(cid); }
        };
        detailContent.addEventListener('click', clickHandler);
      }
    }, 100);

    const modal = document.getElementById('consultationDetailModal'); if (modal) modal.classList.add('active');
  }

  function closeConsultationDetail(){
    const modal = document.getElementById('consultationDetailModal');
    if (modal){ modal.classList.remove('active'); modal.style.zIndex=''; }
  }

  function submitConsultationForm(e){
    e.preventDefault();
    if (!isDoctor()) { if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('consultations_doctors_only'); return; }

    let patientId = document.getElementById('consultPatientId')?.value || '';
    if (!patientId){
      const display = (document.getElementById('consultPatient')?.value || '').trim();
      if (display){
        try {
          const patients = getPatients();
          const namePart = display.split('(')[0].split(' - ')[0].trim();
          const match = patients.find(p => (p.fullName || '').trim().toLowerCase() === namePart.toLowerCase());
          if (match) { patientId = match.id; const hidden = document.getElementById('consultPatientId'); if (hidden) hidden.value = patientId; }
        } catch {}
      }
      if (!patientId && window.currentConsultationPatientId){ patientId = window.currentConsultationPatientId; const hidden = document.getElementById('consultPatientId'); if (hidden) hidden.value = patientId; }
    }

    const heightVal = document.getElementById('consultHeight')?.value;
    const weightVal = document.getElementById('consultWeight')?.value;
    const tempVal = document.getElementById('consultTemperature')?.value;
    const heartRateVal = document.getElementById('consultHeartRate')?.value;
    const bloodSugarVal = document.getElementById('consultBloodSugar')?.value;
    const bpInputVal = document.getElementById('consultBloodPressure')?.value;
    const consultationActSelect = document.getElementById('consultationAct');
    let consultationAct = '';
    if (consultationActSelect) {
      if (consultationActSelect.multiple) {
        const selectedOptions = Array.from(consultationActSelect.selectedOptions || []);
        const acts = selectedOptions.map(o => o.value).filter(v => v && v.trim());
        consultationAct = acts.join(' | ');
      } else {
        consultationAct = consultationActSelect.value || '';
      }
    }
    // Clinical note: use the Clinical Note textarea; fallback to old vital-notes field only if present
    const clinicalNoteInput = document.getElementById('consultNotes') || document.getElementById('consultVitalNotes');
    const clinicalNote = clinicalNoteInput && typeof clinicalNoteInput.value === 'string'
      ? clinicalNoteInput.value.trim()
      : '';
    const radiologyResult = document.getElementById('radiologyResult')?.value.trim() || '';
    const radiologyDiagnostics = document.getElementById('radiologyDiagnostics')?.value.trim() || '';
    const labResults = document.getElementById('labResults')?.value.trim() || '';
    const labNotes = document.getElementById('labNotes')?.value.trim() || '';
    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked')?.value || 'paying';

    // Prescription: rely on textarea kept in sync by medicalPrescription.js
    const prescription = document.getElementById('consultPrescription')?.value.trim() || '';

    // True edit only when editingConsultationId is set (e.g. via Update Last Consultation / Edit)
    const isEditingConsultation = !!window.editingConsultationId;

    if (!patientId){ if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('select_patient_first','Please select a patient first.'); return; }

    const height = heightVal ? parseFloat(heightVal) : null;
    const weight = weightVal ? parseFloat(weightVal) : null;
    const temperature = tempVal ? parseFloat(tempVal) : null;
    const heartRate = heartRateVal ? parseInt(heartRateVal,10) : null;
    const bloodSugar = bloodSugarVal ? parseInt(bloodSugarVal,10) : null;
    const bloodPressure = bpInputVal ? bpInputVal.trim() : '';
    let bpSystolic=null, bpDiastolic=null;
    if (bpInputVal && typeof bpInputVal === 'string'){
      const m = bpInputVal.trim().match(/(\d{2,3})\s*\/\s*(\d{2,3})/); if (m){ bpSystolic = parseInt(m[1],10); bpDiastolic = parseInt(m[2],10); }
    }

    const {bmi, category} = computeIMC(height||0, weight||0);

    // Get documents from global variable
    const documents = (window.consultationDocuments && Array.isArray(window.consultationDocuments)) ? window.consultationDocuments : [];
    
    // Get radiology and lab uploaded files
    const radiologyFiles = [];
    if (typeof radiologySectionUploads !== 'undefined') {
      if (radiologySectionUploads.diagnostics && Array.isArray(radiologySectionUploads.diagnostics)) {
        radiologyFiles.push(...radiologySectionUploads.diagnostics.map(f => ({...f, source: 'radiology', section: 'diagnostics'})));
      }
      if (radiologySectionUploads.result && Array.isArray(radiologySectionUploads.result)) {
        radiologyFiles.push(...radiologySectionUploads.result.map(f => ({...f, source: 'radiology', section: 'result'})));
      }
    }
    
    const labFiles = [];
    if (typeof labSectionUploads !== 'undefined') {
      if (labSectionUploads.notes && Array.isArray(labSectionUploads.notes)) {
        labFiles.push(...labSectionUploads.notes.map(f => ({...f, source: 'lab', section: 'notes'})));
      }
      if (labSectionUploads.results && Array.isArray(labSectionUploads.results)) {
        labFiles.push(...labSectionUploads.results.map(f => ({...f, source: 'lab', section: 'results'})));
      }
    }
    
    // Combine all documents
    const allDocuments = [...documents, ...radiologyFiles, ...labFiles];

    const consultations = getConsultations();
    let id = isEditingConsultation ? window.editingConsultationId : ('CONS-' + Date.now());
    try { var session = JSON.parse(localStorage.getItem('medconnect_session')||'{}'); } catch { var session = {}; }
    if (isEditingConsultation){
      const idx = consultations.findIndex(c=>c.id===window.editingConsultationId);
      if (idx !== -1){
        const existing = consultations[idx];
        const shouldUpdateDate = window.currentConsultationAppointmentId;
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
          bloodPressure,
          imc: bmi,
          bmiCategory: category,
          consultationAct,
          clinicalNote,
          radiologyResult,
          radiologyDiagnostics,
          labResults,
          labNotes,
          prescription,
          paymentStatus,
          documents: allDocuments,
          doctor: session?.name || existing.doctor || 'Doctor',
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
        bloodPressure,
        imc: bmi,
        bmiCategory: category,
        consultationAct,
        clinicalNote,
        radiologyResult,
        radiologyDiagnostics,
        labResults,
        labNotes,
        prescription,
        paymentStatus,
        documents: allDocuments,
        doctor: session?.name || 'Doctor',
        createdAt: new Date().toISOString()
      });
    }
    saveConsultations(consultations);

    // Sync to backend database
    const consultationToSync = consultations.find(c => c.id === id);

    if (consultationToSync) {
        // Existing consultation (including "Update Last Consultation")
        if (isEditingConsultation && typeof updateConsultationInDatabase === 'function') {
            updateConsultationInDatabase(consultationToSync);
        } else if (typeof syncConsultationToDatabase === 'function') {
            // Brand new consultation: use upsert API
            syncConsultationToDatabase(consultationToSync);
        }
    }

    if (consultationToSync && typeof syncRadiologyResultToDatabase === 'function') {
        syncRadiologyResultToDatabase(consultationToSync, radiologyFiles);
    }

    if (consultationToSync && typeof syncLabAssessmentToDatabase === 'function') {
        syncLabAssessmentToDatabase(consultationToSync, labFiles);
    }

    // Clear radiology and lab uploads after saving
    if (typeof radiologySectionUploads !== 'undefined') {
      radiologySectionUploads.diagnostics = [];
      radiologySectionUploads.result = [];
    }
    if (typeof labSectionUploads !== 'undefined') {
      labSectionUploads.notes = [];
      labSectionUploads.results = [];
    }

    // Set consultation ID in certificate form for linking certificates
    const consultCertIdInput = document.getElementById('consultCertConsultationId'); if (consultCertIdInput) consultCertIdInput.value = id;
    window.editingConsultationId = null;

    // Link temp lab assessments
    try {
      const labAssessments = JSON.parse(localStorage.getItem('lab_assessments')||'[]');
      const updatedAssessments = labAssessments.map(a=> (a.consultationId && a.consultationId.startsWith('temp_consult_') && window.currentConsultationPatientId===patientId) ? ({...a, consultationId:id}) : a);
      localStorage.setItem('lab_assessments', JSON.stringify(updatedAssessments));
    } catch (err) { console.error('Error linking lab assessments:', err); }

    // Link temp medical certificates
    try { if (typeof window.linkTempCertificatesToConsultation==='function') window.linkTempCertificatesToConsultation(patientId, id); window.currentConsultationPatientId = null; } catch(err){ console.error('Error linking medical certificates:', err); }

    // Update patient's latest vitals
    try {
      const patients = getPatients();
      const idx = patients.findIndex(p=>p.id===patientId);
      if (idx!==-1){
        if (height!==null) patients[idx].height = height;
        if (weight!==null) patients[idx].weight = weight;
        if (temperature!==null) patients[idx].temperature = temperature;
        if (heartRate!==null) patients[idx].heartRate = heartRate;
        if (bloodSugar!==null) patients[idx].bloodSugar = bloodSugar;
        if (bpSystolic!==null) patients[idx].bpSystolic = bpSystolic;
        if (bpDiastolic!==null) patients[idx].bpDiastolic = bpDiastolic;
        const entry = { date:new Date().toISOString(), height, weight, imc:bmi, temperature, heartRate, bloodSugar, bpSystolic, bpDiastolic };
        if (!Array.isArray(patients[idx].vitalsHistory)) patients[idx].vitalsHistory = [];
        if (height!==null || weight!==null || bmi!==null || temperature!==null || heartRate!==null || bloodSugar!==null || bpSystolic!==null || bpDiastolic!==null) patients[idx].vitalsHistory.push(entry);
        patients[idx].lastUpdated = new Date().toISOString();
        localStorage.setItem('healthcarePatients', JSON.stringify(patients));
        if (typeof window.storedPatients!=='undefined') window.storedPatients = patients;
      }
    } catch {}

    if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('consultation_saved');

    // Clear prescription list UI
    if (typeof window.renderPrescriptionMedicinesList==='function') window.renderPrescriptionMedicinesList();

    // Update appointment status to "consulted" if consultation was created from an appointment
    try {
      if (window.currentConsultationAppointmentId){
        const appointmentId = window.currentConsultationAppointmentId;
        
        // Update appointment status in in-memory cache (if available)
        if (typeof window.storedAppointments !== 'undefined' && Array.isArray(window.storedAppointments)) {
          const appointmentIndex = window.storedAppointments.findIndex(a => a.id === appointmentId);
          if (appointmentIndex !== -1) {
            window.storedAppointments[appointmentIndex].status = 'consulted';
          }
        }
        
        // Update appointment status in database (primary storage)
        if (typeof updateAppointmentStatusInDatabase === 'function') {
          updateAppointmentStatusInDatabase(appointmentId, 'consulted');
        }
        
        window.currentConsultationAppointmentId = null;
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }

    const dashboardModal = document.getElementById('doctorDashboardModal');
    if (dashboardModal && dashboardModal.classList.contains('active')) {
      // Refresh both lists to show updated data
      // Use setTimeout to ensure database sync completes first (status update + consultation save)
      setTimeout(() => {
        if (typeof window.loadTodayAppointments==='function') window.loadTodayAppointments();
        if (typeof window.loadTodayConsultations==='function') window.loadTodayConsultations();
      }, 1000); // Increased delay to ensure appointment status update completes
    } else {
      // Even if modal is closed, refresh if it gets opened later
      // Refresh consultations list after a short delay to ensure it appears when modal is opened
      setTimeout(() => {
        if (typeof window.loadTodayConsultations==='function') window.loadTodayConsultations();
      }, 500);
    }
    if (typeof window.updateTodaySummary==='function') window.updateTodaySummary();
    if (typeof window.updateWaitingRoom==='function') window.updateWaitingRoom();

    if (typeof goToToday === 'function') {
      setTimeout(() => {
        try { goToToday(); } catch (e) { console.error('Error calling goToToday from consultation form:', e); }
      }, 0);
    } else {
      if (typeof window.renderDailyAgenda === 'function') {
        try { window.renderDailyAgenda(); } catch (e) { console.error('Error calling renderDailyAgenda from consultation form:', e); }
      }
      if (typeof window.renderCalendar === 'function') {
        try { window.renderCalendar(); } catch (e) { console.error('Error calling renderCalendar from consultation form:', e); }
      }
    }

    try { if (typeof window.autoSaveCertificateFromConsultationFields==='function') window.autoSaveCertificateFromConsultationFields(id, patientId); } catch (err){ console.error('Error auto-saving certificate:', err); }

    closeConsultationModal();
  }

  function loadDoctorDashboard(){
    const session = JSON.parse(localStorage.getItem('medconnect_session')||'{}');
    const doctor = session && session.role==='doctor';
    const dashboardLink = document.getElementById('doctorDashboardLink');
    const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
    if (doctor){ if (dashboardLink) dashboardLink.style.display=''; if (dashboardLinkMobile) dashboardLinkMobile.style.display=''; }
    else { if (dashboardLink) dashboardLink.style.display='none'; if (dashboardLinkMobile) dashboardLinkMobile.style.display='none'; }
  }
  function showDoctorDashboard(){
    if (!isDoctor()) { if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('consultations_doctors_only'); return; }
    const modal = document.getElementById('doctorDashboardModal');
    if (modal) {
      modal.classList.add('active');
      // Load today's appointments and consultations
      if (typeof window.loadTodayAppointments==='function') window.loadTodayAppointments();
      if (typeof window.loadTodayConsultations==='function') window.loadTodayConsultations();
      updateModalTranslations();
    }
  }

  // Translate/update consultation menu buttons
  function updateConsultMenuButtons() {
    const buttonTranslations = {
      'patient': 'patient_information',
      'consultation': 'consultation',
      'lab': 'lab_assessment',
      'radiology': 'radiology_results',
      'prescription': 'medical_prescription',
      'documents': 'medical_documents',
      'certificate': 'work_certificate'
    };
    // Sections that should stay on one line (don't split)
    const singleLineSections = ['prescription', 'documents'];
    
    Object.keys(buttonTranslations).forEach(section => {
      const button = document.querySelector(`.consult-menu-btn[data-section="${section}"]`);
      if (button) {
        const translationKey = buttonTranslations[section];
        const translatedText = window.t ? window.t(translationKey, button.textContent.trim()) : button.textContent.trim();
        
        // Keep single-line sections on one line
        if (singleLineSections.includes(section)) {
          button.innerHTML = `<span style="display: block;">${translatedText}</span>`;
          return;
        }
        
        const words = translatedText.split(' ');
        if (words.length > 1) {
          if (words.length === 2) {
            button.innerHTML = `<span style="display: block;">${words[0]}</span><span style="display: block;">${words[1]}</span>`;
          } else {
            const mid = Math.ceil(words.length / 2);
            const firstLine = words.slice(0, mid).join(' ');
            const secondLine = words.slice(mid).join(' ');
            button.innerHTML = `<span style="display: block;">${firstLine}</span><span style="display: block;">${secondLine}</span>`;
          }
        } else {
          button.innerHTML = `<span style="display: block;">${translatedText}</span>`;
        }
      }
    });
  }

  // Helper used by dashboards/summary
  function getConsultationsForDate(date){
    const dateStr = (date instanceof Date ? date : new Date(date)).toISOString().split('T')[0];
    const consultations = getConsultations();
    const consultationsForDate = consultations.filter(consultation => {
      const d = new Date(consultation.createdAt);
      return d.toISOString().split('T')[0] === dateStr;
    });
    return consultationsForDate.length;
  }

  // Doctor dashboard: list today's consultations (loaded from API only)
  function loadTodayConsultations(){
    const consultationCountEl = document.getElementById('consultationCount');
    const consultationsListEl = document.getElementById('todayConsultationsList');
    
    // Show loading state
    if (consultationCountEl) consultationCountEl.textContent = '...';
    if (consultationsListEl) {
      consultationsListEl.innerHTML = '<p class="text-gray-500 text-center py-4" data-translate="loading">Loading...</p>';
    }
    
    // Get today's date in YYYY-MM-DD format (using local timezone, not UTC)
    const today = new Date();
    // Use formatDateForStorage if available, otherwise format manually
    const todayStr = typeof formatDateForStorage === 'function' 
      ? formatDateForStorage(today)
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('Loading today consultations from API - Date:', todayStr);
    
    // Fetch consultations from API (primary and only source)
    fetch(`api/get_consultations.php?date=${todayStr}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch consultations: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Consultations API response:', data);
        console.log('Requested date:', todayStr);
        console.log('API returned date:', data.date);
        
        if (data.status === 'ok' && Array.isArray(data.consultations)) {
          const todayConsultations = data.consultations;
          window.todayConsultationsFromAPI = todayConsultations;
          console.log('Total consultations from API:', todayConsultations.length);

          // Merge API consultations into localStorage so detail modal sees latest fields (clinicalNote, etc.)
          try {
            const existing = getConsultations();
            const byId = {};
            existing.forEach(c => { if (c && c.id) byId[c.id] = c; });
            todayConsultations.forEach(c => { if (c && c.id) byId[c.id] = { ...byId[c.id], ...c }; });
            const merged = Object.values(byId);
            if (Array.isArray(merged) && merged.length) {
              saveConsultations(merged);
            }
          } catch (e) {
            console.error('Failed to merge API consultations into localStorage:', e);
          }

          // Update count
          if (consultationCountEl) consultationCountEl.textContent = todayConsultations.length;
          
          if (!consultationsListEl) return;
          
          if (todayConsultations.length === 0) {
            consultationsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_consultations_today">${t('no_consultations_today','No consultations conducted today.')}</p>`;
            return;
          }
          
          // Get patients for patient name lookup (try API first, then localStorage)
          const patients = (window.storedPatients && Array.isArray(window.storedPatients)) ? window.storedPatients : getPatients();
          
          consultationsListEl.innerHTML = todayConsultations.map(consultation => {
            // Try to find patient in local array first
            let patient = patients.find(p => p.id === consultation.patientId);
            
            // If patient not found, try to fetch from API
            if (!patient && consultation.patientId && typeof window.fetchPatientsFromAPI === 'function') {
              // Note: We'll fetch patient name asynchronously if needed, but for now use Unknown
              // In a production app, you might want to batch fetch all missing patients
            }
            
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            // Format time in 12-hour format with AM/PM
            const consultationTime = new Date(consultation.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
            return `
              <div class="consultation-item">
                <div class="patient-name">${patientName}</div>
                <div class="consultation-time">${consultationTime}</div>
		        <div class="consultation-notes">${(consultation.clinicalNote||consultation.vitalNotes||'').substring(0,100)}${(consultation.clinicalNote||consultation.vitalNotes||'').length>100?'...':''}</div>
                <div class="flex gap-2 mt-3 flex-wrap">
                  <button class="btn btn-sm btn-primary" onclick="viewConsultationDetail('${consultation.id}')" data-translate="view_details">View Details</button>
                </div>
              </div>`;
          }).join('');
          
          // Apply translations
          if (window.I18n && window.I18n.walkAndTranslate) {
            window.I18n.walkAndTranslate();
          }
        } else {
          // API returned error or invalid data
          console.error('Invalid API response:', data);
          if (consultationCountEl) consultationCountEl.textContent = '0';
          if (consultationsListEl) {
            consultationsListEl.innerHTML = `<p class="text-red-500 text-center py-4">Error loading consultations. Please try again.</p>`;
          }
        }
      })
      .catch(error => {
        console.error('Error fetching consultations:', error);
        // Fallback to localStorage on error
        const consultations = getConsultations();
        const todayStr = new Date().toISOString().split('T')[0];
        const todayConsultations = consultations.filter(c => new Date(c.createdAt).toISOString().split('T')[0] === todayStr);
        window.todayConsultationsFromAPI = todayConsultations;
        if (consultationCountEl) consultationCountEl.textContent = todayConsultations.length;
        if (!consultationsListEl) return;
        if (todayConsultations.length === 0) {
          consultationsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_consultations_today">${t('no_consultations_today','No consultations conducted today.')}</p>`;
          return;
        }
        const patients = (window.storedPatients||[]);
        consultationsListEl.innerHTML = todayConsultations.map(consultation => {
          const patient = patients.find(p => p.id === consultation.patientId);
          const patientName = patient ? patient.fullName : 'Unknown Patient';
          const consultationTime = new Date(consultation.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
          return `
            <div class="consultation-item">
              <div class="patient-name">${patientName}</div>
              <div class="consultation-time">${consultationTime}</div>
		      <div class="consultation-notes">${(consultation.clinicalNote||consultation.vitalNotes||'').substring(0,100)}${(consultation.clinicalNote||consultation.vitalNotes||'').length>100?'...':''}</div>
                <div class="flex gap-2 mt-3 flex-wrap">
                  <button class="btn btn-sm btn-primary" onclick="viewConsultationDetail('${consultation.id}')" data-translate="view_details">View Details</button>
                </div>
            </div>`;
        }).join('');
      });
  }

  // Start a new consultation from an appointment
  function startConsultation(appointmentId, patientName, patientId){
    if (!isDoctor()) { if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('consultations_doctors_only'); return; }
    window.currentConsultationAppointmentId = appointmentId || null;
    // Explicitly clear any previous editing state so this is treated as a NEW consultation
    window.editingConsultationId = null;
    const consultCertInput = document.getElementById('consultCertConsultationId');
    if (consultCertInput) consultCertInput.value = '';
    // Function to open modal and load patient details from API
    const openModalWithPatient = (foundPatientId, displayName) => {
      showConsultationModal();
      const patientInput = document.getElementById('consultPatient');
      const patientIdInput = document.getElementById('consultPatientId');
      
      if (patientInput) patientInput.value = displayName || (patientName||'').trim();
      if (patientIdInput && foundPatientId) patientIdInput.value = foundPatientId;
      
      // Load patient details from API if we have a patient ID
      if (foundPatientId) {
        setTimeout(() => {
          loadConsultationPatientDetails();
        }, 200);
      }
    };
    
    // If we have a patient ID, use it directly
    if (patientId) {
      // Fetch patient details from API to get display name
      fetch(`api/get_patient.php?id=${encodeURIComponent(patientId)}`)
        .then(response => response.json())
        .then(data => {
          if (data.status === 'ok' && data.patient) {
            const patient = data.patient;
            const age = patient.dateOfBirth ? (typeof window.calculateAge==='function'? window.calculateAge(patient.dateOfBirth): null) : null;
            const patientDisplay = `${patient.fullName}${age!=null?` (${age})`:''} - ${patient.phone||''}`;
            openModalWithPatient(patientId, patientDisplay);
          } else {
            // Fallback to patient name if API fails
            openModalWithPatient(patientId, patientName);
          }
        })
        .catch(() => {
          // Fallback to patient name if API fails
          openModalWithPatient(patientId, patientName);
        });
      return;
    }
    
    // If we only have patient name, try to find patient ID from API
    if (patientName && typeof window.fetchPatientsFromAPI === 'function') {
      window.fetchPatientsFromAPI().then(() => {
        const patientsArr = (window.storedPatients||[]);
        const patient = patientsArr.find(p => p.fullName === patientName);
        
        if (patient && patient.id) {
          const age = patient.dateOfBirth ? (typeof window.calculateAge==='function'? window.calculateAge(patient.dateOfBirth): null) : null;
          const patientDisplay = `${patient.fullName}${age!=null?` (${age})`:''} - ${patient.phone||''}`;
          openModalWithPatient(patient.id, patientDisplay);
        } else {
          // Patient not found, open modal with name only (no ID, so details won't load)
          openModalWithPatient(null, patientName);
        }
      }).catch(() => {
        // API fetch failed, open modal with name only
        openModalWithPatient(null, patientName);
      });
      return;
    }
    
    // Fallback: open modal with patient name only
    openModalWithPatient(null, patientName);
  }

  // Open consultation modal pre-filled for editing
  function editConsultation(consultationId){
    try {
      const consultations = getConsultations();
      const c = consultations.find(x=>x.id===consultationId); if(!c){ if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('Consultation not found.'); return; }
      window.editingConsultationId = consultationId;
      
      // Update button text to "Update Consultation"
      const submitButton = document.querySelector('#consultationForm button[type="submit"]');
      if (submitButton) {
        submitButton.setAttribute('data-translate', 'update_consultation');
        submitButton.textContent = window.t ? window.t('update_consultation', 'Update Consultation') : 'Update Consultation';
      }
      
      // Load documents from consultation
      if (c.documents && Array.isArray(c.documents)) {
        window.consultationDocuments = [...c.documents];
      } else {
        window.consultationDocuments = [];
      }
      
      const patients = (window.storedPatients||JSON.parse(localStorage.getItem('healthcarePatients')||'[]'));
      const p = patients.find(pt=>pt.id===c.patientId);
      const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=(val??''); };
      const patientInput=document.getElementById('consultPatient'); const patientIdInput=document.getElementById('consultPatientId');
      
      // Try to fetch patient from API if not found locally
      if (!p && c.patientId) {
        fetch(`api/get_patient.php?id=${encodeURIComponent(c.patientId)}`)
          .then(response => response.json())
          .then(data => {
            if (data.status === 'ok' && data.patient) {
              const patient = data.patient;
              const age = patient.dateOfBirth ? (typeof window.calculateAge==='function'?window.calculateAge(patient.dateOfBirth):null):null;
              if (patientInput) patientInput.value = `${patient.fullName}${age!=null?` (${age})`:''} - ${patient.phone||''}`;
              if (patientIdInput) patientIdInput.value = c.patientId;
              setTimeout(() => {
                loadConsultationPatientDetails();
              }, 100);
            } else {
              // Fallback to patient ID if API fails
              if (patientInput) patientInput.value = `Patient ID: ${c.patientId}`;
              if (patientIdInput) patientIdInput.value = c.patientId;
            }
          })
          .catch(() => {
            // Fallback to patient ID if API fails
            if (patientInput) patientInput.value = `Patient ID: ${c.patientId}`;
            if (patientIdInput) patientIdInput.value = c.patientId;
          });
      } else {
        if(p&&patientInput){ const age=p.dateOfBirth?(typeof window.calculateAge==='function'?window.calculateAge(p.dateOfBirth):null):null; patientInput.value=`${p.fullName}${age!=null?` (${age})`:''} - ${p.phone||''}`; }
        if(patientIdInput) patientIdInput.value=c.patientId;
      }
      const consultCertConsultationIdInput=document.getElementById('consultCertConsultationId'); if(consultCertConsultationIdInput) consultCertConsultationIdInput.value=consultationId;
      set('consultHeight', c.height);
      set('consultWeight', c.weight);
      set('consultTemperature', c.temperature);
      set('consultHeartRate', c.heartRate);
      set('consultBloodSugar', c.bloodSugar);
      set('consultBloodPressure', c.bpSystolic && c.bpDiastolic ? `${c.bpSystolic}/${c.bpDiastolic}` : '');
      // Clinical note: prefer clinicalNote field, fallback to legacy vitalNotes/notes
      const editClinical = c.clinicalNote || c.vitalNotes || c.notes || '';
      if (document.getElementById('consultNotes')) {
        set('consultNotes', editClinical);
      } else if (document.getElementById('consultVitalNotes')) {
        set('consultVitalNotes', editClinical);
      }
      const consultationActSelect = document.getElementById('consultationAct');
      if (consultationActSelect) {
        const rawActs = c.consultationAct || '';
        const values = rawActs
          ? rawActs.split('|').map(s => s.trim()).filter(Boolean)
          : [];
        Array.from(consultationActSelect.options || []).forEach(opt => {
          opt.selected = values.includes(opt.value);
        });
      }
      set('consultPrescription', c.prescription);
      set('radiologyResult', c.radiologyResult || '');
      set('radiologyDiagnostics', c.radiologyDiagnostics || '');
      set('labResults', c.labResults || '');
      set('labNotes', c.labNotes || '');
      const payingRadio=document.getElementById('payingPatient'); const nonPayingRadio=document.getElementById('nonPayingPatient'); if(c.paymentStatus==='non-paying'){ if(nonPayingRadio) nonPayingRadio.checked=true; } else { if(payingRadio) payingRadio.checked=true; }
      
      // Load documents list
      setTimeout(() => {
        if (typeof window.loadConsultationDocuments === 'function') {
          window.loadConsultationDocuments();
        }
      }, 100);
      
      // Load patient details
      setTimeout(() => {
        loadConsultationPatientDetails();
      }, 100);
      // Ensure correct section active
      document.querySelectorAll('.consult-section').forEach(sec=>sec.classList.add('hidden'));
      const patientSection=document.getElementById('consultSectionPatient'); if(patientSection) patientSection.classList.remove('hidden');
      document.querySelectorAll('.consult-menu-btn').forEach(btn=>{ btn.classList.remove('active'); btn.style.opacity='0.8'; if(btn.getAttribute('data-section')==='patient'){ btn.classList.add('active'); btn.style.opacity='1'; }});
      const consultationModal=document.getElementById('consultationModal'); if(consultationModal){ const dashboardModal=document.getElementById('doctorDashboardModal'); consultationModal.style.zIndex = (dashboardModal && dashboardModal.classList.contains('active')) ? '3000' : ''; consultationModal.classList.add('active'); }
    } catch(e){ console.error('editConsultation error', e); }
  }

  function updateLastConsultation(appointmentId, patientName){
    try{
      if (!isDoctor()) { if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('consultations_doctors_only'); return; }
      const patient=(window.storedPatients||[]).find(p=>p.fullName===patientName);
      if(!patient){ if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('Patient not found in system. Please add patient first.'); return; }
      const consultations=getConsultations().filter(c=>c.patientId===patient.id);
      if(consultations.length===0){ if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('No consultations found for this patient.'); return; }
      consultations.sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0));
      const lastConsultation=consultations[0];
      window.currentConsultationAppointmentId = appointmentId;
      if (lastConsultation && lastConsultation.id) { editConsultation(lastConsultation.id); } else { if (typeof window.showTranslatedAlert==='function') window.showTranslatedAlert('Last consultation not found.'); }
    } catch(e){ console.error('updateLastConsultation error', e); }
  }

  function wireConsultation(){
    const form = document.getElementById('consultationForm');
    if (form){ form.addEventListener('submit', submitConsultationForm); }
    if (typeof window.populateConsultationActSelect === 'function') {
      window.populateConsultationActSelect();
    }
    
    // Watch for patient ID changes to reload patient details
    // Use polling to check for changes in patient ID
    let lastPatientId = null;
    setInterval(() => {
      const patientIdInput = document.getElementById('consultPatientId');
      if (patientIdInput) {
        const currentPatientId = patientIdInput.value;
        if (currentPatientId !== lastPatientId) {
          lastPatientId = currentPatientId;
          // Only reload if patient section is visible
          const patientSection = document.getElementById('consultSectionPatient');
          if (patientSection && !patientSection.classList.contains('hidden')) {
            loadConsultationPatientDetails();
          }
        }
      }
    }, 500); // Check every 500ms
    
    // ensure dashboard links visibility reflects role
    loadDoctorDashboard();
  }

  document.addEventListener('DOMContentLoaded', wireConsultation);

  // Expose globally
  window.showConsultationModal = showConsultationModal;
  window.closeConsultationModal = closeConsultationModal;
  window.showConsultSection = showConsultSection;
  window.viewConsultationDetail = viewConsultationDetail;
  window.loadPatientConsultations = loadPatientConsultations;
  window.closeConsultationDetail = closeConsultationDetail;
  window.loadDoctorDashboard = loadDoctorDashboard;
  window.showDoctorDashboard = showDoctorDashboard;
  window.closeDoctorDashboard = closeDoctorDashboard;
  window.updateConsultMenuButtons = updateConsultMenuButtons;
  window.loadTodayConsultations = loadTodayConsultations;
  window.loadConsultationPatientDetails = loadConsultationPatientDetails;
  window.startConsultation = startConsultation;
  window.editConsultation = editConsultation;
  window.updateLastConsultation = updateLastConsultation;
  window.getConsultationsForDate = getConsultationsForDate;
  
  // Ensure showDoctorDashboard is available (double-check)
  window.showDoctorDashboard = showDoctorDashboard;
})();


// Reason, Diagnosis, Clinical Exam Modal Functions
window.openReasonModal = function () {
    const modal = document.getElementById('reasonModal');
    if (modal) modal.classList.add('active');
};

window.closeReasonModal = function () {
    const modal = document.getElementById('reasonModal');
    if (modal) modal.classList.remove('active');
};

window.saveReason = function () {
    const text = document.getElementById('reasonText').value;
    // Store or process the reason text
    console.log('Reason saved:', text);
    showTranslatedAlert('Reason documented successfully');
    closeReasonModal();
};

window.openDiagnosisModal = function () {
    const modal = document.getElementById('diagnosisModal');
    if (modal) modal.classList.add('active');
};

window.closeDiagnosisModal = function () {
    const modal = document.getElementById('diagnosisModal');
    if (modal) modal.classList.remove('active');
};

window.saveDiagnosis = function () {
    const text = document.getElementById('diagnosisText').value;
    // Store or process the diagnosis text
    console.log('Diagnosis saved:', text);
    showTranslatedAlert('Diagnosis documented successfully');
    closeDiagnosisModal();
};

window.openClinicalExamModal = function () {
    const modal = document.getElementById('clinicalExamModal');
    if (modal) modal.classList.add('active');
};

window.closeClinicalExamModal = function () {
    const modal = document.getElementById('clinicalExamModal');
    if (modal) modal.classList.remove('active');
};

window.saveClinicalExam = function () {
    const text = document.getElementById('clinicalExamText').value;
    // Store or process the clinical exam text
    console.log('Clinical Exam saved:', text);
    showTranslatedAlert('Clinical examination documented successfully');
    closeClinicalExamModal();
};
window.updateLastConsultation = function (appointmentId, patientName) {
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
window.editConsultation = function (consultationId) {
    try {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
        const c = consultations.find(x => x.id === consultationId);
        if (!c) {
                showTranslatedAlert('Consultation not found.');
                return;
            }
        window.editingConsultationId = consultationId;

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
        // When editing, restore clinical note into Clinical Note textarea (fallback to old vitalNotes field)
        const noteVal = c.clinicalNote || c.vitalNotes || '';
        if (document.getElementById('consultNotes')) {
          set('consultNotes', noteVal);
        } else if (document.getElementById('consultVitalNotes')) {
          set('consultVitalNotes', noteVal);
        }
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

                // Certificate type field removed - no longer setting it
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
                // Certificate type field removed - no longer clearing it
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
window.viewConsultationDetail = function (consultationId) {
            let consultation = null;

            if (Array.isArray(window.todayConsultationsFromAPI)) {
                consultation = window.todayConsultationsFromAPI.find(c => c && c.id === consultationId);
            }

            if (!consultation) {
                const consultations = getConsultations();
                consultation = consultations.find(c => c && c.id === consultationId);
            }
            
            if (!consultation) {
                showTranslatedAlert('Consultation not found.');
                return;
            }
            
            const patients = (window.storedPatients && Array.isArray(window.storedPatients)) ? window.storedPatients : getPatients();
            const patient = patients.find(p => p.id === consultation.patientId);
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            const consultationTime = new Date(consultation.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const detailContent = document.getElementById('consultationDetailContent');
            const clinicalNoteHtml = consultation.clinicalNote || (window.t ? window.t('no_notes_provided', 'No notes provided.') : 'No notes provided.');
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
                    <div class="text-sm text-gray-700 space-y-1">
                        <div class="whitespace-pre-wrap">${clinicalNoteHtml}</div>
                        ${consultation.consultationAct ? `<div><strong>${window.t ? window.t('consultation_act', 'Consultation Act') : 'Consultation Act'}:</strong> ${consultation.consultationAct}</div>` : ''}
                    </div>
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
                <div id="consultationCertificatesContainer"></div>
                `;

            // Add medical certificates section (API + localStorage fallback)
            const certificatesContainer = document.getElementById('consultationCertificatesContainer');

            const renderCertificates = (certificates) => {
                // Expose currently displayed certificates globally so printing can use API-loaded data
                if (Array.isArray(certificates)) {
                    window.currentConsultationCertificates = certificates;
                } else {
                    window.currentConsultationCertificates = [];
                }

                if (!certificatesContainer) return;
                if (certificates && certificates.length > 0) {
                    certificatesContainer.innerHTML = `
                    <div class="card p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">${window.t ? window.t('medical_certificates', 'Medical Certificates') : 'Medical Certificates'}</h3>
                        </div>
                        <div class="space-y-3">
                            ${certificates.map(cert => `
                                <div class="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span class="font-semibold text-gray-700">${cert.certType ? cert.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Medical Certificate'}</span>
                                        </div>
                                        <span class="text-xs text-gray-500">${cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : ''}</span>
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
                    certificatesContainer.innerHTML = `
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
            };

            let localCertificates = [];
            try {
                const storedCerts = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
                localCertificates = storedCerts.filter(c => c.consultationId === consultationId);
            } catch (err) {
                console.error('Error reading certificates from localStorage:', err);
            }

            // Render local certificates immediately (for offline support)
            if (localCertificates.length > 0) {
                renderCertificates(localCertificates);
            }

            // Try to load certificates from backend API and merge with local ones
            fetch(`api/get_certificates.php?consultationId=${encodeURIComponent(consultationId)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch certificates');
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data || data.status !== 'ok' || !Array.isArray(data.certificates)) {
                        if (!localCertificates.length) {
                            renderCertificates([]);
                        }
                        return;
                    }

                    const fromApi = data.certificates || [];
                    const byId = {};

                    localCertificates.forEach(cert => {
                        if (cert && cert.id) byId[cert.id] = cert;
                    });
                    fromApi.forEach(cert => {
                        if (cert && cert.id) byId[cert.id] = cert;
                    });

                    const mergedCertificates = Object.values(byId);
                    renderCertificates(mergedCertificates);
                })
                .catch(err => {
                    console.error('Error loading certificates from API:', err);
                    if (!localCertificates.length) {
                        renderCertificates([]);
                    }
                });

            updateModalTranslations();
            
            // Wire print buttons inside consultation detail modal (certificates & prescription)
            setTimeout(() => {
                const detailContentEl = document.getElementById('consultationDetailContent');
                if (!detailContentEl || detailContentEl._printHandlersBound) return;

                const clickHandler = (e) => {
                    const certBtn = e.target.closest('.btn-print-certificate');
                    if (certBtn) {
                        e.preventDefault();
                        e.stopPropagation();
                        const certId = certBtn.getAttribute('data-cert-id');
                        if (certId && typeof window.printMedicalCertificate === 'function') {
                            window.printMedicalCertificate(certId);
                        }
                        return;
                    }

                    const rxBtn = e.target.closest('.btn-print-prescription');
                    if (rxBtn) {
                        e.preventDefault();
                        e.stopPropagation();
                        const cid = rxBtn.getAttribute('data-consultation-id');
                        if (cid && typeof window.printPrescription === 'function') {
                            window.printPrescription(cid);
                        }
                    }
                };

                detailContentEl.addEventListener('click', clickHandler);
                detailContentEl._printHandlersBound = true;
            }, 100);

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
            }
};
window.loadTodayAppointments = function () {
            const appointmentCountEl = document.getElementById('appointmentCount');
            const appointmentsListEl = document.getElementById('todayAppointmentsList');
            
            // Show loading state
            if (appointmentCountEl) appointmentCountEl.textContent = '...';
            if (appointmentsListEl) {
                appointmentsListEl.innerHTML = '<p class="text-gray-500 text-center py-4" data-translate="loading">Loading...</p>';
            }
            
            // Get today's date in YYYY-MM-DD format (using local timezone, not UTC)
            const today = new Date();
            const todayStr = formatDateForStorage(today); // Use formatDateForStorage to ensure consistent format
            const todayDateStr = todayStr;
            
            console.log('Loading today appointments - Date:', todayStr);
            
            // First, fetch total appointments count (all statuses) for the badge
            fetch(`api/get_today_appointments.php?date=${todayStr}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch total appointments');
                    }
                    return response.json();
                })
                .then(totalData => {
                    console.log('API response for appointment count badge:', totalData);
                    console.log('API total field:', totalData.total);
                    console.log('API count field:', totalData.count);
                    console.log('API appointments array length:', totalData.appointments ? totalData.appointments.length : 'N/A');
                    
                    if (totalData.status === 'ok' && Array.isArray(totalData.appointments)) {
                        // Use total from API response (preferred), then count, then appointments.length
                        const totalCount = (totalData.total !== undefined && totalData.total !== null)
                            ? totalData.total
                            : ((totalData.count !== undefined && totalData.count !== null) ? totalData.count : totalData.appointments.length);

                        console.log('Total appointments for today (all statuses):', totalCount);

                        // Do not update the appointmentCount badge here; it should
                        // reflect only validated appointments from the second fetch
                        // to avoid mismatches when the validated list is empty.
                    } else {
                        console.error('Invalid API response for appointment count:', totalData);
                    }
                })
                .catch(error => {
                    console.error('Error fetching total appointments:', error);
                });
            
            // Fetch validated appointments from API (explicitly request validated status) for the list
            fetch(`api/get_today_appointments.php?date=${todayStr}&status=validated`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch appointments');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Appointments API response:', data);
                    console.log('Requested date:', todayStr);
                    console.log('API returned date:', data.date);
                    console.log('API returned status filter:', data.status);
                    
                    if (data.status === 'ok' && Array.isArray(data.appointments)) {
                        // Enforce: ONLY validated appointments in the doctor dashboard
                        // Explicitly exclude pre-validation, consulted, and any other statuses
                        let appointments = data.appointments.filter(apt => {
                            const status = (apt.status || '').toLowerCase().trim();
                            // Only allow 'validated' status - explicitly reject all others
                            if (status !== 'validated') {
                                console.log('Excluding appointment with status:', status, apt.id);
                                return false;
                            }
                            return true;
                        });
                        console.log('API total appointments for date:', data.appointments.length);
                        console.log('After filtering to validated only (excluding pre-validation and consulted):', appointments.length);
                        try {
                          const apiIds = appointments.map(a => a.id);
                          console.log('Filtered appointment IDs:', apiIds.join(', '));
                        } catch (_) {}
                        
                        // Final safety filter - double check that only validated appointments remain
                        const filteredForRender = appointments.filter(a => {
                            const s = (a.status || '').toLowerCase().trim();
                            const isValid = s === 'validated';
                            if (!isValid) {
                                console.warn('Unexpected non-validated appointment in filtered list:', a.id, 'status:', s);
                            }
                            return isValid;
                        });
                        // Update count immediately using filtered list
                        if (appointmentCountEl) appointmentCountEl.textContent = filteredForRender.length;
                        
                        if (!appointmentsListEl) return;
                        
                        if (filteredForRender.length === 0) {
                            appointmentsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_appointments_today">${window.t ? window.t('no_appointments_today', 'No appointments scheduled for today.') : 'No appointments scheduled for today.'}</p>`;
                            return;
                        }
                        
                        // Get consultations for "Update Last Consultation" button (fetch in background)
                        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                        fetch(`api/get_consultations.php?date=${todayDateStr}`)
                            .then(response => {
                                if (!response.ok) return consultations;
                                return response.json().then(apiData => {
                                    if (apiData && apiData.status === 'ok' && Array.isArray(apiData.consultations)) {
                                        let allConsultations = [...consultations];
                                        apiData.consultations.forEach(apiConsultation => {
                                            if (!allConsultations.find(c => c.id === apiConsultation.id)) {
                                                allConsultations.push(apiConsultation);
                                            }
                                        });
                                        return allConsultations;
                                    }
                                    return consultations;
                                }).catch(() => consultations);
                            })
                            .then(allConsultations => {
                                // Get patients for patient name lookup
                                const patients = (window.storedPatients && Array.isArray(window.storedPatients)) ? window.storedPatients : getPatients();
                                
                                const renderedHtml = filteredForRender.map(appointment => {
                                    const patientName = appointment.clientName || 'Unknown Patient';
                                    const statusColor = getStatusColor(appointment.status);
                                    
                                    // Find patient by name or ID
                                    let patient = patients.find(p => p.fullName === patientName);
                                    if (!patient && appointment.patientId) {
                                        patient = patients.find(p => p.id === appointment.patientId);
                                    }
                                    const patientId = patient ? patient.id : (appointment.patientId || '');
                                    
                                    // Check if patient has a consultation created today (for badge)
                                    const hasConsultationToday = patientId ? allConsultations.some(c => {
                                        if (c.patientId !== patientId) return false;
                                        const consultationDate = new Date(c.createdAt).toISOString().split('T')[0];
                                        return consultationDate === todayDateStr;
                                    }) : false;
                                    // Check if patient has any consultations historically (for update last consultation button)
                                    const hasConsultations = patientId ? allConsultations.some(c => c.patientId === patientId) : false;
                
                                    return `
                                        <div class="appointment-item">
                                            <div class="patient-name">${patientName}</div>
                                            <div class="appointment-time">${appointment.time} (${appointment.duration} min)</div>
                                            <div class="flex items-center gap-2 mb-3">
                                                <span class="badge ${statusColor}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                                                ${hasConsultationToday ? `<span class=\"text-xs px-2 py-0.5 rounded bg-green-100 text-green-800\">${window.t ? window.t('consulted_today', 'Consulted today') : 'Consulted today'}</span>` : ''}
                                                ${appointment.notes ? `<span class=\"text-sm text-gray-600\">${appointment.notes}</span>` : ''}
                                            </div>
                                            <div class="flex gap-2">
                                                <button class="btn btn-sm btn-primary" onclick="startConsultation('${appointment.id}', '${patientName}', '${patientId || ''}')" data-translate="new_consultation">${window.t ? window.t('new_consultation', 'New Consultation') : 'New Consultation'}</button>
                                                ${hasConsultations ? `<button class="btn btn-sm btn-secondary" onclick="updateLastConsultation('${appointment.id}', '${patientName}')" data-translate="update_last_consultation">${window.t ? window.t('update_last_consultation', 'Update Last Consultation') : 'Update Last Consultation'}</button>` : ''}
                                            </div>
                                        </div>
                                    `;
                                });
                                appointmentsListEl.innerHTML = renderedHtml.join('');
                                try {
                                  const renderedIds = appointments.map(a => a.id);
                                  console.log('Rendered appointment IDs:', renderedIds.join(', '));
                                } catch (_) {}
                                
                                // Apply translations
                                if (window.I18n && window.I18n.walkAndTranslate) {
                                    window.I18n.walkAndTranslate();
                                }
                            })
                            .catch(err => {
                                console.error('Error fetching consultations:', err);
                                // Still display appointments even if consultation fetch fails
                                const patients = (window.storedPatients && Array.isArray(window.storedPatients)) ? window.storedPatients : getPatients();
                                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                                
                                appointmentsListEl.innerHTML = appointments.map(appointment => {
                                    const patientName = appointment.clientName || 'Unknown Patient';
                                    const statusColor = getStatusColor(appointment.status);
                                    let patient = patients.find(p => p.fullName === patientName);
                                    if (!patient && appointment.patientId) {
                                        patient = patients.find(p => p.id === appointment.patientId);
                                    }
                                    const patientId = patient ? patient.id : (appointment.patientId || '');
                                    const hasConsultations = patientId ? consultations.some(c => c.patientId === patientId) : false;
                                    
                                    return `
                                        <div class="appointment-item">
                                            <div class="patient-name">${patientName}</div>
                                            <div class="appointment-time">${appointment.time} (${appointment.duration} min)</div>
                                            <div class="flex items-center gap-2 mb-3">
                                                <span class="badge ${statusColor}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                                                ${appointment.notes ? `<span class=\"text-sm text-gray-600\">${appointment.notes}</span>` : ''}
                                            </div>
                                            <div class="flex gap-2">
                                                <button class="btn btn-sm btn-primary" onclick="startConsultation('${appointment.id}', '${patientName}', '${patientId || ''}')" data-translate="new_consultation">${window.t ? window.t('new_consultation', 'New Consultation') : 'New Consultation'}</button>
                                                ${hasConsultations ? `<button class="btn btn-sm btn-secondary" onclick="updateLastConsultation('${appointment.id}', '${patientName}')" data-translate="update_last_consultation">${window.t ? window.t('update_last_consultation', 'Update Last Consultation') : 'Update Last Consultation'}</button>` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('');
                                
                                if (window.I18n && window.I18n.walkAndTranslate) {
                                    window.I18n.walkAndTranslate();
                                }
                            });
                    } else {
                        // Fallback to localStorage if API fails
                        const allAppointments = getAppointmentsForDate(today);
                        let appointments = allAppointments; // show all for today to mirror API-without-status
                        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                        
                        if (appointmentCountEl) appointmentCountEl.textContent = appointments.length;
                        if (!appointmentsListEl) return;
                        
                        if (appointments.length === 0) {
                            appointmentsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_appointments_today">${window.t ? window.t('no_appointments_today', 'No appointments scheduled for today.') : 'No appointments scheduled for today.'}</p>`;
                            return;
                        }
                        
                        const patients = (window.storedPatients||[]);
                        appointmentsListEl.innerHTML = appointments.map(appointment => {
                            const patientName = appointment.clientName || 'Unknown Patient';
                            const statusColor = getStatusColor(appointment.status);
                            const patient = patients.find(p => p.fullName === patientName);
                            const patientId = patient ? patient.id : (appointment.patientId || '');
                            const hasConsultationToday = patientId ? consultations.some(c => {
                                if (c.patientId !== patientId) return false;
                                const consultationDate = new Date(c.createdAt).toISOString().split('T')[0];
                                return consultationDate === todayDateStr;
                            }) : false;
                            const hasConsultations = patientId ? consultations.some(c => c.patientId === patientId) : false;
                            
                            return `
                                <div class="appointment-item">
                                    <div class="patient-name">${patientName}</div>
                                    <div class="appointment-time">${appointment.time} (${appointment.duration} min)</div>
                                    <div class="flex items-center gap-2 mb-3">
                                        <span class="badge ${statusColor}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                                        ${hasConsultationToday ? `<span class=\"text-xs px-2 py-0.5 rounded bg-green-100 text-green-800\">${window.t ? window.t('consulted_today', 'Consulted today') : 'Consulted today'}</span>` : ''}
                                        ${appointment.notes ? `<span class=\"text-sm text-gray-600\">${appointment.notes}</span>` : ''}
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="btn btn-sm btn-primary" onclick="startConsultation('${appointment.id}', '${patientName}', '${patientId || ''}')" data-translate="new_consultation">${window.t ? window.t('new_consultation', 'New Consultation') : 'New Consultation'}</button>
                                        ${hasConsultations ? `<button class="btn btn-sm btn-secondary" onclick="updateLastConsultation('${appointment.id}', '${patientName}')" data-translate="update_last_consultation">${window.t ? window.t('update_last_consultation', 'Update Last Consultation') : 'Update Last Consultation'}</button>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                })
                .catch(error => {
                    console.error('Error fetching appointments:', error);
                    // Fallback to localStorage on error
                    const today = new Date();
                    const todayStr = formatDateForStorage(today);
                    const allAppointments = getAppointmentsForDate(today);
                    let appointments = allAppointments; // show all for today to mirror API-without-status
                    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                    const todayDateStr = today.toISOString().split('T')[0];
                    
                    if (appointmentCountEl) appointmentCountEl.textContent = appointments.length;
                    if (!appointmentsListEl) return;
                    
                    if (appointments.length === 0) {
                        appointmentsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_appointments_today">${window.t ? window.t('no_appointments_today', 'No appointments scheduled for today.') : 'No appointments scheduled for today.'}</p>`;
                        return;
                    }
                    
                    const patients = (window.storedPatients||[]);
                    appointmentsListEl.innerHTML = appointments.map(appointment => {
                        const patientName = appointment.clientName || 'Unknown Patient';
                        const statusColor = getStatusColor(appointment.status);
                        const patient = patients.find(p => p.fullName === patientName);
                        const patientId = patient ? patient.id : (appointment.patientId || '');
                        const hasConsultationToday = patientId ? consultations.some(c => {
                            if (c.patientId !== patientId) return false;
                            const consultationDate = new Date(c.createdAt).toISOString().split('T')[0];
                            return consultationDate === todayDateStr;
                        }) : false;
                        const hasConsultations = patientId ? consultations.some(c => c.patientId === patientId) : false;
                        
                        return `
                            <div class="appointment-item">
                                <div class="patient-name">${patientName}</div>
                                <div class="appointment-time">${appointment.time} (${appointment.duration} min)</div>
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="badge ${statusColor}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                                    ${hasConsultationToday ? `<span class=\"text-xs px-2 py-0.5 rounded bg-green-100 text-green-800\">${window.t ? window.t('consulted_today', 'Consulted today') : 'Consulted today'}</span>` : ''}
                                    ${appointment.notes ? `<span class=\"text-sm text-gray-600\">${appointment.notes}</span>` : ''}
                                </div>
                                <div class="flex gap-2">
                                    <button class="btn btn-sm btn-primary" onclick="startConsultation('${appointment.id}', '${patientName}', '${patientId || ''}')" data-translate="new_consultation">${window.t ? window.t('new_consultation', 'New Consultation') : 'New Consultation'}</button>
                                    ${hasConsultations ? `<button class="btn btn-sm btn-secondary" onclick="updateLastConsultation('${appointment.id}', '${patientName}')" data-translate="update_last_consultation">${window.t ? window.t('update_last_consultation', 'Update Last Consultation') : 'Update Last Consultation'}</button>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('');
                });
        }

function loadConsultationDocuments() {
    const documentsList = document.getElementById('consultDocumentsList');
    if (!documentsList) return;

    // Get patient ID from consultation form
    const patientId = document.getElementById('consultPatientId')?.value || currentConsultationPatientId;

    // Get consultation ID if editing
    const consultationId = window.editingConsultationId || null;
    
    // Load documents from current consultation if editing
    if (consultationId) {
        const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
        const consultation = consultations.find(c => c.id === consultationId);
        if (consultation && consultation.documents && Array.isArray(consultation.documents)) {
            window.consultationDocuments = [...consultation.documents];
        }
    }

    // Initialize if not exists
    if (!window.consultationDocuments) {
        window.consultationDocuments = [];
    }

    // Load certificates for this patient (only if patient is selected)
    const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
    const patientCertificates = patientId ? certificates.filter(cert => cert.patientId === patientId) : [];

    // Combine uploaded documents and certificates
    const allDocuments = [];

    // Add uploaded documents
    if (window.consultationDocuments && window.consultationDocuments.length > 0) {
        window.consultationDocuments.forEach(doc => {
            allDocuments.push({
                type: 'uploaded',
                ...doc
            });
        });
    }

    // Add certificates
    patientCertificates.forEach(cert => {
        allDocuments.push({
            type: 'certificate',
            ...cert
        });
    });

    if (allDocuments.length === 0) {
        documentsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p data-translate="no_documents_found">No documents found. ${patientId ? 'Upload documents using the button above.' : 'Select a patient first to view certificates, or upload documents using the button above.'}</p>
                    </div>
                `;
        if (window.I18n && window.I18n.walkAndTranslate) {
            window.I18n.walkAndTranslate();
        }
        return;
    }

    // Sort by date (newest first)
    allDocuments.sort((a, b) => {
        const dateA = new Date(a.uploadedAt || a.createdAt || 0);
        const dateB = new Date(b.uploadedAt || b.createdAt || 0);
        return dateB - dateA;
    });

    // Render documents
    documentsList.innerHTML = allDocuments.map(doc => {
        if (doc.type === 'certificate') {
            const certType = doc.certType ? doc.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Medical Certificate';
            const certDate = new Date(doc.createdAt);
            const dateStr = certDate.toLocaleDateString();
            const timeStr = certDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50 cursor-pointer" onclick="previewPatientDocument('certificate', '${doc.id}', '${doc.consultationId || ''}')">
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
                                    <strong data-translate="document_id">Document ID:</strong> ${doc.id}
                                </span>
                                <span class="text-blue-600 text-xs font-medium" data-translate="click_to_preview">Click to preview</span>
                            </div>
                            ${doc.restPeriod ? `
                                <div class="mt-2 text-sm text-gray-600">
                                    <strong data-translate="rest_period">Rest Period:</strong> ${doc.restPeriod} ${window.t ? window.t('days', 'days') : 'days'}
                                </div>
                            ` : ''}
                            ${doc.startDate || doc.endDate ? `
                                <div class="mt-2 text-sm text-gray-600">
                                    ${doc.startDate ? `<strong data-translate="start_date">Start Date:</strong> ${new Date(doc.startDate).toLocaleDateString()}` : ''}
                                    ${doc.startDate && doc.endDate ? ' | ' : ''}
                                    ${doc.endDate ? `<strong data-translate="end_date">End Date:</strong> ${new Date(doc.endDate).toLocaleDateString()}` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
        } else {
            // Uploaded document
            const uploadDate = new Date(doc.uploadedAt);
            const dateStr = uploadDate.toLocaleDateString();
            const timeStr = uploadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const fileSize = (doc.size / 1024).toFixed(2) + ' KB';
            const fileIcon = doc.type && doc.type.startsWith('image/') ? 
                '<svg class="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' :
                '<svg class="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';

            return `
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-orange-50">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex items-center flex-1">
                                    ${fileIcon}
                                    <div class="flex-1">
                                        <span class="font-semibold text-gray-900">${doc.name}</span>
                                        <span class="text-xs text-gray-500 ml-2">(${fileSize})</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-500">${dateStr} ${timeStr}</span>
                                    <button type="button" onclick="previewConsultationDocument('${doc.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium" data-translate="preview">Preview</button>
                                    <button type="button" onclick="removeConsultationDocument('${doc.id}')" class="text-red-600 hover:text-red-800 ml-2">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
        }
    }).join('');

    // Update translations after rendering
    if (window.I18n && window.I18n.walkAndTranslate) {
        window.I18n.walkAndTranslate();
    }
}