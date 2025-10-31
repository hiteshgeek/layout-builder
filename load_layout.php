<?php
// load_layout.php: Load a layout JSON file by name
header('Content-Type: application/json');
$name = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['name'] ?? '');
$dir = __DIR__ . '/layouts';
$file = "$dir/layout-$name.json";
if (!$name || !file_exists($file)) {
      echo json_encode(['success' => false, 'error' => 'File not found']);
      exit;
}
$data = file_get_contents($file);
echo $data;
