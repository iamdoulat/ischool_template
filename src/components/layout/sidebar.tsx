"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Building2,
    Users,
    Wallet,
    GraduationCap,
    Calendar,
    Settings,
    FileText,
    UserPlus,
    LayoutDashboard,
    ChevronRight,
    BookOpen,
    ClipboardList,
    Bus,
    Home,
    ShieldCheck,
    Video,
    PenSquare,
    Library,
    Package,
    FileUser,
    Hotel,
    Award,
    Globe,
    UserCheck,
    Monitor,
    DollarSign,
    CreditCard,
    Rss,
    GitBranch,
    CalendarDays,
    BookMarked,
    MessageSquare,
    Download,
    X,
    QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";
import { ThemeToggle } from "./theme-toggle";

const menuItems = [
    {
        group: "main", items: [
            { name: "dashboard", icon: LayoutDashboard, href: "/dashboard", submenus: [], color: "amber" }
        ]
    },
    {
        group: "modules", items: [
            {
                name: "front_office",
                icon: Building2,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "admission_enquiry", href: "/dashboard/front-office/admission-enquiry" },
                    { name: "visitor_book", href: "/dashboard/front-office/visitor-book" },
                    { name: "phone_call_log", href: "/dashboard/front-office/phone-call-log" },
                    { name: "postal_dispatch", href: "/dashboard/front-office/postal-dispatch" },
                    { name: "postal_receive", href: "/dashboard/front-office/postal-receive" },
                    { name: "complain", href: "/dashboard/front-office/complain" },
                    { name: "setup_front_office", href: "/dashboard/front-office/setup-front-office" },
                ]
            },
            {
                name: "student_information",
                icon: Users,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "student_details", href: "/dashboard/student-information/student-details" },
                    { name: "student_admission", href: "/dashboard/student-information/student-admission" },
                    { name: "online_admission", href: "/dashboard/student-information/online-admission" },
                    { name: "disabled_students", href: "/dashboard/student-information/disabled-students" },
                    { name: "multi_class_student", href: "/dashboard/student-information/multi-class-student" },
                    { name: "bulk_delete", href: "/dashboard/student-information/bulk-delete" },
                    { name: "student_categories", href: "/dashboard/student-information/student-categories" },
                    { name: "student_house", href: "/dashboard/student-information/student-house" },
                    { name: "disable_reason", href: "/dashboard/student-information/disable-reason" },
                ]
            },
            {
                name: "fees_collection",
                icon: Wallet,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "collect_fees", href: "/dashboard/fees-collection/collect-fees" },
                    { name: "offline_bank_payments", href: "/dashboard/fees-collection/offline-bank-payments" },
                    { name: "search_fees_payment", href: "/dashboard/fees-collection/search-fees-payment" },
                    { name: "search_due_fees", href: "/dashboard/fees-collection/search-due-fees" },
                    { name: "fees_master", href: "/dashboard/fees-collection/fees-master" },
                    { name: "quick_fees", href: "/dashboard/fees-collection/quick-fees" },
                    { name: "fees_group", href: "/dashboard/fees-collection/fees-group" },
                    { name: "fees_type", href: "/dashboard/fees-collection/fees-type" },
                    { name: "fees_discount", href: "/dashboard/fees-collection/fees-discount" },
                    { name: "fees_carry_forward", href: "/dashboard/fees-collection/fees-carry-forward" },
                    { name: "fees_reminder", href: "/dashboard/fees-collection/fees-reminder" },
                ]
            },
            {
                name: "income",
                icon: DollarSign,
                href: "#",
                color: "cyan",
                submenus: [
                    { name: "add_income", href: "/dashboard/income/add-income" },
                    { name: "search_income", href: "/dashboard/income/search-income" },
                    { name: "income_head", href: "/dashboard/income/income-head" },
                ]
            },
            {
                name: "expenses",
                icon: CreditCard,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "add_expense", href: "/dashboard/expenses/add-expense" },
                    { name: "search_expense", href: "/dashboard/expenses/search-expense" },
                    { name: "expense_head", href: "/dashboard/expenses/expense-head" },
                ]
            },
            {
                name: "attendance",
                icon: Calendar,
                href: "#",
                color: "orange",
                submenus: [
                    { name: "student_attendance", href: "/dashboard/attendance/student-attendance" },
                    { name: "period_attendance", href: "/dashboard/attendance/period-attendance" },
                    { name: "approve_leave", href: "/dashboard/attendance/approve-leave" },
                    { name: "attendance_by_date", href: "/dashboard/attendance/attendencereport" },
                ]
            },
            {
                name: "examinations",
                icon: PenSquare,
                href: "#",
                color: "purple",
                submenus: [
                    { name: "exam_group", href: "/dashboard/examinations/exam-group" },
                    { name: "exam_schedule", href: "/dashboard/examinations/exam-schedule" },
                    { name: "exam_result", href: "/dashboard/examinations/exam-result" },
                    { name: "design_admit_card", href: "/dashboard/examinations/design-admit-card" },
                    { name: "print_admit_card", href: "/dashboard/examinations/print-admit-card" },
                    { name: "design_marksheet", href: "/dashboard/examinations/design-marksheet" },
                    { name: "print_marksheet", href: "/dashboard/examinations/print-marksheet" },
                    { name: "marks_grade", href: "/dashboard/examinations/marks-grade" },
                    { name: "marks_division", href: "/dashboard/examinations/marks-division" },
                ]
            },
            {
                name: "cbse_examination",
                icon: FileText,
                href: "#",
                color: "violet",
                submenus: [
                    { name: "exam", href: "/dashboard/cbse-examination/exam" },
                    { name: "exam_schedule", href: "/dashboard/cbse-examination/exam-schedule" },
                    { name: "print_marksheet", href: "/dashboard/cbse-examination/print-marksheet" },
                    { name: "template", href: "/dashboard/cbse-examination/template" },
                    { name: "assign_observation", href: "/dashboard/cbse-examination/assign-observation" },
                    { name: "reports", href: "/dashboard/cbse-examination/reports" },
                    { name: "setting", href: "/dashboard/cbse-examination/setting" },
                ]
            },
            {
                name: "online_examinations",
                icon: Rss,
                href: "#",
                color: "fuchsia",
                submenus: [
                    { name: "online_exam", href: "/dashboard/online-examinations/online-exam" },
                    { name: "question_bank", href: "/dashboard/online-examinations/question-bank" },
                ]
            },
            {
                name: "academics",
                icon: GraduationCap,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "class_timetable", href: "/dashboard/academics/class-timetable" },
                    { name: "teachers_timetable", href: "/dashboard/academics/teachers-timetable" },
                    { name: "assign_class_teacher", href: "/dashboard/academics/assign-class-teacher" },
                    { name: "promote_students", href: "/dashboard/academics/promote-students" },
                    { name: "subject_group", href: "/dashboard/academics/subject-group" },
                    { name: "subjects", href: "/dashboard/academics/subjects" },
                    { name: "class", href: "/dashboard/academics/class" },
                    { name: "sections", href: "/dashboard/academics/sections" },
                ]
            },
            {
                name: "human_resource",
                icon: UserPlus,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "staff_directory", href: "/dashboard/hr/staff-directory" },
                    { name: "staff_attendance", href: "/dashboard/hr/staff-attendance" },
                    { name: "payroll", href: "/dashboard/hr/payroll" },
                    { name: "approve_leave_request", href: "/dashboard/hr/approve-leave-request" },
                    { name: "apply_leave", href: "/dashboard/hr/apply-leave" },
                    { name: "leave_type", href: "/dashboard/hr/leave-type" },
                    { name: "teachers_rating", href: "/dashboard/hr/teachers-rating" },
                    { name: "department", href: "/dashboard/hr/department" },
                    { name: "designation", href: "/dashboard/hr/designation" },
                    { name: "disabled_staff", href: "/dashboard/hr/disabled-staff" },
                ]
            },
            {
                name: "communicate",
                icon: MessageSquare,
                href: "#",
                color: "sky",
                submenus: [
                    { name: "notice_board", href: "/dashboard/communicate/notice-board" },
                    { name: "send_email", href: "/dashboard/communicate/send-email" },
                    { name: "send_sms", href: "/dashboard/communicate/send-sms" },
                    { name: "email_sms_log", href: "/dashboard/communicate/email-sms-log" },
                    { name: "schedule_email_sms_log", href: "/dashboard/communicate/schedule-email-sms-log" },
                    { name: "login_credentials_send", href: "/dashboard/communicate/login-credentials-send" },
                    { name: "email_template", href: "/dashboard/communicate/email-template" },
                    { name: "sms_template", href: "/dashboard/communicate/sms-template" },
                ]
            },
            {
                name: "download_center",
                icon: Download,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "upload_share_content", href: "/dashboard/download-center/upload-content" },
                    { name: "content_share_list", href: "/dashboard/download-center/content-share-list" },
                    { name: "video_tutorial", href: "/dashboard/download-center/video-tutorial" },
                    { name: "content_type", href: "/dashboard/download-center/content-type" },
                ]
            },
            {
                name: "homework",
                icon: BookOpen,
                href: "#",
                color: "amber",
                submenus: [
                    { name: "add_homework", href: "/dashboard/homework/add-homework" },
                    { name: "daily_assignment", href: "/dashboard/homework/daily-assignment" },
                ]
            },
            {
                name: "online_course",
                icon: Monitor,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "online_course", href: "/dashboard/online-course/online-course-list" },
                    { name: "question_bank", href: "/dashboard/online-course/question-bank" },
                    { name: "offline_payment", href: "/dashboard/online-course/offline-payment" },
                    { name: "online_course_report", href: "/dashboard/online-course/reports" },
                    { name: "setting", href: "/dashboard/online-course/settings" },
                ]
            },
            {
                name: "library",
                icon: Library,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "book_list", href: "/dashboard/library/book-list" },
                    { name: "issue_return", href: "/dashboard/library/member" },
                    { name: "add_student", href: "/dashboard/library/add-student" },
                    { name: "add_staff_member", href: "/dashboard/library/add-staff" },
                ]
            },
            {
                name: "inventory",
                icon: Package,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "issue_item", href: "/dashboard/inventory/issue-item" },
                    { name: "add_item_stock", href: "/dashboard/inventory/add-item-stock" },
                    { name: "add_item", href: "/dashboard/inventory/add-item" },
                    { name: "item_category", href: "/dashboard/inventory/item-category" },
                    { name: "item_store", href: "/dashboard/inventory/item-store" },
                    { name: "item_supplier", href: "/dashboard/inventory/item-supplier" },
                ]
            },
            {
                name: "transport",
                icon: Bus,
                href: "#",
                color: "amber",
                submenus: [
                    { name: "fees_master", href: "/dashboard/transport/fees-master" },
                    { name: "pickup_point", href: "/dashboard/transport/pickup-point" },
                    { name: "routes", href: "/dashboard/transport/route" },
                    { name: "vehicles", href: "/dashboard/transport/vehicles" },
                    { name: "assign_vehicle", href: "/dashboard/transport/assign-vehicle" },
                    { name: "route_pickup_point", href: "/dashboard/transport/route-pickup-point" },
                    { name: "student_transport_fees", href: "/dashboard/transport/student-transport-fees" },
                ]
            },
            {
                name: "hostel",
                icon: Hotel,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "hostel_room", href: "/dashboard/hostel/hostel-room" },
                    { name: "room_type", href: "/dashboard/hostel/room-type" },
                    { name: "hostel", href: "/dashboard/hostel/hostel" },
                ]
            },
            {
                name: "certificate",
                icon: Award,
                href: "#",
                color: "amber",
                submenus: [
                    { name: "transfer_certificate", href: "/dashboard/certificate/transfer-certificate" },
                    { name: "student_certificate", href: "/dashboard/certificate/student-certificate" },
                    { name: "generate_certificate", href: "/dashboard/certificate/generate-certificate" },
                    { name: "student_id_card", href: "/dashboard/certificate/student-id-card" },
                    { name: "generate_id_card", href: "/dashboard/certificate/generate-id-card" },
                    { name: "staff_id_card", href: "/dashboard/certificate/staff-id-card" },
                    { name: "generate_staff_id_card", href: "/dashboard/certificate/generate-staff-id-card" },
                ]
            },
            {
                name: "multi_branch",
                icon: GitBranch,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "overview", href: "/dashboard/multi-branch/overview" },
                    { name: "report", href: "/dashboard/multi-branch/report" },
                    { name: "setting", href: "/dashboard/multi-branch/setting" },
                ]
            },
            {
                name: "behaviour_records",
                icon: ClipboardList,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "assign_incident", href: "/dashboard/behaviour-records/assign-incident" },
                    { name: "incidents", href: "/dashboard/behaviour-records/incidents" },
                    { name: "reports", href: "/dashboard/behaviour-records/reports" },
                    { name: "setting", href: "/dashboard/behaviour-records/setting" },
                ]
            },
            {
                name: "reports",
                icon: BarChart3,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "student_information", href: "/dashboard/reports/student-information" },
                    { name: "finance", href: "/dashboard/reports/finance" },
                    { name: "attendance", href: "/dashboard/reports/attendance" },
                    { name: "examinations", href: "/dashboard/reports/examinations" },
                    { name: "online_examinations", href: "/dashboard/reports/online-examinations" },
                    { name: "lesson_plan", href: "/dashboard/reports/lesson-plan" },
                    { name: "human_resource", href: "/dashboard/reports/human-resource" },
                    { name: "homework", href: "/dashboard/reports/homework" },
                    { name: "library", href: "/dashboard/reports/library" },
                    { name: "inventory", href: "/dashboard/reports/inventory" },
                    { name: "transport", href: "/dashboard/reports/transport" },
                    { name: "hostel", href: "/dashboard/reports/hostel" },
                    { name: "alumni", href: "/dashboard/reports/alumni" },
                    { name: "user_log", href: "/dashboard/reports/user-log" },
                    { name: "audit_trail_report", href: "/dashboard/reports/audit-trail" },
                ]
            },
            {
                name: "gmeet_live_classes",
                icon: Video,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "live_classes", href: "/dashboard/gmeet-live-classes/live-classes" },
                    { name: "live_meeting", href: "/dashboard/gmeet-live-classes/live-meeting" },
                    { name: "live_classes_report", href: "/dashboard/gmeet-live-classes/live-classes-report" },
                    { name: "live_meeting_report", href: "/dashboard/gmeet-live-classes/live-meeting-report" },
                    { name: "setting", href: "/dashboard/gmeet-live-classes/setting" },
                ]
            },
            {
                name: "zoom_live_classes",
                icon: Video,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "live_meeting", href: "/dashboard/zoom-live-classes/live-meeting" },
                    { name: "live_classes", href: "/dashboard/zoom-live-classes/live-classes" },
                    { name: "live_classes_report", href: "/dashboard/zoom-live-classes/live-classes-report" },
                    { name: "live_meeting_report", href: "/dashboard/zoom-live-classes/live-meeting-report" },
                    { name: "setting", href: "/dashboard/zoom-live-classes/setting" },
                ]
            },
            {
                name: "lesson_plan",
                icon: BookMarked,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "copy_old_lessons", href: "/dashboard/lesson-plan/copy-old-lessons" },
                    { name: "manage_lesson_plan", href: "/dashboard/lesson-plan/manage-lesson-plan" },
                    { name: "manage_syllabus_status", href: "/dashboard/lesson-plan/manage-syllabus-status" },
                    { name: "lesson", href: "/dashboard/lesson-plan/lesson" },
                    { name: "topic", href: "/dashboard/lesson-plan/topic" },
                ]
            },
            {
                name: "student_cv",
                icon: FileUser,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "build_cv", href: "/dashboard/student-cv/build-cv" },
                    { name: "download_cv", href: "/dashboard/student-cv/download-cv" },
                ]
            },
            {
                name: "alumni",
                icon: UserCheck,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "manage_alumni", href: "/dashboard/alumni/manage-alumni" },
                    { name: "events", href: "/dashboard/alumni/events" },
                ]
            },
            {
                name: "annual_calendar",
                icon: CalendarDays,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "annual_calendar", href: "/dashboard/annual-calendar" },
                    { name: "holiday_type", href: "/dashboard/annual-calendar/holiday-type" },
                ]
            },
            {
                name: "front_cms",
                icon: Globe,
                href: "#",
                color: "cyan",
                submenus: [
                    { name: "event", href: "/dashboard/front-cms/event" },
                    { name: "gallery", href: "/dashboard/front-cms/gallery" },
                    { name: "news", href: "/dashboard/front-cms/news" },
                    { name: "media_manager", href: "/dashboard/front-cms/media-manager" },
                    { name: "pages", href: "/dashboard/front-cms/pages" },
                    { name: "menus", href: "/dashboard/front-cms/menus" },
                    { name: "banner_images", href: "/dashboard/front-cms/banner-images" },
                ]
            },
            {
                name: "qr_code_attendance",
                icon: QrCode,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "attendance", href: "/dashboard/qr-code-attendance/attendance" },
                    { name: "setting", href: "/dashboard/qr-code-attendance/setting" },
                ]
            },
            {
                name: "system_setting",
                icon: Settings,
                href: "#",
                color: "gray",
                submenus: [
                    { name: "general_setting", href: "/dashboard/system-setting/general-setting" },
                    { name: "session_setting", href: "/dashboard/system-setting/session-setting" },
                    { name: "notification_setting", href: "/dashboard/system-setting/notification-setting" },
                    { name: "whatsapp_messaging", href: "/dashboard/system-setting/whatsapp-messaging" },
                    { name: "sms_setting", href: "/dashboard/system-setting/sms-setting" },
                    { name: "email_setting", href: "/dashboard/system-setting/email-setting" },
                    { name: "payment_methods", href: "/dashboard/system-setting/payment-methods" },
                    { name: "print_header_footer", href: "/dashboard/system-setting/print-header-footer" },
                    { name: "thermal_print", href: "/dashboard/system-setting/thermal-print" },
                    { name: "front_cms_setting", href: "/dashboard/system-setting/front-cms-setting" },
                    { name: "backup_restore", href: "/dashboard/system-setting/backup-restore" },
                    { name: "currency", href: "/dashboard/system-setting/currency" },
                    { name: "users", href: "/dashboard/system-setting/users" },
                    { name: "roles_permissions", href: "/dashboard/system-setting/roles-permissions" },
                    { name: "languages", href: "/dashboard/system-setting/languages" },
                    { name: "addons", href: "/dashboard/system-setting/addons" },
                    { name: "modules", href: "/dashboard/system-setting/modules" },
                    { name: "custom_fields", href: "/dashboard/system-setting/custom-fields" },
                    { name: "captcha_setting", href: "/dashboard/system-setting/captcha-setting" },
                    { name: "system_fields", href: "/dashboard/system-setting/system-fields" },
                    { name: "student_profile_setting", href: "/dashboard/system-setting/student-profile-setting" },
                    { name: "online_admission", href: "/dashboard/system-setting/online-admission" },
                    { name: "file_types", href: "/dashboard/system-setting/file-types" },
                    { name: "sidebar_menu", href: "/dashboard/system-setting/sidebar-menu" },
                    { name: "system_update", href: "/dashboard/system-setting/system-update" },
                ]
            },
        ]
    }
];

const sidebarColorMap = {
    amber: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-[#ff6b00]",
        bg: "bg-orange-50 dark:bg-orange-900/10",
        border: "border-orange-100 dark:border-orange-900/20"
    },
    blue: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/10",
        border: "border-blue-100 dark:border-blue-900/20"
    },
    emerald: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-900/10",
        border: "border-emerald-100 dark:border-emerald-900/20"
    },
    indigo: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-indigo-500",
        bg: "bg-indigo-50 dark:bg-indigo-900/10",
        border: "border-indigo-100 dark:border-indigo-900/20"
    },
    rose: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-900/10",
        border: "border-rose-100 dark:border-rose-900/20"
    },
    cyan: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-cyan-500",
        bg: "bg-cyan-50 dark:bg-cyan-900/10",
        border: "border-cyan-100 dark:border-cyan-900/20"
    },
    orange: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/10",
        border: "border-orange-100 dark:border-orange-900/20"
    },
    purple: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-purple-500",
        bg: "bg-purple-50 dark:bg-purple-900/10",
        border: "border-purple-100 dark:border-purple-900/20"
    },
    violet: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-900/10",
        border: "border-violet-100 dark:border-violet-900/20"
    },
    fuchsia: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-fuchsia-500",
        bg: "bg-fuchsia-50 dark:bg-fuchsia-900/10",
        border: "border-fuchsia-100 dark:border-fuchsia-900/20"
    },
    sky: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-sky-500",
        bg: "bg-sky-50 dark:bg-sky-900/10",
        border: "border-sky-100 dark:border-sky-900/20"
    },
    gray: {
        active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40",
        icon: "text-gray-500",
        bg: "bg-gray-50 dark:bg-gray-900/10",
        border: "border-gray-100 dark:border-gray-900/20"
    }
};

import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export function Sidebar({
    collapsed = false,
    mobileOpen = false,
    onClose
}: {
    collapsed?: boolean;
    mobileOpen?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const { settings, loading: settingsLoading } = useSettings();
    const { t } = useTranslation();

    const [mounted, setMounted] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [fetchingSessions, setFetchingSessions] = useState(false);
    const [changingSessionId, setChangingSessionId] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [sidebarConfig, setSidebarConfig] = useState<any[]>([]);
    const [fetchingSidebar, setFetchingSidebar] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setFetchingSessions(true);
                const response = await api.get("/system-setting/sessions");
                if (response.data.success) {
                    setSessions(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch sessions", error);
            } finally {
                setFetchingSessions(false);
            }
        };

        const fetchSidebarConfig = async () => {
            try {
                setFetchingSidebar(true);
                const response = await api.get("/system-setting/sidebar-menu");
                if (response.data.success) {
                    setSidebarConfig(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch sidebar config", error);
            } finally {
                setFetchingSidebar(false);
            }
        };

        fetchSessions();
        fetchSidebarConfig();
    }, []);

    // Process menu items based on backend config
    const processedMenuItems = React.useMemo(() => {
        if (fetchingSidebar || sidebarConfig.length === 0) {
            return menuItems; // Fallback during loading or if empty
        }

        // Create a map for quick lookup
        const configMap = new Map(sidebarConfig.map(c => [c.name, c]));

        return menuItems.map(group => {
            const filteredItems = group.items
                .filter(item => {
                    const config = configMap.get(item.name);
                    return config ? config.is_visible : true; // Default to visible if not found (unexpected)
                })
                .sort((a, b) => {
                    const configA = configMap.get(a.name);
                    const configB = configMap.get(b.name);
                    return (configA?.sort_order ?? 0) - (configB?.sort_order ?? 0);
                });

            return { ...group, items: filteredItems };
        }).filter(group => group.items.length > 0);
    }, [sidebarConfig, fetchingSidebar]);

    const activeSession = sessions.find(s => s.is_active);

    const handleSessionChange = async (session: any) => {
        if (session.is_active) return;
        try {
            setChangingSessionId(session.id);
            await api.put(`/system-setting/sessions/${session.id}`, {
                session: session.session,
                is_active: true
            });
            window.location.reload();
        } catch (error) {
            console.error("Failed to switch session", error);
            setChangingSessionId(null);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
                    mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside className={cn(
                "fixed md:relative inset-y-0 left-0 z-50 md:z-0 flex flex-col border-r bg-card text-card-foreground transition-all duration-300 shadow-2xl md:shadow-none h-[100dvh] md:h-screen overflow-hidden overscroll-contain",
                collapsed ? "md:w-20" : "md:w-[230px] w-[230px]",
                mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="h-14 min-h-[56px] flex items-center justify-between md:justify-center bg-gradient-to-r from-primary to-primary/80 text-white shadow-md z-10 px-4">
                    <div className="flex items-center gap-2">
                        {collapsed && !mobileOpen ? (
                            <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/10 shadow-sm overflow-hidden flex items-center justify-center h-9 w-9">
                                {settings?.admin_small_logo ? (
                                    <img src={settings.admin_small_logo} alt="S" className="h-5 w-5 object-contain" />
                                ) : (
                                    <GraduationCap className="h-6 w-6 text-white" />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/10 shadow-sm overflow-hidden flex items-center justify-center">
                                    {settings?.admin_small_logo ? (
                                        <img src={settings.admin_small_logo} alt="S" className="h-5 w-5 object-contain" />
                                    ) : (
                                        <GraduationCap className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    {settingsLoading ? (
                                        <div className="h-5 w-24 bg-white/20 animate-pulse rounded" />
                                    ) : settings?.admin_logo ? (
                                        <img src={settings.admin_logo} alt={settings.school_name} className="h-6 object-contain" />
                                    ) : (
                                        <span className="font-extrabold text-lg tracking-tight uppercase animate-in fade-in slide-in-from-left-4 duration-300">
                                            {settings?.school_name || "Smart School"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-white hover:bg-white/20 transition-all rounded-lg"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <ScrollArea type="always" className="flex-1 min-h-0 w-full p-0 overscroll-contain">
                    <nav className={cn("space-y-6 py-4 pl-2 pr-4", collapsed && "md:px-2")}>
                        {fetchingSidebar ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                            </div>
                        ) : processedMenuItems.map((group) => (
                            <div key={group.group} className="space-y-2">
                                {!collapsed && (
                                    <h3 className="px-2 mb-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                                        {t(group.group)}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const colors = sidebarColorMap[item.color as keyof typeof sidebarColorMap] || sidebarColorMap.blue;
                                        const isItemActive = pathname === item.href || (item.submenus && item.submenus.some(s => pathname === s.href));

                                        const menuItem = (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => {
                                                    if (window.innerWidth < 768 && onClose) onClose();
                                                }}
                                                className={cn(
                                                    "flex items-center justify-start transition-all group relative overflow-hidden",
                                                    collapsed ? "justify-center h-12 w-12 mx-auto rounded-xl" : "gap-3 px-2 py-2.5 rounded-xl",
                                                    isItemActive
                                                        ? `${colors.active} text-white shadow-lg`
                                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                                    !collapsed && "text-sm font-semibold"
                                                )}
                                                title={collapsed ? item.name : undefined}
                                            >
                                                <div className={cn(
                                                    "p-1.5 rounded-lg transition-all duration-300",
                                                    isItemActive ? "bg-white/20 backdrop-blur-sm border border-white/10" : `bg-muted group-hover:scale-110 ${colors.icon}`
                                                )}>
                                                    <item.icon className={cn(
                                                        "h-4 w-4",
                                                        isItemActive ? "text-white" : "transition-colors"
                                                    )} />
                                                </div>
                                                {!collapsed && (
                                                    <>
                                                        <span className="flex-1 text-left">{t(item.name)}</span>
                                                        {item.submenus && item.submenus.length > 0 ? (
                                                            <ChevronRight className={cn(
                                                                "h-3.5 w-3.5 transition-transform duration-300",
                                                                isItemActive ? "rotate-90 text-white" : "group-hover:translate-x-0.5"
                                                            )} />
                                                        ) : (
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full transition-all duration-300 opacity-0 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]",
                                                                isItemActive && "opacity-100"
                                                            )} />
                                                        )}
                                                    </>
                                                )}
                                            </Link>
                                        );

                                        if (collapsed) {
                                            return (
                                                <Popover key={item.name}>
                                                    <PopoverTrigger asChild>
                                                        {menuItem}
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        side="right"
                                                        align="start"
                                                        sideOffset={15}
                                                        className="w-56 p-2 bg-popover/95 backdrop-blur-xl border-none shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="px-3 py-2 border-b border-muted/20 mb-1">
                                                                <p className={cn("text-xs font-bold uppercase tracking-widest", colors.icon)}>{t(item.name)}</p>
                                                            </div>
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => {
                                                                    if (window.innerWidth < 768 && onClose) onClose();
                                                                }}
                                                                className={cn(
                                                                    "block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                                                    pathname === item.href ? `${colors.bg} ${colors.icon} font-bold` : "hover:bg-muted"
                                                                )}
                                                            >
                                                                {t("overview")}
                                                            </Link>
                                                            {item.submenus && item.submenus.length > 0 && (
                                                                <div className="pt-1 space-y-0.5">
                                                                    {item.submenus.map((submenu) => (
                                                                        <Link
                                                                            key={submenu.name}
                                                                            href={submenu.href}
                                                                            onClick={() => {
                                                                                if (window.innerWidth < 768 && onClose) onClose();
                                                                            }}
                                                                            className={cn(
                                                                                "block px-3 py-1.5 text-xs rounded-md transition-all",
                                                                                pathname === submenu.href
                                                                                    ? `${colors.icon} font-bold ${colors.bg}`
                                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            {submenu.name === "period_attendance" ? "Attendance by Subject" : t(submenu.name)}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            );
                                        }

                                        if (item.submenus && item.submenus.length > 0) {
                                            return (
                                                <Accordion type="single" collapsible key={item.name} className="w-full">
                                                    <AccordionItem value={item.name} className="border-none">
                                                        <AccordionTrigger
                                                            className={cn(
                                                                "flex items-center justify-start transition-all group hover:no-underline py-0 cursor-pointer",
                                                                "gap-3 px-2 py-2.5 rounded-xl mb-1",
                                                                isItemActive
                                                                    ? `${colors.active} text-white shadow-lg`
                                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                                                "text-sm font-semibold text-left"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className={cn(
                                                                    "p-1.5 rounded-lg transition-all duration-300",
                                                                    isItemActive ? "bg-white/20 backdrop-blur-sm border border-white/10" : `bg-muted group-hover:scale-110 ${colors.icon}`
                                                                )}>
                                                                    <item.icon className={cn(
                                                                        "h-4 w-4",
                                                                        isItemActive ? "text-white" : "transition-colors"
                                                                    )} />
                                                                </div>
                                                                <span className="flex-1 text-left">{t(item.name)}</span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-2 pt-1 pl-4 pr-1">
                                                            <div className={cn("flex flex-col gap-1 border-l-2 ml-3 pl-3 animate-in slide-in-from-top-2 duration-300 items-start", isItemActive ? `border-orange-500/20` : "border-primary/10")}>
                                                                {item.submenus.map((submenu) => {
                                                                    const isSubActive = pathname === submenu.href;
                                                                    return (
                                                                        <Link
                                                                            key={submenu.name}
                                                                            href={submenu.href}
                                                                            onClick={() => {
                                                                                if (window.innerWidth < 768 && onClose) onClose();
                                                                            }}
                                                                            className={cn(
                                                                                "relative py-2.5 text-xs font-bold rounded-xl transition-all duration-300 px-3 flex items-center justify-start text-left w-full group/sub",
                                                                                isSubActive
                                                                                    ? `${colors.active} text-white shadow-md shadow-orange-200/20 tracking-tight`
                                                                                    : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50"
                                                                            )}
                                                                        >
                                                                            <span className="flex-1">{submenu.name === "period_attendance" ? "Attendance by Subject" : t(submenu.name)}</span>
                                                                            {isSubActive && (
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in duration-300 ml-2" />
                                                                            )}
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            );
                                        }

                                        return menuItem;
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </ScrollArea>


                <div className={cn(
                    "mt-auto border-t bg-muted/5 backdrop-blur-sm group hover:bg-muted/10 transition-all h-14 min-h-[56px]",
                    collapsed ? "px-4 flex justify-center items-center" : "px-4 flex justify-between items-center"
                )}>
                    {mounted && (collapsed ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="h-8 w-8 rounded-xl border border-muted/50 cursor-pointer flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary transition-all shadow-sm">
                                    <Settings className="h-4 w-4" />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent side="right" align="end" className="w-56 p-2 rounded-xl shadow-xl">
                                <div className="space-y-1">
                                    <p className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("switch_session")}</p>
                                    {fetchingSessions ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : sessions.map(session => (
                                        <button
                                            key={session.id}
                                            onClick={() => handleSessionChange(session)}
                                            disabled={changingSessionId !== null}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left",
                                                session.is_active ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground/80",
                                                changingSessionId === session.id && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <span>{session.session}</span>
                                            {session.is_active && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            {changingSessionId === session.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <>
                            <div className="flex flex-col">
                                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em] font-black leading-tight mb-0.5">{t("session")}</p>
                                <p className="text-sm font-extrabold text-foreground/90 tracking-tight">
                                    {fetchingSessions ? t("loading") : (activeSession?.session || t("not_set"))}
                                </p>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="h-8 w-8 rounded-xl border border-muted/50 cursor-pointer flex items-center justify-center text-muted-foreground bg-card group-hover:text-primary group-hover:border-primary group-hover:shadow-lg transition-all duration-300">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="end" className="w-56 p-2 rounded-xl shadow-xl border-none">
                                    <div className="space-y-1">
                                        <p className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("switch_session")}</p>
                                        {fetchingSessions ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : sessions.map(session => (
                                            <button
                                                key={session.id}
                                                onClick={() => handleSessionChange(session)}
                                                disabled={changingSessionId !== null}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left",
                                                    session.is_active ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground/80",
                                                    changingSessionId === session.id && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <span>{session.session}</span>
                                                {session.is_active && <div className="h-2 w-2 rounded-full bg-primary" />}
                                                {changingSessionId === session.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </>
                    ))}
                </div>
            </aside >
        </>
    );
}
