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
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'Patient'");
if ($tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode(['status' => 'ok', 'patients' => []]);
    exit;
}

// Fetch all patients
$sql = "SELECT id, file_number, cin_passport, full_name, email, phone, date_of_birth, gender, address, medical_history, created_at, updated_at FROM `Patient` ORDER BY created_at DESC";

$result = $mysqli->query($sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch patients', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$patients = [];
while ($row = $result->fetch_assoc()) {
    $patients[] = [
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
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? ''
    ];
}

$result->free();
$mysqli->close();

echo json_encode(['status' => 'ok', 'patients' => $patients]);

