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

// Map frontend bill structure to database structure
$bill = [
    'id' => get_value($input, 'id'),
    'patient_id' => get_value($input, 'patientId', ''),
    'patient_name' => get_value($input, 'patientName', ''),
    'patient_email' => get_value($input, 'patientEmail'),
    'patient_phone' => get_value($input, 'patientPhone'),
    'bill_date' => get_value($input, 'billDate'),
    'due_date' => get_value($input, 'dueDate'),
    'items' => isset($input['items']) && is_array($input['items']) ? json_encode($input['items']) : '[]',
    'subtotal' => get_value($input, 'subtotal', 0),
    'tax' => get_value($input, 'tax', 0),
    'total' => get_value($input, 'total', 0),
    'notes' => get_value($input, 'notes'),
    'status' => get_value($input, 'status', 'Paid'),
    'consultation_id' => get_value($input, 'consultationId')
];

if ($bill['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bill id is required']);
    exit;
}

if ($bill['patient_id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Patient id is required']);
    exit;
}

if ($bill['bill_date'] === '' || $bill['due_date'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bill date and due date are required']);
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
$createSql = "CREATE TABLE IF NOT EXISTS `bill` (
  `id` VARCHAR(100) NOT NULL,
  `patient_id` VARCHAR(100) NOT NULL,
  `patient_name` VARCHAR(255) NOT NULL,
  `patient_email` VARCHAR(255) DEFAULT NULL,
  `patient_phone` VARCHAR(50) DEFAULT NULL,
  `bill_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `items` LONGTEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `tax` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Paid',
  `consultation_id` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_bill_date` (`bill_date`),
  KEY `idx_status` (`status`),
  KEY `idx_consultation_id` (`consultation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure table', 'error' => $mysqli->connect_error]);
    $mysqli->close();
    exit;
}

// Convert date format if needed (handle YYYY-MM-DD format)
$billDate = $bill['bill_date'];
if (strpos($billDate, 'T') !== false) {
    // If it's an ISO datetime string, extract just the date part
    $billDate = substr($billDate, 0, 10);
}

$dueDate = $bill['due_date'];
if (strpos($dueDate, 'T') !== false) {
    // If it's an ISO datetime string, extract just the date part
    $dueDate = substr($dueDate, 0, 10);
}

// Convert numeric values
$subtotal = floatval($bill['subtotal']);
$tax = floatval($bill['tax']);
$total = floatval($bill['total']);

// Get created_at and updated_at from input or use current time
$createdAt = isset($input['createdAt']) && $input['createdAt'] ? date('Y-m-d H:i:s', strtotime($input['createdAt'])) : date('Y-m-d H:i:s');
$updatedAt = isset($input['updatedAt']) && $input['updatedAt'] ? date('Y-m-d H:i:s', strtotime($input['updatedAt'])) : date('Y-m-d H:i:s');

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `bill` (
    id, patient_id, patient_name, patient_email, patient_phone, 
    bill_date, due_date, items, subtotal, tax, total, notes, 
    status, consultation_id, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    patient_id = VALUES(patient_id),
    patient_name = VALUES(patient_name),
    patient_email = VALUES(patient_email),
    patient_phone = VALUES(patient_phone),
    bill_date = VALUES(bill_date),
    due_date = VALUES(due_date),
    items = VALUES(items),
    subtotal = VALUES(subtotal),
    tax = VALUES(tax),
    total = VALUES(total),
    notes = VALUES(notes),
    status = VALUES(status),
    consultation_id = VALUES(consultation_id),
    updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'ssssssssddddssss',
    $bill['id'],
    $bill['patient_id'],
    $bill['patient_name'],
    $bill['patient_email'],
    $bill['patient_phone'],
    $billDate,
    $dueDate,
    $bill['items'],
    $subtotal,
    $tax,
    $total,
    $bill['notes'],
    $bill['status'],
    $bill['consultation_id'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update bill', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $bill['id']]);

