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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
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
    RefreshCw,
    Send,
    Loader2,
    CheckCircle2,
    XCircle,
    BookOpen,
    Pencil,
    Activity,
    Layers,
    Search,
    Filter,
    Globe,
    Code,
    Sparkles
} from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
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
    { id: "*", label: "Full Access (*)", desc: "All module endpoints & MCP tools" },
    { id: "students.read", label: "Students (Read)", desc: "View student directory & profiles" },
    { id: "students.write", label: "Students (Write)", desc: "Create & update student records" },
    { id: "staff.read", label: "Staff (Read)", desc: "View staff directory & designations" },
    { id: "fees.read", label: "Fee Collection (Read)", desc: "View fee structures & due reports" },
    { id: "attendance.read", label: "Attendance (Read)", desc: "View student & staff attendance" },
    { id: "mcp.all", label: "MCP Protocol (All)", desc: "Execute Model Context Protocol tools" },
];

const API_ENDPOINTS_DIRECTORY: ApiEndpointItem[] = [
    // 1. Student Information Module
    { id: "1", method: "GET", path: "/api/v1/student-information/students", module: "Student Information", category: "student_info", scope: "students.read", desc: "Retrieve enrolled student directory with class, section, roll number, and search filters." },
    { id: "2", method: "POST", path: "/api/v1/student-information/students", module: "Student Information", category: "student_info", scope: "students.write", desc: "Create a new student record with profile, parent details, and class assignment." },
    { id: "3", method: "PUT", path: "/api/v1/student-information/students/{id}", module: "Student Information", category: "student_info", scope: "students.write", desc: "Update existing student profile details, guardian info, and enrollment status." },
    { id: "4", method: "DELETE", path: "/api/v1/student-information/students/{id}", module: "Student Information", category: "student_info", scope: "students.write", desc: "Delete or disable a student record from the active directory." },
    { id: "5", method: "GET", path: "/api/v1/student-information/online-admissions", module: "Student Information", category: "student_info", scope: "students.read", desc: "Fetch online admission applicant submissions and approval queue." },
    { id: "6", method: "GET", path: "/api/v1/student-information/student-categories", module: "Student Information", category: "student_info", scope: "students.read", desc: "List student quota & category definitions (General, OBC, SC, ST, Merit)." },

    // 2. Fees & Finance Module
    { id: "7", method: "GET", path: "/api/v1/fee-collection/fee-collection", module: "Fees Collection", category: "fees_finance", scope: "fees.read", desc: "Fetch student fee collection ledgers, payment transactions, and balance dues." },
    { id: "8", method: "POST", path: "/api/v1/fee-collection/collect-fees", module: "Fees Collection", category: "fees_finance", scope: "fees.write", desc: "Record fee payment transaction against student invoice." },
    { id: "9", method: "GET", path: "/api/v1/fee-collection/fees-groups", module: "Fees Collection", category: "fees_finance", scope: "fees.read", desc: "List fee structure groups (Tuition Fee, Bus Fee, Library Fee)." },
    { id: "10", method: "GET", path: "/api/v1/fee-collection/fees-types", module: "Fees Collection", category: "fees_finance", scope: "fees.read", desc: "List fee type master records and code definitions." },
    { id: "11", method: "GET", path: "/api/v1/income/incomes", module: "Income", category: "fees_finance", scope: "finance.read", desc: "Retrieve school general income transaction entries and receipt logs." },
    { id: "12", method: "GET", path: "/api/v1/expense/expenses", module: "Expenses", category: "fees_finance", scope: "finance.read", desc: "Retrieve operational expense vouchers and expense head breakdowns." },

    // 3. Academics & Human Resource Module
    { id: "13", method: "GET", path: "/api/v1/academics/classes", module: "Academics", category: "academics_hr", scope: "academics.read", desc: "Fetch list of school academic classes." },
    { id: "14", method: "GET", path: "/api/v1/academics/sections", module: "Academics", category: "academics_hr", scope: "academics.read", desc: "Fetch class section allotments and capacity info." },
    { id: "15", method: "GET", path: "/api/v1/academics/subjects", module: "Academics", category: "academics_hr", scope: "academics.read", desc: "List curriculum subjects with theory/practical code definitions." },
    { id: "16", method: "GET", path: "/api/v1/human-resource/staff-directory", module: "Human Resource", category: "academics_hr", scope: "staff.read", desc: "Retrieve staff directory, teachers, departments, and designations." },
    { id: "17", method: "POST", path: "/api/v1/human-resource/staff-directory", module: "Human Resource", category: "academics_hr", scope: "staff.write", desc: "Add new teacher or staff employee record." },
    { id: "18", method: "GET", path: "/api/v1/hr/payroll", module: "Human Resource", category: "academics_hr", scope: "staff.read", desc: "Fetch staff payroll salary slips and payment receipts." },

    // 4. Attendance & Examinations Module
    { id: "19", method: "GET", path: "/api/v1/attendance/student-attendance", module: "Attendance", category: "attendance_exams", scope: "attendance.read", desc: "Fetch daily class student attendance records by date." },
    { id: "20", method: "POST", path: "/api/v1/attendance/student-attendance", module: "Attendance", category: "attendance_exams", scope: "attendance.write", desc: "Submit or update student daily attendance entries." },
    { id: "21", method: "GET", path: "/api/v1/examination/exam-group", module: "Examinations", category: "attendance_exams", scope: "exams.read", desc: "Fetch examination groups, schedules, and grading standards." },
    { id: "22", method: "GET", path: "/api/v1/examination/exam-result", module: "Examinations", category: "attendance_exams", scope: "exams.read", desc: "Retrieve student exam marksheets and rank reports." },
    { id: "23", method: "GET", path: "/api/v1/online-examination/online-exam", module: "Online Examinations", category: "attendance_exams", scope: "exams.read", desc: "Fetch online test papers and question bank banks." },

    // 5. Communicate & Messaging Module
    { id: "24", method: "GET", path: "/api/v1/communicate/notices", module: "Communicate", category: "communicate_sms", scope: "communicate.read", desc: "Fetch notice board announcements and circulars." },
    { id: "25", method: "POST", path: "/api/v1/communicate/send-sms", module: "Communicate", category: "communicate_sms", scope: "sms.send", desc: "Dispatch broadcast SMS to selected classes or custom numbers." },
    { id: "26", method: "POST", path: "/api/v1/system-setting/sms-settings/test", module: "System Setting", category: "communicate_sms", scope: "sms.send", desc: "Test dispatch SMS via active gateway or Round Robin balancer." },

    // 6. System Settings Module
    { id: "27", method: "GET", path: "/api/v1/system-setting/general-setting", module: "System Setting", category: "system_setting", scope: "system.read", desc: "Retrieve school profile, logo, session year, and general settings." },
    { id: "28", method: "GET", path: "/api/v1/system-setting/sms-gateways", module: "System Setting", category: "system_setting", scope: "system.read", desc: "Fetch multi-gateway SMS settings and Round Robin state." },
    { id: "29", method: "GET", path: "/api/v1/system-setting/email-gateways", module: "System Setting", category: "system_setting", scope: "system.read", desc: "Fetch SMTP email gateways and Round Robin state." },
    { id: "30", method: "GET", path: "/api/v1/system-setting/payment-gateway-settings", module: "System Setting", category: "system_setting", scope: "system.read", desc: "Fetch active payment method configurations." },
    { id: "31", method: "GET", path: "/api/v1/system-setting/api-keys", module: "System Setting", category: "system_setting", scope: "system.read", desc: "Manage RESTful API keys, secret tokens, and permission scopes." },

    // 7. MCP AI Protocol Module
    { id: "32", method: "GET", path: "/api/v1/mcp/manifest", module: "MCP AI Protocol", category: "mcp_ai", scope: "mcp.all", desc: "Fetch Model Context Protocol server manifest & capabilities." },
    { id: "33", method: "POST", path: "/api/v1/mcp", module: "MCP AI Protocol", category: "mcp_ai", scope: "mcp.all", desc: "Execute MCP JSON-RPC 2.0 requests (initialize, tools/list, tools/call)." },

    // 8. Operations & Logistics
    { id: "34", method: "GET", path: "/api/v1/front-office/admission-enquiries", module: "Front Office", category: "operations", scope: "front_office.read", desc: "Fetch admission enquiry logs and follow-up status." },
    { id: "35", method: "GET", path: "/api/v1/front-office/visitors", module: "Front Office", category: "operations", scope: "front_office.read", desc: "Retrieve visitor logbook entries." },
    { id: "36", method: "GET", path: "/api/v1/inventory/items", module: "Inventory", category: "operations", scope: "inventory.read", desc: "List inventory items, categories, and stock balances." },
    { id: "37", method: "GET", path: "/api/v1/transport/transport", module: "Transport", category: "operations", scope: "transport.read", desc: "Fetch transport routes, pickup points, and assigned vehicles." },
    { id: "38", method: "GET", path: "/api/v1/hostel/hostels", module: "Hostel", category: "operations", scope: "hostel.read", desc: "Fetch hostel room allocations and hostel master records." },
];

export default function ApiKeyPage() {
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<string>("keys");
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

    // Copy snippet helper
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
            console.error("Failed to load API keys:", error);
            sonnerToast.error("Failed to load API keys");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            sonnerToast.error("Please enter an API Key name");
            return;
        }

        setCreating(true);
        try {
            const res = await api.post('/system-setting/api-keys', {
                name: newKeyName.trim(),
                permissions: selectedPermissions,
                rate_limit: newRateLimit,
            });

            if (res.data?.status === 'success') {
                setCreatedSecret(res.data.raw_token);
                setIsCreateOpen(false);
                setNewKeyName("");
                setSelectedPermissions(["*"]);
                setNewRateLimit(60);
                fetchApiKeys();
                sonnerToast.success("API Key generated successfully!");
            } else {
                sonnerToast.error(res.data?.message || "Failed to generate API Key");
            }
        } catch (error: any) {
            sonnerToast.error(error.response?.data?.message || "Failed to generate API Key");
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
        if (!editingItem) return;
        if (!editKeyName.trim()) {
            sonnerToast.error("Please enter an API Key name");
            return;
        }

        setUpdating(true);
        try {
            const res = await api.put(`/system-setting/api-keys/${editingItem.id}`, {
                name: editKeyName.trim(),
                permissions: editPermissions,
                rate_limit: editRateLimit,
            });

            if (res.data?.status === 'success') {
                setIsEditOpen(false);
                setEditingItem(null);
                fetchApiKeys();
                sonnerToast.success("API Key updated successfully!");
            } else {
                sonnerToast.error(res.data?.message || "Failed to update API Key");
            }
        } catch (error: any) {
            sonnerToast.error(error.response?.data?.message || "Failed to update API Key");
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleStatus = async (id: number, currentName: string) => {
        try {
            const res = await api.post(`/system-setting/api-keys/${id}/toggle`);
            if (res.data?.status === 'success') {
                const updatedStatus = res.data.data.status;
                setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: updatedStatus } : k));
                if (updatedStatus) {
                    sonnerToast.success(`API Key '${currentName}' activated`);
                } else {
                    sonnerToast.info(`API Key '${currentName}' revoked`);
                }
            }
        } catch (error) {
            sonnerToast.error("Failed to toggle API Key status");
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) return;
        try {
            const res = await api.delete(`/system-setting/api-keys/${id}`);
            if (res.data?.status === 'success') {
                setApiKeys(prev => prev.filter(k => k.id !== id));
                sonnerToast.success("API Key deleted");
            }
        } catch (error) {
            sonnerToast.error("Failed to delete API Key");
        }
    };

    const handleTestMcpTool = async () => {
        setMcpTesting(true);
        setMcpResult(null);
        try {
            let args: any = {};
            if (mcpTool === "get_students" || mcpTool === "get_staff") {
                if (mcpSearch.trim()) args.search = mcpSearch.trim();
            } else if (mcpTool === "send_sms_notification") {
                args.phone = mcpPhone.trim();
                args.message = mcpMessage.trim();
            }

            const res = await api.post('/mcp', {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: {
                    name: mcpTool,
                    arguments: args
                }
            });

            setMcpResult(res.data);
            if (!res.data?.result?.isError) {
                sonnerToast.success(`MCP Tool '${mcpTool}' executed successfully!`);
            } else {
                sonnerToast.error("MCP tool returned an error");
            }
        } catch (error: any) {
            setMcpResult({ error: error.message || "MCP Execution Failed" });
            sonnerToast.error("MCP Execution Failed");
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
        sonnerToast.success("Copied to clipboard!");
    };

    // Filtered endpoints directory
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
            
            {/* Header Banner */}
            <Card className="p-0 overflow-hidden border border-gray-100/80 shadow-md hover:shadow-lg transition-all rounded-xl bg-gradient-to-r from-[#FFF5E7] via-[#EFF0FD] to-[#F3E8FF]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <KeyRound className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] sm:text-[18px] font-bold text-gray-800 tracking-tight leading-tight">
                                RESTful API Keys & Model Context Protocol (MCP)
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Manage API access tokens for third-party software & connect AI agents via MCP Protocol
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-9 px-4 text-[11px] font-bold uppercase rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-1.5" /> Generate New API Key
                    </Button>
                </div>
            </Card>

            {/* Overview Stat Cards with Realistic Metrics & Outer Shadows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4.5 flex items-center gap-3.5 border-gray-100/90 shadow-md hover:shadow-lg transition-all bg-white rounded-xl">
                    <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total API Keys</p>
                        <p className="text-18 font-extrabold text-gray-800 leading-tight">{loading ? "..." : stats.total_keys}</p>
                        <p className="text-[10px] font-semibold text-indigo-600 mt-0.5">{stats.active_keys} active keys configured</p>
                    </div>
                </Card>

                <Card className="p-4.5 flex items-center gap-3.5 border-gray-100/90 shadow-md hover:shadow-lg transition-all bg-white rounded-xl">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Keys</p>
                        <p className="text-18 font-extrabold text-emerald-600 leading-tight">{loading ? "..." : stats.active_keys}</p>
                        <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">100% Operational & Verified</p>
                    </div>
                </Card>

                <Card className="p-4.5 flex items-center gap-3.5 border-gray-100/90 shadow-md hover:shadow-lg transition-all bg-white rounded-xl">
                    <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                        <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">MCP Server Status</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-extrabold text-gray-800">{stats.mcp_status} (JSON-RPC 2.0)</span>
                        </div>
                        <p className="text-[10px] font-semibold text-purple-600 mt-0.5">6 Core MCP Tools Active</p>
                    </div>
                </Card>

                <Card className="p-4.5 flex items-center gap-3.5 border-gray-100/90 shadow-md hover:shadow-lg transition-all bg-white rounded-xl">
                    <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-inner">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Default Rate Limit</p>
                        <p className="text-18 font-extrabold text-gray-800 leading-tight">60 req / min</p>
                        <p className="text-[10px] font-semibold text-orange-600 mt-0.5">Configurable up to 10,000</p>
                    </div>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                <TabsList className="bg-white border border-gray-200 p-1 rounded-lg h-auto flex flex-wrap gap-1 shadow-sm">
                    <TabsTrigger value="keys" className="text-[11px] font-bold uppercase px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                        <KeyRound className="h-3.5 w-3.5 mr-1.5" /> API Keys Management
                    </TabsTrigger>
                    <TabsTrigger value="mcp" className="text-[11px] font-bold uppercase px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                        <Cpu className="h-3.5 w-3.5 mr-1.5" /> MCP AI Agent Protocol
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="text-[11px] font-bold uppercase px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" /> REST API Documentation ({API_ENDPOINTS_DIRECTORY.length}+)
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: API Keys Management */}
                <TabsContent value="keys">
                    <Card className="pt-0 border-gray-100 shadow-md">
                        <CardHeader className="px-5 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-14 font-bold text-gray-800">Active API Keys</CardTitle>
                                <CardDescription className="text-11 text-gray-400 mt-0.5">
                                    Third-party software authentication keys with custom permission scopes & rate limits
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
                                    <p className="text-xs font-bold text-gray-600 uppercase">No API Keys Generated</p>
                                    <p className="text-[11px] text-gray-400">Generate an API key to allow external software to access iSchool endpoints.</p>
                                    <Button
                                        onClick={() => setIsCreateOpen(true)}
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase mt-2"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Create First API Key
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow>
                                                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Key Name</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Token Prefix</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Permissions</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Rate Limit</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Status</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Last Used</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase text-gray-500 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {apiKeys.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-gray-50/50">
                                                    <TableCell className="font-bold text-[12px] text-gray-800">
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit">
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
                                                    <TableCell className="text-[11px] text-gray-600 font-semibold">
                                                        {item.rate_limit || 60} req/min
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={item.status}
                                                                onCheckedChange={() => handleToggleStatus(item.id, item.name)}
                                                                className="data-[state=checked]:bg-emerald-600"
                                                            />
                                                            <span className={cn("text-[10px] font-bold", item.status ? "text-emerald-600" : "text-gray-400")}>
                                                                {item.status ? "Active" : "Revoked"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] text-gray-400">
                                                        {item.last_used_at ? new Date(item.last_used_at).toLocaleString() : "Never"}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenEditModal(item)}
                                                            className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                            title="Edit API Key"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 text-indigo-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(item.key, 'snippet')}
                                                            className="h-7 w-7 p-0 text-gray-500 hover:text-indigo-600"
                                                            title="Copy Token"
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteKey(item.id)}
                                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                                            title="Delete Key"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: Model Context Protocol (MCP) Protocol */}
                <TabsContent value="mcp" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Left: MCP Configuration & Connection Guide */}
                        <Card className="pt-0 border-indigo-100 shadow-md">
                            <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                                <Cpu className="h-5 w-5 text-indigo-600" />
                                <div>
                                    <h2 className="text-14 font-bold text-gray-800">MCP Client Setup Guide</h2>
                                    <p className="text-[10px] text-gray-500">Connect Claude Desktop, Cursor, or AI agents to iSchool MCP Server</p>
                                </div>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase">MCP Server Endpoint</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={mcpEndpointUrl}
                                            className="font-mono text-[11px] bg-gray-50 border-gray-200 h-9"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(mcpEndpointUrl, 'snippet')}
                                            className="h-9 px-3 text-xs border-indigo-200 text-indigo-700"
                                        >
                                            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold text-gray-600 uppercase">
                                            claude_desktop_config.json Snippet
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(claudeConfigCode, 'snippet')}
                                            className="h-6 text-[10px] text-indigo-600 font-bold uppercase"
                                        >
                                            {copiedSnippet ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                                            {copiedSnippet ? "Copied" : "Copy JSON"}
                                        </Button>
                                    </div>
                                    <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto leading-relaxed border border-gray-800">
                                        {claudeConfigCode}
                                    </pre>
                                </div>

                                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                                    💡 <strong>How it works:</strong> Third-party AI models (like Claude, ChatGPT, or autonomous agents) connect to this endpoint using the JSON-RPC 2.0 MCP protocol to securely query student lists, attendance rates, fee reports, and trigger automated SMS alerts.
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right: Live Interactive MCP Tester Console */}
                        <Card className="pt-0 border-emerald-100 shadow-md">
                            <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                                <Terminal className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <h2 className="text-14 font-bold text-gray-800">Interactive MCP Live Inspector</h2>
                                    <p className="text-[10px] text-gray-500">Test MCP tool execution and inspect live JSON-RPC 2.0 payloads</p>
                                </div>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase">Select MCP Tool</Label>
                                    <Select value={mcpTool} onValueChange={setMcpTool}>
                                        <SelectTrigger className="h-9 text-[11px] border-gray-200 shadow-none rounded text-gray-700">
                                            <SelectValue placeholder="Select tool to execute" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="get_students" className="text-[11px]">get_students (Retrieve student directory)</SelectItem>
                                            <SelectItem value="get_staff" className="text-[11px]">get_staff (Retrieve staff directory)</SelectItem>
                                            <SelectItem value="get_attendance_summary" className="text-[11px]">get_attendance_summary (Attendance rate)</SelectItem>
                                            <SelectItem value="get_fee_due_list" className="text-[11px]">get_fee_due_list (Overdue fee list)</SelectItem>
                                            <SelectItem value="get_system_settings" className="text-[11px]">get_system_settings (School info)</SelectItem>
                                            <SelectItem value="send_sms_notification" className="text-[11px]">send_sms_notification (Dispatch SMS alert)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(mcpTool === "get_students" || mcpTool === "get_staff") && (
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Search Filter (Optional)</Label>
                                        <Input
                                            type="text"
                                            placeholder="Enter name or ID to filter..."
                                            value={mcpSearch}
                                            onChange={(e) => setMcpSearch(e.target.value)}
                                            className="h-8 text-[11px] border-gray-200"
                                        />
                                    </div>
                                )}

                                {mcpTool === "send_sms_notification" && (
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-bold text-gray-500 uppercase">Recipient Phone *</Label>
                                            <Input
                                                type="text"
                                                value={mcpPhone}
                                                onChange={(e) => setMcpPhone(e.target.value)}
                                                className="h-8 text-[11px] border-gray-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-bold text-gray-500 uppercase">Message Text *</Label>
                                            <Input
                                                type="text"
                                                value={mcpMessage}
                                                onChange={(e) => setMcpMessage(e.target.value)}
                                                className="h-8 text-[11px] border-gray-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handleTestMcpTool}
                                    disabled={mcpTesting}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white h-9 text-xs font-bold uppercase rounded-lg shadow-sm"
                                >
                                    {mcpTesting ? (
                                        <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Executing Tool...</>
                                    ) : (
                                        <><Send className="h-3.5 w-3.5 mr-1.5" /> Execute MCP Tool Call</>
                                    )}
                                </Button>

                                {mcpResult && (
                                    <div className="space-y-1 pt-2">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase">JSON-RPC 2.0 Response</Label>
                                        <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-56 border border-gray-800">
                                            {JSON.stringify(mcpResult, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: REST API Documentation (All Modules API Endpoints Directory) */}
                <TabsContent value="docs" className="space-y-6">
                    <Card className="pt-0 border-gray-100 shadow-md">
                        <CardHeader className="px-5 py-4 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-15 font-bold text-gray-800 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-indigo-600" />
                                        RESTful API Endpoints Directory
                                    </CardTitle>
                                    <CardDescription className="text-11 text-gray-400 mt-0.5">
                                        Secured RESTful API endpoints across all iSchool modules accessible using header <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600 font-mono">X-API-KEY: ischool_sk_...</code>
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {filteredEndpoints.length} of {API_ENDPOINTS_DIRECTORY.length} Endpoints
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="p-5 space-y-6">
                            
                            {/* Search & Filters Toolbar */}
                            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200/80">
                                {/* Search input */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                    <Input
                                        placeholder="Search endpoints by path, module, or description..."
                                        value={docSearch}
                                        onChange={(e) => setDocSearch(e.target.value)}
                                        className="pl-8 text-[11px] h-9 border-gray-200 bg-white"
                                    />
                                </div>

                                {/* Method Filter Select */}
                                <div className="w-full md:w-44">
                                    <Select value={docMethod} onValueChange={setDocMethod}>
                                        <SelectTrigger className="h-9 text-[11px] bg-white border-gray-200">
                                            <SelectValue placeholder="All Methods" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-[11px]">All Methods</SelectItem>
                                            <SelectItem value="GET" className="text-[11px]">GET (Read)</SelectItem>
                                            <SelectItem value="POST" className="text-[11px]">POST (Create / Action)</SelectItem>
                                            <SelectItem value="PUT" className="text-[11px]">PUT (Update)</SelectItem>
                                            <SelectItem value="DELETE" className="text-[11px]">DELETE (Remove)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Module Category Filter Buttons */}
                            <div className="flex flex-wrap gap-1.5 pb-1 border-b border-gray-100">
                                {[
                                    { id: "all", label: "All Modules" },
                                    { id: "student_info", label: "Student Info" },
                                    { id: "fees_finance", label: "Fees & Finance" },
                                    { id: "academics_hr", label: "Academics & HR" },
                                    { id: "attendance_exams", label: "Attendance & Exams" },
                                    { id: "communicate_sms", label: "Communicate & SMS" },
                                    { id: "system_setting", label: "System Settings" },
                                    { id: "mcp_ai", label: "MCP AI Protocol" },
                                    { id: "operations", label: "Operations & Hostel" },
                                ].map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDocCategory(cat.id)}
                                        className={cn(
                                            "h-7 text-[10px] font-bold uppercase px-3 rounded-full transition-all",
                                            docCategory === cat.id
                                                ? "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Endpoints Directory Cards Grid */}
                            {filteredEndpoints.length === 0 ? (
                                <div className="p-12 text-center space-y-2">
                                    <Search className="h-10 w-10 text-gray-300 mx-auto" />
                                    <p className="text-xs font-bold text-gray-600 uppercase">No Endpoints Match Your Query</p>
                                    <p className="text-[11px] text-gray-400">Try adjusting your search terms or category filters.</p>
                                </div>
                            ) : (
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
                                                            {ep.module}
                                                        </span>
                                                    </div>

                                                    <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                        {ep.scope}
                                                    </span>
                                                </div>

                                                <code className="text-xs font-mono font-bold text-gray-800 block break-all select-all">
                                                    {ep.path}
                                                </code>

                                                <p className="text-[11px] text-gray-500 leading-snug">
                                                    {ep.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Selected Endpoint cURL Code Generator */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                                        <Code className="h-3.5 w-3.5 text-indigo-600" />
                                        Selected Request cURL Generator (<span className="text-indigo-600">{selectedEndpoint.method} {selectedEndpoint.path}</span>)
                                    </Label>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(currentCurlCode, 'snippet')}
                                        className="h-6 text-[10px] text-indigo-600 font-bold uppercase"
                                    >
                                        <Copy className="h-3 w-3 mr-1" /> Copy cURL
                                    </Button>
                                </div>
                                <pre className="p-4 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto border border-gray-800 leading-relaxed shadow-inner">
                                    {currentCurlCode}
                                </pre>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create API Key Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-15 font-bold text-gray-800 flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-indigo-600" />
                            Generate New API Key
                        </DialogTitle>
                        <DialogDescription className="text-11 text-gray-500">
                            Configure API key name, scope permissions, and rate limit per minute.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-700 uppercase">Key Name *</Label>
                            <Input
                                placeholder="e.g., Mobile App Integration / Claude MCP Client"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="h-9 text-[11px] border-gray-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-700 uppercase">Rate Limit (Requests per minute)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={10000}
                                value={newRateLimit}
                                onChange={(e) => setNewRateLimit(Number(e.target.value))}
                                className="h-9 text-[11px] border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-700 uppercase">Permission Scopes</Label>
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
                                                <p className="text-[11px] font-bold text-gray-800">{scope.label}</p>
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
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateKey}
                            disabled={creating || !newKeyName.trim()}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase"
                        >
                            {creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Generating...</> : "Generate API Key"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit API Key Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-15 font-bold text-gray-800 flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-indigo-600" />
                            Edit API Key Settings
                        </DialogTitle>
                        <DialogDescription className="text-11 text-gray-500">
                            Update key name, permission scopes, and rate limits.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-700 uppercase">Key Name *</Label>
                            <Input
                                placeholder="Key Name"
                                value={editKeyName}
                                onChange={(e) => setEditKeyName(e.target.value)}
                                className="h-9 text-[11px] border-gray-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-700 uppercase">Rate Limit (Requests per minute)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={10000}
                                value={editRateLimit}
                                onChange={(e) => setEditRateLimit(Number(e.target.value))}
                                className="h-9 text-[11px] border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-700 uppercase">Permission Scopes</Label>
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
                                                <p className="text-[11px] font-bold text-gray-800">{scope.label}</p>
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
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateKey}
                            disabled={updating || !editKeyName.trim()}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase"
                        >
                            {updating ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Updating...</> : "Update API Key"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Created Secret Key Dialog */}
            <Dialog open={Boolean(createdSecret)} onOpenChange={(open) => !open && setCreatedSecret(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-15 font-bold text-emerald-700 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            API Key Secret Token Generated
                        </DialogTitle>
                        <DialogDescription className="text-11 text-gray-500">
                            Please copy your secret key now. <strong>For security reasons, it will not be displayed again.</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 flex items-center justify-between gap-2">
                            <code className="text-emerald-400 font-mono text-[11px] break-all select-all">
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
                        <p className="text-[10px] text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                            ⚠️ Keep this key secret. Anyone with this key can access your iSchool REST API endpoints.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setCreatedSecret(null)}
                            className="bg-indigo-600 text-white text-xs font-bold uppercase w-full"
                        >
                            I Have Saved My Secret Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
