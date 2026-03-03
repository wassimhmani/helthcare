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
if (!$input || !isset($input['username']) || !isset($input['role']) || !isset($input['newPassword'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'username, role and newPassword are required']);
    exit;
}

function get_value($data, $key, $default = '') {
    return isset($data[$key]) ? trim((string)$data[$key]) : $default;
}

$username = get_value($input, 'username');
$role = get_value($input, 'role');
$newPassword = get_value($input, 'newPassword');

if ($username === '' || $role === '' || $newPassword === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'username, role and newPassword cannot be empty']);
    exit;
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Password must be at least 6 characters']);
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

// Check if users table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'users'");
if ($tableCheck->num_rows === 0) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Users table not found']);
    $mysqli->close();
    exit;
}

// Find user by username or email and role
$stmt = $mysqli->prepare("SELECT id, status FROM users WHERE (username = ? OR email = ?) AND role = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare select statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('sss', $username, $username, $role);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    $mysqli->close();
    exit;
}

if ($user['status'] !== 'active') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Account is inactive']);
    $mysqli->close();
    exit;
}

// Update password
$updateStmt = $mysqli->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
if (!$updateStmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare update statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$updateStmt->bind_param('ss', $newPassword, $user['id']);

if (!$updateStmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update password', 'error' => $updateStmt->error]);
    $updateStmt->close();
    $mysqli->close();
    exit;
}

$updateStmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'message' => 'Password reset successful']);
