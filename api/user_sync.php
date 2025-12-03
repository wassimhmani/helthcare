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

$user = [
    'id'         => get_value($input, 'id'),
    'username'   => get_value($input, 'username'),
    'password'   => get_value($input, 'password'),
    'role'       => get_value($input, 'role'),
    'name'       => get_value($input, 'name'),
    'email'      => strtolower(get_value($input, 'email')),
    'status'     => get_value($input, 'status', 'active'),
    'permissions'=> get_value($input, 'permissions', null),
];

if ($user['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'User id is required']);
    exit;
}

if ($user['username'] === '' || $user['password'] === '' || $user['role'] === '' || $user['name'] === '' || $user['email'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'username, password, role, name and email are required']);
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

// Ensure users table exists (must match database.sql)
$createSql = "CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `permissions` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure users table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$createdAt = isset($input['createdAt']) && $input['createdAt']
    ? date('Y-m-d H:i:s', strtotime($input['createdAt']))
    : date('Y-m-d H:i:s');
$updatedAt = isset($input['updatedAt']) && $input['updatedAt']
    ? date('Y-m-d H:i:s', strtotime($input['updatedAt']))
    : date('Y-m-d H:i:s');

$sql = "INSERT INTO `users` (
    id, username, password, role, name, email, status, permissions, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    username   = VALUES(username),
    password   = VALUES(password),
    role       = VALUES(role),
    name       = VALUES(name),
    email      = VALUES(email),
    status     = VALUES(status),
    permissions= VALUES(permissions),
    updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'ssssssssss',
    $user['id'],
    $user['username'],
    $user['password'],
    $user['role'],
    $user['name'],
    $user['email'],
    $user['status'],
    $user['permissions'],
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update user', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $user['id']]);
