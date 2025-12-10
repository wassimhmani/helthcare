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

// Optional date filter (defaults to today)
$dateParam = isset($_GET['date']) ? trim($_GET['date']) : null; // YYYY-MM-DD
$today     = date('Y-m-d');
$targetDate = $dateParam !== null && $dateParam !== '' ? $dateParam : $today;

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

// Ensure consultation table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'consultation'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode([
        'status' => 'ok',
        'consultations' => [],
        'date' => $targetDate
    ]);
    exit;
}

// Check if bill table exists. If not, we treat all consultations as having no bill.
$billTableExists = false;
$billCheck = $mysqli->query("SHOW TABLES LIKE 'bill'");
if ($billCheck && $billCheck->num_rows > 0) {
    $billTableExists = true;
}

// Build query: consultations for target date that do not have a related bill
if ($billTableExists) {
    $sql = "SELECT c.id, c.patient_id, c.height, c.weight, c.temperature, c.heart_rate, c.blood_sugar,
                   c.blood_pressure, c.imc, c.bmi_category, c.clinical_note,
                   c.radiology_result, c.radiology_diagnostics, c.lab_results, c.lab_notes,
                   c.prescription, c.payment_status, c.documents, c.doctor, c.created_at, c.updated_at
            FROM consultation c
            LEFT JOIN bill b ON b.consultation_id = c.id
            WHERE DATE(c.created_at) = ?
              AND b.id IS NULL
            ORDER BY c.created_at DESC";
} else {
    // No bill table yet: by definition, all consultations for the date are "ready" (no bills)
    $sql = "SELECT id, patient_id, height, weight, temperature, heart_rate, blood_sugar,
                   blood_pressure, imc, bmi_category, clinical_note,
                   radiology_result, radiology_diagnostics, lab_results, lab_notes,
                   prescription, payment_status, documents, doctor, created_at, updated_at
            FROM consultation
            WHERE DATE(created_at) = ?
            ORDER BY created_at DESC";
}

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

$stmt->bind_param('s', $targetDate);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to execute query',
        'error'   => $stmt->error
    ]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$result = $stmt->get_result();
$consultations = [];

while ($row = $result->fetch_assoc()) {
    // Parse documents JSON if it exists
    $documents = [];
    if (!empty($row['documents'])) {
        $decoded = json_decode($row['documents'], true);
        if (is_array($decoded)) {
            $documents = $decoded;
        }
    }

    $consultations[] = [
        'id' => $row['id'],
        'patientId' => $row['patient_id'] ?? '',
        'height' => $row['height'] !== null ? (float)$row['height'] : null,
        'weight' => $row['weight'] !== null ? (float)$row['weight'] : null,
        'temperature' => $row['temperature'] !== null ? (float)$row['temperature'] : null,
        'heartRate' => $row['heart_rate'] !== null ? (int)$row['heart_rate'] : null,
        'bloodSugar' => $row['blood_sugar'] !== null ? (int)$row['blood_sugar'] : null,
        'bloodPressure' => $row['blood_pressure'] ?? null,
        'imc' => $row['imc'] !== null ? (float)$row['imc'] : null,
        'bmiCategory' => $row['bmi_category'] ?? null,
        'clinicalNote' => $row['clinical_note'] ?? '',
        'radiologyResult' => $row['radiology_result'] ?? '',
        'radiologyDiagnostics' => $row['radiology_diagnostics'] ?? '',
        'labResults' => $row['lab_results'] ?? '',
        'labNotes' => $row['lab_notes'] ?? '',
        'prescription' => $row['prescription'] ?? '',
        'paymentStatus' => $row['payment_status'] ?? 'paying',
        'documents' => $documents,
        'doctor' => $row['doctor'] ?? '',
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? ''
    ];
}

$result->free();
$stmt->close();
$mysqli->close();

echo json_encode([
    'status' => 'ok',
    'consultations' => $consultations,
    'date' => $targetDate
]);
