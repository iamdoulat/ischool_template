@echo off
REM Setup script for Payment Gateway Settings

echo =========================================
echo Payment Gateway Settings Setup
echo =========================================
echo.

cd backend

echo Step 1: Running migrations...
"C:\Program Files\FlyEnv-Data\app\php-8.3.31\php.exe" artisan migrate --force

echo.
echo Step 2: Seeding payment gateway settings...
"C:\Program Files\FlyEnv-Data\app\php-8.3.31\php.exe" artisan db:seed --class=PaymentGatewaySettingSeeder

echo.
echo Step 3: Running tests (optional)...
composer test --filter PaymentGatewaySettingTest

echo.
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo The payment methods page should now work at:
echo http://localhost:3000/dashboard/system-setting/payment-methods

cd ..
pause
