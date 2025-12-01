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

// Check if table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'bill_description'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode(['status' => 'ok', 'services' => []]);
    exit;
}

$sql = "SELECT id, name, default_price, notes, created_at, updated_at
        FROM `bill_description`
        ORDER BY name ASC";

$result = $mysqli->query($sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch services', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$services = [];
while ($row = $result->fetch_assoc()) {
    $services[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'defaultPrice' => $row['default_price'] !== null ? floatval($row['default_price']) : 0,
        'notes' => $row['notes'],
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? ''
    ];
}

$result->free();
$mysqli->close();

echo json_encode(['status' => 'ok', 'services' => $services]);
