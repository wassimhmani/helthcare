<?php
// Get chat messages between two users
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Support both GET and POST
$params = $_SERVER['REQUEST_METHOD'] === 'POST' 
    ? json_decode(file_get_contents('php://input'), true) 
    : $_GET;

if (!$params || !isset($params['user1_id']) || !isset($params['user2_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'user1_id and user2_id are required']);
    exit;
}

$user1Id = trim((string)$params['user1_id']);
$user2Id = trim((string)$params['user2_id']);
$limit = isset($params['limit']) ? intval($params['limit']) : 50;
$offset = isset($params['offset']) ? intval($params['offset']) : 0;

if ($user1Id === '' || $user2Id === '') {
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

// Check if table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'chat_messages'");
if ($tableCheck->num_rows === 0) {
    echo json_encode(['status' => 'ok', 'messages' => [], 'total' => 0]);
    $mysqli->close();
    exit;
}

// Get messages between two users (bidirectional)
$stmt = $mysqli->prepare(
    "SELECT id, sender_id, receiver_id, message, is_read, created_at 
     FROM chat_messages 
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
     ORDER BY created_at ASC
     LIMIT ? OFFSET ?"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('ssssii', $user1Id, $user2Id, $user2Id, $user1Id, $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = [
        'id' => $row['id'],
        'sender_id' => $row['sender_id'],
        'receiver_id' => $row['receiver_id'],
        'message' => $row['message'],
        'is_read' => (bool)$row['is_read'],
        'created_at' => $row['created_at']
    ];
}
$stmt->close();

// Get total count for pagination
$countStmt = $mysqli->prepare(
    "SELECT COUNT(*) as total FROM chat_messages 
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)"
);
$countStmt->bind_param('ssss', $user1Id, $user2Id, $user2Id, $user1Id);
$countStmt->execute();
$countResult = $countStmt->get_result();
$total = $countResult->fetch_assoc()['total'];
$countStmt->close();

$mysqli->close();

echo json_encode([
    'status' => 'ok',
    'messages' => $messages,
    'total' => $total,
    'limit' => $limit,
    'offset' => $offset
]);
