<?php
// export_backup.php - Stream a MySQL SQL dump of the helthcareDB database
// Intended to be called from the UI via a button like "Export data for this month".

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Basic DB configuration (keep in sync with other API scripts like get_users.php)
$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'helthcareDB';

// Optional year/month parameters are used only to name the file
$year  = isset($_GET['year'])  ? preg_replace('/[^0-9]/', '', $_GET['year'])  : date('Y');
$month = isset($_GET['month']) ? preg_replace('/[^0-9]/', '', $_GET['month']) : date('m');
if (strlen($month) === 1) {
    $month = '0' . $month;
}

$filename = sprintf('%s_backup_%s-%s.sql', $dbName, $year, $month);

// Path to mysqldump.
// On your system, the generic 'mysqldump' command is not in PATH, so we use
// the XAMPP MySQL binary directly. If XAMPP is installed elsewhere, update
// this path accordingly (for example, D:\\xampp\\mysql\\bin\\mysqldump.exe).
$mysqldumpBinary = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';

// Build mysqldump command safely
$parts   = [];
$parts[] = escapeshellcmd($mysqldumpBinary);
$parts[] = '--host=' . escapeshellarg($dbHost);
$parts[] = '--user=' . escapeshellarg($dbUser);
if ($dbPass !== '') {
    $parts[] = '--password=' . escapeshellarg($dbPass);
}
// Dump only this database
$parts[] = escapeshellarg($dbName);

$command = implode(' ', $parts);

// Try to start the mysqldump process
$descriptorspec = [
    1 => ['pipe', 'w'], // STDOUT
    2 => ['pipe', 'w'], // STDERR
];

$process = @proc_open($command, $descriptorspec, $pipes);
if (!is_resource($process)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unable to start mysqldump. Please verify mysqldump path and permissions.',
    ]);
    exit;
}

// Send headers for file download
header('Content-Type: application/sql; charset=utf-8');
header('Content-Description: File Transfer');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

// Stream dump output directly to the client
while (!feof($pipes[1])) {
    $chunk = fread($pipes[1], 8192);
    if ($chunk === false) {
        break;
    }
    echo $chunk;
    // Flush buffers to avoid memory build-up on large dumps
    if (function_exists('ob_get_level')) {
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
    }
    flush();
}

// Capture any error output (optional, not sent to client because headers are already sent)
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$returnCode = proc_close($process);

// Optionally append a comment if mysqldump failed
if ($returnCode !== 0) {
    echo "\n-- mysqldump exited with code {$returnCode}\n";
    if ($stderr) {
        echo "-- Error output: " . str_replace("\r", '', preg_replace('/\n+/', "\n-- ", "\n" . $stderr)) . "\n";
    }
}

exit;
