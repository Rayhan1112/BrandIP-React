<?php
/**
 * Router for PHP built-in server. Only /api/products is handled (product fetching from MySQL).
 * Cart, checkout, and orders are not handled here — use Laravel or another backend for those.
 * Run from project root: php -S localhost:8080 -t php-api-example php-api-example/router.php
 */
$uri = $_SERVER['REQUEST_URI'] ?? '';
$uri = parse_url($uri, PHP_URL_PATH);
if (preg_match('#^/api/products#', $uri)) {
    require __DIR__ . '/api/products/index.php';
    return true;
}
return false; // fall back to file system
