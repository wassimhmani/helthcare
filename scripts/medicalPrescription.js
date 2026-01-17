// Global medical prescription utilities
(function(){
  // Internal state for current prescription items during form editing
  let prescriptionMedicines = [];

  function t(key, fallback){
    try { return (window.t ? window.t(key, fallback) : fallback); } catch { return fallback; }
  }

  // Public: refresh the medicines select from the global medicines catalog
  function updatePrescriptionMedicineDropdown(){
    const select = document.getElementById('prescriptionMedicineSelect');
    if (!select) return;
    if (typeof window.getMedicines !== 'function') return;

    const medicines = window.getMedicines();
    const currentValue = select.value;

    select.innerHTML = '<option value="" data-translate="select_medicine">Select medicine...</option>';
    medicines.forEach(med => {
      const option = document.createElement('option');
      option.value = med.id;
      option.textContent = med.name + (med.dosage ? ` (${med.dosage})` : '');
      select.appendChild(option);
    });

    if (currentValue) select.value = currentValue;
  }

  function updatePrescriptionTextarea(){
    const textarea = document.getElementById('consultPrescription');
    if (!textarea) return;
    if (typeof window.getMedicines !== 'function') return;

    const medicines = window.getMedicines();
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
    } else {
      // keep whatever user typed if list is empty
    }
  }

  function renderPrescriptionMedicinesList(){
    const container = document.getElementById('prescriptionListContainer');
    if (!container) return;

    if (prescriptionMedicines.length === 0) {
      container.innerHTML = '';
      updatePrescriptionTextarea();
      return;
    }

    if (typeof window.getMedicines !== 'function') return;
    const medicines = window.getMedicines();

    container.innerHTML = prescriptionMedicines.map((item, index) => {
      const med = medicines.find(m => m.id === item.medicineId);
      const medName = med ? med.name : 'Unknown Medicine';
      const dosage = item.dosage || med?.dosage || '';
      const instructions = item.instructions || '';
      return `
        <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div class="flex-1">
            <div class="font-semibold text-gray-900">${medName}</div>
            ${dosage ? `<div class=\"text-sm text-gray-600\">${t('dosage','Dosage')}: ${dosage}</div>` : ''}
            ${instructions ? `<div class=\"text-sm text-gray-600\">${t('instructions','Instructions')}: ${instructions}</div>` : ''}
          </div>
          <button type="button" onclick="removeMedicineFromPrescription(${index})" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            <span data-translate="remove">${t('remove','Remove')}</span>
          </button>
        </div>
      `;
    }).join('');

    updatePrescriptionTextarea();
  }

  function addMedicineToPrescription(){
    const select = document.getElementById('prescriptionMedicineSelect');
    const dosageInput = document.getElementById('prescriptionDosage');
    const instructionsInput = document.getElementById('prescriptionInstructions');
    if (!select || !dosageInput) return;

    const medicineId = select.value; // use string ID from option value
    const dosage = dosageInput.value.trim();
    const instructions = instructionsInput ? instructionsInput.value.trim() : '';
    if (!medicineId) { alert('Please select a medicine.'); return; }

    prescriptionMedicines.push({ medicineId, dosage, instructions });
    renderPrescriptionMedicinesList();

    // Clear inputs
    select.value = '';
    dosageInput.value = '';
    if (instructionsInput) instructionsInput.value = '';
  }

  function removeMedicineFromPrescription(index){
    if (index >= 0 && index < prescriptionMedicines.length) {
      prescriptionMedicines.splice(index, 1);
      renderPrescriptionMedicinesList();
    }
  }

  // Clear all prescription medicines
  function clearPrescriptionMedicinesList(){
    if (prescriptionMedicines.length === 0) {
      // Even if list is empty, clear the textarea if user wants to clear
      const textarea = document.getElementById('consultPrescription');
      if (textarea && textarea.value.trim()) {
        if (typeof window.showTranslatedConfirm === 'function') {
          if (!window.showTranslatedConfirm('confirm_clear_prescription')) {
            return;
          }
        } else {
          if (!confirm('Are you sure you want to clear all medicines from the prescription?')) {
            return;
          }
        }
        textarea.value = '';
        if (typeof window.showTranslatedAlert === 'function') {
          window.showTranslatedAlert('prescription_cleared');
        }
      }
      return;
    }
    
    if (typeof window.showTranslatedConfirm === 'function') {
      if (!window.showTranslatedConfirm('confirm_clear_prescription')) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to clear all medicines from the prescription?')) {
        return;
      }
    }
    
    prescriptionMedicines = [];
    renderPrescriptionMedicinesList();
    
    // Also clear the prescription textarea
    const textarea = document.getElementById('consultPrescription');
    if (textarea) {
      textarea.value = '';
    }
    
    if (typeof window.showTranslatedAlert === 'function') {
      window.showTranslatedAlert('prescription_cleared');
    }
  }

  // Printing a consultation prescription by consultation id
  function printPrescription(consultationId){
    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    const c = consultations.find(x => x.id === consultationId);
    if (!c || !c.prescription) {
      alert('Prescription not found.');
      return;
    }

    const patients = Array.isArray(window.storedPatients) ? window.storedPatients : [];
    const patient = patients.find(p => String(p.id) === String(c.patientId));
    const cabinetSettings = JSON.parse(localStorage.getItem('cabinetSettings') || '{}');

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
  }

  // Wire events when DOM is ready
  function wirePrescriptionUI(){
    const addBtn = document.getElementById('addMedicineToPrescriptionBtn');
    if (addBtn) addBtn.addEventListener('click', addMedicineToPrescription);
    // Keep dropdown synced
    updatePrescriptionMedicineDropdown();
    // Render any in-memory items if present
    renderPrescriptionMedicinesList();
  }

  document.addEventListener('DOMContentLoaded', wirePrescriptionUI);

  // Print prescription medicines list
  function printPrescriptionMedicinesList(){
    if (prescriptionMedicines.length === 0) {
      if (typeof window.showTranslatedAlert === 'function') {
        window.showTranslatedAlert('no_medicines_found');
      } else {
        alert('No medicines found.');
      }
      return;
    }

    if (typeof window.getMedicines !== 'function') {
      alert('Medicines catalog not available.');
      return;
    }

    const medicines = window.getMedicines();
    const title = t('medical_prescription', 'Medical Prescription');

    // Build the medicines list HTML
    let medicinesHTML = '<h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: #1d4ed8;">' + title + '</h2>';
    medicinesHTML += '<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">';
    medicinesHTML += '<thead><tr style="background-color: #f3f4f6;">';
    medicinesHTML += '<th style="padding: 0.75rem; text-align: left; border: 1px solid #d1d5db;">' + t('medicine_name', 'Medicine') + '</th>';
    medicinesHTML += '<th style="padding: 0.75rem; text-align: left; border: 1px solid #d1d5db;">' + t('dosage', 'Dosage') + '</th>';
    medicinesHTML += '<th style="padding: 0.75rem; text-align: left; border: 1px solid #d1d5db;">' + t('instructions', 'Instructions') + '</th>';
    medicinesHTML += '</tr></thead><tbody>';

    prescriptionMedicines.forEach((item) => {
      const med = medicines.find(m => m.id === item.medicineId);
      const medName = med ? med.name : 'Unknown Medicine';
      const dosage = item.dosage || med?.dosage || '';
      const instructions = item.instructions || '';
      
      medicinesHTML += '<tr style="border-bottom: 1px solid #e5e7eb;">';
      medicinesHTML += '<td style="padding: 0.75rem; border: 1px solid #d1d5db;">' + medName + '</td>';
      medicinesHTML += '<td style="padding: 0.75rem; border: 1px solid #d1d5db;">' + dosage + '</td>';
      medicinesHTML += '<td style="padding: 0.75rem; border: 1px solid #d1d5db;">' + instructions + '</td>';
      medicinesHTML += '</tr>';
    });

    medicinesHTML += '</tbody></table>';

    // Open print window
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
      console.warn('Print window blocked by browser');
      if (typeof window.showTranslatedAlert === 'function') {
        window.showTranslatedAlert('popup_blocked');
      } else {
        alert('Popup blocked. Please allow popups to print.');
      }
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; line-height: 1.6; color: #1f2937; }
            h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #1d4ed8; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { padding: 0.75rem; text-align: left; border: 1px solid #d1d5db; }
            thead tr { background-color: #f3f4f6; }
            tbody tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          ${medicinesHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  // Expose API globally for compatibility with existing calls and templates
  window.updatePrescriptionMedicineDropdown = updatePrescriptionMedicineDropdown;
  window.renderPrescriptionMedicinesList = renderPrescriptionMedicinesList;
  window.updatePrescriptionTextarea = updatePrescriptionTextarea;
  window.addMedicineToPrescription = addMedicineToPrescription;
  window.removeMedicineFromPrescription = removeMedicineFromPrescription;
  window.printPrescription = printPrescription;
  window.printPrescriptionMedicinesList = printPrescriptionMedicinesList;
  window.clearPrescriptionMedicinesList = clearPrescriptionMedicinesList;
})();