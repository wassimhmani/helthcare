<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
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

// Ensure table exists
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

// For now we expect a single logical cabinet with fixed id
$id = 'cabinet-default';

$sql = 'SELECT id, name, address, phone, logo_path, working_hours, created_at, updated_at FROM `cabinet_info` WHERE id = ? LIMIT 1';
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('s', $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to load cabinet info', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$result = $stmt->get_result();
$cabinet = $result->fetch_assoc();

$stmt->close();
$mysqli->close();

if (!$cabinet) {
    echo json_encode(['status' => 'ok', 'cabinet' => null]);
    exit;
}

// Return working_hours as-is (JSON string) and let frontend parse it
$response = [
    'id' => $cabinet['id'],
    'name' => $cabinet['name'],
    'address' => $cabinet['address'],
    'phone' => $cabinet['phone'],
    'logoPath' => $cabinet['logo_path'],
    'workingHours' => $cabinet['working_hours'],
    'createdAt' => $cabinet['created_at'],
    'updatedAt' => $cabinet['updated_at'],
];

echo json_encode(['status' => 'ok', 'cabinet' => $response]);
