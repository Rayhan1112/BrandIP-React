<?php
/**
 * Example API: GET /api/products — returns rows from MySQL product_flat.
 * Run from project root: php -S localhost:8080 -t php-api-example
 * Then open: http://localhost:8080/api/products.php
 *
 * Set your DB credentials below or via environment variables.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$dbHost     = getenv('DB_HOST') ?: 'localhost';
$dbPort     = getenv('DB_PORT') ?: '3306';
$dbName     = getenv('DB_DATABASE') ?: 'brandip_dev';
$dbUser     = getenv('DB_USERNAME') ?: 'root';
$dbPassword = getenv('DB_PASSWORD') ?: '';

try {
    $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
    exit;
}

$stmt = $pdo->query("
    SELECT id, sku, type, product_number, name, short_description, description, url_key,
           `new`, featured, status, meta_title, meta_keywords, meta_description,
           price, special_price, special_price_from, special_price_to, weight,
           created_at, locale, channel, attribute_family_id, product_id, updated_at,
           parent_id, visible_individually
    FROM product_flat
    ORDER BY id
");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Cast numeric types for JSON
foreach ($rows as &$row) {
    if (isset($row['price']))       $row['price']       = $row['price'] !== null ? (float) $row['price'] : null;
    if (isset($row['special_price'])) $row['special_price'] = $row['special_price'] !== null ? (float) $row['special_price'] : null;
    if (isset($row['weight']))      $row['weight']      = $row['weight'] !== null ? (float) $row['weight'] : null;
    if (isset($row['status']))      $row['status']      = $row['status'] !== null ? (bool) $row['status'] : null;
    if (isset($row['new']))         $row['new']         = $row['new'] !== null ? (bool) $row['new'] : null;
    if (isset($row['featured']))   $row['featured']   = $row['featured'] !== null ? (bool) $row['featured'] : null;
    if (isset($row['visible_individually'])) $row['visible_individually'] = $row['visible_individually'] !== null ? (bool) $row['visible_individually'] : null;
}
unset($row);

echo json_encode(['data' => $rows]);
