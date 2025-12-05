<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Accept patient ID from GET or POST
$patientId = null;
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $patientId = isset($_GET['id']) ? trim($_GET['id']) : null;
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $patientId = isset($input['id']) ? trim($input['id']) : null;
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!$patientId || $patientId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Patient ID is required']);
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

// Check if table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'Patient'");
if ($tableCheck->num_rows === 0) {
    $mysqli->close();
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Patient table not found']);
    exit;
}

// Fetch patient by ID
$stmt = $mysqli->prepare("SELECT id, file_number, cin_passport, full_name, email, phone, date_of_birth, gender, address, medical_history, patient_doc, created_at, updated_at FROM `Patient` WHERE id = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare query', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('s', $patientId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    $mysqli->close();
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Patient not found']);
    exit;
}

$row = $result->fetch_assoc();
$patient = [
    'id' => $row['id'],
    'fileNumber' => $row['file_number'] ?? '',
    'cinPassport' => $row['cin_passport'] ?? '',
    'fullName' => $row['full_name'] ?? '',
    'email' => $row['email'] ?? '',
    'phone' => $row['phone'] ?? '',
    'dateOfBirth' => $row['date_of_birth'] ?? '',
    'gender' => $row['gender'] ?? '',
    'address' => $row['address'] ?? '',
    'medicalHistory' => $row['medical_history'] ?? '',
    'patientDoc' => $row['patient_doc'] ?? '',
    'createdAt' => $row['created_at'] ?? '',
    'updatedAt' => $row['updated_at'] ?? ''
];

$result->free();
$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'patient' => $patient]);

