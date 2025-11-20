<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
    exit;
}

function get_value($data, $key, $default = null) {
    if (!isset($data[$key])) {
        return $default;
    }
    $value = $data[$key];
    if (is_string($value)) {
        return trim($value);
    }
    return $value;
}

// Map frontend consultation structure to database structure
$consultation = [
    'id' => get_value($input, 'id'),
    'patient_id' => get_value($input, 'patientId', ''),
    'height' => get_value($input, 'height'),
    'weight' => get_value($input, 'weight'),
    'temperature' => get_value($input, 'temperature'),
    'heart_rate' => get_value($input, 'heartRate'),
    'blood_sugar' => get_value($input, 'bloodSugar'),
    'bp_systolic' => get_value($input, 'bpSystolic'),
    'bp_diastolic' => get_value($input, 'bpDiastolic'),
    'imc' => get_value($input, 'imc'),
    'bmi_category' => get_value($input, 'bmiCategory'),
    'vital_notes' => get_value($input, 'vitalNotes'),
    'notes' => get_value($input, 'notes'),
    'radiology_result' => get_value($input, 'radiologyResult'),
    'radiology_diagnostics' => get_value($input, 'radiologyDiagnostics'),
    'lab_results' => get_value($input, 'labResults'),
    'lab_notes' => get_value($input, 'labNotes'),
    'prescription' => get_value($input, 'prescription'),
    'payment_status' => get_value($input, 'paymentStatus', 'paying'),
    'documents' => isset($input['documents']) && is_array($input['documents']) ? json_encode($input['documents']) : null,
    'doctor' => get_value($input, 'doctor'),
    'created_at' => get_value($input, 'createdAt'),
    'updated_at' => get_value($input, 'updatedAt')
];

if ($consultation['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Consultation id is required']);
    exit;
}

if ($consultation['patient_id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Patient id is required']);
    exit;
}

// Connect to MySQL (XAMPP defaults). Adjust credentials if needed.
$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'helthcareDB';

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Unable to connect to database', 'error' => $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Ensure table exists
$createSql = "CREATE TABLE IF NOT EXISTS `consultation` (
  `id` VARCHAR(100) NOT NULL,
  `patient_id` VARCHAR(100) NOT NULL,
  `height` DECIMAL(5,2) DEFAULT NULL,
  `weight` DECIMAL(5,2) DEFAULT NULL,
  `temperature` DECIMAL(4,2) DEFAULT NULL,
  `heart_rate` INT DEFAULT NULL,
  `blood_sugar` INT DEFAULT NULL,
  `bp_systolic` INT DEFAULT NULL,
  `bp_diastolic` INT DEFAULT NULL,
  `imc` DECIMAL(4,2) DEFAULT NULL,
  `bmi_category` VARCHAR(50) DEFAULT NULL,
  `vital_notes` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `radiology_result` TEXT DEFAULT NULL,
  `radiology_diagnostics` TEXT DEFAULT NULL,
  `lab_results` TEXT DEFAULT NULL,
  `lab_notes` TEXT DEFAULT NULL,
  `prescription` TEXT DEFAULT NULL,
  `payment_status` VARCHAR(50) DEFAULT 'paying',
  `documents` LONGTEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_doctor` (`doctor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Convert numeric values
$height = $consultation['height'] !== null ? floatval($consultation['height']) : null;
$weight = $consultation['weight'] !== null ? floatval($consultation['weight']) : null;
$temperature = $consultation['temperature'] !== null ? floatval($consultation['temperature']) : null;
$heartRate = $consultation['heart_rate'] !== null ? intval($consultation['heart_rate']) : null;
$bloodSugar = $consultation['blood_sugar'] !== null ? intval($consultation['blood_sugar']) : null;
$bpSystolic = $consultation['bp_systolic'] !== null ? intval($consultation['bp_systolic']) : null;
$bpDiastolic = $consultation['bp_diastolic'] !== null ? intval($consultation['bp_diastolic']) : null;
$imc = $consultation['imc'] !== null ? floatval($consultation['imc']) : null;

// Get created_at and updated_at from input or use current time
$createdAt = isset($input['createdAt']) && $input['createdAt'] ? date('Y-m-d H:i:s', strtotime($input['createdAt'])) : date('Y-m-d H:i:s');
$updatedAt = isset($input['updatedAt']) && $input['updatedAt'] ? date('Y-m-d H:i:s', strtotime($input['updatedAt'])) : date('Y-m-d H:i:s');

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `consultation` (
    id, patient_id, height, weight, temperature, heart_rate, blood_sugar, 
    bp_systolic, bp_diastolic, imc, bmi_category, vital_notes, notes, 
    radiology_result, radiology_diagnostics, lab_results, lab_notes, 
    prescription, payment_status, documents, doctor, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    patient_id = VALUES(patient_id),
    height = VALUES(height),
    weight = VALUES(weight),
    temperature = VALUES(temperature),
    heart_rate = VALUES(heart_rate),
    blood_sugar = VALUES(blood_sugar),
    bp_systolic = VALUES(bp_systolic),
    bp_diastolic = VALUES(bp_diastolic),
    imc = VALUES(imc),
    bmi_category = VALUES(bmi_category),
    vital_notes = VALUES(vital_notes),
    notes = VALUES(notes),
    radiology_result = VALUES(radiology_result),
    radiology_diagnostics = VALUES(radiology_diagnostics),
    lab_results = VALUES(lab_results),
    lab_notes = VALUES(lab_notes),
    prescription = VALUES(prescription),
    payment_status = VALUES(payment_status),
    documents = VALUES(documents),
    doctor = VALUES(doctor),
    updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'ssdddiidddsssssssssssss',
    $consultation['id'],
    $consultation['patient_id'],
    $height,
    $weight,
    $temperature,
    $heartRate,
    $bloodSugar,
    $bpSystolic,
    $bpDiastolic,
    $imc,
    $consultation['bmi_category'],
    $consultation['vital_notes'],
    $consultation['notes'],
    $consultation['radiology_result'],
    $consultation['radiology_diagnostics'],
    $consultation['lab_results'],
    $consultation['lab_notes'],
    $consultation['prescription'],
    $consultation['payment_status'],
    $consultation['documents'],
    $consultation['doctor'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update consultation', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $consultation['id']]);

