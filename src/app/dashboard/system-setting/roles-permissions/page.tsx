"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    Search,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronRight as ChevronRightIcon,
    Loader2,
    ShieldCheck,
    Check,
    Save,
    X,
    LayoutDashboard,
    Monitor
} from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { portalMenuPermissions } from "@/lib/portal-menu-permissions";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const moduleSubmenus: Record<string, { name: string; label: string }[]> = {
    dashboard: [],
    front_office: [
        { name: "admission_enquiry", label: "Admission Enquiry" },
        { name: "visitor_book", label: "Visitor Book" },
        { name: "phone_call_log", label: "Phone Call Log" },
        { name: "postal_dispatch", label: "Postal Dispatch" },
        { name: "postal_receive", label: "Postal Receive" },
        { name: "complain", label: "Complain" },
        { name: "setup_front_office", label: "Setup Front Office" },
    ],
    student_information: [
        { name: "student_details", label: "Student Details" },
        { name: "student_admission", label: "Student Admission" },
        { name: "online_admission", label: "Online Admission" },
        { name: "disabled_students", label: "Disabled Students" },
        { name: "multi_class_student", label: "Multi Class Student" },
        { name: "bulk_delete", label: "Bulk Delete" },
        { name: "student_categories", label: "Student Categories" },
        { name: "student_house", label: "Student House" },
        { name: "disable_reason", label: "Disable Reason" },
    ],
    fees_collection: [
        { name: "collect_fees", label: "Collect Fees" },
        { name: "offline_bank_payments", label: "Offline Bank Payments" },
        { name: "search_fees_payment", label: "Search Fees Payment" },
        { name: "search_due_fees", label: "Search Due Fees" },
        { name: "fees_master", label: "Fees Master" },
        { name: "quick_fees", label: "Quick Fees" },
        { name: "fees_group", label: "Fees Group" },
        { name: "fees_type", label: "Fees Type" },
        { name: "fees_discount", label: "Fees Discount" },
        { name: "fees_carry_forward", label: "Fees Carry Forward" },
        { name: "fees_reminder", label: "Fees Reminder" },
    ],
    income: [
        { name: "add_income", label: "Add Income" },
        { name: "search_income", label: "Search Income" },
        { name: "income_head", label: "Income Head" },
    ],
    expenses: [
        { name: "add_expense", label: "Add Expense" },
        { name: "search_expense", label: "Search Expense" },
        { name: "expense_head", label: "Expense Head" },
    ],
    attendance: [
        { name: "student_attendance", label: "Student Attendance" },
        { name: "approve_leave", label: "Approve Leave" },
        { name: "attendance_by_date", label: "Attendance By Date" },
        { name: "leave_type", label: "Leave Type" },
    ],
    examinations: [
        { name: "exam_group", label: "Exam Group" },
        { name: "exam_schedule", label: "Exam Schedule" },
        { name: "exam_result", label: "Exam Result" },
        { name: "design_admit_card", label: "Design Admit Card" },
        { name: "print_admit_card", label: "Print Admit Card" },
        { name: "design_marksheet", label: "Design Marksheet" },
        { name: "print_marksheet", label: "Print Marksheet" },
        { name: "marks_grade", label: "Marks Grade" },
        { name: "marks_division", label: "Marks Division" },
    ],
    cbse_examination: [
        { name: "exam", label: "Exam" },
        { name: "exam_schedule", label: "Exam Schedule" },
        { name: "print_marksheet", label: "Print Marksheet" },
        { name: "template", label: "Template" },
        { name: "assign_observation", label: "Assign Observation" },
        { name: "reports", label: "Reports" },
        { name: "setting", label: "Setting" },
    ],
    online_examinations: [
        { name: "online_exam", label: "Online Exam" },
        { name: "question_bank", label: "Question Bank" },
    ],
    academics: [
        { name: "class_timetable", label: "Class Timetable" },
        { name: "teachers_timetable", label: "Teachers Timetable" },
        { name: "assign_class_teacher", label: "Assign Class Teacher" },
        { name: "promote_students", label: "Promote Students" },
        { name: "subject_group", label: "Subject Group" },
        { name: "subjects", label: "Subjects" },
        { name: "class", label: "Class" },
        { name: "sections", label: "Sections" },
    ],
    human_resource: [
        { name: "staff_directory", label: "Staff Directory" },
        { name: "staff_attendance", label: "Staff Attendance" },
        { name: "payroll", label: "Payroll" },
        { name: "approve_leave_request", label: "Approve Leave Request" },
        { name: "apply_leave", label: "Apply Leave" },
        { name: "leave_type", label: "Leave Type" },
        { name: "teachers_rating", label: "Teachers Rating" },
        { name: "department", label: "Department" },
        { name: "designation", label: "Designation" },
        { name: "disabled_staff", label: "Disabled Staff" },
    ],
    communicate: [
        { name: "notice_board", label: "Notice Board" },
        { name: "send_email", label: "Send Email" },
        { name: "send_sms", label: "Send SMS" },
        { name: "send_wa", label: "Send WA" },
        { name: "email_sms_log", label: "Email SMS Log" },
        { name: "schedule_email_sms_log", label: "Schedule Email SMS Log" },
        { name: "login_credentials_send", label: "Login Credentials Send" },
        { name: "email_template", label: "Email Template" },
        { name: "sms_template", label: "SMS Template" },
        { name: "wa_template", label: "WA Template" },
    ],
    download_center: [
        { name: "upload_share_content", label: "Upload Share Content" },
        { name: "content_share_list", label: "Content Share List" },
        { name: "video_tutorial", label: "Video Tutorial" },
        { name: "content_type", label: "Content Type" },
    ],
    homework: [
        { name: "add_homework", label: "Add Homework" },
        { name: "daily_assignment", label: "Daily Assignment" },
    ],
    online_course: [
        { name: "online_course", label: "Online Course" },
        { name: "question_bank", label: "Question Bank" },
        { name: "offline_payment", label: "Offline Payment" },
        { name: "online_course_report", label: "Online Course Report" },
        { name: "setting", label: "Setting" },
    ],
    library: [
        { name: "book_list", label: "Book List" },
        { name: "issue_return", label: "Issue & Return" },
        { name: "add_student", label: "Add Student" },
        { name: "add_staff_member", label: "Add Staff Member" },
    ],
    inventory: [
        { name: "issue_item", label: "Issue Item" },
        { name: "add_item_stock", label: "Add Item Stock" },
        { name: "add_item", label: "Add Item" },
        { name: "item_category", label: "Item Category" },
        { name: "item_store", label: "Item Store" },
        { name: "item_supplier", label: "Item Supplier" },
    ],
    transport: [
        { name: "fees_master", label: "Fees Master" },
        { name: "pickup_point", label: "Pickup Point" },
        { name: "routes", label: "Routes" },
        { name: "vehicles", label: "Vehicles" },
        { name: "assign_vehicle", label: "Assign Vehicle" },
        { name: "route_pickup_point", label: "Route Pickup Point" },
        { name: "student_transport_fees", label: "Student Transport Fees" },
    ],
    hostel: [
        { name: "hostel_room", label: "Hostel Room" },
        { name: "room_type", label: "Room Type" },
        { name: "hostel", label: "Hostel" },
    ],
    certificate: [
        { name: "transfer_certificate", label: "Transfer Certificate" },
        { name: "student_certificate", label: "Student Certificate" },
        { name: "generate_certificate", label: "Generate Certificate" },
        { name: "student_id_card", label: "Student ID Card" },
        { name: "generate_id_card", label: "Generate ID Card" },
        { name: "staff_id_card", label: "Staff ID Card" },
        { name: "generate_staff_id_card", label: "Generate Staff ID Card" },
    ],
    multi_branch: [
        { name: "overview", label: "Overview" },
        { name: "report", label: "Report" },
        { name: "setting", label: "Setting" },
    ],
    behaviour_records: [
        { name: "assign_incident", label: "Assign Incident" },
        { name: "incidents", label: "Incidents" },
        { name: "reports", label: "Reports" },
        { name: "setting", label: "Setting" },
    ],
    reports: [
        { name: "student_information", label: "Student Information" },
        { name: "finance", label: "Finance" },
        { name: "attendance", label: "Attendance" },
        { name: "examinations", label: "Examinations" },
        { name: "online_examinations", label: "Online Examinations" },
        { name: "lesson_plan", label: "Lesson Plan" },
        { name: "human_resource", label: "Human Resource" },
        { name: "homework", label: "Homework" },
        { name: "library", label: "Library" },
        { name: "inventory", label: "Inventory" },
        { name: "transport", label: "Transport" },
        { name: "hostel", label: "Hostel" },
        { name: "alumni", label: "Alumni" },
        { name: "user_log", label: "User Log" },
        { name: "audit_trail_report", label: "Audit Trail Report" },
    ],
    gmeet_live_classes: [
        { name: "live_classes", label: "Live Classes" },
        { name: "live_meeting", label: "Live Meeting" },
        { name: "live_classes_report", label: "Live Classes Report" },
        { name: "live_meeting_report", label: "Live Meeting Report" },
        { name: "setting", label: "Setting" },
    ],
    zoom_live_classes: [
        { name: "live_meeting", label: "Live Meeting" },
        { name: "live_classes", label: "Live Classes" },
        { name: "live_classes_report", label: "Live Classes Report" },
        { name: "live_meeting_report", label: "Live Meeting Report" },
        { name: "setting", label: "Setting" },
    ],
    lesson_plan: [
        { name: "copy_old_lessons", label: "Copy Old Lessons" },
        { name: "manage_lesson_plan", label: "Manage Lesson Plan" },
        { name: "manage_syllabus_status", label: "Manage Syllabus Status" },
        { name: "lesson", label: "Lesson" },
        { name: "topic", label: "Topic" },
    ],
    student_cv: [
        { name: "build_cv", label: "Build CV" },
        { name: "download_cv", label: "Download CV" },
    ],
    alumni: [
        { name: "manage_alumni", label: "Manage Alumni" },
        { name: "events", label: "Events" },
    ],
    annual_calendar: [
        { name: "annual_calendar", label: "Annual Calendar" },
        { name: "holiday_type", label: "Holiday Type" },
    ],
    front_cms: [
        { name: "event", label: "Event" },
        { name: "gallery", label: "Gallery" },
        { name: "news", label: "News" },
        { name: "media_manager", label: "Media Manager" },
        { name: "pages", label: "Pages" },
        { name: "menus", label: "Menus" },
        { name: "banner_images", label: "Banner Images" },
    ],
    qr_code_attendance: [
        { name: "attendance", label: "Attendance" },
        { name: "terminal", label: "Terminal" },
        { name: "face_registration", label: "Face Registration" },
        { name: "qr_code_generation", label: "QR Code Generation" },
        { name: "nfc_assignment", label: "NFC Assignment" },
        { name: "setting", label: "Setting" },
        { name: "smart_attendance_settings", label: "Smart Attendance Settings" },
    ],
    system_setting: [
        { name: "general_setting", label: "General Setting" },
        { name: "session_setting", label: "Session Setting" },
        { name: "notification_setting", label: "Notification Setting" },
        { name: "whatsapp_messaging", label: "WhatsApp Messaging" },
        { name: "sms_setting", label: "SMS Setting" },
        { name: "email_setting", label: "Email Setting" },
        { name: "payment_methods", label: "Payment Methods" },
        { name: "print_header_footer", label: "Print Header Footer" },
        { name: "thermal_print", label: "Thermal Print" },
        { name: "front_cms_setting", label: "Front CMS Setting" },
        { name: "backup_restore", label: "Backup & Restore" },
        { name: "currency", label: "Currency" },
        { name: "users", label: "Users" },
        { name: "roles_permissions", label: "Roles & Permissions" },
        { name: "languages", label: "Languages" },
        { name: "addons", label: "Addons" },
        { name: "modules", label: "Modules" },
        { name: "custom_fields", label: "Custom Fields" },
        { name: "captcha_setting", label: "Captcha Setting" },
        { name: "system_fields", label: "System Fields" },
        { name: "student_profile_setting", label: "Student Profile Setting" },
        { name: "online_admission", label: "Online Admission" },
        { name: "file_types", label: "File Types" },
        { name: "sidebar_menu", label: "Sidebar Menu" },
        { name: "system_update", label: "System Update" },
    ],
};

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

const sidebarModuleLabels: Record<string, string> = {
    dashboard: "Dashboard",
    front_office: "Front Office",
    student_information: "Student Information",
    fees_collection: "Fees Collection",
    income: "Income",
    expenses: "Expenses",
    attendance: "Attendance",
    examinations: "Examinations",
    cbse_examination: "CBSE Examination",
    online_examinations: "Online Examinations",
    academics: "Academics",
    human_resource: "Human Resource",
    communicate: "Communicate",
    download_center: "Download Center",
    homework: "Homework",
    online_course: "Online Course",
    library: "Library",
    inventory: "Inventory",
    transport: "Transport",
    hostel: "Hostel",
    certificate: "Certificate",
    multi_branch: "Multi Branch",
    behaviour_records: "Behaviour Records",
    reports: "Reports",
    gmeet_live_classes: "GMeet Live Classes",
    zoom_live_classes: "Zoom Live Classes",
    lesson_plan: "Lesson Plan",
    student_cv: "Student CV",
    alumni: "Alumni",
    annual_calendar: "Annual Calendar",
    front_cms: "Front CMS",
    qr_code_attendance: "QR Code Attendance",
    system_setting: "System Setting",
};

const submenuFeatureOverride: Record<string, Record<string, string[]>> = {
    student_information: {
        student_details: ["Student"],
        disabled_students: ["Disable Student"],
        student_house: ["Student Houses"],
    },
    income: {
        add_income: ["Income"],
    },
    expenses: {
        add_expense: ["Expense"],
    },
    attendance: {
        student_attendance: ["Student / Period Attendance"],
    },
    cbse_examination: {
        exam: ["CBSE Exam"],
        exam_schedule: ["CBSE Exam Schedule"],
        print_marksheet: ["CBSE Exam Print Marksheet"],
        template: ["CBSE Exam Template"],
        assign_observation: ["CBSE Exam Assign Observation"],
        reports: ["CBSE Exam Subject Marks Report"],
        setting: ["CBSE Exam Setting"],
    },
    online_examinations: {
        online_exam: ["Online Examination"],
    },
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
    download_center: {
        upload_share_content: ["Upload Content"],
    },
    homework: {
        add_homework: ["Homework"],
    },
    online_course: {
        online_course_report: ["Student Course Purchase Report"],
    },
    library: {
        book_list: ["Books List"],
    },
    transport: {
        vehicles: ["Vehicle"],
    },
    hostel: {
        hostel_room: ["Hostel Rooms"],
    },
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
        modules: [],
        captcha_setting: [],
        student_profile_setting: ["Student Profile Update"],
        file_types: [],
        system_update: [],
    },
};

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
    return (
        <div className="group relative inline-flex items-center justify-center">
            {children}
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-medium">
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
            </div>
        </div>
    );
};

export default function RolesPermissionsPage() {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<any[]>([]);
    const [paginationMeta, setPaginationMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleName, setRoleName] = useState("");
    const [editingRole, setEditingRole] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        role: true,
        type: true,
        action: true,
    });
    const [limit, setLimit] = useState("50");

    const [modules, setModules] = useState<any[]>([]);
    const [permissionsMatrix, setPermissionsMatrix] = useState<any>({});
    const [checkedPermNames, setCheckedPermNames] = useState<Set<string>>(new Set());
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [checkedWidgets, setCheckedWidgets] = useState<Set<string>>(new Set());
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const summaryCardWidgets: { key: string; title: string }[] = [
        { key: "summary_monthly_fees", title: "Monthly Fees Collection" },
        { key: "summary_monthly_expenses", title: "Monthly Expenses" },
        { key: "summary_student", title: "Student" },
        { key: "summary_student_head_count", title: "Student Head Count" },
        { key: "summary_admin", title: "Admin" },
        { key: "summary_teacher", title: "Teacher" },
        { key: "summary_accountant", title: "Accountant" },
        { key: "summary_librarian", title: "Librarian" },
        { key: "summary_receptionist", title: "Receptionist" },
        { key: "summary_super_admin", title: "Super Admin" },
        { key: "summary_driver", title: "Driver" },
    ];

    const dashboardWidgets: { key: string; title: string; section?: string }[] = [
        { key: "fees_awaiting_payment", title: "Fees Awaiting Payment" },
        { key: "staff_approved_leave", title: "Staff Approved Leave" },
        { key: "student_approved_leave", title: "Student Approved Leave" },
        { key: "converted_leads", title: "Converted Leads" },
        { key: "staff_present_today", title: "Staff Present Today" },
        { key: "student_present_today", title: "Students Present Today" },
        { key: "charts_section", title: "Charts & Graphs", section: "true" },
        { key: "overview_section", title: "Overview Cards", section: "true" },
    ];

    const fetchRoles = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get("/roles", {
                params: {
                    search: searchTerm,
                    page: page,
                    limit: limit === "All" ? 1000 : parseInt(limit)
                }
            });
            setRoles(response.data.data.data);
            setPaginationMeta(response.data.data);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, limit]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRoles();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchRoles]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modulesRes, permsRes] = await Promise.all([
                    api.get("/system-setting/modules"),
                    api.get("/permissions"),
                ]);
                if (modulesRes.data.success) {
                    setModules(modulesRes.data.data || []);
                }
                setPermissionsMatrix(permsRes.data.data || {});
            } catch (error) {
                console.error("Failed to fetch module/permission data:", error);
            }
        };
        fetchData();
    }, []);

    const activeModuleKeys = useMemo(() => {
        const activeAliases = new Set(
            modules.filter((m: any) => m.is_active_system).map((m: any) => m.alias)
        );
        const allModuleAliases = new Set(modules.map((m: any) => m.alias));
        return Object.keys(moduleSubmenus).filter(key => {
            if (key === "dashboard") return true;
            if (!allModuleAliases.has(key)) return true;
            return activeAliases.has(key);
        });
    }, [modules]);

    const moduleKeys = activeModuleKeys;

    const buildAllPermNames = useCallback((moduleKey: string): string[] => {
        const permModuleNames = modulePermissionMap[moduleKey] || [];
        const names: string[] = [];
        for (const permModule of permModuleNames) {
            const features = permissionsMatrix[permModule];
            if (features) {
                for (const perms of Object.values(features) as any) {
                    for (const p of perms as any) {
                        names.push(p.name);
                    }
                }
            }
        }
        return names;
    }, [permissionsMatrix]);

    const buildSubmenuPermNames = useCallback((modKey: string, subName: string): string[] => {
        const override = submenuFeatureOverride[modKey]?.[subName];
        const featureLabels = override ?? (() => {
            const label = subName
                .split('_')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            return [label];
        })();
        if (featureLabels.length === 0) return [];
        const permModuleNames = modulePermissionMap[modKey] || [];
        const names: string[] = [];
        for (const permModule of permModuleNames) {
            const features = permissionsMatrix[permModule];
            if (!features) continue;
            for (const [featureKey, perms] of Object.entries(features)) {
                if (featureLabels.some(fl => featureKey.toLowerCase() === fl.toLowerCase())) {
                    for (const p of perms as any) {
                        names.push(p.name);
                    }
                }
            }
        }
        return names;
    }, [permissionsMatrix]);

    const loadRolePermissions = useCallback(async (roleId: number) => {
        setPermissionsLoading(true);
        try {
            const [roleRes, permsRes, widgetRes] = await Promise.all([
                api.get(`/roles/${roleId}`),
                api.get(`/roles/${roleId}/permissions`),
                api.get(`/roles/${roleId}/dashboard-widgets`),
            ]);
            setEditingRole(roleRes.data.data);
            setCheckedPermNames(new Set(permsRes.data.data || []));
            setCheckedWidgets(new Set(widgetRes.data.data || []));
        } catch (error) {
            console.error("Failed to load role permissions:", error);
            setCheckedPermNames(new Set());
            setCheckedWidgets(new Set());
        } finally {
            setPermissionsLoading(false);
        }
    }, []);

    const handleEdit = (role: any) => {
        if (role.name === 'Super Admin') return;
        setRoleName(role.name);
        setExpandedModules(new Set());
        setCheckedPermNames(new Set());
        setCheckedWidgets(new Set());
        loadRolePermissions(role.id);
    };

    const handleCancel = () => {
        setEditingRole(null);
        setRoleName("");
        setCheckedPermNames(new Set());
        setExpandedModules(new Set());
        setCheckedWidgets(new Set());
    };

    const handleChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName.trim()) return;

        setSubmitting(true);
        try {
            if (editingRole) {
                await api.patch(`/roles/${editingRole.id}`, { name: roleName });
            } else {
                const res = await api.post("/roles", {
                    name: roleName,
                    is_system: false
                });
                setEditingRole({ id: res.data.data.id, name: roleName, is_system: false });
            }
            fetchRoles();
        } catch (error) {
            console.error("Failed to save role:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSavePermissions = async () => {
        if (!editingRole) return;
        setSavingPermissions(true);
        try {
            const uniqueNames = [...new Set(checkedPermNames)];
            const [permRes] = await Promise.all([
                api.put(`/roles/${editingRole.id}/permissions`, {
                    permissions: uniqueNames
                }),
                api.put(`/roles/${editingRole.id}/dashboard-widgets`, {
                    widgets: [...checkedWidgets]
                }),
            ]);
            toast.success(permRes.data?.message || t("updated_successfully"));
            handleCancel();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || t("failed_to_save");
            toast.error(msg);
        } finally {
            setSavingPermissions(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (deleteId === null) return;
        try {
            await api.delete(`/roles/${deleteId}`);
            toast.success(t("deleted_successfully"));
            fetchRoles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t("failed_to_delete"));
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const promptDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const toggleWidget = (widgetKey: string) => {
        setCheckedWidgets(prev => {
            const next = new Set(prev);
            if (next.has(widgetKey)) {
                next.delete(widgetKey);
            } else {
                next.add(widgetKey);
            }
            return next;
        });
    };

    const getModuleCheckState = (modKey: string): boolean | "indeterminate" => {
        const permNames = buildAllPermNames(modKey);
        if (permNames.length === 0) return false;
        const checkedCount = permNames.filter(n => checkedPermNames.has(n)).length;
        if (checkedCount === 0) return false;
        if (checkedCount === permNames.length) return true;
        return "indeterminate";
    };

    const isSubmenuChecked = (modKey: string, subName: string): boolean => {
        const permNames = buildSubmenuPermNames(modKey, subName);
        if (permNames.length === 0) return false;
        return permNames.every(n => checkedPermNames.has(n));
    };

    const toggleModule = (modKey: string) => {
        const permNames = buildAllPermNames(modKey);
        setCheckedPermNames(prev => {
            const next = new Set(prev);
            const allChecked = permNames.every(n => next.has(n));
            if (allChecked) {
                for (const n of permNames) next.delete(n);
            } else {
                for (const n of permNames) next.add(n);
            }
            return next;
        });
    };

    const toggleSubmenu = (modKey: string, subName: string) => {
        const permNames = buildSubmenuPermNames(modKey, subName);
        setCheckedPermNames(prev => {
            const next = new Set(prev);
            const allChecked = permNames.every(n => next.has(n));
            if (allChecked) {
                for (const n of permNames) next.delete(n);
            } else {
                for (const n of permNames) next.add(n);
            }
            return next;
        });
    };

    const toggleExpand = (modKey: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(modKey)) next.delete(modKey);
            else next.add(modKey);
            return next;
        });
    };

    // ----- Student Portal menu permission helpers -----
    // The Module Permissions tree controls the student portal sidebar menus.
    // Each portal menu maps directly to a single permission name (see
    // src/lib/portal-menu-permissions.ts).
    const portalMenuPermNames = (menuName: string): string[] => {
        const node = portalMenuPermissions.find(m => m.name === menuName);
        if (!node) return [];
        return [node.permission, ...(node.submenus?.map(s => s.permission) ?? [])];
    };

    const getPortalMenuCheckState = (menuName: string): boolean | "indeterminate" => {
        const names = portalMenuPermNames(menuName);
        if (names.length === 0) return false;
        const checked = names.filter(n => checkedPermNames.has(n)).length;
        if (checked === 0) return false;
        if (checked === names.length) return true;
        return "indeterminate";
    };

    const togglePortalMenu = (menuName: string) => {
        const names = portalMenuPermNames(menuName);
        setCheckedPermNames(prev => {
            const next = new Set(prev);
            const allChecked = names.every(n => next.has(n));
            for (const n of names) allChecked ? next.delete(n) : next.add(n);
            return next;
        });
    };

    const togglePortalSubmenu = (permission: string) => {
        setCheckedPermNames(prev => {
            const next = new Set(prev);
            if (next.has(permission)) next.delete(permission);
            else next.add(permission);
            return next;
        });
    };

    const toggleColumn = (column: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const getExportData = () => {
        const headers = ["Role", "Type"];
        const rows = roles.map(r => [r.name, r.is_system ? "System" : "Custom"]);
        return { headers, rows };
    };

    const handleCopy = () => {
        const { headers, rows } = getExportData();
        const content = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(content);
    };

    const handleExportCSV = () => {
        const { headers, rows } = getExportData();
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "roles_list.csv");
        link.click();
    };

    const handlePrint = () => {
        const { headers, rows } = getExportData();
        const html = `
            <html>
                <head>
                    <title>Role List</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
                        th { background-color: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
                        h1 { font-size: 24px; margin: 0; color: #1e293b; }
                        .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; }
                    </style>
                </head>
                <body>
                    <h1>Role List</h1>
                    <table>
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
                        </tbody>
                    </table>
                    <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
                </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const permissionRoleId = editingRole?.id;
    // Student & Parent roles use the student portal sidebar; every other role
    // uses the admin panel sidebar. Show the matching module tree accordingly.
    const isPortalRole = ["Student", "Parent"].includes(editingRole?.name ?? "");

    return (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-gray-50/10 min-h-screen font-sans">

            {/* Left Panel - Role Form + Module Tree */}
            <div className="lg:col-span-1 space-y-4">
                <Card className="border-none shadow-sm pt-0 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ShieldCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{editingRole ? t("edit_role") : t("new_role")}</h1>
                                <p className="text-[11px] text-gray-500 mt-1">{t("manage_roles_and_access_permissions")}</p>
                            </div>
                        </div>
                        {editingRole && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancel}
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                    <form onSubmit={handleChange}>
                        <CardContent className="pt-4 space-y-3">
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-gray-500">{t("role_name")} <span className="text-red-500">*</span></label>
                                <Input
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder={t("enter_role_name")}
                                    className="h-9 text-[12px] border-gray-200 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-2 pb-4 px-6">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white text-[12px] px-8 h-9 rounded-full shadow-md transition-all"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingRole ? t("update") : t("create")}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {permissionRoleId && (
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-50">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {t("module_permissions")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-1 max-h-[500px] overflow-y-auto">
                            {!permissionsLoading && (
                                <div className="px-1 py-1 mb-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <LayoutDashboard className="h-3.5 w-3.5 text-indigo-500" />
                                        <span className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">{t("dashboard_cards")}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {dashboardWidgets.filter(w => !w.section).map((w) => (
                                            <div key={w.key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50/50 rounded-md transition-colors">
                                                <Checkbox
                                                    checked={checkedWidgets.has(w.key)}
                                                    onCheckedChange={() => toggleWidget(w.key)}
                                                    className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                />
                                                <span className="text-[11px] text-gray-600">{w.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 my-2" />
                                    <div className="space-y-1">
                                        {dashboardWidgets.filter(w => w.section).map((w) => (
                                            <div key={w.key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50/50 rounded-md transition-colors">
                                                <Checkbox
                                                    checked={checkedWidgets.has(w.key)}
                                                    onCheckedChange={() => toggleWidget(w.key)}
                                                    className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                />
                                                <span className="text-[11px] font-medium text-indigo-600">{w.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 my-2" />
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 px-3 py-1.5">
                                            <Checkbox
                                                checked={summaryCardWidgets.every(c => checkedWidgets.has(c.key))}
                                                onCheckedChange={() => {
                                                    const allChecked = summaryCardWidgets.every(c => checkedWidgets.has(c.key));
                                                    setCheckedWidgets(prev => {
                                                        const next = new Set(prev);
                                                        for (const c of summaryCardWidgets) {
                                                            if (allChecked) next.delete(c.key);
                                                            else next.add(c.key);
                                                        }
                                                        return next;
                                                    });
                                                }}
                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                            />
                                            <span className="text-[11px] font-medium text-indigo-600">{t("summary_cards")}</span>
                                        </div>
                                        <div className="ml-6 space-y-0.5 border-l-2 border-indigo-100 pl-3">
                                            {summaryCardWidgets.map((c) => (
                                                <div key={c.key} className="flex items-center gap-2 py-0.5">
                                                    <div className="w-2 h-[1px] bg-indigo-200 flex-shrink-0" />
                                                    <Checkbox
                                                        checked={checkedWidgets.has(c.key)}
                                                        onCheckedChange={() => toggleWidget(c.key)}
                                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-3.5 w-3.5 rounded"
                                                    />
                                                    <span className={`text-[11px] ${checkedWidgets.has(c.key) ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>{c.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {permissionsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                    <span className="ml-2 text-xs text-gray-400">{t("loading_permissions")}</span>
                                </div>
                            ) : isPortalRole ? (
                                <>
                                    <div className="flex items-center gap-2 px-1 mb-2">
                                        <Monitor className="h-3.5 w-3.5 text-indigo-500" />
                                        <span className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">{t("student_portal_menus")}</span>
                                    </div>
                                    {portalMenuPermissions.map((menu) => {
                                        const subs = menu.submenus || [];
                                        const hasSubs = subs.length > 0;
                                        const checkState = getPortalMenuCheckState(menu.name);
                                        const expanded = expandedModules.has(menu.name);
                                        const hasPartial = hasSubs && subs.some(s => checkedPermNames.has(s.permission));
                                        const showExpanded = expanded || hasPartial;

                                        return (
                                            <div key={menu.name} className="border border-gray-100 rounded-md mb-1">
                                                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50/50 rounded-md transition-colors">
                                                    {hasSubs && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(menu.name)}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                                                        >
                                                            {showExpanded ? (
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <ChevronRightIcon className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                    {!hasSubs && <div className="w-3.5 flex-shrink-0" />}
                                                    <Checkbox
                                                        checked={checkState}
                                                        onCheckedChange={() => togglePortalMenu(menu.name)}
                                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                    />
                                                    <span className="text-[12px] font-medium text-gray-700">{menu.label}</span>
                                                </div>

                                                {hasSubs && showExpanded && (
                                                    <div className="ml-8 pb-2 space-y-0.5 border-l-2 border-indigo-100 pl-3">
                                                        {subs.map((sub) => {
                                                            const subChecked = checkedPermNames.has(sub.permission);
                                                            return (
                                                                <div key={sub.name} className="flex items-center gap-2 py-0.5">
                                                                    <div className="w-2 h-[1px] bg-indigo-200 flex-shrink-0" />
                                                                    <Checkbox
                                                                        checked={subChecked}
                                                                        onCheckedChange={() => togglePortalSubmenu(sub.permission)}
                                                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-3.5 w-3.5 rounded"
                                                                    />
                                                                    <span className={`text-[11px] ${subChecked ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>{sub.label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 px-1 mb-2">
                                        <LayoutDashboard className="h-3.5 w-3.5 text-indigo-500" />
                                        <span className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">{t("admin_panel_modules")}</span>
                                    </div>
                                    {moduleKeys.map((modKey) => {
                                        const subs = moduleSubmenus[modKey] || [];
                                        const label = sidebarModuleLabels[modKey] || modKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                                        const checkState = getModuleCheckState(modKey);
                                        const hasSubs = subs.length > 0;
                                        const expanded = expandedModules.has(modKey);
                                        const hasPartial = hasSubs && subs.some(s => {
                                            const pn = buildSubmenuPermNames(modKey, s.name);
                                            return pn.length > 0 && pn.some(n => checkedPermNames.has(n));
                                        });
                                        const showExpanded = expanded || hasPartial;

                                        return (
                                            <div key={modKey} className="border border-gray-100 rounded-md mb-1">
                                                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50/50 rounded-md transition-colors">
                                                    {hasSubs && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(modKey)}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                                                        >
                                                            {showExpanded ? (
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <ChevronRightIcon className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                    {!hasSubs && <div className="w-3.5 flex-shrink-0" />}
                                                    <Checkbox
                                                        checked={checkState}
                                                        onCheckedChange={() => toggleModule(modKey)}
                                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                    />
                                                    <span className="text-[12px] font-medium text-gray-700">{label}</span>
                                                </div>

                                                {hasSubs && showExpanded && (
                                                    <div className="ml-8 pb-2 space-y-0.5 border-l-2 border-indigo-100 pl-3">
                                                        {subs.map((sub) => {
                                                            const subChecked = isSubmenuChecked(modKey, sub.name);
                                                            return (
                                                                <div key={sub.name} className="flex items-center gap-2 py-0.5">
                                                                    <div className="w-2 h-[1px] bg-indigo-200 flex-shrink-0" />
                                                                    <Checkbox
                                                                        checked={subChecked}
                                                                        onCheckedChange={() => toggleSubmenu(modKey, sub.name)}
                                                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-3.5 w-3.5 rounded"
                                                                    />
                                                                    <span className={`text-[11px] ${subChecked ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>{sub.label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                        </CardContent>
                        <CardFooter className="flex justify-end pt-2 pb-4 px-6 border-t border-gray-50">
                            <Button
                                onClick={handleSavePermissions}
                                disabled={savingPermissions}
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white text-[12px] px-8 h-9 rounded-full shadow-md transition-all gap-2"
                            >
                                {savingPermissions ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-3.5 w-3.5" />
                                )}
                                {t("save_permissions")}
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>

            {/* Right Panel - Role List */}
            <div className="lg:col-span-3">
                <Card className="border-none shadow-sm pt-0 min-h-[500px] flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <LayoutDashboard className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("role_list")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("all_system_and_custom_roles")}</p>
                        </div>
                    </div>

                    <div className="p-3 pb-0 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 text-[11px] pl-8 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-8 w-[70px] text-[11px] border-gray-200 bg-gray-50/50 shadow-none focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent className="min-w-[70px]">
                                    <SelectItem value="50" className="text-[11px]">50</SelectItem>
                                    <SelectItem value="100" className="text-[11px]">100</SelectItem>
                                    <SelectItem value="200" className="text-[11px]">200</SelectItem>
                                    <SelectItem value="500" className="text-[11px]">500</SelectItem>
                                    <SelectItem value="All" className="text-[11px]">All</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Tooltip content={t("copy")}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCopy}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content={t("excel")}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleExportCSV}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content={t("pdf")}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrint}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content={t("print")}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrint}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content={t("column")}>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 outline-none">
                                                <Columns className="h-3.5 w-3.5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-32 p-1" align="end">
                                            <div className="space-y-0.5">
                                                {([
                                                    { id: 'role', label: t("role") },
                                                    { id: 'type', label: t("type") },
                                                    { id: 'action', label: t("action") }
                                                ] as const).map((col) => (
                                                    <div
                                                        key={col.id}
                                                        className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                                                        onClick={() => toggleColumn(col.id)}
                                                    >
                                                        <span className="text-[12px] text-gray-700">{col.label}</span>
                                                        {visibleColumns[col.id] && (
                                                            <Check className="h-3.5 w-3.5 text-indigo-500" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-hidden">
                        <Table className="table-fixed w-full border-collapse">
                            <TableHeader className="bg-gray-50/40">
                                <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                    {visibleColumns.role && <TableHead className="h-10 px-3 font-bold text-gray-600 uppercase w-auto">{t("role")}</TableHead>}
                                    {visibleColumns.type && <TableHead className="h-10 px-3 font-bold text-gray-600 uppercase w-[100px]">{t("type")}</TableHead>}
                                    {visibleColumns.action && <TableHead className="h-10 px-3 font-bold text-gray-600 uppercase text-right w-[140px]">{t("action")}</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={`sk-${i}`} className="border-b border-gray-50 h-11">
                                            {visibleColumns.role && (
                                                <TableCell className="py-2 px-3"><div className="h-3 rounded bg-gray-200/60 animate-pulse" style={{ width: `${55 + ((i * 7) % 30)}%` }} /></TableCell>
                                            )}
                                            {visibleColumns.type && (
                                                <TableCell className="py-2 px-3"><div className="h-3 w-14 rounded bg-gray-200/60 animate-pulse" /></TableCell>
                                            )}
                                            {visibleColumns.action && (
                                                <TableCell className="py-2 px-3">
                                                    <div className="flex justify-end gap-1">
                                                        <div className="h-6 w-6 rounded bg-gray-200/60 animate-pulse" />
                                                        <div className="h-6 w-6 rounded bg-gray-200/60 animate-pulse" />
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.role ? (visibleColumns.type ? (visibleColumns.action ? 3 : 2) : (visibleColumns.action ? 2 : 1)) : (visibleColumns.type ? (visibleColumns.action ? 2 : 1) : 1)} className="h-32 text-center text-gray-400 text-xs">{t("no_records_found")}</TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role) => (
                                        <TableRow key={role.id} className={`border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-11 group ${editingRole?.id === role.id ? 'bg-indigo-50/30' : ''}`}>
                                            {visibleColumns.role && (
                                                <TableCell className="py-2 px-3 text-[12px] text-gray-600 font-medium truncate max-w-0" title={role.name}>
                                                    {role.name}
                                                </TableCell>
                                            )}
                                            {visibleColumns.type && <TableCell className="py-2 px-3 text-[12px] text-gray-400 truncate">{role.is_system ? t("system") : t("custom")}</TableCell>}
                                            {visibleColumns.action && (
                                                <TableCell className="py-2 px-3 text-right">
                                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Tooltip content={editingRole?.id === role.id ? t("currently_editing") : t("edit_and_assign_permissions")}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(role)}
                                                                disabled={role.name === 'Super Admin'}
                                                                className={`h-7 w-7 ${role.name === 'Super Admin' ? 'bg-gray-100 text-gray-400' : editingRole?.id === role.id ? 'bg-indigo-500 text-white' : 'bg-[#6366f1] text-white hover:bg-[#5558dd] shadow-sm'} rounded-lg`}
                                                            >
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip content={t("delete_role")}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => promptDelete(role.id)}
                                                                disabled={role.name === 'Super Admin'}
                                                                className={`h-7 w-7 ${role.name === 'Super Admin' ? 'bg-gray-100 text-gray-400' : 'bg-red-500 text-white hover:bg-red-600 shadow-sm'} rounded-lg`}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {paginationMeta && (
                        <CardFooter className="py-3 items-center justify-between border-t border-gray-50">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("showing")} {paginationMeta.from || 0} {t("to")} {paginationMeta.to || 0} {t("of")} {paginationMeta.total || 0} {t("entries")}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!paginationMeta.prev_page_url}
                                    onClick={() => fetchRoles(paginationMeta.current_page - 1)}
                                    className="h-8 w-8 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg bg-gradient-to-r from-orange-400 to-indigo-500 text-white shadow-md hover:from-orange-500 hover:to-indigo-600 font-bold text-xs pointer-events-none"
                                >
                                    {paginationMeta.current_page}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!paginationMeta.next_page_url}
                                    onClick={() => fetchRoles(paginationMeta.current_page + 1)}
                                    className="h-8 w-8 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_role_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <style jsx global>{`
                @media print {
                    .no-print,
                    button,
                    nav,
                    input,
                    header,
                    .lg\\:col-span-1 {
                        display: none !important;
                    }
                    .lg\\:col-span-3 {
                        width: 100% !important;
                        grid-column: span 3 / span 3 !important;
                    }
                    .Card {
                        border: none !important;
                        box-shadow: none !important;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    );
}
