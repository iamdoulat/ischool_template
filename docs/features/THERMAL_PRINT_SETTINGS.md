# Thermal Print Settings - Feature Documentation

## Overview
The Thermal Print Settings feature allows administrators to configure thermal receipt printer settings for the school management system. This includes school information, address, and footer text that appears on printed receipts.

## Features

### ✅ Implemented Features

1. **Enable/Disable Thermal Printing**
   - Toggle switch to enable or disable thermal printing system-wide
   - Visual status indicator (Enabled/Disabled with icons)

2. **School Information Configuration**
   - School name (required, max 255 characters)
   - School address (optional, max 1000 characters, supports HTML `<br>` tags)
   - Footer text (optional, max 1000 characters)

3. **Live Preview**
   - Real-time thermal receipt preview with sample data
   - Shows exactly how the receipt will appear when printed
   - Responsive preview dialog

4. **Test Print**
   - Print test receipt directly from preview
   - Opens in print dialog with thermal-friendly formatting
   - Uses monospace font (Courier New) for better thermal compatibility

5. **Reset to Defaults**
   - One-click reset to default school settings
   - Confirmation dialog to prevent accidental resets

6. **Form Validation**
   - Client-side validation with error messages
   - Server-side validation with detailed error responses
   - Character limit indicators

7. **Database Integration**
   - Full CRUD operations via Laravel backend
   - MySQL database storage
   - Automatic seeding with default values

8. **API Endpoints**
   - `GET /api/v1/system-setting/thermal-print-settings` - Fetch settings
   - `POST /api/v1/system-setting/thermal-print-settings` - Save/update settings
   - `POST /api/v1/system-setting/thermal-print-settings/reset` - Reset to defaults

## Technical Stack

### Frontend
- **Framework**: Next.js 16.1.6 with React 19.2
- **UI Components**: Shadcn UI (new-york variant)
- **Styling**: Tailwind CSS v4
- **State Management**: React useState/useEffect
- **HTTP Client**: Axios
- **Notifications**: Sonner + custom toast

### Backend
- **Framework**: Laravel 12
- **Database**: MySQL (SQLite for tests)
- **Authentication**: Laravel Sanctum
- **Testing**: PHPUnit

## File Structure

```
Frontend:
├── src/app/dashboard/system-setting/thermal-print/page.tsx

Backend:
├── app/
│   ├── Http/Controllers/Api/v1/SystemSetting/
│   │   └── ThermalPrintSettingController.php
│   └── Models/
│       └── ThermalPrintSetting.php
├── database/
│   ├── migrations/
│   │   └── 2026_02_22_105329_create_thermal_print_settings_table.php
│   └── seeders/
│       ├── ThermalPrintSettingSeeder.php
│       └── DatabaseSeeder.php (updated)
├── routes/api/v1/system-setting/
│   └── thermal-print-setting.php
└── tests/Feature/
    └── ThermalPrintSettingTest.php
```

## Database Schema

```sql
CREATE TABLE thermal_print_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status BOOLEAN DEFAULT TRUE,
    school_name VARCHAR(255) NULL,
    address TEXT NULL,
    footer_text TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

## API Documentation

### Get Thermal Print Settings
```http
GET /api/v1/system-setting/thermal-print-settings
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "status": true,
        "school_name": "Smart School Management System",
        "address": "25 Kings Street, California<br>Phone: +1 (555) 123-4567<br>Email: info@smartschool.com",
        "footer_text": "This is a computer-generated receipt. No signature required.",
        "created_at": "2026-06-25T10:00:00.000000Z",
        "updated_at": "2026-06-25T10:00:00.000000Z"
    }
}
```

### Save/Update Settings
```http
POST /api/v1/system-setting/thermal-print-settings
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": true,
    "school_name": "My School",
    "address": "123 School Street<br>City, State 12345",
    "footer_text": "Thank you for your payment"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "Thermal print settings saved successfully",
    "data": {
        "id": 1,
        "status": true,
        "school_name": "My School",
        "address": "123 School Street<br>City, State 12345",
        "footer_text": "Thank you for your payment",
        "created_at": "2026-06-25T10:00:00.000000Z",
        "updated_at": "2026-06-25T10:30:00.000000Z"
    }
}
```

### Reset to Defaults
```http
POST /api/v1/system-setting/thermal-print-settings/reset
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "message": "Settings reset to defaults",
    "data": {
        "id": 1,
        "status": true,
        "school_name": "Smart School Management System",
        "address": "25 Kings Street, California<br>Phone: +1 (555) 123-4567<br>Email: info@smartschool.com",
        "footer_text": "This is a computer-generated receipt. No signature required.",
        "created_at": "2026-06-25T10:00:00.000000Z",
        "updated_at": "2026-06-25T10:45:00.000000Z"
    }
}
```

## Validation Rules

| Field | Required | Type | Max Length | Notes |
|-------|----------|------|------------|-------|
| status | Yes | boolean | - | Enable/disable thermal printing |
| school_name | Yes | string | 255 | School name for receipts |
| address | No | string | 1000 | Supports HTML `<br>` tags |
| footer_text | No | string | 1000 | Footer message on receipts |

## Usage Instructions

### Setup & Installation

1. **Run Migration**:
```bash
cd backend
php artisan migrate
```

2. **Seed Default Data**:
```bash
php artisan db:seed --class=ThermalPrintSettingSeeder
```

3. **Run Tests**:
```bash
composer test --filter ThermalPrintSettingTest
```

### For End Users

1. Navigate to **Dashboard → System Settings → Thermal Print**
2. Toggle the switch to enable/disable thermal printing
3. Enter your school name (required)
4. Add school address with line breaks using `<br>` tags
5. Add custom footer text (e.g., "Thank you for your payment")
6. Click **Preview** to see how the receipt will look
7. Click **Test Print** to print a sample receipt
8. Click **Save** to store the settings
9. Click **Reset** to restore default values

## Testing

The feature includes comprehensive test coverage:

✅ **17 Test Cases**:
- Get thermal print settings
- Return default when no settings exist
- Store new settings
- Update existing settings
- Require status field
- Require school_name field
- Validate school_name max length (255)
- Address is optional
- Footer text is optional
- Reset to default settings
- Require authentication for all endpoints
- Validate status as boolean
- Validate address max length (1000)
- Validate footer text max length (1000)

**Run tests:**
```bash
cd backend
php artisan test --filter ThermalPrintSettingTest
```

## UI/UX Features

1. **Gradient Header** - Orange to indigo gradient matching iSchool design system
2. **Loading Skeleton** - Smooth loading animation
3. **Form Validation** - Real-time error messages
4. **Status Indicator** - Visual enabled/disabled status with icons
5. **Character Limits** - Helper text showing field constraints
6. **Responsive Design** - Works on mobile, tablet, and desktop
7. **Smooth Animations** - Fade-in transitions and hover effects
8. **Print Preview** - Realistic thermal receipt preview (280px width)
9. **Test Print** - Opens browser print dialog with thermal formatting

## Security

- ✅ Protected with Laravel Sanctum authentication
- ✅ CSRF protection on all POST requests
- ✅ Input validation and sanitization
- ✅ SQL injection prevention via Eloquent ORM
- ✅ XSS protection on output

## Future Enhancements (Optional)

- [ ] Multiple thermal printer profiles
- [ ] Logo upload for receipts
- [ ] QR code generation on receipts
- [ ] Custom receipt templates
- [ ] Print margins configuration
- [ ] Font size customization
- [ ] Multi-language receipt support
- [ ] Receipt email functionality
- [ ] Receipt history/archive

## Troubleshooting

### Frontend Issues

**Settings not loading:**
- Check browser console for API errors
- Verify authentication token in localStorage
- Ensure backend is running on port 8000

**Save not working:**
- Check form validation errors
- Verify all required fields are filled
- Check network tab for 422 validation errors

### Backend Issues

**Migration fails:**
- Ensure database connection is configured
- Check MySQL is running
- Verify database user has CREATE TABLE permissions

**Tests failing:**
- Run `php artisan config:clear`
- Ensure SQLite is installed for in-memory testing
- Check User factory exists

## Support

For issues or questions:
1. Check the console/logs for error messages
2. Verify all migrations are run
3. Ensure authentication is working
4. Test API endpoints with Postman/Insomnia

---

**Last Updated**: June 25, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
