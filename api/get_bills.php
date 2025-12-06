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
$dateParam   = isset($_GET['date']) ? trim($_GET['date']) : null;      // YYYY-MM-DD
$patientId   = isset($_GET['patient_id']) ? trim($_GET['patient_id']) : null;
$statusParam = isset($_GET['status']) ? trim($_GET['status']) : null;  // e.g. Paid, Pending

// DB connection (same as other APIs)
$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'helthcareDB';

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unable to connect to database',
        'error'   => $mysqli->connect_error
    ]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Ensure bill table exists; if not, return empty list
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'bill'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode([
        'status' => 'ok',
        'bills'  => [],
        'filters' => [
            'date'       => $dateParam,
            'patient_id' => $patientId,
            'status'     => $statusParam
        ],
        'total' => 0
    ]);
    exit;
}

// Build WHERE clause based on optional filters
$where = [];
$params = [];
$types  = '';

if ($dateParam !== null && $dateParam !== '') {
    $where[]  = 'bill_date = ?';
    $params[] = $dateParam;
    $types   .= 's';
}

if ($patientId !== null && $patientId !== '') {
    $where[]  = 'patient_id = ?';
    $params[] = $patientId;
    $types   .= 's';
}

if ($statusParam !== null && $statusParam !== '') {
    $where[]  = 'LOWER(TRIM(status)) = LOWER(TRIM(?))';
    $params[] = $statusParam;
    $types   .= 's';
}

$sql = "SELECT id, patient_id, patient_name, patient_email, patient_phone,
               bill_date, due_date, items, subtotal, tax, total, notes,
               status, consultation_id, created_at, updated_at
        FROM bill";

if (!empty($where)) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}

$sql .= ' ORDER BY bill_date DESC, created_at DESC';

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to prepare query',
        'error'   => $mysqli->error
    ]);
    $mysqli->close();
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$bills = [];
while ($row = $result->fetch_assoc()) {
    // Decode items JSON safely
    $itemsJson = $row['items'] ?? '[]';
    $items = json_decode($itemsJson, true);
    if (!is_array($items)) {
        $items = [];
    }

    $bills[] = [
        'id'             => $row['id'],
        'patientId'      => $row['patient_id'],
        'patientName'    => $row['patient_name'],
        'patientEmail'   => $row['patient_email'],
        'patientPhone'   => $row['patient_phone'],
        'billDate'       => $row['bill_date'],
        'dueDate'        => $row['due_date'],
        'items'          => $items,
        'subtotal'       => (float)($row['subtotal'] ?? 0),
        'tax'            => (float)($row['tax'] ?? 0),
        'total'          => (float)($row['total'] ?? 0),
        'notes'          => $row['notes'],
        'status'         => $row['status'],
        'consultationId' => $row['consultation_id'],
        'createdAt'      => $row['created_at'] ?? '',
        'updatedAt'      => $row['updated_at'] ?? ''
    ];
}

$result->free();
$stmt->close();
$mysqli->close();

echo json_encode([
    'status' => 'ok',
    'bills'  => $bills,
    'filters' => [
        'date'       => $dateParam,
        'patient_id' => $patientId,
        'status'     => $statusParam
    ],
    'total'  => count($bills)
]);
