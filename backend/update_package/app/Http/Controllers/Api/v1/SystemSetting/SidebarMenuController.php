<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\SidebarMenu;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SidebarMenuController extends Controller
{
    private array $menuPermissionMap = [
        'dashboard' => [],
        'front_office' => ['Front Office'],
        'student_information' => ['Student Information', 'Multi Class', 'Online Admission'],
        'fees_collection' => ['Fees Collection', 'Quick Fees'],
        'income' => ['Income'],
        'expenses' => ['Expense'],
        'attendance' => ['Student Attendance'],
        'examinations' => ['Examination'],
        'cbse_examination' => ['CBSE Examination'],
        'online_examinations' => ['Online Examination'],
        'academics' => ['Academics'],
        'human_resource' => ['Human Resource'],
        'communicate' => ['Communicate', 'Whatsapp Messaging'],
        'download_center' => ['Download Center'],
        'homework' => ['Homework'],
        'online_course' => ['Online Course'],
        'library' => ['Library'],
        'inventory' => ['Inventory'],
        'transport' => ['Transport'],
        'hostel' => ['Hostel'],
        'certificate' => ['Certificate'],
        'multi_branch' => ['Multi Branch'],
        'behaviour_records' => ['Behaviour Records'],
        'reports' => ['Reports'],
        'gmeet_live_classes' => ['Gmeet Live Classes'],
        'zoom_live_classes' => ['Zoom Live Classes'],
        'lesson_plan' => ['Lesson Plan'],
        'student_cv' => ['Student CV'],
        'alumni' => ['Alumni'],
        'annual_calendar' => ['Annual Calendar'],
        'front_cms' => ['Front CMS'],
        'qr_code_attendance' => ['QR Code Attendance'],
        'system_setting' => ['System Settings', 'Thermal Print'],
        'quick_fees' => ['Quick Fees'],
        'thermal_print' => ['Thermal Print'],
        'whatsapp_messaging' => ['Whatsapp Messaging'],
    ];

    /**
     * Known submenus per module — matches frontend sidebar menuItems structure.
     * Used to compute visible_submenus based on user permissions.
     */
    private array $moduleSubmenus = [
        'front_office' => [
            'admission_enquiry', 'visitor_book', 'phone_call_log',
            'postal_dispatch', 'postal_receive', 'complain', 'setup_front_office',
        ],
        'student_information' => [
            'student_details', 'student_admission', 'online_admission',
            'disabled_students', 'multi_class_student', 'bulk_delete',
            'student_categories', 'student_house', 'disable_reason',
        ],
        'fees_collection' => [
            'collect_fees', 'offline_bank_payments', 'search_fees_payment',
            'search_due_fees', 'fees_master', 'quick_fees', 'fees_group',
            'fees_type', 'fees_discount', 'fees_carry_forward', 'fees_reminder',
        ],
        'income' => ['add_income', 'search_income', 'income_head'],
        'expenses' => ['add_expense', 'search_expense', 'expense_head'],
        'attendance' => ['student_attendance', 'approve_leave', 'attendance_by_date', 'leave_type'],
        'examinations' => [
            'exam_group', 'exam_schedule', 'exam_result', 'design_admit_card',
            'print_admit_card', 'design_marksheet', 'print_marksheet',
            'marks_grade', 'marks_division',
        ],
        'cbse_examination' => [
            'exam', 'exam_schedule', 'print_marksheet', 'template',
            'assign_observation', 'reports', 'setting',
        ],
        'online_examinations' => ['online_exam', 'question_bank'],
        'academics' => [
            'class_timetable', 'teachers_timetable', 'assign_class_teacher',
            'promote_students', 'subject_group', 'subjects', 'class', 'sections',
        ],
        'human_resource' => [
            'staff_directory', 'staff_attendance', 'payroll',
            'approve_leave_request', 'apply_leave', 'leave_type',
            'teachers_rating', 'department', 'designation', 'disabled_staff',
        ],
        'communicate' => [
            'notice_board', 'send_email', 'send_sms', 'send_wa', 'send_notification',
            'email_sms_log', 'schedule_email_sms_log', 'login_credentials_send',
            'notification_template', 'email_template', 'sms_template', 'wa_template',
        ],
        'download_center' => [
            'upload_share_content', 'content_share_list', 'video_tutorial', 'content_type',
        ],
        'homework' => ['add_homework', 'daily_assignment'],
        'online_course' => [
            'online_course', 'question_bank', 'offline_payment',
            'online_course_report', 'setting',
        ],
        'library' => ['book_list', 'issue_return', 'add_student', 'add_staff_member'],
        'inventory' => [
            'issue_item', 'add_item_stock', 'add_item',
            'item_category', 'item_store', 'item_supplier',
        ],
        'transport' => [
            'fees_master', 'pickup_point', 'routes', 'vehicles',
            'assign_vehicle', 'route_pickup_point', 'student_transport_fees',
        ],
        'hostel' => ['hostel_room', 'room_type', 'hostel'],
        'certificate' => [
            'transfer_certificate', 'student_certificate', 'generate_certificate',
            'student_id_card', 'generate_id_card', 'staff_id_card', 'generate_staff_id_card',
        ],
        'multi_branch' => ['overview', 'report', 'setting'],
        'behaviour_records' => ['assign_incident', 'incidents', 'reports', 'setting'],
        'reports' => [
            'student_information', 'finance', 'attendance', 'examinations',
            'online_examinations', 'lesson_plan', 'human_resource', 'homework',
            'library', 'inventory', 'transport', 'hostel', 'alumni',
            'user_log', 'audit_trail_report',
        ],
        'gmeet_live_classes' => [
            'live_classes', 'live_meeting', 'live_classes_report', 'live_meeting_report', 'setting',
        ],
        'zoom_live_classes' => [
            'live_meeting', 'live_classes', 'live_classes_report', 'live_meeting_report', 'setting',
        ],
        'lesson_plan' => [
            'copy_old_lessons', 'manage_lesson_plan', 'manage_syllabus_status', 'lesson', 'topic',
        ],
        'student_cv' => ['build_cv', 'download_cv'],
        'alumni' => ['manage_alumni', 'events'],
        'annual_calendar' => ['annual_calendar', 'holiday_type'],
        'front_cms' => [
            'event', 'gallery', 'news', 'media_manager', 'pages', 'menus', 'banner_images',
        ],
        'qr_code_attendance' => [
            'attendance', 'terminal', 'face_registration', 'qr_code_generation',
            'nfc_assignment', 'setting', 'smart_attendance_settings',
        ],
        'system_setting' => [
            'general_setting', 'session_setting', 'notification_setting',
            'whatsapp_messaging', 'sms_setting', 'email_setting',
            'payment_methods', 'print_header_footer', 'thermal_print',
            'front_cms_setting', 'backup_restore', 'currency', 'users',
            'roles_permissions', 'languages', 'addons',
            'custom_fields', 'captcha_setting', 'system_fields',
            'student_profile_setting', 'online_admission', 'admission_form', 'file_types',
            'sidebar_menu', 'system_update',
        ],
    ];

    /**
     * Override default submenu-name→feature-label conversion.
     * Empty array = submenu has no permission controls → hidden from non-Super Admin.
     * Non-empty = submenu requires at least one of these feature permissions.
     * Absent = default snake_case → Title Case conversion used.
     */
    private array $submenuFeatureOverride = [
        'student_information' => [
            'student_details' => ['Student'],
            'disabled_students' => ['Disable Student'],
            'student_house' => ['Student Houses'],
        ],
        'income' => [
            'add_income' => ['Income'],
        ],
        'expenses' => [
            'add_expense' => ['Expense'],
        ],
        'attendance' => [
            'student_attendance' => ['Student / Period Attendance'],
        ],
        'cbse_examination' => [
            'exam' => ['CBSE Exam'],
            'exam_schedule' => ['CBSE Exam Schedule'],
            'print_marksheet' => ['CBSE Exam Print Marksheet'],
            'template' => ['CBSE Exam Template'],
            'assign_observation' => ['CBSE Exam Assign Observation'],
            'reports' => ['CBSE Exam Subject Marks Report'],
            'setting' => ['CBSE Exam Setting'],
        ],
        'online_examinations' => [
            'online_exam' => ['Online Examination'],
        ],
        'academics' => [
            'promote_students' => ['Promote Student'],
            'subjects' => ['Subject'],
            'sections' => ['Section'],
        ],
        'human_resource' => [
            'staff_directory' => ['Staff'],
            'payroll' => ['Staff Payroll'],
            'leave_type' => ['Leave Types'],
            'disabled_staff' => ['Disable Staff'],
        ],
        'communicate' => [
            'notice_board' => ['Notice Board', 'Communicate'],
            'send_email' => ['Email', 'Send Email', 'Communicate'],
            'send_sms' => ['SMS', 'Send SMS', 'Communicate'],
            'send_wa' => ['Whatsapp Messaging', 'Send WA', 'Communicate'],
            'send_notification' => ['Send Notification', 'Notice Board', 'Communicate'],
            'email_sms_log' => ['Email / SMS Log', 'Communicate'],
            'schedule_email_sms_log' => ['Schedule Email SMS Log', 'Communicate'],
            'login_credentials_send' => ['Login Credentials Send', 'Communicate'],
            'notification_template' => ['Notification Template', 'Notice Board', 'Communicate'],
            'email_template' => ['Email Template', 'Communicate'],
            'sms_template' => ['SMS Template', 'Communicate'],
            'wa_template' => ['WA Template', 'Communicate'],
        ],
        'download_center' => [
            'upload_share_content' => ['Upload Content'],
        ],
        'homework' => [
            'add_homework' => ['Homework'],
        ],
        'online_course' => [
            'online_course_report' => ['Student Course Purchase Report'],
        ],
        'library' => [
            'book_list' => ['Books List'],
        ],
        'transport' => [
            'vehicles' => ['Vehicle'],
        ],
        'hostel' => [
            'hostel_room' => ['Hostel Rooms'],
        ],
        'certificate' => [
            'transfer_certificate' => ['Download Transfer Certificate'],
        ],
        'multi_branch' => [
            'report' => ['Daily Collection Report'],
        ],
        'behaviour_records' => [
            'assign_incident' => ['Behaviour Records Assign Incident'],
            'incidents' => ['Behaviour Records Incident'],
            'reports' => ['Student Incident Report'],
            'setting' => ['Behaviour Records Setting'],
        ],
        'reports' => [
            'student_information' => ['Student Report'],
            'finance' => ['Fees Statement'],
            'attendance' => ['Attendance Report'],
            'examinations' => ['Online Exam Wise Report'],
            'online_examinations' => ['Online Exam Wise Report'],
            'lesson_plan' => ['Syllabus Status Report'],
            'human_resource' => ['Staff Report'],
            'homework' => ['Homework Evaluation Report'],
            'library' => ['Book Issue Report'],
            'inventory' => ['Stock Report'],
            'transport' => ['Transport Report'],
            'hostel' => ['Hostel Report'],
            'alumni' => ['Alumni Report'],
        ],
        'qr_code_attendance' => [
        ],
        'system_setting' => [
            'backup_restore' => ['Backup'],
            'users' => ['User Status'],
            'roles_permissions' => ['Roles Permissions'],
            'addons' => ['Addons'],
            'captcha_setting' => ['Captcha Setting'],
            'student_profile_setting' => ['Student Profile Update'],
            'file_types' => ['File Types'],
            'system_update' => ['System Update'],
        ],
    ];

    public function index(Request $request): JsonResponse
    {
        $menus = SidebarMenu::orderBy('sort_order')->get();

        $user = $request->user();
        if ($user) {
            $userRoleLower = strtolower($user->role ?? '');
            // Admin & Super Admin see all menus and submenus
            if ($userRoleLower === 'super admin' || $userRoleLower === 'admin' || $userRoleLower === 'superadmin' || empty($userRoleLower)) {
                $menus = $this->injectAllSubmenus($menus);
                return response()->json([
                    'success' => true,
                    'data' => $menus,
                    'message' => 'Sidebar menus fetched successfully'
                ]);
            }

            $role = Role::where('name', $user->role)->first();
            $permNames = $role ? $role->permissions()->pluck('name')->toArray() : [];

            if (empty($permNames)) {
                $menus = $this->injectAllSubmenus($menus);
                return response()->json([
                    'success' => true,
                    'data' => $menus,
                    'message' => 'Sidebar menus fetched successfully'
                ]);
            }

            $menus = $menus->map(function ($menu) use ($permNames) {
                if ($menu->name === 'dashboard') return $menu;
                $permModules = $this->menuPermissionMap[$menu->name] ?? [];
                if (empty($permModules)) {
                    $menu->is_visible = false;
                    return $menu;
                }
                $hasAccess = false;
                foreach ($permModules as $mod) {
                    $prefix = \Illuminate\Support\Str::slug($mod, '.') . '.';
                    foreach ($permNames as $name) {
                        if (str_starts_with($name, $prefix)) {
                            $hasAccess = true;
                            break 2;
                        }
                    }
                }
                $menu->is_visible = $hasAccess;
                return $menu;
            });

            $menus = $this->injectVisibleSubmenus($menus, $permNames);
        } else {
            $menus = $this->injectAllSubmenus($menus);
        }

        return response()->json([
            'success' => true,
            'data' => $menus,
            'message' => 'Sidebar menus fetched successfully'
        ]);
    }

    /**
     * For each menu with known submenus, set visible_submenus to all submenu names.
     * Used for Super Admin who sees everything.
     */
    private function injectAllSubmenus($menus): mixed
    {
        return $menus->map(function ($menu) {
            $submenus = $this->moduleSubmenus[$menu->name] ?? null;
            if ($submenus === null) return $menu;
            $menu->visible_submenus = $submenus;
            return $menu;
        });
    }

    /**
     * For each menu with known submenus, compute which are visible
     * based on the user's permission names.
     */
    private function injectVisibleSubmenus($menus, array $permNames): mixed
    {
        return $menus->map(function ($menu) use ($permNames) {
            $submenus = $this->moduleSubmenus[$menu->name] ?? null;
            if ($submenus === null) return $menu;

            $visible = [];
            $permModules = $this->menuPermissionMap[$menu->name] ?? [];

            foreach ($submenus as $subName) {
                if ($this->isSubmenuVisible($subName, $permModules, $permNames, $menu->name)) {
                    $visible[] = $subName;
                }
            }

            $menu->visible_submenus = $visible;

            // If no submenus are visible, hide the entire module
            if ($menu->name !== 'dashboard' && !empty($submenus) && empty($visible)) {
                $menu->is_visible = false;
            }

            return $menu;
        });
    }

    /**
     * Determine if a submenu should be visible based on user permissions.
     */
    private function isSubmenuVisible(string $subName, array $permModules, array $permNames, string $menuKey): bool
    {
        $override = $this->submenuFeatureOverride[$menuKey][$subName] ?? null;

        if ($override !== null) {
            // Explicit override with empty array = no permission controls, hide it
            if (empty($override)) return false;
            $featureLabels = $override;
        } else {
            // Default: convert snake_case to Title Case
            $featureLabels = [implode(' ', array_map('ucfirst', explode('_', $subName)))];
        }

        foreach ($permModules as $mod) {
            $modSlug = \Illuminate\Support\Str::slug($mod, '.');
            foreach ($featureLabels as $label) {
                $prefix = \Illuminate\Support\Str::slug($mod . '.' . $label, '.') . '.';
                foreach ($permNames as $name) {
                    if (str_starts_with($name, $prefix) || str_starts_with($name, $modSlug . '.')) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'menus' => 'required|array',
            'menus.*.id' => 'required|integer|exists:sidebar_menus,id',
            'menus.*.is_visible' => 'required|boolean',
            'menus.*.sort_order' => 'required|integer',
            'menus.*.submenu_order' => 'nullable|array',
        ]);

        foreach ($validated['menus'] as $menuData) {
            SidebarMenu::where('id', $menuData['id'])->update([
                'is_visible' => $menuData['is_visible'],
                'sort_order' => $menuData['sort_order'],
                'submenu_order' => $menuData['submenu_order'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sidebar menus updated successfully'
        ]);
    }
}
