<?php
/**
 * GET /api/products — returns rows from MySQL product_flat.
 * Run from project root: php -S localhost:8080 -t php-api-example
 * Then: http://localhost:8080/api/products
 *
 * DB credentials: set in php-api-example/.env or as env vars (DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD).
 */
$envFile = dirname(__DIR__, 2) . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (preg_match('/^([^=]+)=(.*)$/', $line, $m)) putenv(trim($m[1]) . '=' . trim($m[2], " \t\"'"));
    }
}

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
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
    exit;
}

// Single product: GET /api/products/123
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
if (preg_match('#^/api/products/(\d+)/?$#', $path, $m)) {
    $productId = (int) $m[1];
    $sqlOne = "
        SELECT pf.id, pf.sku, pf.type, pf.product_number, pf.name, pf.short_description, pf.description, pf.url_key,
               pf.`new`, pf.featured, pf.status, pf.meta_title, pf.meta_keywords, pf.meta_description,
               pf.price, pf.special_price, pf.special_price_from, pf.special_price_to, pf.weight,
               pf.created_at, pf.locale, pf.channel, pf.attribute_family_id, pf.product_id, pf.updated_at,
               pf.parent_id, pf.visible_individually,
               (SELECT pi.path FROM product_images pi WHERE pi.product_id = pf.product_id ORDER BY pi.id ASC LIMIT 1) AS image_path
        FROM product_flat pf
        WHERE pf.id = " . $productId . " OR pf.product_id = " . $productId . "
        LIMIT 1
    ";
    try {
        $stmtOne = $pdo->query($sqlOne);
        $row = $stmtOne->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $sqlOne = "SELECT id, sku, type, product_number, name, short_description, description, url_key,
            `new`, featured, status, meta_title, meta_keywords, meta_description,
            price, special_price, special_price_from, special_price_to, weight,
            created_at, locale, channel, attribute_family_id, product_id, updated_at,
            parent_id, visible_individually FROM product_flat WHERE id = " . $productId . " LIMIT 1";
        $stmtOne = $pdo->query($sqlOne);
        $row = $stmtOne->fetch(PDO::FETCH_ASSOC);
    }
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found', 'id' => $productId]);
        exit;
    }
    if (array_key_exists('price', $row))            $row['price'] = $row['price'] !== null ? (float) $row['price'] : null;
    if (array_key_exists('special_price', $row))   $row['special_price'] = $row['special_price'] !== null ? (float) $row['special_price'] : null;
    if (array_key_exists('weight', $row))           $row['weight'] = $row['weight'] !== null ? (float) $row['weight'] : null;
    if (array_key_exists('status', $row))           $row['status'] = $row['status'] !== null ? (bool) $row['status'] : null;
    if (array_key_exists('new', $row))              $row['new'] = $row['new'] !== null ? (bool) $row['new'] : null;
    if (array_key_exists('featured', $row))         $row['featured'] = $row['featured'] !== null ? (bool) $row['featured'] : null;
    if (array_key_exists('visible_individually', $row)) $row['visible_individually'] = $row['visible_individually'] !== null ? (bool) $row['visible_individually'] : null;

    // Attach all images for this product (gallery) from product_images
    $pid = isset($row['product_id']) ? (int) $row['product_id'] : (int) $row['id'];
    $row['images'] = [];
    try {
        $imgStmt = $pdo->prepare("SELECT id, path, position FROM product_images WHERE product_id = ? ORDER BY COALESCE(position, 999), id ASC");
        $imgStmt->execute([$pid]);
        while ($imgRow = $imgStmt->fetch(PDO::FETCH_ASSOC)) {
            $row['images'][] = [
                'id' => isset($imgRow['id']) ? (int) $imgRow['id'] : null,
                'path' => $imgRow['path'] ?? '',
                'position' => isset($imgRow['position']) ? (int) $imgRow['position'] : null,
            ];
        }
    } catch (PDOException $e) {
        // position column might not exist
        try {
            $imgStmt = $pdo->prepare("SELECT id, path FROM product_images WHERE product_id = ? ORDER BY id ASC");
            $imgStmt->execute([$pid]);
            while ($imgRow = $imgStmt->fetch(PDO::FETCH_ASSOC)) {
                $row['images'][] = ['id' => (int) $imgRow['id'], 'path' => $imgRow['path'] ?? ''];
            }
        } catch (PDOException $e2) {
            // no product_images table
        }
    }
    if (empty($row['images']) && !empty($row['image_path'])) {
        $row['images'] = [['id' => null, 'path' => $row['image_path'], 'position' => null]];
    }

    echo json_encode(['data' => $row]);
    exit;
}

$usePagination = isset($_GET['page']) || isset($_GET['per_page']);
$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 24)));
$offset = ($page - 1) * $perPage;

$limitClause = $usePagination ? ' LIMIT ' . (int) $perPage . ' OFFSET ' . (int) $offset : '';

// Count total for pagination when using limit
$total = 0;
$lastPage = 1;
if ($usePagination) {
    $countStmt = $pdo->query("SELECT COUNT(*) FROM product_flat");
    $total = (int) $countStmt->fetchColumn();
    $lastPage = $total > 0 ? (int) ceil($total / $perPage) : 1;
}

// Use last image as base/main (matches Laravel shop: base image = last in images array)
$sql = "
    SELECT pf.id, pf.sku, pf.type, pf.product_number, pf.name, pf.short_description, pf.description, pf.url_key,
           pf.`new`, pf.featured, pf.status, pf.meta_title, pf.meta_keywords, pf.meta_description,
           pf.price, pf.special_price, pf.special_price_from, pf.special_price_to, pf.weight,
           pf.created_at, pf.locale, pf.channel, pf.attribute_family_id, pf.product_id, pf.updated_at,
           pf.parent_id, pf.visible_individually,
           (SELECT pi.path FROM product_images pi WHERE pi.product_id = pf.product_id ORDER BY COALESCE(pi.position, -1) DESC, pi.id DESC LIMIT 1) AS image_path
    FROM product_flat pf
    ORDER BY pf.id
    " . $limitClause . "
";
try {
    $stmt = $pdo->query($sql);
} catch (PDOException $e) {
    $sql = "
        SELECT pf.id, pf.sku, pf.type, pf.product_number, pf.name, pf.short_description, pf.description, pf.url_key,
               pf.`new`, pf.featured, pf.status, pf.meta_title, pf.meta_keywords, pf.meta_description,
               pf.price, pf.special_price, pf.special_price_from, pf.special_price_to, pf.weight,
               pf.created_at, pf.locale, pf.channel, pf.attribute_family_id, pf.product_id, pf.updated_at,
               pf.parent_id, pf.visible_individually,
               (SELECT pi.path FROM product_images pi WHERE pi.product_id = pf.product_id ORDER BY pi.id DESC LIMIT 1) AS image_path
        FROM product_flat pf
        ORDER BY pf.id
        " . $limitClause . "
    ";
    try {
        $stmt = $pdo->query($sql);
    } catch (PDOException $e2) {
        $sql = "
            SELECT id, sku, type, product_number, name, short_description, description, url_key,
                   `new`, featured, status, meta_title, meta_keywords, meta_description,
                   price, special_price, special_price_from, special_price_to, weight,
                   created_at, locale, channel, attribute_family_id, product_id, updated_at,
                   parent_id, visible_individually
            FROM product_flat
            ORDER BY id
            " . $limitClause . "
        ";
        $stmt = $pdo->query($sql);
    }
}
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($usePagination && $total === 0 && count($rows) > 0) {
    $total = count($rows);
}

foreach ($rows as &$row) {
    if (array_key_exists('price', $row))            $row['price'] = $row['price'] !== null ? (float) $row['price'] : null;
    if (array_key_exists('special_price', $row))   $row['special_price'] = $row['special_price'] !== null ? (float) $row['special_price'] : null;
    if (array_key_exists('weight', $row))           $row['weight'] = $row['weight'] !== null ? (float) $row['weight'] : null;
    if (array_key_exists('status', $row))           $row['status'] = $row['status'] !== null ? (bool) $row['status'] : null;
    if (array_key_exists('new', $row))              $row['new'] = $row['new'] !== null ? (bool) $row['new'] : null;
    if (array_key_exists('featured', $row))         $row['featured'] = $row['featured'] !== null ? (bool) $row['featured'] : null;
    if (array_key_exists('visible_individually', $row)) $row['visible_individually'] = $row['visible_individually'] !== null ? (bool) $row['visible_individually'] : null;
}
unset($row);

$out = ['data' => $rows];
if ($usePagination) {
    $out['meta'] = [
        'total' => $total,
        'per_page' => $perPage,
        'current_page' => $page,
        'last_page' => $lastPage,
    ];
}
echo json_encode($out);
