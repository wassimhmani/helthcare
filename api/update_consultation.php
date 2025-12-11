<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid payload. Consultation id is required.']);
    exit;
}

function get_value($data, $key, $default = null) {
    if (!isset($data[$key])) {
        return $default;
    }
    $value = $data[$key];
    if (is_string($value)) {
        return trim($value);
    }
    return $value;
}

$consultationId = get_value($input, 'id');

if ($consultationId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Consultation id is required']);
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

// Check if consultation exists and get current data
$checkSql = "SELECT id FROM `consultation` WHERE id = ? LIMIT 1";
$checkStmt = $mysqli->prepare($checkSql);
if (!$checkStmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare check statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$checkStmt->bind_param('s', $consultationId);
$checkStmt->execute();
$result = $checkStmt->get_result();
$exists = $result->num_rows > 0;
$checkStmt->close();

if (!$exists) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Consultation not found. Cannot update non-existent consultation.']);
    $mysqli->close();
    exit;
}

// Build update query dynamically based on provided fields
$updateFields = [];
$updateValues = [];
$types = '';

// Map frontend consultation structure to database structure
// Note: consultation table uses a single blood_pressure column (no bp_systolic/bp_diastolic)
$fieldMappings = [
    'patientId' => ['db' => 'patient_id', 'type' => 's'],
    'height' => ['db' => 'height', 'type' => 'd'],
    'weight' => ['db' => 'weight', 'type' => 'd'],
    'temperature' => ['db' => 'temperature', 'type' => 'd'],
    'heartRate' => ['db' => 'heart_rate', 'type' => 'i'],
    'bloodSugar' => ['db' => 'blood_sugar', 'type' => 'i'],
    'bloodPressure' => ['db' => 'blood_pressure', 'type' => 's'],
    'imc' => ['db' => 'imc', 'type' => 'd'],
    'bmiCategory' => ['db' => 'bmi_category', 'type' => 's'],
    'clinicalNote' => ['db' => 'clinical_note', 'type' => 's'],
    'radiologyResult' => ['db' => 'radiology_result', 'type' => 's'],
    'radiologyDiagnostics' => ['db' => 'radiology_diagnostics', 'type' => 's'],
    'labResults' => ['db' => 'lab_results', 'type' => 's'],
    'labNotes' => ['db' => 'lab_notes', 'type' => 's'],
    'prescription' => ['db' => 'prescription', 'type' => 's'],
    'paymentStatus' => ['db' => 'payment_status', 'type' => 's'],
    'documents' => ['db' => 'documents', 'type' => 's', 'json' => true],
    'doctor' => ['db' => 'doctor', 'type' => 's']
];

foreach ($fieldMappings as $frontendKey => $mapping) {
    if (isset($input[$frontendKey])) {
        $updateFields[] = "`{$mapping['db']}` = ?";
        $types .= $mapping['type'];
        
        $value = get_value($input, $frontendKey);
        
        // Handle special cases
        if ($mapping['db'] === 'documents' && isset($mapping['json']) && $mapping['json']) {
            // Convert array to JSON string
            if (is_array($value)) {
                $value = json_encode($value);
            } elseif ($value === null || $value === '') {
                $value = null;
            }
        }
        
        // Convert numeric values
        if ($mapping['type'] === 'd') {
            $value = ($value !== null && $value !== '') ? floatval($value) : null;
        } elseif ($mapping['type'] === 'i') {
            $value = ($value !== null && $value !== '') ? intval($value) : null;
        }
        
        $updateValues[] = $value;
    }
}

// Always update updated_at timestamp
$updateFields[] = "`updated_at` = ?";
$types .= 's';
$updateValues[] = date('Y-m-d H:i:s');

if (empty($updateFields)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No fields provided for update']);
    $mysqli->close();
    exit;
}

// Build and execute update query - ensure WHERE clause uses exact match
$sql = "UPDATE `consultation` SET " . implode(', ', $updateFields) . " WHERE `id` = ?";
$types .= 's';
$updateValues[] = $consultationId;

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare update statement', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

$stmt->bind_param($types, ...$updateValues);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update consultation', 'error' => $stmt->error, 'sql' => $sql]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$affectedRows = $stmt->affected_rows;
$stmt->close();

// Verify the row still exists after update (sanity check)
$verifySql = "SELECT id FROM `consultation` WHERE id = ? LIMIT 1";
$verifyStmt = $mysqli->prepare($verifySql);
if ($verifyStmt) {
    $verifyStmt->bind_param('s', $consultationId);
    $verifyStmt->execute();
    $verifyResult = $verifyStmt->get_result();
    $stillExists = $verifyResult->num_rows > 0;
    $verifyStmt->close();
    
    if (!$stillExists) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Consultation was deleted during update', 'id' => $consultationId]);
        $mysqli->close();
        exit;
    }
}

$mysqli->close();

if ($affectedRows === 0) {
    // No rows were updated - this means the data was already the same or WHERE clause didn't match
    // But we verified the row exists, so it means no changes were needed
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'No changes made (data already up to date)', 'id' => $consultationId, 'affected_rows' => 0]);
} else {
    // Successfully updated existing row
    echo json_encode(['status' => 'ok', 'message' => 'Consultation updated successfully', 'id' => $consultationId, 'affected_rows' => $affectedRows]);
}

