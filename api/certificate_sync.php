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

function cert_get_value($data, $key, $default = null) {
    if (!isset($data[$key])) {
        return $default;
    }
    $value = $data[$key];
    if (is_string($value)) {
        return trim($value);
    }
    return $value;
}

// Map frontend certificate structure to database structure
$certificate = [
    'id' => cert_get_value($input, 'id'),
    // allow either consultationId or consultation_id
    'consultation_id' => cert_get_value($input, 'consultationId', cert_get_value($input, 'consultation_id', '')),
    'patient_id' => cert_get_value($input, 'patientId', cert_get_value($input, 'patient_id', '')),
    'cert_type' => cert_get_value($input, 'certType', cert_get_value($input, 'cert_type')),
    'rest_period' => cert_get_value($input, 'restPeriod'),
    'start_date' => cert_get_value($input, 'startDate'),
    'end_date' => cert_get_value($input, 'endDate'),
    'notes' => cert_get_value($input, 'notes'),
    'doctor_name' => cert_get_value($input, 'doctorName'),
    'created_at' => cert_get_value($input, 'createdAt'),
    'updated_at' => cert_get_value($input, 'updatedAt'),
];

if ($certificate['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Certificate id is required']);
    exit;
}

if ($certificate['consultation_id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Consultation id is required']);
    exit;
}

if ($certificate['patient_id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Patient id is required']);
    exit;
}

// Connect to MySQL (same settings as other APIs)
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

// Ensure certificate table exists (safety net in case migrations were not run)
$createSql = "CREATE TABLE IF NOT EXISTS `certificate` (
  `id` VARCHAR(100) NOT NULL,
  `consultation_id` VARCHAR(100) NOT NULL,
  `patient_id` VARCHAR(100) NOT NULL,
  `cert_type` VARCHAR(100) DEFAULT NULL,
  `rest_period` INT DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `doctor_name` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_certificate_patient_id` (`patient_id`),
  KEY `idx_certificate_consultation_id` (`consultation_id`),
  KEY `idx_certificate_start_date` (`start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure certificate table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Helpers to normalize dates
function cert_normalize_date($value) {
    if (!$value) return null;
    $ts = strtotime($value);
    if ($ts === false) return null;
    return date('Y-m-d', $ts);
}

function cert_normalize_datetime($value) {
    $ts = $value ? strtotime($value) : false;
    if ($ts === false) {
        return date('Y-m-d H:i:s');
    }
    return date('Y-m-d H:i:s', $ts);
}

$restPeriod = null;
if ($certificate['rest_period'] !== null && $certificate['rest_period'] !== '') {
    $restPeriod = (int)$certificate['rest_period'];
}

$startDate = cert_normalize_date($certificate['start_date']);
$endDate = cert_normalize_date($certificate['end_date']);
$createdAt = cert_normalize_datetime($certificate['created_at']);
$updatedAt = cert_normalize_datetime($certificate['updated_at']);

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `certificate` (
  id, consultation_id, patient_id, cert_type, rest_period, start_date, end_date, notes, doctor_name, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  consultation_id = VALUES(consultation_id),
  patient_id = VALUES(patient_id),
  cert_type = VALUES(cert_type),
  rest_period = VALUES(rest_period),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  notes = VALUES(notes),
  doctor_name = VALUES(doctor_name),
  updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'ssssissssss',
    $certificate['id'],
    $certificate['consultation_id'],
    $certificate['patient_id'],
    $certificate['cert_type'],
    $restPeriod,
    $startDate,
    $endDate,
    $certificate['notes'],
    $certificate['doctor_name'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update certificate', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $certificate['id']]);
