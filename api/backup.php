<?php
// Endpoint to persist application data snapshots into the Access database.
// Expects JSON payload: { "key": "healthcarePatients", "raw": "<localStorage string>" }

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['key'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
    exit;
}

$key = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $input['key']);
$raw = isset($input['raw']) ? (string) $input['raw'] : '';
$timestamp = date('Y-m-d H:i:s');

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

// Ensure table exists (ignore errors if already created)
@odbc_exec($conn, 'CREATE TABLE AppData (id AUTOINCREMENT PRIMARY KEY, data_key TEXT(255), data_json LONGTEXT, updated_at DATETIME)');
@odbc_exec($conn, 'CREATE UNIQUE INDEX idx_appdata_key ON AppData (data_key)');

// Determine whether a record already exists for this key
$existsStmt = odbc_prepare($conn, 'SELECT id FROM AppData WHERE data_key = ?');
if (!$existsStmt || !odbc_execute($existsStmt, [$key])) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to query existing records']);
    odbc_close($conn);
    exit;
}

if (odbc_fetch_row($existsStmt)) {
    $updateStmt = odbc_prepare($conn, 'UPDATE AppData SET data_json = ?, updated_at = ? WHERE data_key = ?');
    $ok = $updateStmt && odbc_execute($updateStmt, [$raw, $timestamp, $key]);
    if (!$ok) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to update backup']);
        odbc_close($conn);
        exit;
    }
} else {
    $insertStmt = odbc_prepare($conn, 'INSERT INTO AppData (data_key, data_json, updated_at) VALUES (?, ?, ?)');
    $ok = $insertStmt && odbc_execute($insertStmt, [$key, $raw, $timestamp]);
    if (!$ok) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to insert backup']);
        odbc_close($conn);
        exit;
    }
}

odbc_close($conn);

echo json_encode(['status' => 'ok', 'key' => $key, 'updated_at' => $timestamp]);
