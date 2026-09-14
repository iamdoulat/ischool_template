"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Search,
    Plus,
    LayoutGrid,
    List as ListIcon,
    Phone,
    MapPin,
    User,
    Users,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    KeyRound,
    CheckCircle,
    Ban,
    QrCode,
    ArrowRightLeft,
    FilePlus,
    Loader2
} from "lucide-react";
import { TransferDialog } from "@/components/multi-branch/transfer-dialog";
import { StaffRequisitionDialog } from "@/components/hr/staff-requisition-dialog";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { toLocaleNumber } from "@/lib/utils";

interface Staff {
    id: number;
    staff_id: string;
    name: string;
    email?: string;
    role: string;
    phone: string;
    department?: string;
    avatar?: string;
    qr_code?: string;
    nfc_uid?: string;
    active?: boolean | number;
}

interface Role {
    name: string;
}

interface CurrentUser {
    role?: string;
    permissions?: string[];
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function CardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-muted/30 p-4 space-y-3 bg-card animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted/60" />
                        <div className="space-y-2 flex-1"><div className="h-3 w-1/2 rounded bg-muted/60" /><div className="h-3 w-1/3 rounded bg-muted/60" /></div>
                    </div>
                    <div className="h-3 w-full rounded bg-muted/60" /><div className="h-3 w-3/4 rounded bg-muted/60" />
                </div>
            ))}
        </>
    );
}

export default function StaffDirectoryPage() {
    const router = useRouter();
    const pathname = usePathname() || "";
    const { toast } = useToast();
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";

    // Detect if current route is a sub-branch
    const branchMatch = pathname.match(/^\/br\/([^\/]+)/);
    const isSubBranch = (!!branchMatch && branchMatch[1] !== "main") || (typeof window !== "undefined" && !!localStorage.getItem("active_branch_id") && localStorage.getItem("active_branch_id") !== "1" && localStorage.getItem("active_branch_slug") !== "main");
    const currentBranchSlug = branchMatch && branchMatch[1] !== "main" ? branchMatch[1] : null;

    const [view, setView] = useState("card");
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [selectedRole, setSelectedRole] = useState("Select");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [staffToToggle, setStaffToToggle] = useState<Staff | null>(null);
    const [transferStaff, setTransferStaff] = useState<Staff | null>(null);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [requisitionDialogOpen, setRequisitionDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const getLocalizedRoleName = (roleName?: string) => {
        if (!roleName) return "";
        const key = roleName.toLowerCase().replace(/[\s-]+/g, "_");
        const trans = t(key);
        if (trans && trans !== key) return trans;
        if (key === "super_admin" || key === "superadmin") return t("super_admin");
        if (key === "admin") return t("admin");
        if (key === "teacher") return t("teacher");
        if (key === "accountant") return t("accountant");
        if (key === "librarian") return t("librarian");
        if (key === "receptionist") return t("receptionist");
        if (key === "driver") return t("driver");
        if (key === "branch_admin") return t("branch_admin");
        return roleName;
    };

    const getLocalizedDepartmentName = (dept?: string) => {
        if (!dept) return t("general");
        const key = dept.toLowerCase().replace(/[\s-]+/g, "_");
        const trans = t(key);
        if (trans && trans !== key) return trans;
        return dept;
    };

    const fetchStaff = useCallback(async (searchKeyword = "", roleFilter = "Select", statusFilter = "all") => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchKeyword) params.append("keyword", searchKeyword);
            if (roleFilter !== "Select") params.append("role", roleFilter);
            params.append("active", statusFilter);

            const response = await api.get(`/hr/staff-directory?${params.toString()}`);
            if (response.data.status === "Success" || response.data.data) {
                setStaffList(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get("/hr/staff-roles");
            if (response.data.status === "Success" || response.data.data) {
                setRoles(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get("/profile");
            if (response.data.status === "Success" || response.data.data) {
                setCurrentUser(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([fetchStaff(), fetchRoles(), fetchCurrentUser()]);
        };
        loadInitialData();
    }, [fetchStaff]);

    const roleClean = (currentUser?.role || "").toLowerCase().replace(/[_\s]/g, "");
    const isAdmin = currentUser && (roleClean.includes("admin") || roleClean.includes("superadmin"));

    const hasPerm = (permission: string) => {
        if (!currentUser) return false;
        if (isAdmin) return true;
        if (!currentUser.permissions) return false;
        if (currentUser.permissions.includes("all")) return true;
        return currentUser.permissions.includes(permission);
    };

    const handleSearch = () => {
        fetchStaff(keyword, selectedRole, selectedStatus);
    };

    const handleEdit = (staffId: string | number) => {
        router.push(`/dashboard/hr/staff-directory/edit/${staffId}`);
    };

    const handleDeleteClick = (staff: Staff) => {
        setStaffToDelete(staff);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!staffToDelete) return;

        try {
            const idToDelete = staffToDelete.staff_id || staffToDelete.id;
            const response = await api.delete(`/hr/staff-directory/${idToDelete}`);

            if (response.data.status === "Success") {
                toast({
                    title: t("success"),
                    description: t("staff_deleted_successfully"),
                });
                fetchStaff(keyword, selectedRole, selectedStatus);
                setDeleteDialogOpen(false);
                setStaffToDelete(null);
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast({
                title: t("error"),
                description: err.response?.data?.message || t("failed_to_delete_staff"),
                variant: "destructive",
            });
        }
    };

    const handleResetPassword = async (staffId: string | number) => {
        try {
            const response = await api.post(`/hr/staff-directory/${staffId}/reset-password`, {});

            if (response.data.status === "Success") {
                toast({
                    title: t("success"),
                    description: t("password_reset_link_sent"),
                });
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast({
                title: t("error"),
                description: err.response?.data?.message || t("failed_to_send_reset_link"),
                variant: "destructive",
            });
        }
    };

    const handleConfirmToggleStatus = async () => {
        if (!staffToToggle) return;

        const newStatus = !(staffToToggle.active !== false && staffToToggle.active !== 0);
        const actionText = newStatus ? "enabled" : "disabled";

        try {
            const idToUpdate = staffToToggle.staff_id || staffToToggle.id;
            const response = await api.put(`/hr/staff-directory/${idToUpdate}`, { active: newStatus });

            if (response.data.status === "Success") {
                toast({
                    title: actionText === "enabled" ? t("staff_member_enabled") : t("staff_member_disabled"),
                    description: `${staffToToggle.name} ${actionText === "enabled" ? t("has_been_enabled") : t("has_been_disabled")}`,
                    variant: "default",
                });
                fetchStaff(keyword, selectedRole, selectedStatus);
                setStatusDialogOpen(false);
                setStaffToToggle(null);
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error(`Error toggling staff:`, error);
            toast({
                title: t("error"),
                description: err.response?.data?.message || `${t("failed_to_update_status_for")} ${staffToToggle.name}. ${t("please_try_again")}`,
                variant: "destructive",
            });
            setStatusDialogOpen(false);
        }
    };

    const handlePrintStaffBadge = (person: Staff) => {
        const win = window.open("", "_blank");
        if (!win) return;
        const rawQr = person.qr_code || person.staff_id || String(person.id);
        const data = JSON.stringify({ qr_code: rawQr });
        const imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(data)}`;
        const avatarSrc = person.avatar ? person.avatar : "";

        win.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Staff ID Badge - ${person.name}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                        body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; padding: 20px; }
                        .badge-card {
                            width: 320px; height: 490px; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                            border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; text-align: center;
                            padding: 24px; position: relative; overflow: hidden;
                        }
                        .header-banner {
                            position: absolute; top: 0; left: 0; right: 0; height: 80px;
                            background: linear-gradient(135deg, #FF9800, #6366F1);
                        }
                        .avatar {
                            width: 76px; height: 76px; border-radius: 50%; border: 4px solid white; object-fit: cover;
                            margin-top: 24px; position: relative; z-index: 10; background: #e0e7ff;
                        }
                        .name { font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 10px; }
                        .role { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; }
                        .details { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
                        .qr-container { margin-top: 14px; padding: 8px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
                        .qr-img { width: 140px; height: 140px; }
                        .footer-text { font-size: 10px; color: #94a3b8; margin-top: auto; font-family: monospace; }
                        @media print {
                            body { background: white; padding: 0; }
                            .badge-card { box-shadow: none; border: 1px solid #ccc; page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="badge-card">
                        <div class="header-banner"></div>
                        ${avatarSrc ? `<img src="${avatarSrc}" class="avatar" alt="" />` : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-weight:bold;color:#4f46e5;font-size:24px;">${person.name?.charAt(0)}</div>`}
                        <h2 class="name">${person.name}</h2>
                        <p class="role">${getLocalizedRoleName(person.role) || "STAFF"}</p>
                        <p class="details">Staff ID: ${person.staff_id || "N/A"} | Dept: ${person.department || "General"}</p>
                        <div class="qr-container">
                            <img src="${imgSrc}" class="qr-img" alt="QR Code" />
                        </div>
                        <p class="footer-text">SMART ATTENDANCE & ACCESS</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <div className="w-full space-y-6 p-4 lg:p-6 font-sans bg-gray-50/10 min-h-screen">
            {/* Master Header Banner */}
            <div className="rounded-xl border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <Users className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                {t("staff_directory")}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    {t("total_staff_count", { count: toLocaleNumber(staffList.length, shortCode) })}
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("filter_staff_by_role_or_keyword")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        {isSubBranch ? (
                            <Button
                                onClick={() => setRequisitionDialogOpen(true)}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-9 text-xs font-bold rounded-lg shadow-sm active:scale-95 flex items-center gap-1.5 border-0 cursor-pointer"
                            >
                                <FilePlus className="h-4 w-4" /> {t("requisition")}
                            </Button>
                        ) : (
                            hasPerm("human-resource.staff.add") && (
                                <Button
                                    onClick={() => router.push('/dashboard/hr/staff-directory/create')}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-9 text-xs font-bold rounded-lg shadow-sm active:scale-95 flex items-center gap-1.5 border-0 cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" /> {t("add_staff")}
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-slate-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                        <Filter className="h-4 w-4" />
                    </span>
                    <div>
                        <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t("filter_staff_by_role_or_keyword")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Role Filter */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("role")} <span className="text-rose-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg cursor-pointer">
                                            <SelectValue placeholder={t("select_role")}>
                                                {selectedRole === "Select" ? t("select") : getLocalizedRoleName(selectedRole)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Select" className="cursor-pointer">{t("select")}</SelectItem>
                                            {roles.map((role) => (
                                                <SelectItem key={role.name} value={role.name} className="cursor-pointer">
                                                    {getLocalizedRoleName(role.name)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 px-5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0 shrink-0"
                                >
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                    {t("search")}
                                </Button>
                            </div>
                        </div>

                        {/* Keyword Search */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("search_by_keyword")}
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Input
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder={t("search_by_staff_id_name_role")}
                                        className="h-9 text-xs bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 px-5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0 shrink-0"
                                >
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                    {t("search")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Staff View Section */}
            <Card className="border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Users className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-800">{t("staff_directory")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-0.5">{t("total_staff_count", { count: toLocaleNumber(staffList.length, shortCode) })}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={view} className="w-full" onValueChange={setView}>
                        <div className="px-5 border-b border-slate-100 bg-white flex justify-between items-center">
                            <TabsList className="bg-transparent h-12 gap-6 p-0">
                                <TabsTrigger
                                    value="card"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 text-xs font-bold text-gray-400 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2 transition-all cursor-pointer"
                                >
                                    <LayoutGrid className="h-4 w-4 mr-1.5" /> {t("card_view")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="list"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 text-xs font-bold text-gray-400 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2 transition-all cursor-pointer"
                                >
                                    <ListIcon className="h-4 w-4 mr-1.5" /> {t("list_view")}
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center py-2">
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(val) => {
                                        setSelectedStatus(val);
                                        fetchStaff(keyword, selectedRole, val);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[140px] border-slate-200 text-xs font-semibold text-gray-600 focus:ring-indigo-500 rounded-lg cursor-pointer">
                                        <SelectValue placeholder={t("status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="cursor-pointer">{t("all_staff")}</SelectItem>
                                        <SelectItem value="true" className="cursor-pointer">{t("active_staff")}</SelectItem>
                                        <SelectItem value="false" className="cursor-pointer">{t("disabled_staff_filter")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <TabsContent value="card" className="p-5 m-0">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    <CardSkeleton count={6} />
                                </div>
                            ) : staffList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {staffList.map((person) => (
                                        <div key={person.id} className={`bg-white border border-slate-200/80 rounded-xl p-4 hover:shadow-lg hover:border-indigo-200 transition-all group relative overflow-hidden flex gap-4 ${person.active === false || person.active === 0 ? "opacity-60 grayscale hover:grayscale-0 hover:opacity-100" : ""}`}>
                                            <div className="relative h-18 w-18 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shadow-2xs">
                                                {person.avatar ? (
                                                    <img
                                                        src={person.avatar}
                                                        alt={person.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-indigo-300 bg-indigo-50/50">
                                                        <User className="h-9 w-9" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col justify-between py-0.5 w-full min-w-0 pr-7">
                                                <div>
                                                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                                        {person.name}
                                                    </h3>
                                                    <div className="text-[10px] font-mono font-bold text-indigo-600 mt-0.5">
                                                        {person.staff_id ? toLocaleNumber(person.staff_id, shortCode) : t("n_a")}
                                                    </div>
                                                </div>

                                                <div className="space-y-1 mt-2">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                        <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                                                        <span className="truncate">{person.phone ? toLocaleNumber(person.phone, shortCode) : t("no_phone")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                        <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                                                        <span className="truncate">{getLocalizedDepartmentName(person.department)} - {getLocalizedRoleName(person.role)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mt-2.5">
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded-md uppercase tracking-tight">
                                                        {getLocalizedRoleName(person.role)}
                                                    </span>
                                                    {(person.active === false || person.active === 0) && (
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold rounded-md uppercase tracking-tight">
                                                            {t("disabled")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {(hasPerm("human-resource.staff.edit") || hasPerm("human-resource.staff.delete")) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors rounded-full cursor-pointer shadow-2xs">
                                                            <MoreVertical className="h-3.5 w-3.5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 bg-white">
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => { setStaffToToggle(person); setStatusDialogOpen(true); }}
                                                                className={`cursor-pointer text-xs font-semibold ${person.active === false || person.active === 0 ? "text-emerald-600 focus:text-emerald-600" : "text-amber-600 focus:text-amber-600"}`}
                                                            >
                                                                {person.active === false || person.active === 0 ? (
                                                                    <><CheckCircle className="h-3.5 w-3.5 mr-2" /> {t("enable_staff")}</>
                                                                ) : (
                                                                    <><Ban className="h-3.5 w-3.5 mr-2" /> {t("disable_staff")}</>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => handlePrintStaffBadge(person)}
                                                            className="cursor-pointer text-xs font-semibold text-indigo-600 focus:text-indigo-600"
                                                        >
                                                            <QrCode className="h-3.5 w-3.5 mr-2" />
                                                            {t("print_id_badge_qr")}
                                                        </DropdownMenuItem>
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setTransferStaff(person);
                                                                    setTransferDialogOpen(true);
                                                                }}
                                                                className="cursor-pointer text-xs font-semibold text-amber-600 focus:text-amber-600"
                                                            >
                                                                <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                                                                {t("transfer_campus_branch")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleEdit(person.staff_id || person.id)}
                                                                className="cursor-pointer text-xs font-semibold text-slate-700"
                                                            >
                                                                <Edit className="h-3.5 w-3.5 mr-2" />
                                                                {t("edit")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleResetPassword(person.staff_id || person.id)}
                                                                className="cursor-pointer text-xs font-semibold text-slate-700"
                                                            >
                                                                <KeyRound className="h-3.5 w-3.5 mr-2" />
                                                                {t("reset_password")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPerm("human-resource.staff.delete") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(person)}
                                                                className="cursor-pointer text-xs font-semibold text-rose-600 focus:text-rose-600"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                {t("delete")}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-600">{t("no_staff_found")}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="list" className="p-0 m-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t("staff_id")}</th>
                                            <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t("name")}</th>
                                            <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t("role")}</th>
                                            <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t("phone")}</th>
                                            <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t("department")}</th>
                                            <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t("designation")}</th>
                                            <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">{t("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100 text-xs">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={7} />
                                        ) : staffList.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-xs font-bold text-slate-400">{t("no_staff_found")}</td>
                                            </tr>
                                        ) : (
                                            staffList.map((person) => (
                                                <tr key={person.id} className={`hover:bg-indigo-50/20 transition-colors group ${person.active === false || person.active === 0 ? "opacity-60 grayscale hover:grayscale-0 hover:opacity-100" : ""}`}>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 inline-block">
                                                            {person.staff_id ? toLocaleNumber(person.staff_id, shortCode) : t("n_a")}
                                                        </div>
                                                        {(person.active === false || person.active === 0) && (
                                                            <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold uppercase inline-block ml-1">{t("disabled")}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                                                                {person.avatar ? (
                                                                    <img
                                                                        src={person.avatar}
                                                                        alt={person.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-indigo-300">
                                                                        <User className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{person.name}</div>
                                                                <div className="text-[11px] text-slate-400">{person.email || ""}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-md uppercase">
                                                            {getLocalizedRoleName(person.role)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                            <Phone className="h-3.5 w-3.5 text-indigo-400" />
                                                            <span>{person.phone ? toLocaleNumber(person.phone, shortCode) : t("n_a")}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="text-xs text-slate-600">{getLocalizedDepartmentName(person.department)}</div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="text-xs text-slate-600">{getLocalizedRoleName(person.role)}</div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-right pr-6">
                                                        {(hasPerm("human-resource.staff.edit") || hasPerm("human-resource.staff.delete")) && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="h-7 w-7 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors rounded-full cursor-pointer shadow-2xs">
                                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 bg-white">
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => { setStaffToToggle(person); setStatusDialogOpen(true); }}
                                                                            className={`cursor-pointer text-xs font-semibold ${person.active === false || person.active === 0 ? "text-emerald-600 focus:text-emerald-600" : "text-amber-600 focus:text-amber-600"}`}
                                                                        >
                                                                            {person.active === false || person.active === 0 ? (
                                                                                <><CheckCircle className="h-3.5 w-3.5 mr-2" /> {t("enable_staff")}</>
                                                                            ) : (
                                                                                <><Ban className="h-3.5 w-3.5 mr-2" /> {t("disable_staff")}</>
                                                                            )}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={() => handlePrintStaffBadge(person)}
                                                                        className="cursor-pointer text-xs font-semibold text-indigo-600 focus:text-indigo-600"
                                                                    >
                                                                        <QrCode className="h-3.5 w-3.5 mr-2" />
                                                                        {t("print_id_badge_qr")}
                                                                    </DropdownMenuItem>
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                setTransferStaff(person);
                                                                                setTransferDialogOpen(true);
                                                                            }}
                                                                            className="cursor-pointer text-xs font-semibold text-amber-600 focus:text-amber-600"
                                                                        >
                                                                            <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                                                                            {t("transfer_campus_branch")}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleEdit(person.staff_id || person.id)}
                                                                            className="cursor-pointer text-xs font-semibold text-slate-700"
                                                                        >
                                                                            <Edit className="h-3.5 w-3.5 mr-2" />
                                                                            {t("edit")}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleResetPassword(person.staff_id || person.id)}
                                                                            className="cursor-pointer text-xs font-semibold text-slate-700"
                                                                        >
                                                                            <KeyRound className="h-3.5 w-3.5 mr-2" />
                                                                            {t("reset_password")}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasPerm("human-resource.staff.delete") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteClick(person)}
                                                                            className="cursor-pointer text-xs font-semibold text-rose-600 focus:text-rose-600"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                            {t("delete")}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-rose-600" />
                            {t("are_you_absolutely_sure")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            {t("delete_warning_message")}{" "}
                            <span className="font-bold text-slate-900">{staffToDelete?.name}</span> (ID: {staffToDelete?.staff_id ? toLocaleNumber(staffToDelete?.staff_id, shortCode) : ""}) {t("from_the_database")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel onClick={() => setStaffToDelete(null)} className="text-xs font-semibold rounded-lg cursor-pointer">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Status Toggle Confirmation Dialog */}
            <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <AlertDialogContent className="max-w-md rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            {staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0)
                                ? t("enable_staff_member_question")
                                : t("disable_staff_member_question")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            {staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0)
                                ? <>{t("enable_confirmation_prefix")} <span className="font-bold text-slate-900">{staffToToggle.name}</span> {t("enable_confirmation_suffix")}</>
                                : <>{t("disable_confirmation_prefix")} <span className="font-bold text-slate-900">{staffToToggle?.name}</span> {t("disable_confirmation_suffix")}</>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel onClick={() => setStaffToToggle(null)} className="text-xs font-semibold rounded-lg cursor-pointer">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmToggleStatus}
                            className={staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0) ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer" : "bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer"}
                        >
                            {staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0) ? t("enable_staff") : t("disable_staff")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TransferDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                type="staff"
                record={transferStaff}
                onSuccess={() => {
                    fetchStaff(keyword, selectedRole, selectedStatus);
                }}
            />

            <StaffRequisitionDialog
                open={requisitionDialogOpen}
                onOpenChange={setRequisitionDialogOpen}
                defaultBranchSlug={currentBranchSlug || undefined}
            />
        </div>
    );
}
