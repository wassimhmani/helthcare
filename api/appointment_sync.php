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

function get_value($data, $key, $default = '') {
    return isset($data[$key]) ? trim((string)$data[$key]) : $default;
}

// Map frontend appointment structure to database structure
$appointment = [
    'id' => get_value($input, 'id'),
    'date' => get_value($input, 'date'),
    'time' => get_value($input, 'time'),
    'duration' => get_value($input, 'duration', '30'),
    'client_name' => get_value($input, 'clientName'),
    'client_phone' => get_value($input, 'clientPhone'),
    'client_email' => get_value($input, 'clientEmail'),
    'type' => get_value($input, 'type'),
    'status' => get_value($input, 'status', 'pre-validation'),
    'notes' => get_value($input, 'notes'),
    'doctor' => get_value($input, 'doctor'),
    'patient_id' => get_value($input, 'patientId')
];

if ($appointment['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Appointment id is required']);
    exit;
}

if ($appointment['date'] === '' || $appointment['time'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Appointment date and time are required']);
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
$createSql = "CREATE TABLE IF NOT EXISTS `appointment` (
  `id` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `duration` INT NOT NULL DEFAULT 30,
  `client_name` VARCHAR(255) NOT NULL,
  `client_phone` VARCHAR(50) NOT NULL,
  `client_email` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pre-validation',
  `notes` TEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `patient_id` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`),
  KEY `idx_patient_id` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Convert date format if needed (handle YYYY-MM-DD format)
$appointmentDate = $appointment['date'];
if (strpos($appointmentDate, 'T') !== false) {
    // If it's an ISO datetime string, extract just the date part
    $appointmentDate = substr($appointmentDate, 0, 10);
}

// Convert time format if needed (handle HH:MM or HH:MM:SS format)
$appointmentTime = $appointment['time'];
if (strlen($appointmentTime) === 5) {
    // If it's HH:MM format, add seconds
    $appointmentTime .= ':00';
}

// Convert duration to integer
$duration = intval($appointment['duration']);

// Get created_at and updated_at from input or use current time
$createdAt = isset($input['createdAt']) ? date('Y-m-d H:i:s', strtotime($input['createdAt'])) : date('Y-m-d H:i:s');
$updatedAt = isset($input['updatedAt']) ? date('Y-m-d H:i:s', strtotime($input['updatedAt'])) : date('Y-m-d H:i:s');

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `appointment` (id, date, time, duration, client_name, client_phone, client_email, type, status, notes, doctor, patient_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            date = VALUES(date),
            time = VALUES(time),
            duration = VALUES(duration),
            client_name = VALUES(client_name),
            client_phone = VALUES(client_phone),
            client_email = VALUES(client_email),
            type = VALUES(type),
            status = VALUES(status),
            notes = VALUES(notes),
            doctor = VALUES(doctor),
            patient_id = VALUES(patient_id),
            updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'sssissssssssss',
    $appointment['id'],
    $appointmentDate,
    $appointmentTime,
    $duration,
    $appointment['client_name'],
    $appointment['client_phone'],
    $appointment['client_email'],
    $appointment['type'],
    $appointment['status'],
    $appointment['notes'],
    $appointment['doctor'],
    $appointment['patient_id'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update appointment', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $appointment['id']]);

