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

$service = [
    'id' => get_value($input, 'id'),
    'name' => get_value($input, 'name'),
    'default_price' => get_value($input, 'defaultPrice', '0'),
    'notes' => get_value($input, 'notes', null),
];

if ($service['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Service id is required']);
    exit;
}

if ($service['name'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Service name is required']);
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
$createSql = "CREATE TABLE IF NOT EXISTS `bill_description` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `default_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$defaultPrice = floatval($service['default_price']);

$createdAt = isset($input['createdAt']) && $input['createdAt']
    ? date('Y-m-d H:i:s', strtotime($input['createdAt']))
    : date('Y-m-d H:i:s');
$updatedAt = isset($input['updatedAt']) && $input['updatedAt']
    ? date('Y-m-d H:i:s', strtotime($input['updatedAt']))
    : date('Y-m-d H:i:s');

$sql = "INSERT INTO `bill_description` (
    id, name, default_price, notes, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    default_price = VALUES(default_price),
    notes = VALUES(notes),
    updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'ssdsss',
    $service['id'],
    $service['name'],
    $defaultPrice,
    $service['notes'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update service', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $service['id']]);
