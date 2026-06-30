"use client";

import api from "./api";

/**
 * Maps dashboard URL paths to their module key + submenu name.
 * Mirrors the sidebar's hardcoded menuItems structure.
 */
const urlModuleMap: Record<string, { moduleKey: string; submenuName: string }> = {
  "/dashboard": { moduleKey: "dashboard", submenuName: "dashboard" },

  // Front Office
  "/dashboard/front-office/admission-enquiry": { moduleKey: "front_office", submenuName: "admission_enquiry" },
  "/dashboard/front-office/visitor-book": { moduleKey: "front_office", submenuName: "visitor_book" },
  "/dashboard/front-office/phone-call-log": { moduleKey: "front_office", submenuName: "phone_call_log" },
  "/dashboard/front-office/postal-dispatch": { moduleKey: "front_office", submenuName: "postal_dispatch" },
  "/dashboard/front-office/postal-receive": { moduleKey: "front_office", submenuName: "postal_receive" },
  "/dashboard/front-office/complain": { moduleKey: "front_office", submenuName: "complain" },
  "/dashboard/front-office/setup-front-office": { moduleKey: "front_office", submenuName: "setup_front_office" },

  // Student Information
  "/dashboard/student-information/student-details": { moduleKey: "student_information", submenuName: "student_details" },
  "/dashboard/student-information/student-admission": { moduleKey: "student_information", submenuName: "student_admission" },
  "/dashboard/student-information/online-admission": { moduleKey: "student_information", submenuName: "online_admission" },
  "/dashboard/student-information/disabled-students": { moduleKey: "student_information", submenuName: "disabled_students" },
  "/dashboard/student-information/multi-class-student": { moduleKey: "student_information", submenuName: "multi_class_student" },
  "/dashboard/student-information/bulk-delete": { moduleKey: "student_information", submenuName: "bulk_delete" },
  "/dashboard/student-information/student-categories": { moduleKey: "student_information", submenuName: "student_categories" },
  "/dashboard/student-information/student-house": { moduleKey: "student_information", submenuName: "student_house" },
  "/dashboard/student-information/disable-reason": { moduleKey: "student_information", submenuName: "disable_reason" },

  // Fees Collection
  "/dashboard/fees-collection/collect-fees": { moduleKey: "fees_collection", submenuName: "collect_fees" },
  "/dashboard/fees-collection/offline-bank-payments": { moduleKey: "fees_collection", submenuName: "offline_bank_payments" },
  "/dashboard/fees-collection/search-fees-payment": { moduleKey: "fees_collection", submenuName: "search_fees_payment" },
  "/dashboard/fees-collection/search-due-fees": { moduleKey: "fees_collection", submenuName: "search_due_fees" },
  "/dashboard/fees-collection/fees-master": { moduleKey: "fees_collection", submenuName: "fees_master" },
  "/dashboard/fees-collection/quick-fees": { moduleKey: "fees_collection", submenuName: "quick_fees" },
  "/dashboard/fees-collection/fees-group": { moduleKey: "fees_collection", submenuName: "fees_group" },
  "/dashboard/fees-collection/fees-type": { moduleKey: "fees_collection", submenuName: "fees_type" },
  "/dashboard/fees-collection/fees-discount": { moduleKey: "fees_collection", submenuName: "fees_discount" },
  "/dashboard/fees-collection/fees-carry-forward": { moduleKey: "fees_collection", submenuName: "fees_carry_forward" },
  "/dashboard/fees-collection/fees-reminder": { moduleKey: "fees_collection", submenuName: "fees_reminder" },

  // Income
  "/dashboard/income/add-income": { moduleKey: "income", submenuName: "add_income" },
  "/dashboard/income/search-income": { moduleKey: "income", submenuName: "search_income" },
  "/dashboard/income/income-head": { moduleKey: "income", submenuName: "income_head" },

  // Expenses
  "/dashboard/expenses/add-expense": { moduleKey: "expenses", submenuName: "add_expense" },
  "/dashboard/expenses/search-expense": { moduleKey: "expenses", submenuName: "search_expense" },
  "/dashboard/expenses/expense-head": { moduleKey: "expenses", submenuName: "expense_head" },

  // Attendance
  "/dashboard/attendance/student-attendance": { moduleKey: "attendance", submenuName: "student_attendance" },
  "/dashboard/attendance/approve-leave": { moduleKey: "attendance", submenuName: "approve_leave" },
  "/dashboard/attendance/attendencereport": { moduleKey: "attendance", submenuName: "attendance_by_date" },
  "/dashboard/attendance/leave-type": { moduleKey: "attendance", submenuName: "leave_type" },

  // Examinations
  "/dashboard/examinations/exam-group": { moduleKey: "examinations", submenuName: "exam_group" },
  "/dashboard/examinations/exam-schedule": { moduleKey: "examinations", submenuName: "exam_schedule" },
  "/dashboard/examinations/exam-result": { moduleKey: "examinations", submenuName: "exam_result" },
  "/dashboard/examinations/design-admit-card": { moduleKey: "examinations", submenuName: "design_admit_card" },
  "/dashboard/examinations/print-admit-card": { moduleKey: "examinations", submenuName: "print_admit_card" },
  "/dashboard/examinations/design-marksheet": { moduleKey: "examinations", submenuName: "design_marksheet" },
  "/dashboard/examinations/print-marksheet": { moduleKey: "examinations", submenuName: "print_marksheet" },
  "/dashboard/examinations/marks-grade": { moduleKey: "examinations", submenuName: "marks_grade" },
  "/dashboard/examinations/marks-division": { moduleKey: "examinations", submenuName: "marks_division" },

  // CBSE Examination
  "/dashboard/cbse-examination/exam": { moduleKey: "cbse_examination", submenuName: "exam" },
  "/dashboard/cbse-examination/exam-schedule": { moduleKey: "cbse_examination", submenuName: "exam_schedule" },
  "/dashboard/cbse-examination/print-marksheet": { moduleKey: "cbse_examination", submenuName: "print_marksheet" },
  "/dashboard/cbse-examination/template": { moduleKey: "cbse_examination", submenuName: "template" },
  "/dashboard/cbse-examination/assign-observation": { moduleKey: "cbse_examination", submenuName: "assign_observation" },
  "/dashboard/cbse-examination/reports": { moduleKey: "cbse_examination", submenuName: "reports" },
  "/dashboard/cbse-examination/setting": { moduleKey: "cbse_examination", submenuName: "setting" },

  // Online Examinations
  "/dashboard/online-examinations/online-exam": { moduleKey: "online_examinations", submenuName: "online_exam" },
  "/dashboard/online-examinations/question-bank": { moduleKey: "online_examinations", submenuName: "question_bank" },

  // Academics
  "/dashboard/academics/class-timetable": { moduleKey: "academics", submenuName: "class_timetable" },
  "/dashboard/academics/teachers-timetable": { moduleKey: "academics", submenuName: "teachers_timetable" },
  "/dashboard/academics/assign-class-teacher": { moduleKey: "academics", submenuName: "assign_class_teacher" },
  "/dashboard/academics/promote-students": { moduleKey: "academics", submenuName: "promote_students" },
  "/dashboard/academics/subject-group": { moduleKey: "academics", submenuName: "subject_group" },
  "/dashboard/academics/subjects": { moduleKey: "academics", submenuName: "subjects" },
  "/dashboard/academics/class": { moduleKey: "academics", submenuName: "class" },
  "/dashboard/academics/sections": { moduleKey: "academics", submenuName: "sections" },

  // Human Resource
  "/dashboard/hr/staff-directory": { moduleKey: "human_resource", submenuName: "staff_directory" },
  "/dashboard/hr/staff-attendance": { moduleKey: "human_resource", submenuName: "staff_attendance" },
  "/dashboard/hr/payroll": { moduleKey: "human_resource", submenuName: "payroll" },
  "/dashboard/hr/approve-leave-request": { moduleKey: "human_resource", submenuName: "approve_leave_request" },
  "/dashboard/hr/apply-leave": { moduleKey: "human_resource", submenuName: "apply_leave" },
  "/dashboard/hr/leave-type": { moduleKey: "human_resource", submenuName: "leave_type" },
  "/dashboard/hr/teachers-rating": { moduleKey: "human_resource", submenuName: "teachers_rating" },
  "/dashboard/hr/department": { moduleKey: "human_resource", submenuName: "department" },
  "/dashboard/hr/designation": { moduleKey: "human_resource", submenuName: "designation" },
  "/dashboard/hr/disabled-staff": { moduleKey: "human_resource", submenuName: "disabled_staff" },

  // Communicate
  "/dashboard/communicate/notice-board": { moduleKey: "communicate", submenuName: "notice_board" },
  "/dashboard/communicate/send-email": { moduleKey: "communicate", submenuName: "send_email" },
  "/dashboard/communicate/send-sms": { moduleKey: "communicate", submenuName: "send_sms" },
  "/dashboard/communicate/send-wa": { moduleKey: "communicate", submenuName: "send_wa" },
  "/dashboard/communicate/email-sms-log": { moduleKey: "communicate", submenuName: "email_sms_log" },
  "/dashboard/communicate/schedule-email-sms-log": { moduleKey: "communicate", submenuName: "schedule_email_sms_log" },
  "/dashboard/communicate/login-credentials-send": { moduleKey: "communicate", submenuName: "login_credentials_send" },
  "/dashboard/communicate/email-template": { moduleKey: "communicate", submenuName: "email_template" },
  "/dashboard/communicate/sms-template": { moduleKey: "communicate", submenuName: "sms_template" },
  "/dashboard/communicate/wa-template": { moduleKey: "communicate", submenuName: "wa_template" },

  // Download Center
  "/dashboard/download-center/upload-content": { moduleKey: "download_center", submenuName: "upload_share_content" },
  "/dashboard/download-center/content-share-list": { moduleKey: "download_center", submenuName: "content_share_list" },
  "/dashboard/download-center/video-tutorial": { moduleKey: "download_center", submenuName: "video_tutorial" },
  "/dashboard/download-center/content-type": { moduleKey: "download_center", submenuName: "content_type" },

  // Homework
  "/dashboard/homework/add-homework": { moduleKey: "homework", submenuName: "add_homework" },
  "/dashboard/homework/daily-assignment": { moduleKey: "homework", submenuName: "daily_assignment" },

  // Online Course
  "/dashboard/online-course/online-course-list": { moduleKey: "online_course", submenuName: "online_course" },
  "/dashboard/online-course/question-bank": { moduleKey: "online_course", submenuName: "question_bank" },
  "/dashboard/online-course/offline-payment": { moduleKey: "online_course", submenuName: "offline_payment" },
  "/dashboard/online-course/reports": { moduleKey: "online_course", submenuName: "online_course_report" },
  "/dashboard/online-course/settings": { moduleKey: "online_course", submenuName: "setting" },

  // Library
  "/dashboard/library/book-list": { moduleKey: "library", submenuName: "book_list" },
  "/dashboard/library/member": { moduleKey: "library", submenuName: "issue_return" },
  "/dashboard/library/add-student": { moduleKey: "library", submenuName: "add_student" },
  "/dashboard/library/add-staff": { moduleKey: "library", submenuName: "add_staff_member" },

  // Inventory
  "/dashboard/inventory/issue-item": { moduleKey: "inventory", submenuName: "issue_item" },
  "/dashboard/inventory/add-item-stock": { moduleKey: "inventory", submenuName: "add_item_stock" },
  "/dashboard/inventory/add-item": { moduleKey: "inventory", submenuName: "add_item" },
  "/dashboard/inventory/item-category": { moduleKey: "inventory", submenuName: "item_category" },
  "/dashboard/inventory/item-store": { moduleKey: "inventory", submenuName: "item_store" },
  "/dashboard/inventory/item-supplier": { moduleKey: "inventory", submenuName: "item_supplier" },

  // Transport
  "/dashboard/transport/fees-master": { moduleKey: "transport", submenuName: "fees_master" },
  "/dashboard/transport/pickup-point": { moduleKey: "transport", submenuName: "pickup_point" },
  "/dashboard/transport/route": { moduleKey: "transport", submenuName: "routes" },
  "/dashboard/transport/vehicles": { moduleKey: "transport", submenuName: "vehicles" },
  "/dashboard/transport/assign-vehicle": { moduleKey: "transport", submenuName: "assign_vehicle" },
  "/dashboard/transport/route-pickup-point": { moduleKey: "transport", submenuName: "route_pickup_point" },
  "/dashboard/transport/student-transport-fees": { moduleKey: "transport", submenuName: "student_transport_fees" },

  // Hostel
  "/dashboard/hostel/hostel-room": { moduleKey: "hostel", submenuName: "hostel_room" },
  "/dashboard/hostel/room-type": { moduleKey: "hostel", submenuName: "room_type" },
  "/dashboard/hostel/hostel": { moduleKey: "hostel", submenuName: "hostel" },

  // Certificate
  "/dashboard/certificate/transfer-certificate": { moduleKey: "certificate", submenuName: "transfer_certificate" },
  "/dashboard/certificate/student-certificate": { moduleKey: "certificate", submenuName: "student_certificate" },
  "/dashboard/certificate/generate-certificate": { moduleKey: "certificate", submenuName: "generate_certificate" },
  "/dashboard/certificate/student-id-card": { moduleKey: "certificate", submenuName: "student_id_card" },
  "/dashboard/certificate/generate-id-card": { moduleKey: "certificate", submenuName: "generate_id_card" },
  "/dashboard/certificate/staff-id-card": { moduleKey: "certificate", submenuName: "staff_id_card" },
  "/dashboard/certificate/generate-staff-id-card": { moduleKey: "certificate", submenuName: "generate_staff_id_card" },

  // Multi Branch
  "/dashboard/multi-branch/overview": { moduleKey: "multi_branch", submenuName: "overview" },
  "/dashboard/multi-branch/report": { moduleKey: "multi_branch", submenuName: "report" },
  "/dashboard/multi-branch/setting": { moduleKey: "multi_branch", submenuName: "setting" },

  // Behaviour Records
  "/dashboard/behaviour-records/assign-incident": { moduleKey: "behaviour_records", submenuName: "assign_incident" },
  "/dashboard/behaviour-records/incidents": { moduleKey: "behaviour_records", submenuName: "incidents" },
  "/dashboard/behaviour-records/reports": { moduleKey: "behaviour_records", submenuName: "reports" },
  "/dashboard/behaviour-records/setting": { moduleKey: "behaviour_records", submenuName: "setting" },

  // Reports
  "/dashboard/reports/student-information": { moduleKey: "reports", submenuName: "student_information" },
  "/dashboard/reports/finance": { moduleKey: "reports", submenuName: "finance" },
  "/dashboard/reports/attendance": { moduleKey: "reports", submenuName: "attendance" },
  "/dashboard/reports/examinations": { moduleKey: "reports", submenuName: "examinations" },
  "/dashboard/reports/online-examinations": { moduleKey: "reports", submenuName: "online_examinations" },
  "/dashboard/reports/lesson-plan": { moduleKey: "reports", submenuName: "lesson_plan" },
  "/dashboard/reports/human-resource": { moduleKey: "reports", submenuName: "human_resource" },
  "/dashboard/reports/homework": { moduleKey: "reports", submenuName: "homework" },
  "/dashboard/reports/library": { moduleKey: "reports", submenuName: "library" },
  "/dashboard/reports/inventory": { moduleKey: "reports", submenuName: "inventory" },
  "/dashboard/reports/transport": { moduleKey: "reports", submenuName: "transport" },
  "/dashboard/reports/hostel": { moduleKey: "reports", submenuName: "hostel" },
  "/dashboard/reports/alumni": { moduleKey: "reports", submenuName: "alumni" },
  "/dashboard/reports/user-log": { moduleKey: "reports", submenuName: "user_log" },
  "/dashboard/reports/audit-trail": { moduleKey: "reports", submenuName: "audit_trail_report" },

  // Gmeet Live Classes
  "/dashboard/gmeet-live-classes/live-classes": { moduleKey: "gmeet_live_classes", submenuName: "live_classes" },
  "/dashboard/gmeet-live-classes/live-meeting": { moduleKey: "gmeet_live_classes", submenuName: "live_meeting" },
  "/dashboard/gmeet-live-classes/live-classes-report": { moduleKey: "gmeet_live_classes", submenuName: "live_classes_report" },
  "/dashboard/gmeet-live-classes/live-meeting-report": { moduleKey: "gmeet_live_classes", submenuName: "live_meeting_report" },
  "/dashboard/gmeet-live-classes/setting": { moduleKey: "gmeet_live_classes", submenuName: "setting" },

  // Zoom Live Classes
  "/dashboard/zoom-live-classes/live-meeting": { moduleKey: "zoom_live_classes", submenuName: "live_meeting" },
  "/dashboard/zoom-live-classes/live-classes": { moduleKey: "zoom_live_classes", submenuName: "live_classes" },
  "/dashboard/zoom-live-classes/live-classes-report": { moduleKey: "zoom_live_classes", submenuName: "live_classes_report" },
  "/dashboard/zoom-live-classes/live-meeting-report": { moduleKey: "zoom_live_classes", submenuName: "live_meeting_report" },
  "/dashboard/zoom-live-classes/setting": { moduleKey: "zoom_live_classes", submenuName: "setting" },

  // Lesson Plan
  "/dashboard/lesson-plan/copy-old-lessons": { moduleKey: "lesson_plan", submenuName: "copy_old_lessons" },
  "/dashboard/lesson-plan/manage-lesson-plan": { moduleKey: "lesson_plan", submenuName: "manage_lesson_plan" },
  "/dashboard/lesson-plan/manage-syllabus-status": { moduleKey: "lesson_plan", submenuName: "manage_syllabus_status" },
  "/dashboard/lesson-plan/lesson": { moduleKey: "lesson_plan", submenuName: "lesson" },
  "/dashboard/lesson-plan/topic": { moduleKey: "lesson_plan", submenuName: "topic" },

  // Student CV
  "/dashboard/student-cv/build-cv": { moduleKey: "student_cv", submenuName: "build_cv" },
  "/dashboard/student-cv/download-cv": { moduleKey: "student_cv", submenuName: "download_cv" },

  // Alumni
  "/dashboard/alumni/manage-alumni": { moduleKey: "alumni", submenuName: "manage_alumni" },
  "/dashboard/alumni/events": { moduleKey: "alumni", submenuName: "events" },

  // Annual Calendar
  "/dashboard/annual-calendar": { moduleKey: "annual_calendar", submenuName: "annual_calendar" },
  "/dashboard/annual-calendar/holiday-type": { moduleKey: "annual_calendar", submenuName: "holiday_type" },

  // Front CMS
  "/dashboard/front-cms/event": { moduleKey: "front_cms", submenuName: "event" },
  "/dashboard/front-cms/gallery": { moduleKey: "front_cms", submenuName: "gallery" },
  "/dashboard/front-cms/news": { moduleKey: "front_cms", submenuName: "news" },
  "/dashboard/front-cms/media-manager": { moduleKey: "front_cms", submenuName: "media_manager" },
  "/dashboard/front-cms/pages": { moduleKey: "front_cms", submenuName: "pages" },
  "/dashboard/front-cms/menus": { moduleKey: "front_cms", submenuName: "menus" },
  "/dashboard/front-cms/banner-images": { moduleKey: "front_cms", submenuName: "banner_images" },

  // QR Code Attendance
  "/dashboard/qr-code-attendance/attendance": { moduleKey: "qr_code_attendance", submenuName: "attendance" },
  "/dashboard/smart-attendance-terminal": { moduleKey: "qr_code_attendance", submenuName: "terminal" },
  "/dashboard/qr-code-attendance/face-registration": { moduleKey: "qr_code_attendance", submenuName: "face_registration" },
  "/dashboard/qr-code-attendance/qr-code-generation": { moduleKey: "qr_code_attendance", submenuName: "qr_code_generation" },
  "/dashboard/qr-code-attendance/nfc-assignment": { moduleKey: "qr_code_attendance", submenuName: "nfc_assignment" },
  "/dashboard/qr-code-attendance/setting": { moduleKey: "qr_code_attendance", submenuName: "setting" },
  "/dashboard/qr-code-attendance/smart-attendance-settings": { moduleKey: "qr_code_attendance", submenuName: "smart_attendance_settings" },

  // System Setting
  "/dashboard/system-setting/general-setting": { moduleKey: "system_setting", submenuName: "general_setting" },
  "/dashboard/system-setting/session-setting": { moduleKey: "system_setting", submenuName: "session_setting" },
  "/dashboard/system-setting/notification-setting": { moduleKey: "system_setting", submenuName: "notification_setting" },
  "/dashboard/system-setting/whatsapp-messaging": { moduleKey: "system_setting", submenuName: "whatsapp_messaging" },
  "/dashboard/system-setting/sms-setting": { moduleKey: "system_setting", submenuName: "sms_setting" },
  "/dashboard/system-setting/email-setting": { moduleKey: "system_setting", submenuName: "email_setting" },
  "/dashboard/system-setting/payment-methods": { moduleKey: "system_setting", submenuName: "payment_methods" },
  "/dashboard/system-setting/print-header-footer": { moduleKey: "system_setting", submenuName: "print_header_footer" },
  "/dashboard/system-setting/thermal-print": { moduleKey: "system_setting", submenuName: "thermal_print" },
  "/dashboard/system-setting/front-cms-setting": { moduleKey: "system_setting", submenuName: "front_cms_setting" },
  "/dashboard/system-setting/backup-restore": { moduleKey: "system_setting", submenuName: "backup_restore" },
  "/dashboard/system-setting/currency": { moduleKey: "system_setting", submenuName: "currency" },
  "/dashboard/system-setting/users": { moduleKey: "system_setting", submenuName: "users" },
  "/dashboard/system-setting/roles-permissions": { moduleKey: "system_setting", submenuName: "roles_permissions" },
  "/dashboard/system-setting/languages": { moduleKey: "system_setting", submenuName: "languages" },
  "/dashboard/system-setting/addons": { moduleKey: "system_setting", submenuName: "addons" },
  "/dashboard/system-setting/custom-fields": { moduleKey: "system_setting", submenuName: "custom_fields" },
  "/dashboard/system-setting/captcha-setting": { moduleKey: "system_setting", submenuName: "captcha_setting" },
  "/dashboard/system-setting/system-fields": { moduleKey: "system_setting", submenuName: "system_fields" },
  "/dashboard/system-setting/student-profile-setting": { moduleKey: "system_setting", submenuName: "student_profile_setting" },
  "/dashboard/system-setting/online-admission": { moduleKey: "system_setting", submenuName: "online_admission" },
  "/dashboard/system-setting/file-types": { moduleKey: "system_setting", submenuName: "file_types" },
  "/dashboard/system-setting/sidebar-menu": { moduleKey: "system_setting", submenuName: "sidebar_menu" },
  "/dashboard/system-setting/system-update": { moduleKey: "system_setting", submenuName: "system_update" },
};

/** Maps each module key to its permission module names */
const modulePermissionMap: Record<string, string[]> = {
  front_office: ["Front Office"],
  student_information: ["Student Information", "Multi Class", "Online Admission"],
  fees_collection: ["Fees Collection", "Quick Fees"],
  income: ["Income"],
  expenses: ["Expense"],
  attendance: ["Student Attendance"],
  examinations: ["Examination"],
  cbse_examination: ["CBSE Examination"],
  online_examinations: ["Online Examination"],
  academics: ["Academics"],
  human_resource: ["Human Resource"],
  communicate: ["Communicate", "Whatsapp Messaging"],
  download_center: ["Download Center"],
  homework: ["Homework"],
  online_course: ["Online Course"],
  library: ["Library"],
  inventory: ["Inventory"],
  transport: ["Transport"],
  hostel: ["Hostel"],
  certificate: ["Certificate"],
  multi_branch: ["Multi Branch"],
  behaviour_records: ["Behaviour Records"],
  reports: ["Reports"],
  gmeet_live_classes: ["Gmeet Live Classes"],
  zoom_live_classes: ["Zoom Live Classes"],
  lesson_plan: ["Lesson Plan"],
  student_cv: ["Student CV"],
  alumni: ["Alumni"],
  annual_calendar: ["Annual Calendar"],
  front_cms: ["Front CMS"],
  qr_code_attendance: ["QR Code Attendance"],
  system_setting: ["System Settings", "Thermal Print"],
};

/** Maps module+submenu to feature label overrides (same as roles-permissions page) */
const submenuFeatureOverride: Record<string, Record<string, string[]>> = {
  student_information: {
    student_details: ["Student"],
    disabled_students: ["Disable Student"],
    student_house: ["Student Houses"],
  },
  income: { add_income: ["Income"] },
  expenses: { add_expense: ["Expense"] },
  attendance: { student_attendance: ["Student / Period Attendance"] },
  cbse_examination: {
    exam: ["CBSE Exam"],
    exam_schedule: ["CBSE Exam Schedule"],
    print_marksheet: ["CBSE Exam Print Marksheet"],
    template: ["CBSE Exam Template"],
    assign_observation: ["CBSE Exam Assign Observation"],
    reports: ["CBSE Exam Subject Marks Report"],
    setting: ["CBSE Exam Setting"],
  },
  online_examinations: { online_exam: ["Online Examination"] },
  academics: {
    promote_students: ["Promote Student"],
    subjects: ["Subject"],
    sections: ["Section"],
  },
  human_resource: {
    staff_directory: ["Staff"],
    payroll: ["Staff Payroll"],
    leave_type: ["Leave Types"],
    disabled_staff: ["Disable Staff"],
  },
  communicate: {
    send_email: ["Email"],
    send_sms: ["SMS"],
    send_wa: ["Whatsapp Messaging"],
    email_sms_log: ["Email / SMS Log"],
  },
  download_center: { upload_share_content: ["Upload Content"] },
  homework: { add_homework: ["Homework"] },
  online_course: {
    online_course_report: ["Student Course Purchase Report"],
  },
  library: { book_list: ["Books List"] },
  transport: { vehicles: ["Vehicle"] },
  hostel: { hostel_room: ["Hostel Rooms"] },
  certificate: {
    transfer_certificate: ["Download Transfer Certificate"],
  },
  multi_branch: {
    report: ["Daily Collection Report"],
  },
  behaviour_records: {
    assign_incident: ["Behaviour Records Assign Incident"],
    incidents: ["Behaviour Records Incident"],
    reports: ["Student Incident Report"],
    setting: ["Behaviour Records Setting"],
  },
  reports: {
    student_information: ["Student Report"],
    finance: ["Fees Statement"],
    attendance: ["Attendance Report"],
    examinations: ["Online Exam Wise Report"],
    online_examinations: ["Online Exam Wise Report"],
    lesson_plan: ["Syllabus Status Report"],
    human_resource: ["Staff Report"],
    homework: ["Homework Evaluation Report"],
    library: ["Book Issue Report"],
    inventory: ["Stock Report"],
    transport: ["Transport Report"],
    hostel: ["Hostel Report"],
    alumni: ["Alumni Report"],
  },
  qr_code_attendance: {},
  system_setting: {
    backup_restore: ["Backup"],
    users: ["User Status"],
    roles_permissions: [],
    addons: [],
    captcha_setting: [],
    student_profile_setting: ["Student Profile Update"],
    file_types: [],
    system_update: [],
  },
};

/** Gets feature labels for a submenu name under a module key */
function getSubmenuFeatureLabels(moduleKey: string, submenuName: string): string[] {
  const override = submenuFeatureOverride[moduleKey]?.[submenuName];
  if (override !== undefined) return override;
  return [
    submenuName
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  ];
}

/** Builds all permission prefixes that would grant access to a given page */
function buildPermissionPrefixes(moduleKey: string, submenuName: string): string[] {
  const permModuleNames = modulePermissionMap[moduleKey] || [];
  const featureLabels = getSubmenuFeatureLabels(moduleKey, submenuName);
  if (featureLabels.length === 0) return [];

  const prefixes: string[] = [];
  for (const permModule of permModuleNames) {
    for (const label of featureLabels) {
      const slug = permModule.toLowerCase().replace(/\s+/g, ".") + "." + label.toLowerCase().replace(/\s+/g, ".") + ".";
      prefixes.push(slug);
    }
  }
  return prefixes;
}

/** Converts a permission name to a prefix (e.g., "student-information.student.view" → "student-information.student.") */
function permNameToPrefix(name: string): string {
  const parts = name.split(".");
  if (parts.length < 2) return name;
  parts.pop();
  return parts.join(".") + ".";
}

/**
 * Checks if the user has access to a given dashboard page.
 * @param pathname - The current URL pathname (e.g., "/dashboard/fees-collection/collect-fees")
 * @param userPermissions - Array of permission name strings from the user profile
 * @returns true if the user has access
 */
export function checkPageAccess(pathname: string, userPermissions: string[]): boolean {
  // Super Admin has access to everything
  if (userPermissions.includes("all")) return true;
  if (userPermissions.length === 0) return false;

  // Dashboard home is always accessible
  if (pathname === "/dashboard") return true;

  // Remove trailing slash
  const cleanPath = pathname.replace(/\/$/, "");

  const pageInfo = urlModuleMap[cleanPath];
  if (!pageInfo) return true;

  const prefixes = buildPermissionPrefixes(pageInfo.moduleKey, pageInfo.submenuName);
  if (prefixes.length === 0) return false;

  // Build a set of user permission prefixes for fast lookup
  const userPrefixes = new Set(userPermissions.map(permNameToPrefix));

  return prefixes.some((p) => userPrefixes.has(p));
}

/**
 * Fetches the current user's permissions from /profile.
 */
export async function fetchUserPermissions(): Promise<string[]> {
  try {
    const res = await api.get("/profile");
    return res.data.data?.permissions || [];
  } catch {
    return [];
  }
}
