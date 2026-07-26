<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\NotificationSetting;

class NotificationSettingSeeder extends Seeder
{
    public function run(): void
    {
        $events = [
            // ── HR / Payroll ───────────────────────────────────────────────
            [
                "event_name" => "Salary Generated",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Staff"],
                "sample_message" => "Dear {{name}}, your salary of {{net_salary}} for {{month_name}} {{year}} has been generated. Basic: {{basic_salary}}, Allowances: {{allowances}}, Deductions: {{deductions}}.",
            ],
            [
                "event_name" => "Salary Paid",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Staff"],
                "sample_message" => "Dear {{name}}, your salary of {{net_salary}} for {{month_name}} {{year}} has been paid on {{paid_on}}.",
            ],

            // ── Online Admission ─────────────────────────────────────────
            [
                "event_name" => "Online Admission Fees Submission",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "whatsapp_template_id" => "HXD7195c2d239676124c4e08f58232104a",
                "sample_message" => "Dear {{firstname}} {{lastname}} your online admission form has been submitted successfully and the payment of {{paid_amount}} has been received on {{date}}. Your Reference number is {{reference_no}}.",
            ],
            [
                "event_name" => "Online Admission Fees Processing",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Dear {{firstname}} {{lastname}}, your online admission fee of {{paid_amount}} is being processed on {{date}}. Ref: {{reference_no}}, Transaction ID: {{transaction_id}}.",
            ],
            [
                "event_name" => "Online Admission Form Submission",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Dear {{firstname}} {{lastname}}, your admission application has been submitted successfully on {{date}}. Reference No: {{reference_no}}. Class: {{class}}, Section: {{section}}.",
            ],
            [
                "event_name" => "Student Admission",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "whatsapp_template_id" => "HXD7195c2d239676124c4e08f58232104a",
                "sample_message" => "Dear {{firstname}} {{lastname}}, you have been enrolled as a student. Admission No: {{admission_no}}, Roll No: {{roll_no}}, Class: {{class}}, Section: {{section}}. Username: {{username}}, Password: {{password}}.",
            ],

            // ── Behaviour ─────────────────────────────────────────────────
            [
                "event_name" => "Behaviour Incident Assigned",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "whatsapp_template_id" => "HXD7195c2d239676124c4e08f58232104a",
                "sample_message" => "A behaviour incident ({{incident_title}}) with {{incident_point}} point(s) has been assigned to {{student_name}} ({{class}} - {{section}}, {{admission_no}}). Guardian: {{guardian_name}} ({{guardian_phone}}).",
            ],

            // ── CBSE Exam ─────────────────────────────────────────────────
            [
                "event_name" => "CBSE Exam Result",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "whatsapp_template_id" => "HX81ee1977fb43981e9e9a6ada5cb9a54f",
                "sample_message" => "Dear {{student_name}} (Roll No: {{roll_no}}), your {{exam}} result has been published. Please check the portal for details.",
            ],
            [
                "event_name" => "CBSE Exam Marksheet Pdf",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Dear {{student_name}} ({{admission_no}}, {{class}} Section {{section}}), the marksheet for Roll No. {{roll_no}} has been mailed to you.",
            ],
            [
                "event_name" => "Email PDF Exam Marksheet",
                "is_active" => true,
                "destinations" => ["Email"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Dear {{student_name}} ({{admission_no}}, {{class}} Section {{section}}), we have mailed the marksheet for {{exam}} (Roll No: {{roll_no}}).",
            ],
            [
                "event_name" => "Exam Result Published",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Dear {{student_name}}, the result for {{exam}} has been published. Check the portal for your marks and grade.",
            ],

            // ── Online Course ─────────────────────────────────────────────
            [
                "event_name" => "Online Course Guest User Sign Up",
                "is_active" => true,
                "destinations" => ["Email"],
                "recipients" => ["Student"],
                "sample_message" => "Dear {{guest_user_name}}, you have successfully signed up with email {{email}}. Access your courses at {{url}}.",
            ],
            [
                "event_name" => "Online Course Purchase For Guest User",
                "is_active" => true,
                "destinations" => ["Email", "SMS"],
                "recipients" => ["Student"],
                "sample_message" => "Thank you for purchasing {{title}}. Discount: {{discount}}, Amount: {{price}}, Purchase Date: {{purchase_date}}.",
            ],
            [
                "event_name" => "Online Course Purchase",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "whatsapp_template_id" => "HX81ee1977fb43981e9e9a6ada5cb9a54f",
                "sample_message" => "Thank you for purchasing {{title}} for {{price}} on {{purchase_date}}. Class: {{class}}, Section: {{section}}. Assigned to {{assign_teacher}}.",
            ],
            [
                "event_name" => "Online Course Publish",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Staff"],
                "sample_message" => "A new course {{title}} has been published. Category: {{category}}, Price: {{price}}, Instructor: {{instructor_name}}.",
            ],

            // ── Student Leave ─────────────────────────────────────────────
            [
                "event_name" => "Student Apply Leave",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "WhatsApp"],
                "recipients" => ["Guardian", "Staff"],
                "sample_message" => "{{student_name}} (Class {{class}}, Section {{section}}) has applied for leave on {{apply_date}} from {{from_date}} to {{to_date}}. Reason: {{message}}.",
            ],

            // ── Fee Processing ────────────────────────────────────────────
            [
                "event_name" => "Fee Processing",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Fee payment of {{fee_amount}} received for {{student_name}} ({{class}} - {{section}}). Transaction ID: {{transaction_id}}.",
            ],
            [
                "event_name" => "Fee Submission",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Fee of {{fee_amount}} has been submitted for {{student_name}} ({{admission_no}}). Due Date: {{due_date}}, Paid On: {{paid_date}}. Fee Type: {{fee_type}}.",
            ],
            [
                "event_name" => "Fees Reminder",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Reminder: Fee of {{fee_amount}} is due for {{student_name}} ({{admission_no}}). Due Date: {{due_date}}. Please pay before the due date to avoid late fees.",
            ],

            // ── Login Credentials ─────────────────────────────────────────
            [
                "event_name" => "Staff Login Credential",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "WhatsApp"],
                "recipients" => ["Staff"],
                "sample_message" => "Hello {{first_name}} {{last_name}}, your login details for {{url}} - Username: {{username}}, Password: {{password}}, Employee ID: {{employee_id}}.",
            ],
            [
                "event_name" => "Student Login Credential",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Hello {{display_name}}, your login details for {{url}} - Username: {{username}}, Password: {{password}}, Admission No: {{admission_no}}.",
            ],
            [
                "event_name" => "Forgot Password",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "WhatsApp"],
                "recipients" => ["Student", "Guardian", "Staff"],
                "sample_message" => "Hello {{name}}, a password reset link has been sent to your registered email. Username: {{username}}. If you did not request this, please ignore this message.",
            ],

            // ── Attendance ─────────────────────────────────────────────────
            [
                "event_name" => "Student Present Attendance",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Guardian"],
                "sample_message" => "Dear Guardian, {{student_name}} ({{admission_no}}, Class {{class}} Section {{section}}) is marked PRESENT on {{attendance_date}}. Entry: {{entry_time}}.",
            ],
            [
                "event_name" => "Student Absent Attendance",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Guardian"],
                "sample_message" => "Dear Guardian, {{student_name}} ({{admission_no}}, Class {{class}} Section {{section}}) is marked ABSENT on {{attendance_date}}. Reason: {{reason}}.",
            ],
            [
                "event_name" => "Staff Present Attendance",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App"],
                "recipients" => ["Staff"],
                "sample_message" => "Hello {{staff_name}} ({{employee_id}}), your attendance for {{attendance_date}} has been marked as PRESENT. Entry: {{entry_time}}.",
            ],
            [
                "event_name" => "Staff Absent Attendance",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App"],
                "recipients" => ["Staff"],
                "sample_message" => "Hello {{staff_name}} ({{employee_id}}), your attendance for {{attendance_date}} has been marked as ABSENT. Reason: {{reason}}.",
            ],

            // ── Homework ───────────────────────────────────────────────────
            [
                "event_name" => "Homework Created",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Homework has been assigned for {{subject}} (Class {{class}} Section {{section}}). Homework Date: {{homework_date}}, Submission Date: {{submission_date}}. Description: {{description}}.",
            ],
            [
                "event_name" => "Homework Evaluation",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Your homework for {{subject}} has been evaluated. Evaluation Date: {{evaluation_date}}. Please check the portal for details.",
            ],

            // ── Gmeet ──────────────────────────────────────────────────────
            [
                "event_name" => "Gmeet Live Meeting",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Staff"],
                "sample_message" => "A new Gmeet meeting {{meeting_title}} has been scheduled for {{meeting_date_time}}. Created by: {{created_by}}.",
            ],
            [
                "event_name" => "Gmeet Live Meeting Start",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Staff"],
                "sample_message" => "Gmeet meeting {{meeting_title}} has started. Join now using the meeting link.",
            ],
            [
                "event_name" => "Gmeet Live Classes",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "A new Gmeet live class {{class_title}} has been scheduled for {{class_date_time}}. Class: {{class}}, Section: {{section}}. Teacher: {{teacher_name}}.",
            ],
            [
                "event_name" => "Gmeet Live Classes Start",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Gmeet live class {{class_title}} has started. Join now using the meeting link.",
            ],

            // ── Online Examination ─────────────────────────────────────────
            [
                "event_name" => "Online Examination Publish Exam",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Online exam {{exam_title}} has been published. Duration: {{duration}}, Total Marks: {{total_marks}}, Exam From: {{exam_from}}, Exam To: {{exam_to}}.",
            ],
            [
                "event_name" => "Online Examination Publish Result",
                "is_active" => true,
                "destinations" => ["Email", "SMS", "Mobile App", "WhatsApp"],
                "recipients" => ["Student", "Guardian"],
                "sample_message" => "Result for online exam {{exam_title}} has been published. Please check the portal for your score.",
            ],
        ];

        foreach ($events as $event) {
            NotificationSetting::updateOrCreate(
                ['event_name' => $event['event_name']],
                $event
            );
        }
    }
}
