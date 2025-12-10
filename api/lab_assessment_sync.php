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

function la_get_value($data, $key, $default = null) {
    if (!isset($data[$key])) {
        return $default;
    }
    $value = $data[$key];
    if (is_string($value)) {
        return trim($value);
    }
    return $value;
}

// Map frontend lab assessment structure to database structure
$assessment = [
    'id' => la_get_value($input, 'id'),
    // allow either consultationId or consultation_id
    'consultation_id' => la_get_value($input, 'consultationId', la_get_value($input, 'consultation_id', '')),
    'patient_id' => la_get_value($input, 'patientId', la_get_value($input, 'patient_id', '')),
    'assessment_type' => la_get_value($input, 'assessmentType', la_get_value($input, 'assessment_type')),
    'lab_date' => la_get_value($input, 'labDate', la_get_value($input, 'lab_date')),
    'results' => la_get_value($input, 'results'),
    'notes' => la_get_value($input, 'notes'),
    'documents' => la_get_value($input, 'documents'),
    'doctor' => la_get_value($input, 'doctor'),
    'created_at' => la_get_value($input, 'createdAt'),
    'updated_at' => la_get_value($input, 'updatedAt'),
];

if ($assessment['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Lab assessment id is required']);
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

// Ensure lab_assessment table exists (safety net in case migrations were not run)
$createSql = "CREATE TABLE IF NOT EXISTS `lab_assessment` (
  `id` VARCHAR(100) NOT NULL,
  `consultation_id` VARCHAR(100) DEFAULT NULL,
  `patient_id` VARCHAR(100) DEFAULT NULL,
  `assessment_type` VARCHAR(255) DEFAULT NULL,
  `lab_date` DATE DEFAULT NULL,
  `results` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `documents` LONGTEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lab_assessment_patient_id` (`patient_id`),
  KEY `idx_lab_assessment_consultation_id` (`consultation_id`),
  KEY `idx_lab_assessment_lab_date` (`lab_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure lab_assessment table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Helpers to normalize dates
function la_normalize_date($value) {
    if (!$value) return null;
    $ts = strtotime($value);
    if ($ts === false) return null;
    return date('Y-m-d', $ts);
}

function la_normalize_datetime($value) {
    $ts = $value ? strtotime($value) : false;
    if ($ts === false) {
        return date('Y-m-d H:i:s');
    }
    return date('Y-m-d H:i:s', $ts);
}

$labDate = la_normalize_date($assessment['lab_date']);
$createdAt = la_normalize_datetime($assessment['created_at']);
$updatedAt = la_normalize_datetime($assessment['updated_at']);

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `lab_assessment` (
  id, consultation_id, patient_id, assessment_type, lab_date, results, notes, documents, doctor, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  consultation_id = VALUES(consultation_id),
  patient_id = VALUES(patient_id),
  assessment_type = VALUES(assessment_type),
  lab_date = VALUES(lab_date),
  results = VALUES(results),
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
    'sssssssssss',
    $assessment['id'],
    $assessment['consultation_id'],
    $assessment['patient_id'],
    $assessment['assessment_type'],
    $labDate,
    $assessment['results'],
    $assessment['notes'],
    $assessment['documents'],
    $assessment['doctor'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update lab assessment', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $assessment['id']]);
