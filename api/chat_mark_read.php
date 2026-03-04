<?php
// Mark messages as read
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
if (!$input || !isset($input['receiver_id']) || !isset($input['sender_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'receiver_id and sender_id are required']);
    exit;
}

$receiverId = trim((string)$input['receiver_id']);
$senderId = trim((string)$input['sender_id']);

if ($receiverId === '' || $senderId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'User IDs cannot be empty']);
    exit;
}

$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'helthcareDB';

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed', 'error' => $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Mark all messages from sender to receiver as read
$stmt = $mysqli->prepare("UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('ss', $senderId, $receiverId);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to mark messages as read', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$affectedRows = $stmt->affected_rows;
$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'marked_read' => $affectedRows]);
