"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, toLocaleNumber } from "@/lib/utils";
import {
    KeyRound,
    Cpu,
    Plus,
    Copy,
    Check,
    Trash2,
    ShieldCheck,
    Zap,
    Terminal,
    Send,
    Loader2,
    CheckCircle2,
    BookOpen,
    Pencil,
    Search,
    Code,
} from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";
import { toast as sonnerToast } from "sonner";

interface ApiKeyItem {
    id: number;
    name: string;
    key: string;
    secret?: string;
    permissions: string[];
    rate_limit: number;
    status: boolean;
    last_used_at: string | null;
    created_at: string;
}

interface ApiEndpointItem {
    id: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    module: string;
    category: string;
    scope: string;
    desc: string;
}

const PERMISSION_SCOPES = [
    { id: "*", labelKey: "full_access", fallbackLabel: "Full Access (*)", desc: "All module endpoints & MCP tools" },
    { id: "students.read", labelKey: "students_read", fallbackLabel: "Students (Read)", desc: "View student directory & profiles" },
    { id: "students.write", labelKey: "students_write", fallbackLabel: "Students (Write)", desc: "Create & update student records" },
    { id: "staff.read", labelKey: "staff_read", fallbackLabel: "Staff (Read)", desc: "View staff directory & designations" },
    { id: "fees.read", labelKey: "fees_read", fallbackLabel: "Fee Collection (Read)", desc: "View fee structures & due reports" },
    { id: "attendance.read", labelKey: "attendance_read", fallbackLabel: "Attendance (Read)", desc: "View student & staff attendance" },
    { id: "mcp.all", labelKey: "mcp_all", fallbackLabel: "MCP Protocol (All)", desc: "Execute Model Context Protocol tools" },
];

const API_ENDPOINTS_DIRECTORY: ApiEndpointItem[] = [
    // Authentication
    { id: "a1",  method: "POST",   path: "/api/v1/login",                                              module: "Authentication",        category: "auth",              scope: "*",              desc: "Authenticate user and obtain Sanctum access token." },
    { id: "a2",  method: "POST",   path: "/api/v1/logout",                                             module: "Authentication",        category: "auth",              scope: "*",              desc: "Revoke the currently authenticated user's access token." },
    { id: "a3",  method: "GET",    path: "/api/v1/profile",                                            module: "Authentication",        category: "auth",              scope: "*",              desc: "Get the authenticated user's profile and role information." },

    // Student Information
    { id: "s1",  method: "GET",    path: "/api/v1/students",                                           module: "Student Information",   category: "student_info",      scope: "students.read",  desc: "List all enrolled students with class, section, roll number, and search filters." },
    { id: "s2",  method: "GET",    path: "/api/v1/students/{id}",                                      module: "Student Information",   category: "student_info",      scope: "students.read",  desc: "Fetch a specific student's complete profile details." },
    { id: "s3",  method: "POST",   path: "/api/v1/students",                                           module: "Student Information",   category: "student_info",      scope: "students.write", desc: "Create a new student record with profile, parent details, and class assignment." },
    { id: "s4",  method: "PUT",    path: "/api/v1/students/{id}",                                      module: "Student Information",   category: "student_info",      scope: "students.write", desc: "Update existing student profile, guardian info, and enrollment status." },
    { id: "s5",  method: "DELETE", path: "/api/v1/students/{id}",                                      module: "Student Information",   category: "student_info",      scope: "students.write", desc: "Delete or disable a student record from the active directory." },
    { id: "s6",  method: "GET",    path: "/api/v1/students/disabled",                                  module: "Student Information",   category: "student_info",      scope: "students.read",  desc: "List all disabled / inactive student records." },
    { id: "s7",  method: "GET",    path: "/api/v1/students/generate-admission-no",                     module: "Student Information",   category: "student_info",      scope: "students.read",  desc: "Auto-generate the next available student admission number." },
    { id: "s8",  method: "GET",    path: "/api/v1/online-admissions",                                  module: "Student Information",   category: "student_info",      scope: "students.read",  desc: "Fetch online admission submissions and pending approval queue." },
    { id: "s9",  method: "DELETE", path: "/api/v1/online-admissions/{id}",                             module: "Student Information",   category: "student_info",      scope: "students.write", desc: "Delete an online admission application record." },
    { id: "s10", method: "GET",    path: "/api/v1/multi-class-students",                               module: "Student Information",   category: "student_info",      scope: "students.read",  desc: "List students enrolled in multiple classes simultaneously." },
    { id: "s11", method: "DELETE", path: "/api/v1/multi-class-students/{id}",                          module: "Student Information",   category: "student_info",      scope: "students.write", desc: "Remove a student's multi-class enrollment entry." },

    // Front Office
    { id: "fo1", method: "GET",    path: "/api/v1/front-office/admission-enquiries",                   module: "Front Office",          category: "front_office",      scope: "front_office.read",  desc: "Fetch admission enquiry logs with follow-up status and source." },
    { id: "fo2", method: "POST",   path: "/api/v1/front-office/admission-enquiries",                   module: "Front Office",          category: "front_office",      scope: "front_office.write", desc: "Create a new admission enquiry record." },
    { id: "fo3", method: "GET",    path: "/api/v1/front-office/visitors",                              module: "Front Office",          category: "front_office",      scope: "front_office.read",  desc: "Retrieve visitor logbook entries with timestamps and purpose." },
    { id: "fo4", method: "POST",   path: "/api/v1/front-office/visitors",                              module: "Front Office",          category: "front_office",      scope: "front_office.write", desc: "Log a new visitor check-in entry." },
    { id: "fo5", method: "GET",    path: "/api/v1/front-office/phone-call-logs",                       module: "Front Office",          category: "front_office",      scope: "front_office.read",  desc: "List outgoing and incoming phone call log records." },
    { id: "fo6", method: "GET",    path: "/api/v1/front-office/postal-dispatches",                     module: "Front Office",          category: "front_office",      scope: "front_office.read",  desc: "Retrieve outgoing postal dispatch records." },
    { id: "fo7", method: "GET",    path: "/api/v1/front-office/postal-receives",                       module: "Front Office",          category: "front_office",      scope: "front_office.read",  desc: "Retrieve incoming postal receive records." },
    { id: "fo8", method: "GET",    path: "/api/v1/front-office/complaints",                            module: "Front Office",          category: "front_office",      scope: "front_office.read",  desc: "List registered school complaints and their resolution status." },

    // Academics
    { id: "ac1", method: "GET",    path: "/api/v1/academics/classes",                                  module: "Academics",             category: "academics",         scope: "academics.read",  desc: "List all academic school classes with section counts." },
    { id: "ac2", method: "POST",   path: "/api/v1/academics/classes",                                  module: "Academics",             category: "academics",         scope: "academics.write", desc: "Create a new school class record." },
    { id: "ac3", method: "PUT",    path: "/api/v1/academics/classes/{id}",                             module: "Academics",             category: "academics",         scope: "academics.write", desc: "Update an existing class name or attributes." },
    { id: "ac4", method: "DELETE", path: "/api/v1/academics/classes/{id}",                             module: "Academics",             category: "academics",         scope: "academics.write", desc: "Delete a class record from the system." },
    { id: "ac5", method: "GET",    path: "/api/v1/academics/sections",                                 module: "Academics",             category: "academics",         scope: "academics.read",  desc: "Fetch class section allotments and room capacity info." },
    { id: "ac6", method: "GET",    path: "/api/v1/academics/subjects",                                 module: "Academics",             category: "academics",         scope: "academics.read",  desc: "List all curriculum subjects with theory/practical code definitions." },
    { id: "ac7", method: "GET",    path: "/api/v1/academics/subject-groups",                           module: "Academics",             category: "academics",         scope: "academics.read",  desc: "Retrieve subject groups and their assigned subject mappings." },
    { id: "ac8", method: "GET",    path: "/api/v1/academics/class-timetables",                         module: "Academics",             category: "academics",         scope: "academics.read",  desc: "Fetch class-wise weekly timetable schedules." },
    { id: "ac9", method: "GET",    path: "/api/v1/academics/class-teachers",                           module: "Academics",             category: "academics",         scope: "academics.read",  desc: "List class-teacher assignments per class and section." },
    { id: "ac10",method: "POST",   path: "/api/v1/academics/promote-students",                         module: "Academics",             category: "academics",         scope: "academics.write", desc: "Promote students from one class/session to the next year." },

    // Human Resource
    { id: "hr1", method: "GET",    path: "/api/v1/staff-directory",                                    module: "Human Resource",        category: "academics_hr",      scope: "staff.read",      desc: "Retrieve school staff directory, teachers, and designations." },
    { id: "hr2", method: "GET",    path: "/api/v1/staff-directory/{id}",                               module: "Human Resource",        category: "academics_hr",      scope: "staff.read",      desc: "Fetch a specific staff member's full profile." },
    { id: "hr3", method: "POST",   path: "/api/v1/staff-directory",                                    module: "Human Resource",        category: "academics_hr",      scope: "staff.write",     desc: "Add new teacher or staff employee record to the directory." },
    { id: "hr4", method: "PUT",    path: "/api/v1/staff-directory/{id}",                               module: "Human Resource",        category: "academics_hr",      scope: "staff.write",     desc: "Update staff details, department, or designation." },
    { id: "hr5", method: "DELETE", path: "/api/v1/staff-directory/{id}",                               module: "Human Resource",        category: "academics_hr",      scope: "staff.write",     desc: "Delete a staff member from the active directory." },
    { id: "hr6", method: "GET",    path: "/api/v1/hr/payroll",                                         module: "Human Resource",        category: "academics_hr",      scope: "staff.read",      desc: "Fetch staff payroll records, salary slips, and payment history." },
    { id: "hr7", method: "GET",    path: "/api/v1/hr/staff-attendance",                                module: "Human Resource",        category: "academics_hr",      scope: "staff.read",      desc: "Retrieve daily staff attendance records and leave counts." },
    { id: "hr8", method: "GET",    path: "/api/v1/teacher-ratings",                                    module: "Human Resource",        category: "academics_hr",      scope: "staff.read",      desc: "Fetch teacher performance rating submissions from students." },
    { id: "hr9", method: "GET",    path: "/api/v1/hr/leave-requests",                                  module: "Human Resource",        category: "academics_hr",      scope: "staff.read",      desc: "List staff leave requests and their approval status." },
    { id: "hr10",method: "PUT",    path: "/api/v1/hr/leave-requests/{id}/status",                      module: "Human Resource",        category: "academics_hr",      scope: "staff.write",     desc: "Approve or reject a staff leave request." },

    // Fees Collection & Finance
    { id: "f1",  method: "GET",    path: "/api/v1/fee-collection/fee-collection",                      module: "Fees Collection",       category: "fees_finance",      scope: "fees.read",       desc: "Fetch student fee collection ledgers, transactions, and balance dues." },
    { id: "f2",  method: "POST",   path: "/api/v1/fee-collection/fee-collection",                      module: "Fees Collection",       category: "fees_finance",      scope: "fees.write",      desc: "Record a fee payment transaction against a student invoice." },
    { id: "f3",  method: "GET",    path: "/api/v1/fee-collection/fees-groups",                         module: "Fees Collection",       category: "fees_finance",      scope: "fees.read",       desc: "List fee structure groups (Tuition, Bus, Library, Hostel fees)." },
    { id: "f4",  method: "POST",   path: "/api/v1/fee-collection/fees-groups",                         module: "Fees Collection",       category: "fees_finance",      scope: "fees.write",      desc: "Create a new fee group for a class-session combination." },
    { id: "f5",  method: "GET",    path: "/api/v1/fee-collection/fees-types",                          module: "Fees Collection",       category: "fees_finance",      scope: "fees.read",       desc: "List all fee type master records and code definitions." },
    { id: "f6",  method: "GET",    path: "/api/v1/fee-collection/fees-masters",                        module: "Fees Collection",       category: "fees_finance",      scope: "fees.read",       desc: "Fetch fee master schedules for each class and session." },
    { id: "f7",  method: "GET",    path: "/api/v1/fee-collection/offline-payments",                    module: "Fees Collection",       category: "fees_finance",      scope: "fees.read",       desc: "List offline bank payment submissions awaiting verification." },
    { id: "f8",  method: "DELETE", path: "/api/v1/fee-collection/student-fees/{id}",                   module: "Fees Collection",       category: "fees_finance",      scope: "fees.write",      desc: "Delete a specific student fee invoice record." },
    { id: "f9",  method: "GET",    path: "/api/v1/balance-fees-report",                                module: "Fees Collection",       category: "fees_finance",      scope: "fees.read",       desc: "Generate the balance fees outstanding report across all classes." },
    { id: "f10", method: "GET",    path: "/api/v1/income/incomes",                                     module: "Income",                category: "fees_finance",      scope: "finance.read",    desc: "Retrieve school general income transaction entries and receipt logs." },
    { id: "f11", method: "POST",   path: "/api/v1/income/incomes",                                     module: "Income",                category: "fees_finance",      scope: "finance.write",   desc: "Record a new school income transaction entry." },
    { id: "f12", method: "GET",    path: "/api/v1/expense/expenses",                                   module: "Expenses",              category: "fees_finance",      scope: "finance.read",    desc: "Retrieve operational expense vouchers and expense head breakdowns." },
    { id: "f13", method: "POST",   path: "/api/v1/expense/expenses",                                   module: "Expenses",              category: "fees_finance",      scope: "finance.write",   desc: "Create a new expense voucher entry." },

    // Attendance & Exams
    { id: "at1", method: "GET",    path: "/api/v1/attendance/student",                                 module: "Attendance",            category: "attendance_exams",  scope: "attendance.read",  desc: "Fetch daily class student attendance records by date and class." },
    { id: "at2", method: "POST",   path: "/api/v1/attendance/student-attendance",                      module: "Attendance",            category: "attendance_exams",  scope: "attendance.write", desc: "Submit or bulk update student daily attendance entries." },
    { id: "ex1", method: "GET",    path: "/api/v1/examination/exam-group",                             module: "Examinations",          category: "attendance_exams",  scope: "exams.read",      desc: "Fetch examination groups, schedule periods, and grading standards." },
    { id: "ex2", method: "GET",    path: "/api/v1/examination/exam-schedule",                          module: "Examinations",          category: "attendance_exams",  scope: "exams.read",      desc: "Retrieve exam schedule timetable for selected exam group." },
    { id: "ex3", method: "GET",    path: "/api/v1/examination/exam-result",                            module: "Examinations",          category: "attendance_exams",  scope: "exams.read",      desc: "Retrieve student exam marksheets, grades, and rank reports." },

    // API Keys & MCP
    { id: "ak1", method: "GET",    path: "/api/v1/system-setting/api-keys",                            module: "API Keys & MCP",        category: "mcp_ai",            scope: "system.read",     desc: "List all RESTful API keys with scopes, rate limits, and status." },
    { id: "ak2", method: "POST",   path: "/api/v1/system-setting/api-keys",                            module: "API Keys & MCP",        category: "mcp_ai",            scope: "system.write",    desc: "Generate a new API key with permission scopes and rate limits." },
    { id: "ak3", method: "PUT",    path: "/api/v1/system-setting/api-keys/{id}",                       module: "API Keys & MCP",        category: "mcp_ai",            scope: "system.write",    desc: "Update API key name, scopes, and rate limit settings." },
    { id: "ak4", method: "DELETE", path: "/api/v1/system-setting/api-keys/{id}",                       module: "API Keys & MCP",        category: "mcp_ai",            scope: "system.write",    desc: "Permanently revoke and delete an API key." },
    { id: "ak5", method: "GET",    path: "/api/v1/mcp/manifest",                                       module: "API Keys & MCP",        category: "mcp_ai",            scope: "mcp.all",         desc: "Fetch MCP server manifest with capabilities and tool listings." },
    { id: "ak6", method: "POST",   path: "/api/v1/mcp",                                                module: "API Keys & MCP",        category: "mcp_ai",            scope: "mcp.all",         desc: "Execute MCP JSON-RPC 2.0 requests (initialize, tools/list, tools/call)." },
];

interface McpToolDef {
    name:        string;
    label:       string;
    category:    string;
    desc:        string;
    paramType:   "none" | "search" | "class_filter" | "sms" | "date_filter" | "id" | "subject_filter";
    paramHint?:  string;
}

const MCP_TOOLS: McpToolDef[] = [
    { name: "get_students",                category: "Students",          label: "get_students",                paramType: "search",        paramHint: "Search by name, roll, or admission number",        desc: "Retrieve student directory with optional name/ID search and class filter." },
    { name: "get_student_by_id",           category: "Students",          label: "get_student_by_id",           paramType: "id",            paramHint: "Enter student numeric ID",                         desc: "Fetch a specific student's complete profile by numeric ID." },
    { name: "get_classes",                 category: "Academics",         label: "get_classes",                 paramType: "none",                                                                        desc: "List all school academic classes." },
    { name: "get_sections",                category: "Academics",         label: "get_sections",                paramType: "class_filter",  paramHint: "Enter class ID to filter sections",                desc: "Retrieve class sections, optionally filtered by class ID." },
    { name: "get_subjects",                category: "Academics",         label: "get_subjects",                paramType: "class_filter",  paramHint: "Enter class ID to filter subjects",                desc: "List curriculum subjects for a given class." },
    { name: "get_staff",                   category: "HR & Payroll",      label: "get_staff",                   paramType: "search",        paramHint: "Search by name or employee ID",                    desc: "Retrieve school staff directory, teachers, and designations." },
    { name: "get_fee_due_list",            category: "Fees & Finance",    label: "get_fee_due_list",            paramType: "class_filter",  paramHint: "Enter class ID to filter dues",                    desc: "Generate overdue fee list across classes." },
    { name: "get_attendance_summary",      category: "Attendance",        label: "get_attendance_summary",      paramType: "date_filter",   paramHint: "Enter date YYYY-MM-DD",                            desc: "Fetch student attendance summary for a specific date." },
    { name: "get_exam_results",            category: "Examinations",      label: "get_exam_results",            paramType: "class_filter",  paramHint: "Enter class ID to filter results",                 desc: "Retrieve student exam marksheets and grade reports." },
    { name: "send_sms_notification",       category: "Communicate",       label: "send_sms_notification",       paramType: "sms",                                                                         desc: "Dispatch an SMS notification to a specified phone number." },
    { name: "get_system_settings",         category: "System",            label: "get_system_settings",         paramType: "none",                                                                        desc: "Retrieve school profile, session year, and general settings." },
    { name: "get_dashboard_stats",         category: "System",            label: "get_dashboard_stats",         paramType: "none",                                                                        desc: "Fetch main dashboard KPIs: student count, fee collection, attendance rate." },
];

export default function ApiKeyPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();

    const [activeTab, setActiveTab] = useState<"keys" | "mcp" | "docs">("keys");
    const [loading, setLoading] = useState<boolean>(true);
    const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
    const [stats, setStats] = useState<{ total_keys: number; active_keys: number; mcp_status: string }>({
        total_keys: 0,
        active_keys: 0,
        mcp_status: "Active"
    });

    // Create Modal state
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [creating, setCreating] = useState<boolean>(false);
    const [newKeyName, setNewKeyName] = useState<string>("");
    const [newRateLimit, setNewRateLimit] = useState<number>(60);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["*"]);

    // Edit Modal state
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<ApiKeyItem | null>(null);
    const [editKeyName, setEditKeyName] = useState<string>("");
    const [editRateLimit, setEditRateLimit] = useState<number>(60);
    const [editPermissions, setEditPermissions] = useState<string[]>(["*"]);
    const [updating, setUpdating] = useState<boolean>(false);

    // Created Secret Key Modal
    const [createdSecret, setCreatedSecret] = useState<string | null>(null);
    const [copiedSecret, setCopiedSecret] = useState<boolean>(false);

    // MCP Tester state
    const [mcpTool, setMcpTool] = useState<string>("get_students");
    const [mcpToolSearch, setMcpToolSearch] = useState<string>("");
    const [mcpToolCategory, setMcpToolCategory] = useState<string>("All");
    const [mcpSearch, setMcpSearch] = useState<string>("");
    const [mcpPhone, setMcpPhone] = useState<string>("+1234567890");
    const [mcpMessage, setMcpMessage] = useState<string>("Hello from iSchool MCP!");
    const [mcpTesting, setMcpTesting] = useState<boolean>(false);
    const [mcpResult, setMcpResult] = useState<any>(null);

    // API Endpoints Directory filters
    const [docCategory, setDocCategory] = useState<string>("all");
    const [docSearch, setDocSearch] = useState<string>("");
    const [docMethod, setDocMethod] = useState<string>("all");
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointItem>(API_ENDPOINTS_DIRECTORY[0]);
    const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        setLoading(true);
        try {
            const res = await api.get('/system-setting/api-keys');
            if (res.data?.status === 'success') {
                setApiKeys(res.data.data || []);
                if (res.data.stats) {
                    setStats(res.data.stats);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return;
        setCreating(true);
        try {
            const res = await api.post('/system-setting/api-keys', {
                name: newKeyName.trim(),
                permissions: selectedPermissions,
                rate_limit: newRateLimit,
            });
            if (res.data?.status === 'success') {
                setIsCreateOpen(false);
                setNewKeyName("");
                setSelectedPermissions(["*"]);
                setNewRateLimit(60);
                if (res.data.secret) {
                    setCreatedSecret(res.data.secret);
                }
                fetchApiKeys();
                sonnerToast.success(t("key_created_successfully"));
            }
        } catch (error: any) {
            sonnerToast.error(error.response?.data?.message || t("failed_to_save"));
        } finally {
            setCreating(false);
        }
    };

    const handleOpenEditModal = (item: ApiKeyItem) => {
        setEditingItem(item);
        setEditKeyName(item.name);
        setEditRateLimit(item.rate_limit || 60);
        setEditPermissions(item.permissions || ["*"]);
        setIsEditOpen(true);
    };

    const handleUpdateKey = async () => {
        if (!editingItem || !editKeyName.trim()) return;
        setUpdating(true);
        try {
            const res = await api.put(`/system-setting/api-keys/${editingItem.id}`, {
                name: editKeyName.trim(),
                permissions: editPermissions,
                rate_limit: editRateLimit,
            });
            if (res.data?.status === 'success') {
                setIsEditOpen(false);
                fetchApiKeys();
                sonnerToast.success(t("key_updated_successfully"));
            }
        } catch (error: any) {
            sonnerToast.error(error.response?.data?.message || t("failed_to_save"));
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleStatus = async (id: number, name: string) => {
        try {
            const res = await api.post(`/system-setting/api-keys/${id}/toggle`);
            if (res.data?.status === 'success') {
                setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: res.data.data.status } : k));
                sonnerToast.success(t("key_updated_successfully"));
            }
        } catch (error) {
            sonnerToast.error(t("failed_to_save"));
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!window.confirm(t("confirm_delete") || "Are you sure you want to delete this API Key?")) return;
        try {
            const res = await api.delete(`/system-setting/api-keys/${id}`);
            if (res.data?.status === 'success') {
                setApiKeys(prev => prev.filter(k => k.id !== id));
                sonnerToast.success(t("key_deleted_successfully"));
            }
        } catch (error) {
            sonnerToast.error(t("failed_to_save"));
        }
    };

    const handleTestMcpTool = async () => {
        setMcpTesting(true);
        setMcpResult(null);
        const toolDef = MCP_TOOLS.find(t => t.name === mcpTool);
        try {
            let args: any = {};
            if (toolDef?.paramType === "search" && mcpSearch.trim())        args.search  = mcpSearch.trim();
            if (toolDef?.paramType === "class_filter" && mcpSearch.trim())  args.class_id = mcpSearch.trim();
            if (toolDef?.paramType === "date_filter" && mcpSearch.trim())   args.date    = mcpSearch.trim();
            if (toolDef?.paramType === "id" && mcpSearch.trim())            args.id      = mcpSearch.trim();
            if (toolDef?.paramType === "sms") {
                args.phone   = mcpPhone.trim();
                args.message = mcpMessage.trim();
            }

            const res = await api.post('/mcp', {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: { name: mcpTool, arguments: args }
            });

            setMcpResult(res.data);
            if (!res.data?.result?.isError) {
                sonnerToast.success(`${t("execute_mcp_tool")}: ${mcpTool}`);
            } else {
                sonnerToast.error(t("failed_to_save"));
            }
        } catch (error: any) {
            setMcpResult({ error: error.response?.data?.message || error.message || "MCP Execution Failed" });
            sonnerToast.error(t("failed_to_save"));
        } finally {
            setMcpTesting(false);
        }
    };

    const copyToClipboard = (text: string, type: 'secret' | 'snippet') => {
        navigator.clipboard.writeText(text);
        if (type === 'secret') {
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        } else {
            setCopiedSnippet(true);
            setTimeout(() => setCopiedSnippet(false), 2000);
        }
        sonnerToast.success(t("copied_to_clipboard"));
    };

    const translateCategory = (cat: string) => {
        switch (cat) {
            case "auth": return t("authentication") || "Authentication";
            case "student_info":
            case "Students": return t("student_information") || "Student Information";
            case "front_office":
            case "Operations": return t("front_office") || "Front Office";
            case "academics":
            case "Academics": return t("academics") || "Academics";
            case "academics_hr":
            case "HR & Payroll": return t("human_resource") || "HR & Payroll";
            case "fees_finance":
            case "Fees & Finance": return t("fees_collection") || "Fees & Finance";
            case "attendance_exams":
            case "Attendance":
            case "Examinations": return t("attendance") || "Attendance & Exams";
            case "communicate_sms":
            case "Communicate": return t("communicate") || "Communicate";
            case "mcp_ai":
            case "System": return t("system_setting") || "System & MCP";
            default: return cat;
        }
    };

    const filteredEndpoints = useMemo(() => {
        return API_ENDPOINTS_DIRECTORY.filter((item) => {
            const matchesCategory = docCategory === "all" || item.category === docCategory;
            const matchesMethod = docMethod === "all" || item.method === docMethod;
            const query = docSearch.toLowerCase().trim();
            const matchesSearch =
                !query ||
                item.path.toLowerCase().includes(query) ||
                item.module.toLowerCase().includes(query) ||
                item.desc.toLowerCase().includes(query) ||
                item.scope.toLowerCase().includes(query);
            return matchesCategory && matchesMethod && matchesSearch;
        });
    }, [docCategory, docMethod, docSearch]);

    const mcpEndpointUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/mcp` : '/api/v1/mcp';
    const apiBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}` : 'http://localhost:3000';

    const claudeConfigCode = `{
  "mcpServers": {
    "ischool": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "${mcpEndpointUrl}"
      ],
      "env": {
        "X_API_KEY": "ischool_sk_YOUR_GENERATED_KEY_HERE"
      }
    }
  }
}`;

    const currentCurlCode = `curl -X ${selectedEndpoint.method} "${apiBaseUrl}${selectedEndpoint.path}" \\
  -H "X-API-KEY: ischool_sk_YOUR_GENERATED_KEY" \\
  -H "Content-Type: application/json"`;

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            
            {/* Page Header Banner (Mandatory Rule: Edge-to-edge gradient div, NEVER inside Card) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <KeyRound className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("api_keys_mcp_title")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("api_keys_mcp_desc")}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-9 px-4 text-xs font-bold rounded-lg shadow-xs transition-all border-none cursor-pointer"
                >
                    <Plus className="h-4 w-4 mr-1.5" /> {t("generate_new_api_key")}
                </Button>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-3.5 border-gray-100 shadow-xs bg-white rounded-xl">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {t("total_api_keys")}
                        </p>
                        <p className="text-xl font-extrabold text-gray-800 leading-tight">
                            {loading ? "..." : toLocaleNumber(stats.total_keys, language?.short_code)}
                        </p>
                        <p className="text-[10px] font-semibold text-indigo-600 mt-0.5">
                            {toLocaleNumber(stats.active_keys, language?.short_code)} {t("active_keys_configured")}
                        </p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5 border-gray-100 shadow-xs bg-white rounded-xl">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {t("active_keys")}
                        </p>
                        <p className="text-xl font-extrabold text-emerald-600 leading-tight">
                            {loading ? "..." : toLocaleNumber(stats.active_keys, language?.short_code)}
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                            {t("operational_verified")}
                        </p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5 border-gray-100 shadow-xs bg-white rounded-xl">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {t("mcp_server_status")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-extrabold text-gray-800">{stats.mcp_status} (JSON-RPC 2.0)</span>
                        </div>
                        <p className="text-[10px] font-semibold text-purple-600 mt-0.5">
                            {toLocaleNumber(MCP_TOOLS.length, language?.short_code)} {t("core_mcp_tools_active")}
                        </p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5 border-gray-100 shadow-xs bg-white rounded-xl">
                    <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {t("default_rate_limit")}
                        </p>
                        <p className="text-xl font-extrabold text-gray-800 leading-tight">
                            {toLocaleNumber(60, language?.short_code)} {t("req_per_min")}
                        </p>
                        <p className="text-[10px] font-semibold text-orange-600 mt-0.5">
                            {t("configurable_up_to")}
                        </p>
                    </div>
                </Card>
            </div>

            {/* High Contrast Navigation Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-white/95 border border-gray-200/80 shadow-xs gap-1 flex-wrap">
                <button
                    type="button"
                    onClick={() => setActiveTab("keys")}
                    className={cn(
                        "h-8 px-4 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer select-none",
                        activeTab === "keys"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                    )}
                >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>{t("api_keys_management")}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("mcp")}
                    className={cn(
                        "h-8 px-4 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer select-none",
                        activeTab === "mcp"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                    )}
                >
                    <Cpu className="h-3.5 w-3.5" />
                    <span>{t("mcp_ai_agent_protocol")}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("docs")}
                    className={cn(
                        "h-8 px-4 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer select-none",
                        activeTab === "docs"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                    )}
                >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>
                        {t("rest_api_documentation")} ({toLocaleNumber(API_ENDPOINTS_DIRECTORY.length, language?.short_code)}+)
                    </span>
                </button>
            </div>

            {/* TAB 1: API Keys Management */}
            {activeTab === "keys" && (
                <Card className="rounded-xl border-gray-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="px-5 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-gray-800">
                                {t("active_api_keys")}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500 mt-0.5">
                                {t("active_api_keys_desc")}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 space-y-3">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : apiKeys.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <KeyRound className="h-12 w-12 text-gray-300 mx-auto" />
                                <p className="text-xs font-bold text-gray-600 uppercase">
                                    {t("no_api_keys_generated")}
                                </p>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    {t("no_api_keys_desc")}
                                </p>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    size="sm"
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white text-xs font-bold uppercase mt-2 rounded-lg"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" /> {t("create_first_api_key")}
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead className="text-xs font-bold text-gray-600">{t("key_name")}</TableHead>
                                            <TableHead className="text-xs font-bold text-gray-600">{t("token_prefix")}</TableHead>
                                            <TableHead className="text-xs font-bold text-gray-600">{t("permissions")}</TableHead>
                                            <TableHead className="text-xs font-bold text-gray-600">{t("rate_limit")}</TableHead>
                                            <TableHead className="text-xs font-bold text-gray-600">{t("status")}</TableHead>
                                            <TableHead className="text-xs font-bold text-gray-600">{t("last_used")}</TableHead>
                                            <TableHead className="text-xs font-bold text-gray-600 text-right">{t("action") || t("actions")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {apiKeys.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-gray-50/50 h-12">
                                                <TableCell className="font-bold text-xs text-gray-800">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit">
                                                    {item.secret || item.key.substring(0, 15) + "..."}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(item.permissions || ["*"]).map((perm) => (
                                                            <span
                                                                key={perm}
                                                                className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                                                            >
                                                                {perm}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-600 font-semibold">
                                                    {toLocaleNumber(item.rate_limit || 60, language?.short_code)} {t("req_per_min")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={item.status}
                                                            onCheckedChange={() => handleToggleStatus(item.id, item.name)}
                                                            className="data-[state=checked]:bg-emerald-600 scale-90"
                                                        />
                                                        <span className={cn("text-xs font-bold", item.status ? "text-emerald-600" : "text-gray-400")}>
                                                            {item.status ? t("active") : t("revoked")}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-400">
                                                    {item.last_used_at ? new Date(item.last_used_at).toLocaleString() : t("never")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenEditModal(item)}
                                                            className="bg-gradient-to-r from-amber-500 to-orange-600 h-7 w-7 rounded-lg text-white shadow-xs active:scale-95 transition-all"
                                                            title={t("edit_api_key")}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => copyToClipboard(item.key, 'snippet')}
                                                            className="bg-gradient-to-r from-[#6366f1] to-indigo-600 h-7 w-7 rounded-lg text-white shadow-xs active:scale-95 transition-all"
                                                            title={t("copy_token")}
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteKey(item.id)}
                                                            className="bg-gradient-to-r from-rose-500 to-red-600 h-7 w-7 rounded-lg text-white shadow-xs active:scale-95 transition-all"
                                                            title={t("delete_key")}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB 2: Model Context Protocol (MCP) */}
            {activeTab === "mcp" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Setup Guide */}
                    <Card className="rounded-xl border-indigo-100 shadow-sm bg-white overflow-hidden">
                        <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                            <Cpu className="h-5 w-5 text-indigo-600" />
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">{t("mcp_client_setup_guide")}</h2>
                                <p className="text-xs text-gray-500">{t("mcp_client_setup_desc")}</p>
                            </div>
                        </div>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-600 uppercase">{t("mcp_server_endpoint")}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={mcpEndpointUrl}
                                        className="font-mono text-xs bg-gray-50 border-gray-200 h-9"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(mcpEndpointUrl, 'snippet')}
                                        className="h-9 px-3 text-xs border-indigo-200 text-indigo-700"
                                    >
                                        <Copy className="h-3.5 w-3.5 mr-1" /> {t("copy") || "Copy"}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-gray-600 uppercase">
                                        {t("claude_config_snippet")}
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(claudeConfigCode, 'snippet')}
                                        className="h-6 text-[10px] text-indigo-600 font-bold uppercase"
                                    >
                                        {copiedSnippet ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                                        {copiedSnippet ? t("copied_to_clipboard") : t("copy_json")}
                                    </Button>
                                </div>
                                <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto leading-relaxed border border-gray-800">
                                    {claudeConfigCode}
                                </pre>
                            </div>

                            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                                {t("mcp_how_it_works")}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Live Interactive MCP Tester */}
                    <Card className="rounded-xl border-emerald-100 shadow-sm bg-white overflow-hidden">
                        <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                            <Terminal className="h-5 w-5 text-emerald-600" />
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">{t("interactive_mcp_inspector")}</h2>
                                <p className="text-xs text-gray-500">{t("interactive_mcp_desc")}</p>
                            </div>
                        </div>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-gray-600 uppercase">{t("select_mcp_tool")}</Label>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        {toLocaleNumber(MCP_TOOLS.length, language?.short_code)} {t("tools_available")}
                                    </span>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-400" />
                                    <Input
                                        placeholder={t("search_tools")}
                                        value={mcpToolSearch}
                                        onChange={e => setMcpToolSearch(e.target.value)}
                                        className="pl-7 h-8 text-xs border-gray-200 bg-white"
                                    />
                                </div>

                                <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border border-gray-100 bg-gray-50/40 p-1.5">
                                    {MCP_TOOLS
                                        .filter(item =>
                                            mcpToolSearch === "" ||
                                            item.name.toLowerCase().includes(mcpToolSearch.toLowerCase()) ||
                                            item.desc.toLowerCase().includes(mcpToolSearch.toLowerCase())
                                        )
                                        .map(tool => (
                                            <div
                                                key={tool.name}
                                                onClick={() => { setMcpTool(tool.name); setMcpSearch(""); }}
                                                className={cn(
                                                    "p-2 rounded-lg cursor-pointer border transition-all",
                                                    mcpTool === tool.name
                                                        ? "border-emerald-500 bg-emerald-50/70 shadow-xs"
                                                        : "border-transparent hover:border-emerald-200 hover:bg-white"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-xs font-bold font-mono text-gray-800">{tool.name}</span>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                                        {translateCategory(tool.category)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{tool.desc}</p>
                                            </div>
                                        ))
                                    }
                                </div>

                                {mcpTool && (() => {
                                    const sel = MCP_TOOLS.find(item => item.name === mcpTool);
                                    return sel ? (
                                        <div className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-emerald-800 font-mono">{sel.name}</p>
                                                <p className="text-[11px] text-emerald-700 mt-0.5">{sel.desc}</p>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </div>

                            {/* Tool parameter inputs */}
                            {(() => {
                                const sel = MCP_TOOLS.find(item => item.name === mcpTool);
                                if (!sel) return null;
                                if (sel.paramType === "sms") return (
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-600 uppercase">{t("phone_number")}</Label>
                                            <Input type="text" value={mcpPhone} onChange={e => setMcpPhone(e.target.value)} className="h-8 text-xs border-gray-200" placeholder="+880xxxxxxxxxx" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-600 uppercase">{t("message_text")}</Label>
                                            <Input type="text" value={mcpMessage} onChange={e => setMcpMessage(e.target.value)} className="h-8 text-xs border-gray-200" placeholder="Your message here…" />
                                        </div>
                                    </div>
                                );
                                if (sel.paramType !== "none") return (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-600 uppercase">{t("parameter")}</Label>
                                        <Input
                                            type="text"
                                            value={mcpSearch}
                                            onChange={e => setMcpSearch(e.target.value)}
                                            className="h-8 text-xs border-gray-200"
                                            placeholder={sel.paramHint || "Enter parameter value…"}
                                        />
                                    </div>
                                );
                                return null;
                            })()}

                            <Button
                                onClick={handleTestMcpTool}
                                disabled={mcpTesting}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white h-9 text-xs font-bold uppercase rounded-lg shadow-xs"
                            >
                                {mcpTesting ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> {t("executing")}</>
                                ) : (
                                    <><Send className="h-3.5 w-3.5 mr-1.5" /> {t("execute_mcp_tool")}</>
                                )}
                            </Button>

                            {mcpResult && (
                                <div className="space-y-1 pt-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase">{t("jsonrpc_response_label")}</Label>
                                    <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-56 border border-gray-800">
                                        {JSON.stringify(mcpResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB 3: REST API Documentation */}
            {activeTab === "docs" && (
                <Card className="rounded-xl border-gray-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="px-5 py-4 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-indigo-600" />
                                    {t("rest_api_documentation")}
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-500 mt-0.5">
                                    {t("endpoints_directory_desc")}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {toLocaleNumber(filteredEndpoints.length, language?.short_code)} / {toLocaleNumber(API_ENDPOINTS_DIRECTORY.length, language?.short_code)} {t("endpoints_found")}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-5 space-y-5">
                        {/* Search & Filters */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200/80">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("search_endpoints_placeholder")}
                                    value={docSearch}
                                    onChange={(e) => setDocSearch(e.target.value)}
                                    className="pl-8 text-xs h-9 border-gray-200 bg-white"
                                />
                            </div>

                            <div className="w-full md:w-44">
                                <Select value={docMethod} onValueChange={setDocMethod}>
                                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                                        <SelectValue placeholder={t("all_methods")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">{t("all_methods")}</SelectItem>
                                        <SelectItem value="GET" className="text-xs">GET</SelectItem>
                                        <SelectItem value="POST" className="text-xs">POST</SelectItem>
                                        <SelectItem value="PUT" className="text-xs">PUT</SelectItem>
                                        <SelectItem value="DELETE" className="text-xs">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Category filter pills */}
                        <div className="flex flex-wrap gap-1.5 pb-1 border-b border-gray-100">
                            {[
                                { id: "all", label: t("all_categories") || "All Categories", count: API_ENDPOINTS_DIRECTORY.length },
                                { id: "auth", label: t("authentication") || "Auth", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="auth").length },
                                { id: "student_info", label: t("student_information") || "Student Info", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="student_info").length },
                                { id: "front_office", label: t("front_office") || "Front Office", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="front_office").length },
                                { id: "academics", label: t("academics") || "Academics", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="academics").length },
                                { id: "academics_hr", label: t("human_resource") || "HR & Payroll", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="academics_hr").length },
                                { id: "fees_finance", label: t("fees_collection") || "Fees & Finance", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="fees_finance").length },
                                { id: "attendance_exams", label: t("attendance") || "Attendance & Exams", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="attendance_exams").length },
                                { id: "mcp_ai", label: t("api_keys_mcp_title") || "API Keys & MCP", count: API_ENDPOINTS_DIRECTORY.filter(e=>e.category==="mcp_ai").length },
                            ].map((cat) => (
                                <Button
                                    key={cat.id}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDocCategory(cat.id)}
                                    className={cn(
                                        "h-7 text-[10px] font-bold uppercase px-2.5 rounded-full transition-all gap-1.5",
                                        docCategory === cat.id
                                            ? "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    {cat.label}
                                    <span className={cn(
                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                        docCategory === cat.id ? "bg-white/25 text-white" : "bg-white text-gray-500"
                                    )}>
                                        {toLocaleNumber(cat.count, language?.short_code)}
                                    </span>
                                </Button>
                            ))}
                        </div>

                        {/* Endpoints Directory Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {filteredEndpoints.map((ep) => {
                                const isSelected = selectedEndpoint.id === ep.id;
                                return (
                                    <div
                                        key={ep.id}
                                        onClick={() => setSelectedEndpoint(ep)}
                                        className={cn(
                                            "p-3.5 rounded-xl border transition-all cursor-pointer space-y-2",
                                            isSelected
                                                ? "border-indigo-500 bg-indigo-50/30 shadow-md ring-1 ring-indigo-500"
                                                : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50/60 bg-white shadow-xs"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide",
                                                        ep.method === "GET" && "bg-blue-100 text-blue-700 border border-blue-200",
                                                        ep.method === "POST" && "bg-emerald-100 text-emerald-700 border border-emerald-200",
                                                        ep.method === "PUT" && "bg-amber-100 text-amber-700 border border-amber-200",
                                                        ep.method === "DELETE" && "bg-rose-100 text-rose-700 border border-rose-200"
                                                    )}
                                                >
                                                    {ep.method}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {translateCategory(ep.module)}
                                                </span>
                                            </div>

                                            <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {ep.scope}
                                            </span>
                                        </div>

                                        <code className="text-xs font-mono font-bold text-gray-800 block break-all select-all">
                                            {ep.path}
                                        </code>

                                        <p className="text-xs text-gray-500 leading-snug">
                                            {ep.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected Endpoint cURL Code Generator */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                                    <Code className="h-3.5 w-3.5 text-indigo-600" />
                                    {t("curl_command_snippet")} (<span className="text-indigo-600">{selectedEndpoint.method} {selectedEndpoint.path}</span>)
                                </Label>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(currentCurlCode, 'snippet')}
                                    className="h-6 text-[10px] text-indigo-600 font-bold uppercase"
                                >
                                    <Copy className="h-3 w-3 mr-1" /> {t("copy_curl")}
                                </Button>
                            </div>
                            <pre className="p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-gray-800 leading-relaxed shadow-inner">
                                {currentCurlCode}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create API Key Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-indigo-600" />
                            {t("generate_key_modal_title")}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {t("generate_key_modal_desc")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 uppercase">{t("key_friendly_name")} *</Label>
                            <Input
                                placeholder={t("key_name_placeholder")}
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="h-9 text-xs border-gray-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 uppercase">{t("rate_limit_label")}</Label>
                            <Input
                                type="number"
                                min={1}
                                max={10000}
                                value={newRateLimit}
                                onChange={(e) => setNewRateLimit(Number(e.target.value))}
                                className="h-9 text-xs border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-700 uppercase">{t("api_permission_scopes")}</Label>
                            <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-gray-50/50">
                                {PERMISSION_SCOPES.map((scope) => {
                                    const isChecked = selectedPermissions.includes(scope.id);
                                    return (
                                        <div
                                            key={scope.id}
                                            onClick={() => {
                                                if (scope.id === "*") {
                                                    setSelectedPermissions(isChecked ? [] : ["*"]);
                                                } else {
                                                    const filtered = selectedPermissions.filter(p => p !== "*");
                                                    if (isChecked) {
                                                        setSelectedPermissions(filtered.filter(p => p !== scope.id));
                                                    } else {
                                                        setSelectedPermissions([...filtered, scope.id]);
                                                    }
                                                }
                                            }}
                                            className="flex items-start gap-2.5 p-1.5 rounded cursor-pointer hover:bg-white transition-colors"
                                        >
                                            <Checkbox checked={isChecked} className="mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">
                                                    {t(scope.labelKey) || scope.fallbackLabel}
                                                </p>
                                                <p className="text-[10px] text-gray-400">{scope.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleCreateKey}
                            disabled={creating || !newKeyName.trim()}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase"
                        >
                            {creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> {t("executing")}</> : t("generate_new_api_key")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit API Key Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-indigo-600" />
                            {t("edit_key_modal_title")}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {t("edit_key_modal_desc")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 uppercase">{t("key_name")} *</Label>
                            <Input
                                placeholder={t("key_name")}
                                value={editKeyName}
                                onChange={(e) => setEditKeyName(e.target.value)}
                                className="h-9 text-xs border-gray-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 uppercase">{t("rate_limit_label")}</Label>
                            <Input
                                type="number"
                                min={1}
                                max={10000}
                                value={editRateLimit}
                                onChange={(e) => setNewRateLimit(Number(e.target.value))}
                                className="h-9 text-xs border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-700 uppercase">{t("api_permission_scopes")}</Label>
                            <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-gray-50/50">
                                {PERMISSION_SCOPES.map((scope) => {
                                    const isChecked = editPermissions.includes(scope.id);
                                    return (
                                        <div
                                            key={scope.id}
                                            onClick={() => {
                                                if (scope.id === "*") {
                                                    setEditPermissions(isChecked ? [] : ["*"]);
                                                } else {
                                                    const filtered = editPermissions.filter(p => p !== "*");
                                                    if (isChecked) {
                                                        setEditPermissions(filtered.filter(p => p !== scope.id));
                                                    } else {
                                                        setEditPermissions([...filtered, scope.id]);
                                                    }
                                                }
                                            }}
                                            className="flex items-start gap-2.5 p-1.5 rounded cursor-pointer hover:bg-white transition-colors"
                                        >
                                            <Checkbox checked={isChecked} className="mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">
                                                    {t(scope.labelKey) || scope.fallbackLabel}
                                                </p>
                                                <p className="text-[10px] text-gray-400">{scope.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="text-xs">
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleUpdateKey}
                            disabled={updating || !editKeyName.trim()}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase"
                        >
                            {updating ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> {t("executing")}</> : t("save_changes")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Created Secret Key Dialog */}
            <Dialog open={Boolean(createdSecret)} onOpenChange={(open) => !open && setCreatedSecret(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            {t("secret_key_modal_title")}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {t("secret_key_modal_desc")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 flex items-center justify-between gap-2">
                            <code className="text-emerald-400 font-mono text-xs break-all select-all">
                                {createdSecret}
                            </code>
                            <Button
                                size="sm"
                                onClick={() => createdSecret && copyToClipboard(createdSecret, 'secret')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
                            >
                                {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setCreatedSecret(null)}
                            className="bg-indigo-600 text-white text-xs font-bold uppercase w-full"
                        >
                            {t("copied_the_key")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
