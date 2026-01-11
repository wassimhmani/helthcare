<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get optional date parameter (defaults to today)
$dateParam = isset($_GET['date']) ? trim($_GET['date']) : null;
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
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'consultation'");
if ($tableCheck->num_rows === 0) {
    $mysqli->close();
    echo json_encode(['status' => 'ok', 'consultations' => [], 'date' => $targetDate]);
    exit;
}

// Fetch consultations for the target date (based on created_at)
$sql = "SELECT id, patient_id, height, weight, temperature, heart_rate, blood_sugar, 
        blood_pressure, imc, bmi_category, consultation_act, clinical_note, 
        radiology_result, radiology_diagnostics, lab_results, lab_notes, 
        prescription, payment_status, documents, doctor, created_at, updated_at 
        FROM `consultation` 
        WHERE DATE(created_at) = ? 
        ORDER BY created_at DESC";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare query', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param('s', $targetDate);
$stmt->execute();
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
        'height' => $row['height'] !== null ? floatval($row['height']) : null,
        'weight' => $row['weight'] !== null ? floatval($row['weight']) : null,
        'temperature' => $row['temperature'] !== null ? floatval($row['temperature']) : null,
        'heartRate' => $row['heart_rate'] !== null ? intval($row['heart_rate']) : null,
        'bloodSugar' => $row['blood_sugar'] !== null ? intval($row['blood_sugar']) : null,
        'bloodPressure' => $row['blood_pressure'] ?? null,
        'imc' => $row['imc'] !== null ? floatval($row['imc']) : null,
        'bmiCategory' => $row['bmi_category'] ?? null,
        'consultationAct' => $row['consultation_act'] ?? '',
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

echo json_encode(['status' => 'ok', 'consultations' => $consultations, 'date' => $targetDate]);

