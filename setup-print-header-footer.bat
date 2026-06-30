@echo off
REM Backend setup script for Print Header/Footer Settings

echo =========================================
echo Print Header/Footer Settings Setup
echo =========================================
echo.

cd backend

echo Step 1: Running migrations...
"C:\Program Files\FlyEnv-Data\app\php-8.3.31\php.exe" artisan migrate --force

echo.
echo Step 2: Creating storage link...
"C:\Program Files\FlyEnv-Data\app\php-8.3.31\php.exe" artisan storage:link

echo.
echo Step 3: Seeding print header/footer settings...
"C:\Program Files\FlyEnv-Data\app\php-8.3.31\php.exe" artisan db:seed --class=PrintHeaderFooterSettingSeeder

echo.
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Next: Run tests with:
echo composer test --filter PrintHeaderFooterSettingTest

cd ..
