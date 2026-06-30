#!/bin/bash

# Backend setup script for Print Header/Footer Settings

echo "========================================="
echo "Print Header/Footer Settings Setup"
echo "========================================="
echo ""

# Navigate to backend directory
cd backend

echo "Step 1: Running migrations..."
"/c/Program Files/FlyEnv-Data/app/php-8.3.31/php" artisan migrate --force

echo ""
echo "Step 2: Creating storage link..."
"/c/Program Files/FlyEnv-Data/app/php-8.3.31/php" artisan storage:link

echo ""
echo "Step 3: Seeding print header/footer settings..."
"/c/Program Files/FlyEnv-Data/app/php-8.3.31/php" artisan db:seed --class=PrintHeaderFooterSettingSeeder

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next: Run tests with:"
echo "composer test --filter PrintHeaderFooterSettingTest"
