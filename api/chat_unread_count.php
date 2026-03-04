<?php
// Get unread message count for a user
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'user_id is required']);
    exit;
}

$userId = trim((string)$_GET['user_id']);

if ($userId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'user_id cannot be empty']);
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

// Check if table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'chat_messages'");
if ($tableCheck->num_rows === 0) {
    echo json_encode(['status' => 'ok', 'total_unread' => 0, 'by_sender' => []]);
    $mysqli->close();
    exit;
}

// Get total unread count
$stmt = $mysqli->prepare("SELECT COUNT(*) as total FROM chat_messages WHERE receiver_id = ? AND is_read = 0");
$stmt->bind_param('s', $userId);
$stmt->execute();
$result = $stmt->get_result();
$totalUnread = $result->fetch_assoc()['total'];
$stmt->close();

// Get unread count by sender
$stmt2 = $mysqli->prepare(
    "SELECT sender_id, COUNT(*) as count FROM chat_messages 
     WHERE receiver_id = ? AND is_read = 0 
     GROUP BY sender_id"
);
$stmt2->bind_param('s', $userId);
$stmt2->execute();
$result2 = $stmt2->get_result();

$bySender = [];
while ($row = $result2->fetch_assoc()) {
    $bySender[$row['sender_id']] = (int)$row['count'];
}
$stmt2->close();

$mysqli->close();

echo json_encode([
    'status' => 'ok',
    'total_unread' => $totalUnread,
    'by_sender' => $bySender
]);
