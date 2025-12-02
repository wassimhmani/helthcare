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
if (!$input) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
    exit;
}

function get_value($data, $key, $default = '') {
    return isset($data[$key]) ? trim((string)$data[$key]) : $default;
}

// We expect a single logical cabinet; use fixed ID if not provided
$cabinet = [
    'id' => get_value($input, 'id', 'cabinet-default'),
    'name' => get_value($input, 'name'),
    'address' => get_value($input, 'address', null),
    'phone' => get_value($input, 'phone', null),
    'logo_path' => get_value($input, 'logoPath', null),
    'working_hours' => get_value($input, 'workingHours', null),
];

if ($cabinet['name'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Cabinet name is required']);
    exit;
}

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

// Ensure cabinet_info table exists (match database.sql)
$createSql = "CREATE TABLE IF NOT EXISTS `cabinet_info` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `logo_path` VARCHAR(500) DEFAULT NULL,
  `working_hours` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$createdAt = isset($input['createdAt']) && $input['createdAt']
    ? date('Y-m-d H:i:s', strtotime($input['createdAt']))
    : date('Y-m-d H:i:s');
$updatedAt = isset($input['updatedAt']) && $input['updatedAt']
    ? date('Y-m-d H:i:s', strtotime($input['updatedAt']))
    : date('Y-m-d H:i:s');

$sql = "INSERT INTO `cabinet_info` (
    id, name, address, phone, logo_path, working_hours, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    address = VALUES(address),
    phone = VALUES(phone),
    logo_path = VALUES(logo_path),
    working_hours = VALUES(working_hours),
    updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'ssssssss',
    $cabinet['id'],
    $cabinet['name'],
    $cabinet['address'],
    $cabinet['phone'],
    $cabinet['logo_path'],
    $cabinet['working_hours'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save cabinet info', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $cabinet['id']]);
