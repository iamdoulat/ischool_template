<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException;

class GeneralSettingController extends BaseController
{
    /**
     * Get the general settings.
     */
    public function index(): JsonResponse
    {
        $settings = GeneralSetting::first();
        $classes = \App\Models\SchoolClass::with('sections')->get();

        $generatedStudentSettings = [];
        $savedStudentSettings = $settings ? $settings->student_attendance_settings : [];

        foreach ($classes as $class) {
            $classEntry = [
                'class_id' => $class->id,
                'class_name' => $class->name,
                'sections' => []
            ];

            // Find saved class settings if they exist
            $savedClass = null;
            if (is_array($savedStudentSettings)) {
                foreach ($savedStudentSettings as $sClass) {
                    if (isset($sClass['class_id']) && $sClass['class_id'] == $class->id) {
                        $savedClass = $sClass;
                        break;
                    }
                }
            }

            foreach ($class->sections as $section) {
                $sectionEntry = [
                    'section_id' => $section->id,
                    'section_name' => $section->name,
                    'settings' => [
                        ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                        ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                        ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                        ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                    ]
                ];

                // Override with saved settings if available
                if ($savedClass && isset($savedClass['sections']) && is_array($savedClass['sections'])) {
                    foreach ($savedClass['sections'] as $sSection) {
                        if (isset($sSection['section_id']) && $sSection['section_id'] == $section->id) {
                            $sectionEntry['settings'] = $sSection['settings'];
                            break;
                        }
                    }
                }

                $classEntry['sections'][] = $sectionEntry;
            }
            $generatedStudentSettings[] = $classEntry;
        }

        if (!$settings) {
            // Return default empty settings if non exist
            return $this->success([
                'school_name' => '',
                'school_slogan' => '',
                'school_description' => '',
                'school_code' => '',
                'address' => '',
                'phone' => '',
                'email' => '',
                'session' => '',
                'session_start_month' => '',
                'date_format' => '',
                'timezone' => '',
                'start_day_of_week' => '',
                'time_format' => '12',
                'currency_format' => '',
                'base_url' => '',
                'file_upload_path' => '',
                'print_logo' => '/logo-print.png',
                'admin_logo' => '/logo-admin.png',
                'admin_small_logo' => '/logo-admin-small.png',
                'app_logo' => '/logo-app.png',
                'login_page_background_admin' => '/bg-admin.jpg',
                'login_page_background_user' => '/bg-user.jpg',
                'theme_mode' => 'light',
                'skins' => 'shadow',
                'side_menu' => 'expanded',
                'primary_color' => '#4f46e5',
                'box_content' => 'wide',
                'mobile_api_url' => '',
                'mobile_primary_color' => '#424242',
                'mobile_secondary_color' => '#E7F1EE',
                'student_login' => 1,
                'parent_login' => 1,
                'student_login_admission_no' => 1,
                'student_login_mobile_no' => 0,
                'student_login_email' => 0,
                'parent_login_mobile_no' => 1,
                'parent_login_email' => 0,
                'allow_student_to_add_timeline' => 0,
                'attendance_type' => 'day_wise',
                'biometric_attendance' => 0,
                'devices' => '',
                'low_attendance_limit' => '75.00',
                'staff_attendance_settings' => [
                    [
                        'role' => 'Super Admin',
                        'settings' => [
                            ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                            ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                            ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                            ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                        ]
                    ],
                    [
                        'role' => 'Admin',
                        'settings' => [
                            ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                            ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                            ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                            ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                        ]
                    ],
                    [
                        'role' => 'Teacher',
                        'settings' => [
                            ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                            ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                            ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                            ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                        ]
                    ],
                    [
                        'role' => 'Accountant',
                        'settings' => [
                            ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                            ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                            ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                            ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                        ]
                    ],
                    [
                        'role' => 'Librarian',
                        'settings' => [
                            ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                            ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                            ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                            ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                        ]
                    ],
                    [
                        'role' => 'Receptionist',
                        'settings' => [
                            ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                            ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                            ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                            ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                        ]
                    ],
                ],
                'auto_admission_no' => 0,
                'admission_no_prefix' => 'ADM',
                'admission_no_digit' => 4,
                'admission_start_from' => '1',
                'auto_staff_id' => 0,
                'staff_id_prefix' => 'STF',
                'staff_no_digit' => 4,
                'staff_id_start_from' => '1',
                'auto_roll_no' => 0,
                'roll_no_prefix' => 'RL',
                'roll_no_digit' => 4,
                'roll_no_start_from' => '1',
                'footer_contact_title' => 'Contact Us',
                'footer_contact_info_label' => 'Contact Info',
                'facebook_url' => '',
                'twitter_url' => '',
                'instagram_url' => '',
                'youtube_url' => '',
                'linkedin_url' => '',
                'pinterest_url' => '',
                'student_attendance_settings' => $generatedStudentSettings,
            ], 'Default settings fetched');
        }

        // Ensure JSON fields are not null in response
        if (is_null($settings->staff_attendance_settings)) {
            $settings->staff_attendance_settings = [
                [
                    'role' => 'Super Admin',
                    'settings' => [
                        ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                        ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                        ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                        ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                    ]
                ],
                [
                    'role' => 'Admin',
                    'settings' => [
                        ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                        ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                        ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                        ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                    ]
                ],
                [
                    'role' => 'Teacher',
                    'settings' => [
                        ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                        ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                        ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                        ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                    ]
                ],
                [
                    'role' => 'Accountant',
                    'settings' => [
                        ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                        ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                        ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                        ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                    ]
                ],
                [
                    'role' => 'Librarian',
                    'settings' => [
                        ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                        ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                        ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                        ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                    ]
                ],
                [
                    'role' => 'Receptionist',
                    'settings' => [
                        ['type' => 'Present (P)', 'from' => '08:45:00', 'upto' => '09:05:00', 'total' => '09:00:00'],
                        ['type' => 'Late (L)', 'from' => '09:05:00', 'upto' => '09:15:00', 'total' => '09:00:00'],
                        ['type' => 'Half Day (F)', 'from' => '09:15:00', 'upto' => '09:30:00', 'total' => '05:00:00'],
                        ['type' => 'Half Day (Second Half) (SH)', 'from' => '12:00:00', 'upto' => '12:30:00', 'total' => '05:00:00'],
                    ]
                ],
            ];
        }

        // Fill empty logo/background fields with default paths
        if (empty($settings->print_logo)) $settings->print_logo = '/logo-print.png';
        if (empty($settings->admin_logo)) $settings->admin_logo = '/logo-admin.png';
        if (empty($settings->admin_small_logo)) $settings->admin_small_logo = '/logo-admin-small.png';
        if (empty($settings->app_logo)) $settings->app_logo = '/logo-app.png';
        if (empty($settings->login_page_background_admin)) $settings->login_page_background_admin = '/bg-admin.jpg';
        if (empty($settings->login_page_background_user)) $settings->login_page_background_user = '/bg-user.jpg';

        // Always replace student settings with generated structure including persistence checks
        $settings->student_attendance_settings = $generatedStudentSettings;

        // Add app version to response dynamically from env SYSTEM_VERSION
        $settings->app_version = env('SYSTEM_VERSION') ?: ($settings->app_version ?? '1.0.0');

        return $this->success($settings, 'General settings fetched successfully');
    }

    /**
     * Update the general settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_name' => 'nullable|string',
            'school_slogan' => 'nullable|string',
            'school_description' => 'nullable|string',
            'school_code' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'session' => 'nullable|string',
            'session_start_month' => 'nullable|string',
            'date_format' => 'nullable|string',
            'timezone' => 'nullable|string',
            'start_day_of_week' => 'nullable|string',
            'time_format' => 'nullable|string|in:12,24',
            'currency_format' => 'nullable|string',
            'base_url' => 'nullable|string',
            'file_upload_path' => 'nullable|string',
            'print_logo' => 'nullable|string',
            'admin_logo' => 'nullable|string',
            'admin_small_logo' => 'nullable|string',
            'app_logo' => 'nullable|string',
            'login_page_background_admin' => 'nullable|string',
            'login_page_background_user' => 'nullable|string',
            'theme_mode' => 'nullable|string',
            'skins' => 'nullable|string',
            'side_menu' => 'nullable|string',
            'primary_color' => 'nullable|string',
            'box_content' => 'nullable|string',
            'mobile_api_url' => 'nullable|string',
            'mobile_primary_color' => 'nullable|string',
            'mobile_secondary_color' => 'nullable|string',
            'student_login' => 'nullable|boolean',
            'parent_login' => 'nullable|boolean',
            'student_login_admission_no' => 'nullable|boolean',
            'student_login_mobile_no' => 'nullable|boolean',
            'student_login_email' => 'nullable|boolean',
            'parent_login_mobile_no' => 'nullable|boolean',
            'parent_login_email' => 'nullable|boolean',
            'allow_student_to_add_timeline' => 'nullable|boolean',
            'attendance_type' => 'nullable|string',
            'biometric_attendance' => 'nullable|boolean',
            'devices' => 'nullable|string',
            'low_attendance_limit' => 'nullable|numeric',
            'staff_attendance_settings' => 'nullable|array',
            'student_attendance_settings' => 'nullable|array',
            'google_client_id' => 'nullable|string',
            'google_api_key' => 'nullable|string',
            'google_project_number' => 'nullable|string',
            'google_status' => 'nullable|boolean',
            'google_allow_student' => 'nullable|boolean',
            'google_allow_guardian' => 'nullable|boolean',
            'google_allow_staff' => 'nullable|boolean',
            'whatsapp_front_site_status' => 'nullable|boolean',
            'whatsapp_front_site_mobile' => 'nullable|string',
            'whatsapp_front_site_from' => 'nullable|string',
            'whatsapp_front_site_to' => 'nullable|string',
            'whatsapp_admin_panel_status' => 'nullable|boolean',
            'whatsapp_admin_panel_mobile' => 'nullable|string',
            'whatsapp_admin_panel_from' => 'nullable|string',
            'whatsapp_admin_panel_to' => 'nullable|string',
            'whatsapp_student_panel_status' => 'nullable|boolean',
            'whatsapp_student_panel_mobile' => 'nullable|string',
            'whatsapp_student_panel_from' => 'nullable|string',
            'whatsapp_student_panel_to' => 'nullable|string',
            'chat_student_delete' => 'nullable|boolean',
            'chat_guardian_delete' => 'nullable|boolean',
            'chat_staff_delete' => 'nullable|boolean',
            'maintenance_mode' => 'nullable|boolean',

            // ID Auto Generation
            'auto_admission_no' => 'nullable|boolean',
            'admission_no_prefix' => 'nullable|string',
            'admission_no_digit' => 'nullable|integer',
            'admission_start_from' => 'nullable|string',
            'auto_staff_id' => 'nullable|boolean',
            'staff_id_prefix' => 'nullable|string',
            'staff_no_digit' => 'nullable|integer',
            'staff_id_start_from' => 'nullable|string',
            'auto_roll_no' => 'nullable|boolean',
            'roll_no_prefix' => 'nullable|string',
            'roll_no_digit' => 'nullable|integer',
            'roll_no_start_from' => 'nullable|string',

            // Username Auto Generation
            'auto_username' => 'nullable|boolean',
            'username_prefix' => 'nullable|string',
            'username_digit' => 'nullable|integer',
            'username_start_from' => 'nullable|string',

            // Parent Username Auto Generation
            'auto_parent_username' => 'nullable|boolean',
            'parent_username_prefix' => 'nullable|string',
            'parent_username_digit' => 'nullable|integer',
            'parent_username_start_from' => 'nullable|string',

            // Fees
            'fees_offline_bank_payment_in_student_panel' => 'nullable|boolean',
            'fees_offline_bank_payment_instruction' => 'nullable|string',
            'fees_lock_student_panel_if_fees_remaining' => 'nullable|boolean',
            'fees_print_fees_receipt_for' => 'nullable|array',
            'fees_due_days' => 'nullable|integer',
            'fees_single_page_print' => 'nullable|boolean',
            'fees_collect_fees_in_back_date' => 'nullable|boolean',
            'fees_student_guardian_panel_fees_discount' => 'nullable|boolean',
            'fees_display_previous_fees' => 'nullable|boolean',
            'fees_allow_student_to_add_partial_payment' => 'nullable|boolean',

            // Miscellaneous
            'online_exam_show_only_my_question' => 'nullable|boolean',
            'id_card_scan_code' => 'nullable|string|in:barcode,qrcode',
            'exam_result_page_in_front_site' => 'nullable|boolean',
            'exam_admit_card_download_in_student_panel' => 'nullable|boolean',
            'teacher_restricted_mode' => 'nullable|boolean',
            'superadmin_visibility' => 'nullable|boolean',
            'event_reminder' => 'nullable|boolean',
            'staff_apply_leave_notification_email' => 'nullable|email',
            'enable_multi_class_selection_in_student_admission_form' => 'nullable|boolean',
            'footer_contact_title' => 'nullable|string',
            'footer_contact_info_label' => 'nullable|string',
            'facebook_url' => 'nullable|url',
            'twitter_url' => 'nullable|url',
            'instagram_url' => 'nullable|url',
            'youtube_url' => 'nullable|url',
            'linkedin_url' => 'nullable|url',
            'pinterest_url' => 'nullable|url',
            'contact_form_receiver_email' => 'nullable|email',

            // Income Invoice
            'income_invoice_enable_auto_generation' => 'nullable|boolean',
            'income_invoice_prefix' => 'nullable|string',
            'income_invoice_digit' => 'nullable|integer',
            'income_invoice_start_from' => 'nullable|string',

            // Expense Invoice
            'expense_invoice_enable_auto_generation' => 'nullable|boolean',
            'expense_invoice_prefix' => 'nullable|string',
            'expense_invoice_digit' => 'nullable|integer',
            'expense_invoice_start_from' => 'nullable|string',
        ]);

        $settings = GeneralSetting::first();

        // Get actual existing columns from general_settings table to avoid unknown column SQL errors
        try {
            $existingColumns = Schema::getColumnListing('general_settings');
            $safeValidated = array_filter(
                $validated,
                fn($key) => in_array($key, $existingColumns),
                ARRAY_FILTER_USE_KEY
            );

            if ($settings) {
                $settings->update($safeValidated);
            } else {
                $settings = GeneralSetting::create($safeValidated);
            }
        } catch (QueryException $e) {
            if ($settings) {
                $settings->update($validated);
            } else {
                $settings = GeneralSetting::create($validated);
            }
        }

        return $this->success($settings, 'General settings updated successfully');
    }
}
