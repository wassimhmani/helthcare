<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

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

// Check if users table exists; if not, return empty list
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'users'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    if ($tableCheck) { $tableCheck->close(); }
    $mysqli->close();
    echo json_encode(['status' => 'ok', 'users' => []]);
    exit;
}
$tableCheck->close();

$sql = "SELECT id, username, password, role, name, email, status, permissions, created_at, updated_at FROM `users` ORDER BY created_at DESC";
$result = $mysqli->query($sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch users', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$users = [];
while ($row = $result->fetch_assoc()) {
    $perms = null;
    if (isset($row['permissions']) && $row['permissions'] !== null && $row['permissions'] !== '') {
        $decoded = json_decode($row['permissions'], true);
        $perms = is_array($decoded) ? $decoded : null;
    }

    $users[] = [
        'id' => $row['id'],
        'username' => $row['username'] ?? '',
        'password' => $row['password'] ?? '',
        'role' => $row['role'] ?? '',
        'name' => $row['name'] ?? '',
        'email' => $row['email'] ?? '',
        'status' => $row['status'] ?? 'active',
        'permissions' => $perms,
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? ''
    ];
}

$result->free();
$mysqli->close();

echo json_encode(['status' => 'ok', 'users' => $users]);
