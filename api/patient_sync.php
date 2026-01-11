<?php
header('Content-Type: application/json; charset=utf-8');
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

$patient = [
    'id' => get_value($input, 'id'),
    'file_number' => get_value($input, 'fileNumber'),
    'cin_passport' => get_value($input, 'cinPassport'),
    'full_name' => get_value($input, 'fullName'),
    'email' => strtolower(get_value($input, 'email')),
    'phone' => get_value($input, 'phone'),
    'date_of_birth' => get_value($input, 'dateOfBirth'),
    'gender' => get_value($input, 'gender'),
    'address' => get_value($input, 'address'),
    'medical_history' => get_value($input, 'medicalHistory'),
    'patient_doc' => get_value($input, 'patientDoc'),
    'created_at' => get_value($input, 'createdAt', date('Y-m-d H:i:s')),
    'updated_at' => get_value($input, 'updatedAt', date('Y-m-d H:i:s'))
];

if ($patient['id'] === '') {
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
    echo json_encode(['status' => 'error', 'message' => 'Unable to connect to MySQL', 'error' => $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Ensure table exists
$createSql = "CREATE TABLE IF NOT EXISTS `Patient` (
  `id` VARCHAR(100) NOT NULL,
  `file_number` VARCHAR(100) NULL,
  `cin_passport` VARCHAR(100) NULL,
  `full_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `date_of_birth` VARCHAR(20) NULL,
  `gender` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `medical_history` TEXT NULL,
  `patient_doc` LONGTEXT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure table', 'sql' => $createSql, 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `Patient` (id, file_number, cin_passport, full_name, email, phone, date_of_birth, gender, address, medical_history, patient_doc, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            file_number = VALUES(file_number),
            cin_passport = VALUES(cin_passport),
            full_name = VALUES(full_name),
            email = VALUES(email),
            phone = VALUES(phone),
            date_of_birth = VALUES(date_of_birth),
            gender = VALUES(gender),
            address = VALUES(address),
            medical_history = VALUES(medical_history),
            patient_doc = VALUES(patient_doc),
            updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$createdAt = $patient['created_at'] ?: date('Y-m-d H:i:s');
$updatedAt = $patient['updated_at'] ?: date('Y-m-d H:i:s');

$stmt->bind_param(
    'sssssssssssss',
    $patient['id'],
    $patient['file_number'],
    $patient['cin_passport'],
    $patient['full_name'],
    $patient['email'],
    $patient['phone'],
    $patient['date_of_birth'],
    $patient['gender'],
    $patient['address'],
    $patient['medical_history'],
    $patient['patient_doc'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update patient', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $patient['id']]);
