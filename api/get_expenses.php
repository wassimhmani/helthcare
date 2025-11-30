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

// Optional filters
$startDate = isset($_GET['startDate']) ? trim($_GET['startDate']) : null;
$endDate   = isset($_GET['endDate'])   ? trim($_GET['endDate'])   : null;

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

// Check if table exists, if not return empty array
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'expenses'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode(['status' => 'ok', 'expenses' => []]);
    exit;
}

// Base query
$sql = "SELECT id, expense_date, category, description, amount, created_at, updated_at
        FROM `expenses`";
$where = [];
$params = [];
$types = '';

// If date range is provided, filter on expense_date
if ($startDate) {
    $where[] = 'expense_date >= ?';
    $types .= 's';
    $params[] = $startDate;
}
if ($endDate) {
    $where[] = 'expense_date <= ?';
    $types .= 's';
    $params[] = $endDate;
}

if (!empty($where)) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}

$sql .= ' ORDER BY expense_date DESC, created_at DESC';

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare query', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$expenses = [];
while ($row = $result->fetch_assoc()) {
    $expenses[] = [
        'id' => $row['id'],
        'expenseDate' => $row['expense_date'],
        'category' => $row['category'],
        'description' => $row['description'],
        'amount' => $row['amount'] !== null ? floatval($row['amount']) : 0,
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? ''
    ];
}

$result->free();
$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'expenses' => $expenses]);
