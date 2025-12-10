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

function rad_get_value($data, $key, $default = null) {
    if (!isset($data[$key])) {
        return $default;
    }
    $value = $data[$key];
    if (is_string($value)) {
        return trim($value);
    }
    return $value;
}

// Map frontend radiology result structure to database structure
$record = [
    'id' => rad_get_value($input, 'id'),
    // allow either consultationId or consultation_id
    'consultation_id' => rad_get_value($input, 'consultationId', rad_get_value($input, 'consultation_id', '')),
    'patient_id' => rad_get_value($input, 'patientId', rad_get_value($input, 'patient_id', '')),
    'exam_type' => rad_get_value($input, 'examType', rad_get_value($input, 'exam_type')),
    'exam_date' => rad_get_value($input, 'examDate', rad_get_value($input, 'exam_date')),
    'radiology_result' => rad_get_value($input, 'radiologyResult', rad_get_value($input, 'radiology_result')),
    'radiology_diagnostics' => rad_get_value($input, 'radiologyDiagnostics', rad_get_value($input, 'radiology_diagnostics')),
    'notes' => rad_get_value($input, 'notes'),
    'documents' => rad_get_value($input, 'documents'),
    'doctor' => rad_get_value($input, 'doctor'),
    'created_at' => rad_get_value($input, 'createdAt'),
    'updated_at' => rad_get_value($input, 'updatedAt'),
];

if ($record['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Radiology result id is required']);
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

// Ensure radiology_result table exists (safety net in case migrations were not run)
$createSql = "CREATE TABLE IF NOT EXISTS `radiology_result` (
  `id` VARCHAR(100) NOT NULL,
  `consultation_id` VARCHAR(100) DEFAULT NULL,
  `patient_id` VARCHAR(100) DEFAULT NULL,
  `exam_type` VARCHAR(255) DEFAULT NULL,
  `exam_date` DATE DEFAULT NULL,
  `radiology_result` TEXT DEFAULT NULL,
  `radiology_diagnostics` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `documents` LONGTEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_radiology_result_patient_id` (`patient_id`),
  KEY `idx_radiology_result_consultation_id` (`consultation_id`),
  KEY `idx_radiology_result_exam_date` (`exam_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure radiology_result table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Helpers to normalize dates
function rad_normalize_date($value) {
    if (!$value) return null;
    $ts = strtotime($value);
    if ($ts === false) return null;
    return date('Y-m-d', $ts);
}

function rad_normalize_datetime($value) {
    $ts = $value ? strtotime($value) : false;
    if ($ts === false) {
        return date('Y-m-d H:i:s');
    }
    return date('Y-m-d H:i:s', $ts);
}

$examDate = rad_normalize_date($record['exam_date']);
$createdAt = rad_normalize_datetime($record['created_at']);
$updatedAt = rad_normalize_datetime($record['updated_at']);

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `radiology_result` (
  id, consultation_id, patient_id, exam_type, exam_date, radiology_result, radiology_diagnostics, notes, documents, doctor, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  consultation_id = VALUES(consultation_id),
  patient_id = VALUES(patient_id),
  exam_type = VALUES(exam_type),
  exam_date = VALUES(exam_date),
  radiology_result = VALUES(radiology_result),
  radiology_diagnostics = VALUES(radiology_diagnostics),
  notes = VALUES(notes),
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
    'ssssssssssss',
    $record['id'],
    $record['consultation_id'],
    $record['patient_id'],
    $record['exam_type'],
    $examDate,
    $record['radiology_result'],
    $record['radiology_diagnostics'],
    $record['notes'],
    $record['documents'],
    $record['doctor'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update radiology result', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $record['id']]);
