// Global medical certificate utilities
(function(){
  // Link any temporary medical certificates created before the consultation was saved
  window.linkTempCertificatesToConsultation = function(patientId, consultationId){
    try {
      const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
      const updated = certificates.map(cert => {
        if (cert.consultationId && String(cert.consultationId).startsWith('temp_cert_consult_') && cert.patientId === patientId) {
          return { ...cert, consultationId };
        }
        return cert;
      });
      localStorage.setItem('medical_certificates', JSON.stringify(updated));
    } catch (err) {
      console.error('Error linking temporary certificates:', err);
    }
  };

  // Read certificate fields from the consultation modal and persist a certificate for the given consultation
  // Returns true if a certificate was saved or updated, false if no certificate fields were provided
  window.autoSaveCertificateFromConsultationFields = function(consultationId, patientId){
    const certStartDateEl = document.getElementById('consultCertStartDate');
    const certEndDateEl = document.getElementById('consultCertEndDate');
    const certRestPeriodEl = document.getElementById('consultCertRestPeriod');
    const certNotesEl = document.getElementById('consultCertNotes');

    const certType = ''; // Certificate type field removed, using default
    const certStartDate = certStartDateEl?.value || '';
    const certEndDate = certEndDateEl?.value || '';
    const certRestPeriod = certRestPeriodEl?.value || '';
    const certNotes = certNotesEl?.value.trim() || '';

    if (!(certStartDate || certEndDate || certRestPeriod)) {
      return false;
    }

    try {
      const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
      const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
      const patient = patients.find(p => p.id === patientId);
      const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');

      const existingIndex = certificates.findIndex(c => c.consultationId === consultationId);
      const payload = {
        certType,
        restPeriod: certRestPeriod ? parseInt(certRestPeriod) : null,
        startDate: certStartDate,
        endDate: certEndDate || null,
        notes: certNotes,
        patientName: patient ? patient.fullName : (existingIndex !== -1 ? certificates[existingIndex].patientName : '-') ,
        doctorName: session?.name || (existingIndex !== -1 ? certificates[existingIndex].doctorName : 'Doctor')
      };

      if (existingIndex !== -1) {
        certificates[existingIndex] = { ...certificates[existingIndex], ...payload };
      } else {
        certificates.push({
          id: 'cert_' + Date.now(),
          consultationId,
          patientId,
          patientName: payload.patientName,
          doctorName: payload.doctorName,
          certType: payload.certType,
          restPeriod: payload.restPeriod,
          startDate: payload.startDate,
          endDate: payload.endDate,
          notes: payload.notes,
          createdAt: new Date().toISOString()
        });
      }

      localStorage.setItem('medical_certificates', JSON.stringify(certificates));
      return true;
    } catch (e) {
      console.error('Error auto-saving certificate:', e);
      return false;
    }
  };

  // Print a stored medical certificate by its ID
  window.printMedicalCertificate = function(certificateId) {
    const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
    const cert = certificates.find(c => c.id === certificateId);
    if (!cert) {
      alert('Certificate not found.');
      return;
    }

    // Patient information
    const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
    const patient = cert.patientId ? patients.find(p => p.id === cert.patientId) : null;

    // Consultation date
    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    const consultation = cert.consultationId ? consultations.find(c => c.id === cert.consultationId) : null;
    const consultationDate = consultation ? consultation.createdAt : cert.createdAt;

    // Cabinet settings (expects a global getCabinetSettings function)
    const cabinetSettings = (typeof window.getCabinetSettings === 'function')
      ? window.getCabinetSettings()
      : (JSON.parse(localStorage.getItem('cabinetSettings') || '{}'));

    // Date formatting (FR)
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

    // Patient title
    const patientTitle = patient && patient.gender ?
      (patient.gender.toLowerCase() === 'male' || patient.gender.toLowerCase() === 'homme' ? 'M.' : 'Mme') :
      'M.';

    // Rest period calculation
    const restDays = cert.restPeriod || (cert.startDate && cert.endDate ?
      Math.ceil((new Date(cert.endDate) - new Date(cert.startDate)) / (1000 * 60 * 60 * 24)) : 0);

    // Cabinet location
    const cabinetLocation = cabinetSettings.address ?
      (cabinetSettings.address.split(',')[0] || cabinetSettings.address) : 'Tunis';

    // Build printable HTML
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
    certificateHTML += '<p>Je soussigné(e), Dr ' + (cert.doctorName || '') + ', Médecin généraliste, certifie que :</p>';

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
    certificateHTML += '<div>' + (cert.doctorName || '') + '</div>';
    if (cabinetSettings.address) {
      certificateHTML += '<div>' + cabinetSettings.address + '</div>';
    }
    if (cabinetSettings.phone) {
     certificateHTML += '<div>Tél: ' + cabinetSettings.phone + '</div>';
   }
    certificateHTML += '</div>';
    certificateHTML += '</div>';

    certificateHTML += '<scr' + 'ipt>window.onload = function() { window.print(); };</scr' + 'ipt>';

printWindow.document.write(certificateHTML);
printWindow.document.close();
};

  // Print certificate from form data (without saving)
window.printCertificateFromForm = function() {
  // Get form data
  const certStartDateEl = document.getElementById('consultCertStartDate');
  const certEndDateEl = document.getElementById('consultCertEndDate');
  const certRestPeriodEl = document.getElementById('consultCertRestPeriod');
  const consultationIdEl = document.getElementById('consultCertConsultationId');
  const patientIdEl = document.getElementById('consultPatientId');
  
  const certType = ''; // Certificate type removed, using default
  const certStartDate = certStartDateEl?.value || '';
  const certEndDate = certEndDateEl?.value || '';
  const certRestPeriod = certRestPeriodEl?.value || '';
  const consultationId = consultationIdEl?.value || '';
  const patientId = patientIdEl?.value || '';
  
  // Validate required fields
  if (!patientId) {
    if (typeof window.showTranslatedAlert === 'function') {
      window.showTranslatedAlert('Please select a patient first.');
    } else {
      alert('Please select a patient first.');
    }
    return;
  }
  
  // Get patient information
  const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
  const patient = patients.find(p => p.id === patientId);
  
  if (!patient) {
    if (typeof window.showTranslatedAlert === 'function') {
      window.showTranslatedAlert('Patient not found.');
    } else {
      alert('Patient not found.');
    }
    return;
  }
  
  // Get consultation information
  const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
  const consultation = consultationId ? consultations.find(c => c.id === consultationId) : null;
  const consultationDate = consultation ? consultation.createdAt : new Date().toISOString();
  
  // Get session info for doctor name
  const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
  const doctorName = session?.name || consultation?.doctor || 'Doctor';
  
  // Cabinet settings
  const cabinetSettings = (typeof window.getCabinetSettings === 'function')
    ? window.getCabinetSettings()
    : (JSON.parse(localStorage.getItem('cabinetSettings') || '{}'));
  
  // Date formatting (FR)
  const formatDateFR = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '/' + month + '/' + year;
  };
  
  const consultationDateFR = formatDateFR(consultationDate);
  const startDateFR = formatDateFR(certStartDate);
  const endDateFR = formatDateFR(certEndDate);
  const certificateDateFR = formatDateFR(new Date().toISOString());
  const patientBirthDateFR = patient.dateOfBirth ? formatDateFR(patient.dateOfBirth) : '';
  
  // Patient title
  const patientTitle = patient.gender ?
    (patient.gender.toLowerCase() === 'male' || patient.gender.toLowerCase() === 'homme' ? 'M.' : 'Mme') :
    'M.';
  
  // Rest period calculation
  const restDays = certRestPeriod ? parseInt(certRestPeriod) : (certStartDate && certEndDate ?
    Math.ceil((new Date(certEndDate) - new Date(certStartDate)) / (1000 * 60 * 60 * 24)) : 0);
  
  // Cabinet location
  const cabinetLocation = cabinetSettings.address ?
    (cabinetSettings.address.split(',')[0] || cabinetSettings.address) : 'Tunis';
  
  // Certificate type - using default since field was removed
  const certTypeName = 'Certificat médical';
  
  // Build printable HTML
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    if (typeof window.showTranslatedAlert === 'function') {
      window.showTranslatedAlert('Popup blocked. Please allow popups to print.');
    } else {
      alert('Popup blocked. Please allow popups to print.');
    }
    return;
  }
  
  let certificateHTML = '<!DOCTYPE html><html><head>';
  certificateHTML += '<title>' + certTypeName + ' - ' + patient.fullName + '</title>';
  certificateHTML += '<meta charset="UTF-8">';
  certificateHTML += '<style>';
  certificateHTML += 'body { font-family: "Times New Roman", serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.8; font-size: 14px; }';
  certificateHTML += '.certificate-title { font-weight: bold; font-size: 18px; margin-bottom: 30px; text-align: center; }';
  certificateHTML += '.cert-body { text-align: justify; margin: 20px 0; }';
  certificateHTML += '.cert-body p { margin: 15px 0; }';
  certificateHTML += '.signature-section { margin-top: 60px; }';
  certificateHTML += '.signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }';
  certificateHTML += '.signature-box { margin-top: 30px; }';
  certificateHTML += '.signature-box div { margin: 5px 0; }';
  certificateHTML += '@media print { body { padding: 20px; } }';
  certificateHTML += '</style></head><body>';
  
  // Title
  certificateHTML += '<div class="certificate-title">' + certTypeName.toUpperCase() + '</div>';
  
  // Certificate body
  certificateHTML += '<div class="cert-body">';
  
  // Doctor declaration
  certificateHTML += '<p>Je soussigné(e), Dr ' + doctorName + ', Médecin généraliste, certifie que :</p>';
  
  // Patient and consultation info
  certificateHTML += '<p>' + patientTitle + ' ' + patient.fullName;
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
  if (certStartDate && certEndDate) {
    certificateHTML += '<p>Je recommande donc à mon patient de prendre un repos total du ' + startDateFR + ' au ' + endDateFR + '.</p>';
  } else if (certStartDate) {
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
  certificateHTML += '<div>' + doctorName + '</div>';
  if (cabinetSettings.address) {
    certificateHTML += '<div>' + cabinetSettings.address + '</div>';
  }
  if (cabinetSettings.phone) {
    certificateHTML += '<div>Tél: ' + cabinetSettings.phone + '</div>';
  }
  certificateHTML += '</div>';
  certificateHTML += '</div>';
  
  certificateHTML += '<scr' + 'ipt>window.onload = function() { window.print(); };</scr' + 'ipt>';
  
  printWindow.document.write(certificateHTML);
  printWindow.document.close();
};

// Save and/or update a medical certificate using fields from the consultation form
window.saveAndGenerateCertificate = function(showAlert = true) {
const patientId = document.getElementById('consultPatientId')?.value;
if (!patientId) {
if (showAlert) alert('Please select a patient first.');
return;
}

// Determine consultation ID
let consultationId = document.getElementById('consultCertConsultationId')?.value || '';
if (!consultationId && window.editingConsultationId) consultationId = window.editingConsultationId;

// If still no ID, try most recent consultation for this patient
if (!consultationId) {
try {
const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
const pid = document.getElementById('consultPatientId')?.value;
if (pid) {
const patientConsultations = consultations.filter(c => c.patientId === pid);
if (patientConsultations.length > 0) {
const mostRecent = patientConsultations.sort((a,b)=> new Date(b.createdAt||b.date||0) - new Date(a.createdAt||a.date||0))[0];
consultationId = mostRecent.id;
const hidden = document.getElementById('consultCertConsultationId');
if (hidden) hidden.value = consultationId;
}
}
} catch (e) {
console.error('Error finding consultation ID:', e);
}
}

// If still no ID, create temporary one
if (!consultationId) consultationId = 'temp_cert_consult_' + Date.now();

const certType = ''; // Certificate type field removed, using default
const restPeriod = document.getElementById('consultCertRestPeriod')?.value || '';
const startDate = document.getElementById('consultCertStartDate')?.value || '';
const endDate = document.getElementById('consultCertEndDate')?.value || '';
const notes = document.getElementById('consultCertNotes')?.value?.trim() || '';

if (!startDate && !endDate && !restPeriod) return; // nothing to save

const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
const patient = patients.find(p => p.id === patientId);
const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');

const existingIdx = certificates.findIndex(c => c.consultationId === consultationId);
let payload;
if (existingIdx !== -1) {
payload = {
...certificates[existingIdx],
certType,
restPeriod: restPeriod ? parseInt(restPeriod) : null,
startDate,
endDate: endDate || null,
notes,
patientName: patient ? patient.fullName : certificates[existingIdx].patientName || '-',
doctorName: session?.name || certificates[existingIdx].doctorName || 'Doctor'
};
certificates[existingIdx] = payload;
} else {
payload = {
id: 'cert_' + Date.now(),
consultationId,
patientId,
patientName: patient ? patient.fullName : '-',
doctorName: session?.name || 'Doctor',
certType,
restPeriod: restPeriod ? parseInt(restPeriod) : null,
startDate,
endDate: endDate || null,
notes,
createdAt: new Date().toISOString()
};
certificates.push(payload);
}

localStorage.setItem('medical_certificates', JSON.stringify(certificates));

if (showAlert) {
const successMessage = (window.translations && window.currentLanguage && translations[currentLanguage]?.certificate_saved) || 'Medical certificate saved successfully!';
if (typeof window.showTranslatedAlert === 'function') {
window.showTranslatedAlert('certificate_saved', successMessage);
} else {
alert(successMessage);
}
}

const detailModal = document.getElementById('consultationDetailModal');
if (detailModal && detailModal.classList.contains('active')) {
try {
const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
const exists = consultations.some(c => c.id === consultationId);
if (exists && typeof window.viewConsultationDetail === 'function') {
setTimeout(() => window.viewConsultationDetail(consultationId), 100);
}
} catch {}
}

const consultCertForm = document.getElementById('consultCertificateForm');
if (consultCertForm) {
const formInputs = consultCertForm.querySelectorAll('input, select, textarea');
formInputs.forEach(input => { if (input.id !== 'consultCertConsultationId') input.value = ''; });
}
};

// Auto-calc wiring for certificate dates/rest period
function wireCertificateAutoCalc() {
const consultCertForm = document.getElementById('consultCertificateForm');
if (!consultCertForm) return;
const consultRestPeriodInput = document.getElementById('consultCertRestPeriod');
const consultStartDateInput = document.getElementById('consultCertStartDate');
const consultEndDateInput = document.getElementById('consultCertEndDate');
if (!(consultRestPeriodInput && consultStartDateInput && consultEndDateInput)) return;
let isUpdating = false;
const updateConsultEndDate = function() {
if (isUpdating) return;
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
if (isUpdating) return;
const endDate = consultEndDateInput.value;
const restPeriod = parseInt(consultRestPeriodInput.value);
if (endDate && restPeriod > 0) {
isUpdating = true;
const end = new Date(endDate);
end.setDate(end.getDate() - (restPeriod - 1));
consultStartDateInput.value = end.toISOString().split('T')[0];
isUpdating = false;
}
};
const updateConsultRestPeriod = function() {
if (isUpdating) return;
const startDate = consultStartDateInput.value;
const endDate = consultEndDateInput.value;
if (startDate && endDate) {
isUpdating = true;
const start = new Date(startDate);
const end = new Date(endDate);
if (end >= start) {
const diffTime = end - start;
const diffDays = Math.floor(diffTime / (1000*60*60*24)) + 1;
consultRestPeriodInput.value = diffDays;
}
isUpdating = false;
}
};
consultRestPeriodInput.addEventListener('input', updateConsultEndDate);
consultStartDateInput.addEventListener('change', function(){
updateConsultEndDate();
updateConsultRestPeriod();
});
consultEndDateInput.addEventListener('change', function(){
updateConsultStartDate();
updateConsultRestPeriod();
});
}

// Attempt to wire on DOM ready
document.addEventListener('DOMContentLoaded', wireCertificateAutoCalc);
})();