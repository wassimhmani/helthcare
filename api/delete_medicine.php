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

$id = trim((string)$input['id']);
if ($id === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Medicine id is required']);
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

// Ensure medicine table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'medicine'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode(['status' => 'ok', 'deleted' => false]);
    exit;
}

$stmt = $mysqli->prepare('DELETE FROM `medicine` WHERE id = ?');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('s', $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to delete medicine', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$affected = $stmt->affected_rows;

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'deleted' => $affected > 0]);
