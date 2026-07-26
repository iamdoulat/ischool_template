<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
    protected $fillable = [
        'school_name',
        'school_slogan',
        'school_description',
        'school_code',
        'address',
        'phone',
        'email',
        'session',
        'session_start_month',
        'date_format',
        'timezone',
        'start_day_of_week',
        'time_format',
        'currency_format',
        'base_url',
        'file_upload_path',
        'print_logo',
        'admin_logo',
        'admin_small_logo',
        'app_logo',
        'login_page_background_admin',
        'login_page_background_user',
        'theme_mode',
        'skins',
        'side_menu',
        'primary_color',
        'box_content',
        'mobile_api_url',
        'mobile_primary_color',
        'mobile_secondary_color',
        'student_login',
        'parent_login',
        'student_login_admission_no',
        'student_login_mobile_no',
        'student_login_email',
        'parent_login_mobile_no',
        'parent_login_email',
        'allow_student_to_add_timeline',
        'attendance_type',
        'biometric_attendance',
        'devices',
        'low_attendance_limit',
        'staff_attendance_settings',
        'student_attendance_settings',
        'google_client_id',
        'google_api_key',
        'google_project_number',
        'google_status',
        'google_allow_student',
        'google_allow_guardian',
        'google_allow_staff',
        'whatsapp_front_site_status',
        'whatsapp_front_site_mobile',
        'whatsapp_front_site_from',
        'whatsapp_front_site_to',
        'whatsapp_admin_panel_status',
        'whatsapp_admin_panel_mobile',
        'whatsapp_admin_panel_from',
        'whatsapp_admin_panel_to',
        'whatsapp_student_panel_status',
        'whatsapp_student_panel_mobile',
        'whatsapp_student_panel_from',
        'whatsapp_student_panel_to',
        'chat_student_delete',
        'chat_guardian_delete',
        'chat_staff_delete',
        'maintenance_mode',
        // ID Auto Generation
        'auto_admission_no',
        'admission_no_prefix',
        'admission_no_digit',
        'admission_start_from',
        'auto_staff_id',
        'staff_id_prefix',
        'staff_no_digit',
        'staff_id_start_from',
        'auto_roll_no',
        'roll_no_prefix',
        'roll_no_digit',
        'roll_no_start_from',
        'auto_username',
        'username_prefix',
        'username_digit',
        'username_start_from',
        'auto_parent_username',
        'parent_username_prefix',
        'parent_username_digit',
        'parent_username_start_from',
        // Fees
        'fees_offline_bank_payment_in_student_panel',
        'fees_offline_bank_payment_instruction',
        'fees_lock_student_panel_if_fees_remaining',
        'fees_print_fees_receipt_for',
        'fees_due_days',
        'fees_single_page_print',
        'fees_collect_fees_in_back_date',
        'fees_student_guardian_panel_fees_discount',
        'fees_display_previous_fees',
        'fees_allow_student_to_add_partial_payment',
        // Miscellaneous
        'online_exam_show_only_my_question',
        'id_card_scan_code',
        'exam_result_page_in_front_site',
        'exam_admit_card_download_in_student_panel',
        'teacher_restricted_mode',
        'superadmin_visibility',
        'event_reminder',
        'staff_apply_leave_notification_email',
        'enable_multi_class_selection_in_student_admission_form',
        'cron_secret_key',
        'is_student_profile_edit',
        // Income Invoice
        'income_invoice_enable_auto_generation',
        'income_invoice_prefix',
        'income_invoice_digit',
        'income_invoice_start_from',
        // Expense Invoice
        'expense_invoice_enable_auto_generation',
        'expense_invoice_prefix',
        'expense_invoice_digit',
        'expense_invoice_start_from',
        'footer_contact_title',
        'footer_contact_info_label',
        'facebook_url',
        'twitter_url',
        'instagram_url',
        'youtube_url',
        'linkedin_url',
        'pinterest_url',
        'contact_form_receiver_email',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'student_login' => 'boolean',
        'parent_login' => 'boolean',
        'student_login_admission_no' => 'boolean',
        'student_login_mobile_no' => 'boolean',
        'student_login_email' => 'boolean',
        'parent_login_mobile_no' => 'boolean',
        'parent_login_email' => 'boolean',
        'allow_student_to_add_timeline' => 'boolean',
        'biometric_attendance' => 'boolean',
        'staff_attendance_settings' => 'json',
        'student_attendance_settings' => 'json',
        'google_status' => 'boolean',
        'google_allow_student' => 'boolean',
        'google_allow_guardian' => 'boolean',
        'google_allow_staff' => 'boolean',
        'whatsapp_front_site_status' => 'boolean',
        'whatsapp_admin_panel_status' => 'boolean',
        'whatsapp_student_panel_status' => 'boolean',
        'chat_student_delete' => 'boolean',
        'chat_guardian_delete' => 'boolean',
        'chat_staff_delete' => 'boolean',
        'maintenance_mode' => 'boolean',
        // ID Auto Generation
        'auto_admission_no' => 'boolean',
        'auto_staff_id' => 'boolean',
        'auto_roll_no' => 'boolean',
        'auto_username' => 'boolean',
        'username_digit' => 'integer',
        'auto_parent_username' => 'boolean',
        'parent_username_digit' => 'integer',
        // Fees
        'fees_offline_bank_payment_in_student_panel' => 'boolean',
        'fees_lock_student_panel_if_fees_remaining' => 'boolean',
        'fees_print_fees_receipt_for' => 'json',
        'fees_single_page_print' => 'boolean',
        'fees_collect_fees_in_back_date' => 'boolean',
        'fees_student_guardian_panel_fees_discount' => 'boolean',
        'fees_display_previous_fees' => 'boolean',
        'fees_allow_student_to_add_partial_payment' => 'boolean',
        // Miscellaneous
        'online_exam_show_only_my_question' => 'boolean',
        'exam_result_page_in_front_site' => 'boolean',
        'exam_admit_card_download_in_student_panel' => 'boolean',
        'teacher_restricted_mode' => 'boolean',
        'superadmin_visibility' => 'boolean',
        'event_reminder' => 'boolean',
        'enable_multi_class_selection_in_student_admission_form' => 'boolean',
        'is_student_profile_edit' => 'boolean',
        // Income Invoice
        'income_invoice_enable_auto_generation' => 'boolean',
        'income_invoice_digit' => 'integer',
        // Expense Invoice
        'expense_invoice_enable_auto_generation' => 'boolean',
        'expense_invoice_digit' => 'integer',
    ];

    /**
     * Get base64 encoded print logo
     */
    public function getPrintLogoBase64Attribute(): ?string
    {
        if (!$this->print_logo) {
            return null;
        }

        $path = $this->print_logo;
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            $parsed = parse_url($path);
            $path = $parsed['path'] ?? '';
            if (str_starts_with($path, '/storage/')) {
                $path = substr($path, 9);
            } elseif (str_starts_with($path, 'storage/')) {
                $path = substr($path, 8);
            }
        }

        try {
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
                $fileContents = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
                $mimeType = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($path);
                return 'data:' . $mimeType . ';base64,' . base64_encode($fileContents);
            }
        } catch (\Exception $e) {
            return null;
        }

        return null;
    }

    protected $appends = ['print_logo_base64'];
}
