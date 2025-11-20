<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get optional date parameter (defaults to today)
$dateParam = isset($_GET['date']) ? trim($_GET['date']) : null;
// Optional status parameter - if not provided, return all appointments
$statusParam = isset($_GET['status']) ? trim($_GET['status']) : null;

$today = date('Y-m-d');

// If date parameter is provided, use it; otherwise use today
$targetDate = $dateParam ? $dateParam : $today;

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

// Check if table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'appointment'");
if ($tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode([
        'status' => 'ok',
        'appointments' => [],
        'date' => $targetDate,
        'statusFilter' => $statusParam,
        'total' => 0,
        'count' => 0
    ]);
    exit;
}

// Build SQL - return all appointments for the date, optionally filter by status
$sql = "SELECT id, date, time, duration, client_name, client_phone, client_email, 
        type, status, notes, doctor, patient_id, created_at, updated_at 
        FROM `appointment` 
        WHERE date = ?";
        
// Add status filter if status parameter is provided
if ($statusParam !== null && $statusParam !== '') {
    $sql .= " AND LOWER(TRIM(status)) = LOWER(TRIM(?))";
}

$sql .= " ORDER BY time ASC";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare query', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

// Bind parameters based on whether status filter is used
if ($statusParam !== null && $statusParam !== '') {
    $stmt->bind_param('ss', $targetDate, $statusParam);
} else {
    $stmt->bind_param('s', $targetDate);
}
$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
while ($row = $result->fetch_assoc()) {
    // Format time to HH:MM if needed
    $time = $row['time'];
    if (strlen($time) > 5) {
        $time = substr($time, 0, 5); // Extract HH:MM from HH:MM:SS
    }
    
    $appointments[] = [
        'id' => $row['id'],
        'date' => $row['date'],
        'time' => $time,
        'duration' => $row['duration'] !== null ? intval($row['duration']) : 30,
        'clientName' => $row['client_name'] ?? '',
        'clientPhone' => $row['client_phone'] ?? '',
        'clientEmail' => $row['client_email'] ?? '',
        'type' => $row['type'] ?? '',
        'status' => $row['status'] ?? 'pre-validation',
        'notes' => $row['notes'] ?? '',
        'doctor' => $row['doctor'] ?? '',
        'patientId' => $row['patient_id'] ?? '',
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? ''
    ];
}

$result->free();
$stmt->close();
$mysqli->close();

$totalCount = count($appointments);
echo json_encode([
    'status' => 'ok',
    'appointments' => $appointments,
    'date' => $targetDate,
    'statusFilter' => $statusParam,
    'total' => $totalCount,
    'count' => $totalCount
]);

