"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    Ban
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

interface Staff {
    id: number;
    staff_id: string;
    name: string;
    email?: string;
    role: string;
    phone: string;
    department?: string;
    avatar?: string;
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
    const { toast } = useToast();
    const { t } = useTranslation();
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
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const fetchStaff = async (searchKeyword = "", roleFilter = "Select", statusFilter = "all") => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchKeyword) params.append("keyword", searchKeyword);
            if (roleFilter !== "Select") params.append("role", roleFilter);
            params.append("active", statusFilter);

            const response = await api.get(`/hr/staff-directory?${params.toString()}`);
            if (response.data.status === "Success") {
                setStaffList(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get("/hr/staff-roles");
            if (response.data.status === "Success") {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get("/profile");
            if (response.data.status === "Success") {
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
    }, []);

    const isAdmin = currentUser && (currentUser.role === "Admin" || currentUser.role === "Super Admin" || currentUser.role === "SUPER ADMIN");

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

    // Premium gradient button style - Orange to Purple
    const gradientBtn = "bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 transition-all duration-300 border-none rounded-full";

    return (
        <div className="p-2 space-y-2 bg-transparent min-h-screen font-sans">
            <div className="flex justify-between items-center bg-transparent p-4 rounded-md border border-slate-200/60 shadow-none">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Users className="h-5 w-5" />
                    </span>
                    <h1 className="text-lg font-bold text-gray-800 uppercase tracking-widest">{t("staff_directory")}</h1>
                </div>
                {hasPerm("human-resource.staff.add") && (
                    <Button
                        onClick={() => router.push('/dashboard/hr/staff-directory/create')}
                        className={`${gradientBtn} gap-2 h-10 px-6 text-sm font-semibold`}
                    >
                        <Plus className="h-4 w-4" /> {t("add_staff")}
                    </Button>
                )}
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_staff_by_role_or_keyword")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    {t("role")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 transition-all rounded-lg">
                                        <SelectValue placeholder={t("select_role")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Select">{t("select")}</SelectItem>
                                        {roles.map((role) => (
                                            <SelectItem key={role.name} value={role.name}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSearch} className={`${gradientBtn} gap-2 h-10 px-8 text-sm font-semibold`}>
                                    <Search className="h-4 w-4" /> {t("search")}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    {t("search_by_keyword")}
                                </Label>
                                <Input
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder={t("search_by_staff_id_name_role")}
                                    className="h-11 border-gray-200 text-sm focus-visible:ring-indigo-500 rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSearch} className={`${gradientBtn} gap-2 h-10 px-8 text-sm font-semibold`}>
                                    <Search className="h-4 w-4" /> {t("search")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Staff View Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Users className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("staff_directory")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{staffList.length} {staffList.length !== 1 ? t("staff_members") : t("staff_member")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="card" className="w-full" onValueChange={setView}>
                        <div className="px-6 border-b border-gray-100 bg-white flex justify-between items-center">
                            <TabsList className="bg-transparent h-14 gap-8 p-0">
                                <TabsTrigger
                                    value="card"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-14 text-xs font-bold text-gray-400 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2 transition-all"
                                >
                                    <LayoutGrid className="h-4 w-4 mr-2" /> {t("card_view")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="list"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-14 text-xs font-bold text-gray-400 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2 transition-all"
                                >
                                    <ListIcon className="h-4 w-4 mr-2" /> {t("list_view")}
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center">
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(val) => {
                                        setSelectedStatus(val);
                                        fetchStaff(keyword, selectedRole, val);
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-[140px] border-gray-200 text-xs font-semibold text-gray-600 focus:ring-indigo-500 transition-all rounded-lg">
                                        <SelectValue placeholder={t("status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all_staff")}</SelectItem>
                                        <SelectItem value="true">{t("active_staff")}</SelectItem>
                                        <SelectItem value="false">{t("disabled_staff_filter")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <TabsContent value="card" className="p-6 m-0">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <CardSkeleton count={8} />
                                </div>
                            ) : staffList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {staffList.map((person) => (
                                        <div key={person.id} className={`bg-white border border-gray-100 rounded-lg p-4 hover:shadow-xl transition-all group relative overflow-hidden flex gap-4 ${person.active === false || person.active === 0 ? "opacity-60 grayscale hover:grayscale-0 hover:opacity-100" : "hover:shadow-indigo-500/5"}`}>
                                            <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                                                {person.avatar ? (
                                                    <img
                                                        src={person.avatar}
                                                        alt={person.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        onError={(e) => {
                                                            // Fallback if image fails to load
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-indigo-200">
                                                        <User className="h-10 w-10" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col justify-between py-1 w-full">
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                                        {person.name}
                                                    </h3>
                                                    <div className="text-[11px] font-bold text-indigo-500/70 mt-0.5">
                                                        {person.staff_id || t("n_a")}
                                                    </div>
                                                </div>

                                                <div className="space-y-1 mt-2">
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                                        <Phone className="h-3 w-3 text-indigo-400/70" />
                                                        <span>{person.phone || t("no_phone")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                                        <MapPin className="h-3 w-3 text-indigo-400/70" />
                                                        <span className="truncate">{person.department || t("general")} - {person.role}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mt-3">
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-md uppercase tracking-tight">
                                                        {person.role}
                                                    </span>
                                                    {(person.active === false || person.active === 0) && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-md uppercase tracking-tight">
                                                            {t("disabled")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {(hasPerm("human-resource.staff.edit") || hasPerm("human-resource.staff.delete")) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="absolute top-3 right-2 p-1 text-gray-300 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => { setStaffToToggle(person); setStatusDialogOpen(true); }}
                                                                className={`cursor-pointer ${person.active === false || person.active === 0 ? "text-green-600 focus:text-green-600" : "text-amber-600 focus:text-amber-600"}`}
                                                            >
                                                                {person.active === false || person.active === 0 ? (
                                                                    <><CheckCircle className="h-4 w-4 mr-2" /> {t("enable_staff")}</>
                                                                ) : (
                                                                    <><Ban className="h-4 w-4 mr-2" /> {t("disable_staff")}</>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleEdit(person.staff_id || person.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                {t("edit")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleResetPassword(person.staff_id || person.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <KeyRound className="h-4 w-4 mr-2" />
                                                                {t("reset_password")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPerm("human-resource.staff.delete") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(person)}
                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
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
                                <div className="text-center py-20">
                                    <User className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-sm text-gray-400 font-medium">{t("no_staff_found")}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="list" className="p-0 m-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("staff_id")}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("name")}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("role")}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("phone")}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("department")}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("designation")}</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={7} />
                                        ) : staffList.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            staffList.map((person) => (
                                                <tr key={person.id} className={`hover:bg-gray-50 transition-colors group ${person.active === false || person.active === 0 ? "opacity-60 grayscale hover:grayscale-0 hover:opacity-100" : ""}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-purple-600">{person.staff_id || t("n_a")}</div>
                                                        {(person.active === false || person.active === 0) && (
                                                            <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase inline-block mt-1">{t("disabled")}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                                                                {person.avatar ? (
                                                                    <img
                                                                        src={person.avatar}
                                                                        alt={person.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-purple-200">
                                                                        <User className="h-6 w-6" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-800 group-hover:text-purple-600 transition-colors">{person.name}</div>
                                                                <div className="text-xs text-gray-400">{person.email || ""}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full uppercase">
                                                            {person.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="h-4 w-4 text-purple-400" />
                                                            <span>{person.phone || t("n_a")}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{person.department || "—"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{person.role}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {(hasPerm("human-resource.staff.edit") || hasPerm("human-resource.staff.delete")) && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-2 text-gray-300 hover:text-purple-600 transition-colors rounded-full hover:bg-purple-50">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40">
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => { setStaffToToggle(person); setStatusDialogOpen(true); }}
                                                                            className={`cursor-pointer ${person.active === false || person.active === 0 ? "text-green-600 focus:text-green-600" : "text-amber-600 focus:text-amber-600"}`}
                                                                        >
                                                                            {person.active === false || person.active === 0 ? (
                                                                                <><CheckCircle className="h-4 w-4 mr-2" /> {t("enable_staff")}</>
                                                                            ) : (
                                                                                <><Ban className="h-4 w-4 mr-2" /> {t("disable_staff")}</>
                                                                            )}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleEdit(person.staff_id || person.id)}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <Edit className="h-4 w-4 mr-2" />
                                                                            {t("edit")}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleResetPassword(person.staff_id || person.id)}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <KeyRound className="h-4 w-4 mr-2" />
                                                                            {t("reset_password")}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasPerm("human-resource.staff.delete") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteClick(person)}
                                                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_warning_message")}{" "}
                            <span className="font-bold text-gray-900">{staffToDelete?.name}</span> (ID: {staffToDelete?.staff_id}) from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStaffToDelete(null)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Status Toggle Confirmation Dialog */}
            <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0)
                                ? t("enable_staff_member_question")
                                : t("disable_staff_member_question")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0)
                                ? <>{t("enable_confirmation_prefix")} {staffToToggle.name}? {t("enable_confirmation_suffix")}</>
                                : <>{t("disable_confirmation_prefix")} {staffToToggle?.name}? {t("disable_confirmation_suffix")}</>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStaffToToggle(null)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmToggleStatus}
                            className={staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0) ? "bg-green-600 hover:bg-green-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
                        >
                            {staffToToggle && (staffToToggle.active === false || staffToToggle.active === 0) ? t("enable") : t("disable")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
