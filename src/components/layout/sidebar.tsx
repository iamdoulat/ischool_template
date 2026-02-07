"use client";

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

const menuItems = [
    {
        group: "Main", items: [
            { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", submenus: [], color: "amber" }
        ]
    },
    {
        group: "Modules", items: [
            {
                name: "Front Office",
                icon: Building2,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "Admission Enquiry", href: "/dashboard/front-office/admission-enquiry" },
                    { name: "Visitor Book", href: "/dashboard/front-office/visitor-book" },
                    { name: "Phone Call Log", href: "/dashboard/front-office/phone-call-log" },
                    { name: "Postal Dispatch", href: "/dashboard/front-office/postal-dispatch" },
                    { name: "Postal Receive", href: "/dashboard/front-office/postal-receive" },
                    { name: "Complain", href: "/dashboard/front-office/complain" },
                    { name: "Setup Front Office", href: "/dashboard/front-office/setup-front-office" },
                ]
            },
            {
                name: "Student Information",
                icon: Users,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "Student Details", href: "/dashboard/student-information/student-details" },
                    { name: "Student Admission", href: "/dashboard/student-information/student-admission" },
                    { name: "Online Admission", href: "/dashboard/student-information/online-admission" },
                    { name: "Disabled Students", href: "/dashboard/student-information/disabled-students" },
                    { name: "Multi Class Student", href: "/dashboard/student-information/multi-class-student" },
                    { name: "Bulk Delete", href: "/dashboard/student-information/bulk-delete" },
                    { name: "Student Categories", href: "/dashboard/student-information/student-categories" },
                    { name: "Student House", href: "/dashboard/student-information/student-house" },
                    { name: "Disable Reason", href: "/dashboard/student-information/disable-reason" },
                ]
            },
            {
                name: "Fees Collection",
                icon: Wallet,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "Collect Fees", href: "/dashboard/fees-collection/collect-fees" },
                    { name: "Offline Bank Payments", href: "/dashboard/fees-collection/offline-bank-payments" },
                    { name: "Search Fees Payment", href: "/dashboard/fees-collection/search-fees-payment" },
                    { name: "Search Due Fees", href: "/dashboard/fees-collection/search-due-fees" },
                    { name: "Fees Master", href: "/dashboard/fees-collection/fees-master" },
                    { name: "Quick Fees", href: "/dashboard/fees-collection/quick-fees" },
                    { name: "Fees Group", href: "/dashboard/fees-collection/fees-group" },
                    { name: "Fees Type", href: "/dashboard/fees-collection/fees-type" },
                    { name: "Fees Discount", href: "/dashboard/fees-collection/fees-discount" },
                    { name: "Fees Carry Forward", href: "/dashboard/fees-collection/fees-carry-forward" },
                    { name: "Fees Reminder", href: "/dashboard/fees-collection/fees-reminder" },
                ]
            },
            {
                name: "Income",
                icon: DollarSign,
                href: "#",
                color: "cyan",
                submenus: [
                    { name: "Add Income", href: "/dashboard/income/add-income" },
                    { name: "Search Income", href: "/dashboard/income/search-income" },
                    { name: "Income Head", href: "/dashboard/income/income-head" },
                ]
            },
            {
                name: "Expenses",
                icon: CreditCard,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "Add Expense", href: "/dashboard/expenses/add-expense" },
                    { name: "Search Expense", href: "/dashboard/expenses/search-expense" },
                    { name: "Expense Head", href: "/dashboard/expenses/expense-head" },
                ]
            },
            {
                name: "Attendance",
                icon: Calendar,
                href: "#",
                color: "orange",
                submenus: [
                    { name: "Student Attendance", href: "/dashboard/attendance/student-attendance" },
                    { name: "Period Attendance", href: "/dashboard/attendance/period-attendance" },
                    { name: "Approve Leave", href: "/dashboard/attendance/approve-leave" },
                    { name: "Attendance By Date", href: "#" },
                    { name: "Period Attendance By Date", href: "/dashboard/attendance/period-attendance-by-date" },
                ]
            },
            {
                name: "Examinations",
                icon: PenSquare,
                href: "#",
                color: "purple",
                submenus: [
                    { name: "Exam Group", href: "/dashboard/examinations/exam-group" },
                    { name: "Exam Schedule", href: "/dashboard/examinations/exam-schedule" },
                    { name: "Exam Result", href: "/dashboard/examinations/exam-result" },
                    { name: "Design Admit Card", href: "/dashboard/examinations/design-admit-card" },
                    { name: "Print Admit Card", href: "/dashboard/examinations/print-admit-card" },
                    { name: "Design Marksheet", href: "/dashboard/examinations/design-marksheet" },
                    { name: "Print Marksheet", href: "/dashboard/examinations/print-marksheet" },
                    { name: "Marks Grade", href: "/dashboard/examinations/marks-grade" },
                    { name: "Marks Division", href: "/dashboard/examinations/marks-division" },
                ]
            },
            {
                name: "CBSE Examination",
                icon: FileText,
                href: "#",
                color: "violet",
                submenus: [
                    { name: "Exam", href: "/dashboard/cbse-examination/exam" },
                    { name: "Exam Schedule", href: "/dashboard/cbse-examination/exam-schedule" },
                    { name: "Print Marksheet", href: "/dashboard/cbse-examination/print-marksheet" },
                    { name: "Template", href: "/dashboard/cbse-examination/template" },
                    { name: "Assign Observation", href: "/dashboard/cbse-examination/assign-observation" },
                    { name: "Reports", href: "/dashboard/cbse-examination/reports" },
                    { name: "Setting", href: "/dashboard/cbse-examination/setting" },
                ]
            },
            {
                name: "Online Examinations",
                icon: Rss,
                href: "#",
                color: "fuchsia",
                submenus: [
                    { name: "Online Exam", href: "/dashboard/online-examinations/online-exam" },
                    { name: "Question Bank", href: "/dashboard/online-examinations/question-bank" },
                ]
            },
            {
                name: "Academics",
                icon: GraduationCap,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "Class Timetable", href: "/dashboard/academics/class-timetable" },
                    { name: "Teachers Timetable", href: "/dashboard/academics/teachers-timetable" },
                    { name: "Assign Class Teacher", href: "/dashboard/academics/assign-class-teacher" },
                    { name: "Promote Students", href: "/dashboard/academics/promote-students" },
                    { name: "Subject Group", href: "/dashboard/academics/subject-group" },
                    { name: "Subjects", href: "/dashboard/academics/subjects" },
                    { name: "Class", href: "/dashboard/academics/class" },
                    { name: "Sections", href: "/dashboard/academics/sections" },
                ]
            },
            {
                name: "Human Resource",
                icon: UserPlus,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "Staff Directory", href: "/dashboard/hr/staff-directory" },
                    { name: "Staff Attendance", href: "/dashboard/hr/staff-attendance" },
                    { name: "Payroll", href: "/dashboard/hr/payroll" },
                    { name: "Approve Leave Request", href: "/dashboard/hr/approve-leave-request" },
                    { name: "Apply Leave", href: "/dashboard/hr/apply-leave" },
                    { name: "Leave Type", href: "/dashboard/hr/leave-type" },
                    { name: "Teachers Rating", href: "/dashboard/hr/teachers-rating" },
                    { name: "Department", href: "/dashboard/hr/department" },
                    { name: "Designation", href: "/dashboard/hr/designation" },
                    { name: "Disabled Staff", href: "/dashboard/hr/disabled-staff" },
                ]
            },
            {
                name: "Communicate",
                icon: MessageSquare,
                href: "#",
                color: "sky",
                submenus: [
                    { name: "Notice Board", href: "/dashboard/communicate/notice-board" },
                    { name: "Send Email", href: "/dashboard/communicate/send-email" },
                    { name: "Send SMS", href: "/dashboard/communicate/send-sms" },
                    { name: "Email / SMS Log", href: "/dashboard/communicate/email-sms-log" },
                    { name: "Schedule Email SMS Log", href: "/dashboard/communicate/schedule-email-sms-log" },
                    { name: "Login Credentials Send", href: "/dashboard/communicate/login-credentials-send" },
                    { name: "Email Template", href: "/dashboard/communicate/email-template" },
                    { name: "SMS Template", href: "/dashboard/communicate/sms-template" },
                ]
            },
            {
                name: "Download Center",
                icon: Download,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "Upload/Share Content", href: "/dashboard/download-center/upload-content" },
                    { name: "Content Share List", href: "/dashboard/download-center/content-share-list" },
                    { name: "Video Tutorial", href: "/dashboard/download-center/video-tutorial" },
                    { name: "Content Type", href: "/dashboard/download-center/content-type" },
                ]
            },
            {
                name: "Homework",
                icon: BookOpen,
                href: "#",
                color: "amber",
                submenus: [
                    { name: "Add Homework", href: "/dashboard/homework/add-homework" },
                    { name: "Daily Assignment", href: "/dashboard/homework/daily-assignment" },
                ]
            },
            {
                name: "Online Course",
                icon: Monitor,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "Online Course", href: "/dashboard/online-course/online-course-list" },
                    { name: "Question Bank", href: "/dashboard/online-course/question-bank" },
                    { name: "Offline Payment", href: "/dashboard/online-course/offline-payment" },
                    { name: "Online Course Report", href: "/dashboard/online-course/reports" },
                    { name: "Setting", href: "/dashboard/online-course/settings" },
                ]
            },
            {
                name: "Library",
                icon: Library,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "Book List", href: "/dashboard/library/book-list" },
                    { name: "Issue - Return", href: "/dashboard/library/member" },
                    { name: "Add Student", href: "/dashboard/library/add-student" },
                    { name: "Add Staff Member", href: "/dashboard/library/add-staff" },
                ]
            },
            {
                name: "Inventory",
                icon: Package,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "Issue Item", href: "/dashboard/inventory/issue-item" },
                    { name: "Add Item Stock", href: "/dashboard/inventory/add-item-stock" },
                    { name: "Add Item", href: "/dashboard/inventory/add-item" },
                    { name: "Item Category", href: "/dashboard/inventory/item-category" },
                    { name: "Item Store", href: "/dashboard/inventory/item-store" },
                    { name: "Item Supplier", href: "/dashboard/inventory/item-supplier" },
                ]
            },
            {
                name: "Transport",
                icon: Bus,
                href: "#",
                color: "amber",
                submenus: [
                    { name: "Fees Master", href: "/dashboard/transport/fees-master" },
                    { name: "Pickup Point", href: "/dashboard/transport/pickup-point" },
                    { name: "Routes", href: "/dashboard/transport/route" },
                    { name: "Vehicles", href: "/dashboard/transport/vehicles" },
                    { name: "Assign Vehicle", href: "/dashboard/transport/assign-vehicle" },
                    { name: "Route Pickup Point", href: "/dashboard/transport/route-pickup-point" },
                    { name: "Student Transport Fees", href: "/dashboard/transport/student-transport-fees" },
                ]
            },
            {
                name: "Hostel",
                icon: Hotel,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "Hostel Room", href: "/dashboard/hostel/hostel-room" },
                    { name: "Room Type", href: "/dashboard/hostel/room-type" },
                    { name: "Hostel", href: "/dashboard/hostel/hostel" },
                ]
            },
            {
                name: "Certificate",
                icon: Award,
                href: "#",
                color: "amber",
                submenus: [
                    { name: "Transfer Certificate", href: "/dashboard/certificate/transfer-certificate" },
                    { name: "Student Certificate", href: "/dashboard/certificate/student-certificate" },
                    { name: "Generate Certificate", href: "/dashboard/certificate/generate-certificate" },
                    { name: "Student ID Card", href: "/dashboard/certificate/student-id-card" },
                    { name: "Generate ID Card", href: "/dashboard/certificate/generate-id-card" },
                    { name: "Staff ID Card", href: "/dashboard/certificate/staff-id-card" },
                    { name: "Generate Staff ID Card", href: "/dashboard/certificate/generate-staff-id-card" },
                ]
            },
            {
                name: "Multi Branch",
                icon: GitBranch,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "Overview", href: "/dashboard/multi-branch/overview" },
                    { name: "Report", href: "/dashboard/multi-branch/report" },
                    { name: "Setting", href: "/dashboard/multi-branch/setting" },
                ]
            },
            {
                name: "Behaviour Records",
                icon: ClipboardList,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "Assign Incident", href: "/dashboard/behaviour-records/assign-incident" },
                    { name: "Incidents", href: "/dashboard/behaviour-records/incidents" },
                    { name: "Reports", href: "/dashboard/behaviour-records/reports" },
                    { name: "Setting", href: "/dashboard/behaviour-records/setting" },
                ]
            },
            {
                name: "Reports",
                icon: BarChart3,
                href: "#",
                color: "indigo",
                submenus: [
                    { name: "Student Information", href: "/dashboard/reports/student-information" },
                    { name: "Finance", href: "/dashboard/reports/finance" },
                    { name: "Attendance", href: "/dashboard/reports/attendance" },
                    { name: "Examinations", href: "/dashboard/reports/examinations" },
                    { name: "Online Examinations", href: "/dashboard/reports/online-examinations" },
                    { name: "Lesson Plan", href: "/dashboard/reports/lesson-plan" },
                    { name: "Human Resource", href: "/dashboard/reports/human-resource" },
                    { name: "Homework", href: "/dashboard/reports/homework" },
                    { name: "Library", href: "/dashboard/reports/library" },
                    { name: "Inventory", href: "/dashboard/reports/inventory" },
                    { name: "Transport", href: "/dashboard/reports/transport" },
                    { name: "Hostel", href: "/dashboard/reports/hostel" },
                    { name: "Alumni", href: "/dashboard/reports/alumni" },
                    { name: "User Log", href: "/dashboard/reports/user-log" },
                    { name: "Audit Trail Report", href: "/dashboard/reports/audit-trail" },
                ]
            },
            {
                name: "Gmeet Live Classes",
                icon: Video,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "Live Classes", href: "/dashboard/gmeet-live-classes/live-classes" },
                    { name: "Live Meeting", href: "/dashboard/gmeet-live-classes/live-meeting" },
                    { name: "Live Classes Report", href: "/dashboard/gmeet-live-classes/live-classes-report" },
                    { name: "Live Meeting Report", href: "/dashboard/gmeet-live-classes/live-meeting-report" },
                    { name: "Setting", href: "/dashboard/gmeet-live-classes/setting" },
                ]
            },
            {
                name: "Zoom Live Classes",
                icon: Video,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "Live Meeting", href: "/dashboard/zoom-live-classes/live-meeting" },
                    { name: "Live Classes", href: "/dashboard/zoom-live-classes/live-classes" },
                    { name: "Live Classes Report", href: "/dashboard/zoom-live-classes/live-classes-report" },
                    { name: "Live Meeting Report", href: "/dashboard/zoom-live-classes/live-meeting-report" },
                    { name: "Setting", href: "/dashboard/zoom-live-classes/setting" },
                ]
            },
            {
                name: "Lesson Plan",
                icon: BookMarked,
                href: "#",
                color: "emerald",
                submenus: [
                    { name: "Copy Old Lessons", href: "/dashboard/lesson-plan/copy-old-lessons" },
                    { name: "Manage Lesson Plan", href: "/dashboard/lesson-plan/manage-lesson-plan" },
                    { name: "Manage Syllabus Status", href: "/dashboard/lesson-plan/manage-syllabus-status" },
                    { name: "Lesson", href: "/dashboard/lesson-plan/lesson" },
                    { name: "Topic", href: "/dashboard/lesson-plan/topic" },
                ]
            },
            {
                name: "Student CV",
                icon: FileUser,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "Build CV", href: "/dashboard/student-cv/build-cv" },
                    { name: "Download CV", href: "/dashboard/student-cv/download-cv" },
                ]
            },
            {
                name: "Alumni",
                icon: UserCheck,
                href: "#",
                color: "blue",
                submenus: [
                    { name: "Manage Alumni", href: "/dashboard/alumni/manage-alumni" },
                    { name: "Events", href: "/dashboard/alumni/events" },
                ]
            },
            {
                name: "Annual Calendar",
                icon: CalendarDays,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "Annual Calendar", href: "/dashboard/annual-calendar" },
                    { name: "Holiday Type", href: "/dashboard/annual-calendar/holiday-type" },
                ]
            },
            {
                name: "Front CMS",
                icon: Globe,
                href: "#",
                color: "cyan",
                submenus: [
                    { name: "Event", href: "/dashboard/front-cms/event" },
                    { name: "Gallery", href: "/dashboard/front-cms/gallery" },
                    { name: "News", href: "/dashboard/front-cms/news" },
                    { name: "Media Manager", href: "/dashboard/front-cms/media-manager" },
                    { name: "Pages", href: "/dashboard/front-cms/pages" },
                    { name: "Menus", href: "/dashboard/front-cms/menus" },
                    { name: "Banner Images", href: "/dashboard/front-cms/banner-images" },
                ]
            },
            {
                name: "QR Code Attendance",
                icon: QrCode,
                href: "#",
                color: "rose",
                submenus: [
                    { name: "Attendance", href: "/dashboard/qr-code-attendance/attendance" },
                    { name: "Setting", href: "/dashboard/qr-code-attendance/setting" },
                ]
            },
            {
                name: "System Setting",
                icon: Settings,
                href: "#",
                color: "gray",
                submenus: [
                    { name: "General Setting", href: "/dashboard/system-setting/general-setting" },
                    { name: "Session Setting", href: "/dashboard/system-setting/session-setting" },
                    { name: "Notification Setting", href: "/dashboard/system-setting/notification-setting" },
                    { name: "Whatsapp Messaging", href: "/dashboard/system-setting/whatsapp-messaging" },
                    { name: "SMS Setting", href: "/dashboard/system-setting/sms-setting" },
                    { name: "Email Setting", href: "/dashboard/system-setting/email-setting" },
                    { name: "Payment Methods", href: "/dashboard/system-setting/payment-methods" },
                    { name: "Print Header Footer", href: "/dashboard/system-setting/print-header-footer" },
                    { name: "Thermal Print", href: "/dashboard/system-setting/thermal-print" },
                    { name: "Front CMS Setting", href: "/dashboard/system-setting/front-cms-setting" },
                    { name: "Backup Restore", href: "/dashboard/system-setting/backup-restore" },
                    { name: "Currency", href: "/dashboard/system-setting/currency" },
                    { name: "Users", href: "/dashboard/system-setting/users" },
                    { name: "Roles Permissions", href: "/dashboard/system-setting/roles-permissions" },
                    { name: "Languages", href: "/dashboard/system-setting/languages" },
                    { name: "Addons", href: "/dashboard/system-setting/addons" },
                    { name: "Modules", href: "/dashboard/system-setting/modules" },
                    { name: "Custom Fields", href: "/dashboard/system-setting/custom-fields" },
                    { name: "Captcha Setting", href: "/dashboard/system-setting/captcha-setting" },
                    { name: "System Fields", href: "/dashboard/system-setting/system-fields" },
                    { name: "Student Profile Setting", href: "/dashboard/system-setting/student-profile-setting" },
                    { name: "Online Admission", href: "/dashboard/system-setting/online-admission" },
                    { name: "File Types", href: "/dashboard/system-setting/file-types" },
                    { name: "Sidebar Menu", href: "/dashboard/system-setting/sidebar-menu" },
                    { name: "System Update", href: "/dashboard/system-setting/system-update" },
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
                collapsed ? "md:w-20" : "md:w-64 w-64",
                mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="h-14 min-h-[56px] flex items-center justify-between md:justify-center bg-gradient-to-r from-primary to-primary/80 text-white shadow-md z-10 px-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/10 shadow-sm">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        {(!collapsed || mobileOpen) && (
                            <span className="font-extrabold text-lg tracking-tight uppercase animate-in fade-in slide-in-from-left-4 duration-300">
                                Smart School
                            </span>
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
                    <nav className={cn("space-y-6 py-4 px-4", collapsed && "md:px-2")}>
                        {menuItems.map((group) => (
                            <div key={group.group} className="space-y-2">
                                {!collapsed && (
                                    <h3 className="px-3 mb-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                                        {group.group}
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
                                                    "flex items-center transition-all group relative overflow-hidden",
                                                    collapsed ? "justify-center h-12 w-12 mx-auto rounded-xl" : "gap-3 px-3 py-2.5 rounded-xl",
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
                                                        <span className="flex-1">{item.name}</span>
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
                                                                <p className={cn("text-xs font-bold uppercase tracking-widest", colors.icon)}>{item.name}</p>
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
                                                                Overview
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
                                                                            {submenu.name}
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
                                                                "flex items-center transition-all group hover:no-underline py-0 cursor-pointer",
                                                                "gap-3 px-3 py-2.5 rounded-xl mb-1",
                                                                isItemActive
                                                                    ? `${colors.active} text-white shadow-lg`
                                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                                                "text-sm font-semibold"
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
                                                                <span className="flex-1 text-left">{item.name}</span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-2 pt-1 pl-4 pr-1">
                                                            <div className={cn("flex flex-col gap-1 border-l-2 ml-5 pl-4 animate-in slide-in-from-top-2 duration-300", isItemActive ? `border-orange-500/20` : "border-primary/10")}>
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
                                                                                "relative py-2.5 text-xs font-bold rounded-xl transition-all duration-300 px-4 flex items-center justify-between group/sub",
                                                                                isSubActive
                                                                                    ? `${colors.active} text-white shadow-md shadow-orange-200/20 tracking-tight`
                                                                                    : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50"
                                                                            )}
                                                                        >
                                                                            <span>{submenu.name}</span>
                                                                            {isSubActive && (
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in duration-300" />
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
                    "mt-auto border-t bg-muted/5 backdrop-blur-sm group cursor-pointer hover:bg-muted/10 transition-all h-14 min-h-[56px]",
                    collapsed ? "px-4 flex justify-center items-center" : "px-4 flex justify-between items-center"
                )}>
                    {collapsed ? (
                        <div className="h-8 w-8 rounded-xl border border-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary transition-all shadow-sm">
                            <Settings className="h-4 w-4" />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col">
                                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em] font-black leading-tight mb-0.5">Session</p>
                                <p className="text-sm font-extrabold text-foreground/90 tracking-tight">2025-2026</p>
                            </div>
                            <div className="h-8 w-8 rounded-xl border border-muted/50 flex items-center justify-center text-muted-foreground bg-card group-hover:text-primary group-hover:border-primary group-hover:shadow-lg transition-all duration-300">
                                <Settings className="h-4 w-4" />
                            </div>
                        </>
                    )}
                </div>
            </aside >
        </>
    );
}
