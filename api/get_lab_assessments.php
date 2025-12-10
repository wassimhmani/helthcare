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
$consultationId = null;
if (isset($_GET['consultation_id'])) {
    $consultationId = trim($_GET['consultation_id']);
} elseif (isset($_GET['consultationId'])) {
    $consultationId = trim($_GET['consultationId']);
}

$patientId = null;
if (isset($_GET['patient_id'])) {
    $patientId = trim($_GET['patient_id']);
} elseif (isset($_GET['patientId'])) {
    $patientId = trim($_GET['patientId']);
}

// Connect to MySQL (same settings as other APIs)
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

// Check if lab_assessment table exists
$tableCheck = $mysqli->query("SHOW TABLES LIKE 'lab_assessment'");
if (!$tableCheck) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to check tables', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

if ($tableCheck->num_rows === 0) {
    // No lab_assessment table yet
    $mysqli->close();
    echo json_encode(['status' => 'ok', 'labAssessments' => []]);
    exit;
}

$sql = "SELECT id, consultation_id, patient_id, assessment_type, lab_date, results, notes, documents, doctor, created_at, updated_at
        FROM `lab_assessment`";

$conditions = [];
$params = [];
$types = '';

if ($consultationId !== null && $consultationId !== '') {
    $conditions[] = 'consultation_id = ?';
    $params[] = $consultationId;
    $types .= 's';
}

if ($patientId !== null && $patientId !== '') {
    $conditions[] = 'patient_id = ?';
    $params[] = $patientId;
    $types .= 's';
}

if (!empty($conditions)) {
    $sql .= ' WHERE ' . implode(' AND ', $conditions);
}

$sql .= ' ORDER BY lab_date DESC, created_at DESC';

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare query', 'error' => $mysqli->error]);
    $mysqli->close();
    exit;
}

if ($types !== '') {
    // Bind only when we actually have parameters
    $stmt->bind_param($types, ...$params);
}

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to execute query', 'error' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$result = $stmt->get_result();
$labAssessments = [];

while ($row = $result->fetch_assoc()) {
    $labAssessments[] = [
        'id' => $row['id'],
        'consultationId' => $row['consultation_id'],
        'patientId' => $row['patient_id'],
        'assessmentType' => $row['assessment_type'],
        'labDate' => $row['lab_date'],
        'results' => $row['results'],
        'notes' => $row['notes'],
        'documents' => $row['documents'],
        'doctor' => $row['doctor'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

$result->free();
$stmt->close();
$mysqli->close();

echo json_encode(['status' => 'ok', 'labAssessments' => $labAssessments]);
