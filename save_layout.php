<?php
// save_layout.php: Save layout JSON to a file
header('Content-Type: application/json');
$name = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['name'] ?? '');
$data = $_POST['data'] ?? '';
if (!$name || !$data) {
      echo json_encode(['success' => false, 'error' => 'Missing name or data']);
      exit;
}
$dir = __DIR__ . '/layouts';
if (!is_dir($dir)) mkdir($dir, 0777, true);
$file = "$dir/layout-$name.json";
if (file_put_contents($file, $data) !== false) {
      echo json_encode(['success' => true]);
} else {
      echo json_encode(['success' => false, 'error' => 'Failed to write file']);
}
