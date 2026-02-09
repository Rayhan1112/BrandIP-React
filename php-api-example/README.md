# PHP API example (products only)

Serves **`/api/products`** from your local MySQL `product_flat` table. No cart, checkout, or orders — only product fetching.

## 1. Database credentials

Edit **php-api-example/.env** so products use the correct database (e.g. `brandip_dev`):

```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=brandip_dev
DB_USERNAME=root
DB_PASSWORD=your_password
```

## 2. Start the PHP server (required)

From the **React BrandIP project root**, run:

```bash
php -S localhost:8080 -t php-api-example php-api-example/router.php
```

Leave this terminal open. You should see: `Development Server (http://localhost:8080) started`.

## 3. React .env

In the **React** project root `.env`:

```env
VITE_PHP_API_BASE_URL=http://localhost:8080
```

For **cart and checkout**, the React app must use Laravel (or another backend). Set `VITE_LARAVEL_API_BASE_URL` to your Laravel app URL so cart and orders go there.

## 4. Open the app

Go to **http://localhost:5173/php-products**. The React app will request `/api/products`; Vite proxies it to the PHP server, which returns data from `product_flat`.
