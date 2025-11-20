<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid payload. Appointment id is required.']);
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

$appointmentId = get_value($input, 'id');
$newStatus = get_value($input, 'status', 'consulted');

if ($appointmentId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Appointment id is required']);
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

// Check if appointment exists
$checkSql = "SELECT id, status FROM `appointment` WHERE id = ? LIMIT 1";
$checkStmt = $mysqli->prepare($checkSql);
if (!$checkStmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare check statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$checkStmt->bind_param('s', $appointmentId);
$checkStmt->execute();
$result = $checkStmt->get_result();
$exists = $result->num_rows > 0;
$currentStatus = null;
if ($exists) {
    $row = $result->fetch_assoc();
    $currentStatus = $row['status'];
}
$checkStmt->close();

if (!$exists) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Appointment not found']);
    $mysqli->close();
    exit;
}

// Update appointment status
$sql = "UPDATE `appointment` SET `status` = ?, `updated_at` = ? WHERE `id` = ?";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare update statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$updatedAt = date('Y-m-d H:i:s');
$stmt->bind_param('sss', $newStatus, $updatedAt, $appointmentId);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update appointment status', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$affectedRows = $stmt->affected_rows;
$stmt->close();

// Verify the update was successful
$verifySql = "SELECT id, status FROM `appointment` WHERE id = ? LIMIT 1";
$verifyStmt = $mysqli->prepare($verifySql);
if ($verifyStmt) {
    $verifyStmt->bind_param('s', $appointmentId);
    $verifyStmt->execute();
    $verifyResult = $verifyStmt->get_result();
    $updatedRow = $verifyResult->fetch_assoc();
    $verifyStmt->close();
    
    if ($updatedRow && $updatedRow['status'] === $newStatus) {
        $mysqli->close();
        echo json_encode([
            'status' => 'ok', 
            'message' => 'Appointment status updated successfully', 
            'id' => $appointmentId,
            'oldStatus' => $currentStatus,
            'newStatus' => $newStatus,
            'affected_rows' => $affectedRows
        ]);
    } else {
        $mysqli->close();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Status update verification failed', 'id' => $appointmentId]);
    }
} else {
    $mysqli->close();
    echo json_encode([
        'status' => 'ok', 
        'message' => 'Appointment status updated', 
        'id' => $appointmentId,
        'oldStatus' => $currentStatus,
        'newStatus' => $newStatus,
        'affected_rows' => $affectedRows
    ]);
}

