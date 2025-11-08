<?php
header('Content-Type: application/json; charset=utf-8');
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

$patient = [
    'id' => get_value($input, 'id'),
    'file_number' => get_value($input, 'fileNumber'),
    'cin_passport' => get_value($input, 'cinPassport'),
    'full_name' => get_value($input, 'fullName'),
    'email' => strtolower(get_value($input, 'email')),
    'phone' => get_value($input, 'phone'),
    'date_of_birth' => get_value($input, 'dateOfBirth'),
    'gender' => get_value($input, 'gender'),
    'address' => get_value($input, 'address'),
    'medical_history' => get_value($input, 'medicalHistory'),
    'created_at' => get_value($input, 'createdAt', date('Y-m-d H:i:s')),
    'updated_at' => get_value($input, 'updatedAt', date('Y-m-d H:i:s'))
];

if ($patient['id'] === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Patient id is required']);
    exit;
}

$dbPath = realpath(__DIR__ . '/../helthcareDB.accdb');
if (!$dbPath || !file_exists($dbPath)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database file not found']);
    exit;
}

$connStr = 'Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=' . $dbPath . ';';
$conn = @odbc_connect($connStr, '', '');
if (!$conn) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Unable to connect to Access database']);
    exit;
}

// Ensure table exists (ignore errors when already present)
@odbc_exec($conn, 'CREATE TABLE patient (
    id TEXT(100) PRIMARY KEY,
    file_number TEXT(100),
    cin_passport TEXT(100),
    full_name TEXT(255),
    email TEXT(255),
    phone TEXT(50),
    date_of_birth TEXT(20),
    gender TEXT(20),
    address MEMO,
    medical_history MEMO,
    created_at DATETIME,
    updated_at DATETIME
)');
@odbc_exec($conn, 'CREATE UNIQUE INDEX idx_patient_id ON patient (id)');

$existsStmt = odbc_prepare($conn, 'SELECT id FROM patient WHERE id = ?');
$exists = $existsStmt && odbc_execute($existsStmt, [$patient['id']]) && odbc_fetch_row($existsStmt);

if ($exists) {
    $updateStmt = odbc_prepare($conn, 'UPDATE patient SET file_number = ?, cin_passport = ?, full_name = ?, email = ?, phone = ?, date_of_birth = ?, gender = ?, address = ?, medical_history = ?, updated_at = ? WHERE id = ?');
    $ok = $updateStmt && odbc_execute($updateStmt, [
        $patient['file_number'],
        $patient['cin_passport'],
        $patient['full_name'],
        $patient['email'],
        $patient['phone'],
        $patient['date_of_birth'],
        $patient['gender'],
        $patient['address'],
        $patient['medical_history'],
        date('Y-m-d H:i:s'),
        $patient['id']
    ]);
    if (!$ok) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to update patient']);
        odbc_close($conn);
        exit;
    }
} else {
    $insertStmt = odbc_prepare($conn, 'INSERT INTO patient (id, file_number, cin_passport, full_name, email, phone, date_of_birth, gender, address, medical_history, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $ok = $insertStmt && odbc_execute($insertStmt, [
        $patient['id'],
        $patient['file_number'],
        $patient['cin_passport'],
        $patient['full_name'],
        $patient['email'],
        $patient['phone'],
        $patient['date_of_birth'],
        $patient['gender'],
        $patient['address'],
        $patient['medical_history'],
        date('Y-m-d H:i:s'),
        date('Y-m-d H:i:s')
    ]);
    if (!$ok) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to insert patient']);
        odbc_close($conn);
        exit;
    }
}

odbc_close($conn);

echo json_encode(['status' => 'ok', 'id' => $patient['id']]);
