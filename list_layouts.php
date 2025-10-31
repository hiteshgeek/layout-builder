<?php
// list_layouts.php: List all saved layout JSON files
header('Content-Type: application/json');
$dir = __DIR__ . '/layouts';
if (!is_dir($dir)) {
      echo json_encode([]);
      exit;
}
$files = glob("$dir/layout-*.json");
$names = array_map(function ($f) {
      return preg_replace('/^.*layout-(.*)\\.json$/', '$1', $f);
}, $files);
echo json_encode($names);
