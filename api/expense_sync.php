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

// Map frontend expense structure to database structure
$expense = [
    'id' => get_value($input, 'id'),
    'expense_date' => get_value($input, 'expenseDate'),
    'category' => get_value($input, 'category'),
    'description' => get_value($input, 'description'),
    'amount' => get_value($input, 'amount', '0'),
];

if ($expense['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Expense id is required']);
    exit;
}

if ($expense['expense_date'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Expense date is required']);
    exit;
}

if ($expense['category'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Category is required']);
    exit;
}

if ($expense['description'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Description is required']);
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

// Ensure table exists (matches config/database.sql)
$createSql = "CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(100) NOT NULL,
  `expense_date` DATE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (!$mysqli->query($createSql)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to ensure table', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Normalize date (allow ISO string, take only date part)
$expenseDate = $expense['expense_date'];
if (strpos($expenseDate, 'T') !== false) {
    $expenseDate = substr($expenseDate, 0, 10);
}

// Convert numeric values
$amount = floatval($expense['amount']);

// Get created_at and updated_at from input or use current time
$createdAt = isset($input['createdAt']) && $input['createdAt']
    ? date('Y-m-d H:i:s', strtotime($input['createdAt']))
    : date('Y-m-d H:i:s');
$updatedAt = isset($input['updatedAt']) && $input['updatedAt']
    ? date('Y-m-d H:i:s', strtotime($input['updatedAt']))
    : date('Y-m-d H:i:s');

// Upsert (insert or update) using ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO `expenses` (
    id, expense_date, category, description, amount, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    expense_date = VALUES(expense_date),
    category = VALUES(category),
    description = VALUES(description),
    amount = VALUES(amount),
    updated_at = VALUES(updated_at)";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param(
    'ssssdss',
    $expense['id'],
    $expenseDate,
    $expense['category'],
    $expense['description'],
    $amount,
    $createdAt,
    $updatedAt
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to insert/update expense', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'id' => $expense['id']]);
