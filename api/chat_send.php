<?php
// Send a chat message
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
if (!$input || !isset($input['sender_id']) || !isset($input['receiver_id']) || !isset($input['message'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'sender_id, receiver_id and message are required']);
    exit;
}

function get_value($data, $key, $default = '') {
    return isset($data[$key]) ? trim((string)$data[$key]) : $default;
}

$senderId = get_value($input, 'sender_id');
$receiverId = get_value($input, 'receiver_id');
$message = get_value($input, 'message');

if ($senderId === '' || $receiverId === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
    exit;
}

if ($senderId === $receiverId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Cannot send message to yourself']);
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

// Ensure chat_messages table exists
$createSql = "CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` VARCHAR(100) NOT NULL,
  `receiver_id` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Insert message
$stmt = $mysqli->prepare("INSERT INTO chat_messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('sss', $senderId, $receiverId, $message);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to send message', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$messageId = $stmt->insert_id;
$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'message_id' => $messageId, 'message' => 'Message sent successfully']);
