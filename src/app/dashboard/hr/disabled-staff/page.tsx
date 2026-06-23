"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    LayoutGrid,
    List as ListIcon,
    Phone,
    MapPin,
    User,
    UserX,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
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
    designation?: string;
    avatar?: string;
}

interface Role {
    name: string;
}

interface CurrentUser {
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

export default function DisabledStaffPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<"card" | "list">("card");
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [selectedRole, setSelectedRole] = useState("Select");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
    const [enableDialogOpen, setEnableDialogOpen] = useState(false);
    const [staffToEnable, setStaffToEnable] = useState<Staff | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchStaff = async (searchKeyword = "", roleFilter = "Select") => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchKeyword) params.append("keyword", searchKeyword);
            if (roleFilter !== "Select") params.append("role", roleFilter);
            params.append("active", "false"); // Only fetch disabled staff

            const response = await api.get(`/hr/staff-directory?${params.toString()}`);
            if (response.data.status === "Success") {
                setStaffList(response.data.data);
                setCurrentPage(1); // Reset to first page on search
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

    const hasPerm = (permission: string) => {
        if (!currentUser || !currentUser.permissions) return false;
        if (currentUser.permissions.includes("all")) return true;
        return currentUser.permissions.includes(permission);
    };

    const handleSearch = () => {
        fetchStaff(keyword, selectedRole);
    };

    const handleEdit = (staffId: string | number) => {
        router.push(`/dashboard/hr/staff-directory/edit/${staffId}`);
    };

    const handleEnableClick = (staff: Staff) => {
        setStaffToEnable(staff);
        setEnableDialogOpen(true);
    };

    const handleEnableConfirm = async () => {
        if (!staffToEnable) return;
        try {
            const idToUpdate = staffToEnable.staff_id || staffToEnable.id;
            const response = await api.put(`/hr/staff-directory/${idToUpdate}`, { active: true });
            if (response.data.status === "Success") {
                toast({
                    title: t("staff_member_enabled"),
                    description: t("x_has_been_enabled_restored", { name: staffToEnable.name }),
                });
                fetchStaff(keyword, selectedRole);
                setEnableDialogOpen(false);
                setStaffToEnable(null);
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error("Error enabling staff:", error);
            toast({
                title: t("error"),
                description: err.response?.data?.message || t("failed_to_enable_staff"),
                variant: "destructive",
            });
            setEnableDialogOpen(false);
        }
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
                fetchStaff(keyword, selectedRole);
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

    // Premium gradient button style
    const gradientBtn = "bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 transition-all duration-300 border-none rounded-full";

    // Pagination logic
    const totalPages = Math.ceil(staffList.length / itemsPerPage);
    const currentData = staffList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="flex items-center gap-2 text-xl font-medium text-gray-800">
                    <UserX className="h-6 w-6 text-[#6366F1]" />
                    {t("disabled_staff")}
                </h1>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_disabled_staff_by_role_or_keyword")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    {t("role")}
                                </Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 transition-all rounded-lg">
                                        <SelectValue placeholder={t("select_role")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Select">{t("all_roles")}</SelectItem>
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
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserX className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("disabled_staff")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{staffList.length} {staffList.length === 1 ? t("disabled_member") : t("disabled_members")}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "card" | "list")} className="w-full">
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

                            {/* Pagination Controls Top */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="mr-2 text-xs font-medium">{`${t("page")} ${currentPage} ${t("of")} ${totalPages}`}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-[10px] border-gray-200"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-[10px] border-gray-200"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <TabsContent value="card" className="p-6 m-0">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <CardSkeleton count={8} />
                                </div>
                            ) : currentData.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {currentData.map((person) => (
                                        <div key={person.id} className="bg-gray-50/50 border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all group relative overflow-hidden flex gap-4 opacity-80 hover:opacity-100 grayscale hover:grayscale-0">
                                            <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                                {person.avatar ? (
                                                    <img
                                                        src={person.avatar}
                                                        alt={person.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                        <User className="h-10 w-10" />
                                                    </div>
                                                )}
                                                <div className="absolute top-0 left-0 w-full h-full bg-red-500/10 mix-blend-multiply pointer-events-none"></div>
                                            </div>

                                            <div className="flex flex-col justify-between py-1 w-full">
                                                <div>
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="text-sm font-bold text-gray-700 truncate pr-6">
                                                            {person.name}
                                                        </h3>
                                                    </div>
                                                    <div className="text-[11px] font-bold text-red-500 mt-0.5">
                                                        {person.staff_id || t("not_available")} • {t("disabled")}
                                                    </div>
                                                </div>

                                                <div className="space-y-1 mt-2">
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                                                        <Phone className="h-3 w-3 text-gray-400" />
                                                        <span>{person.phone || t("no_phone")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                                                        <MapPin className="h-3 w-3 text-gray-400" />
                                                        <span className="truncate">{person.department || t("general")}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mt-3">
                                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-bold rounded-md uppercase tracking-tight">
                                                        {person.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {(hasPerm("human-resource.staff.edit") || hasPerm("human-resource.staff.delete")) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="absolute top-3 right-2 p-1 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        {hasPerm("human-resource.staff.edit") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleEnableClick(person)}
                                                                className="cursor-pointer text-green-600 focus:text-green-600"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                {t("enable_staff")}
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPerm("human-resource.staff.delete") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(person)}
                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
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
                                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm text-gray-500 font-medium">{t("no_disabled_staff_found")}</p>
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
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={6} />
                                        ) : currentData.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            currentData.map((person) => (
                                                <tr key={person.id} className="hover:bg-gray-50 transition-colors group opacity-80 hover:opacity-100">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-red-500">{person.staff_id || t("not_available")}</div>
                                                        <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">{t("disabled")}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200 grayscale">
                                                                {person.avatar ? (
                                                                    <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                                        <User className="h-6 w-6" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-700">{person.name}</div>
                                                                <div className="text-xs text-gray-400">{person.email || ""}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">
                                                            {person.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Phone className="h-4 w-4 text-gray-400" />
                                                            <span>{person.phone || "N/A"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{person.department || "—"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {(hasPerm("human-resource.staff.edit") || hasPerm("human-resource.staff.delete")) && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40">
                                                                    {hasPerm("human-resource.staff.edit") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleEnableClick(person)}
                                                                            className="cursor-pointer text-green-600 focus:text-green-600"
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            {t("enable_staff")}
                                                                            <Edit className="h-4 w-4 mr-2" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasPerm("human-resource.staff.delete") && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteClick(person)}
                                                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Delete
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

                            {/* Bottom Pagination */}
                            {totalPages > 1 && currentData.length > 0 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                                    <p className="text-sm text-gray-500">
                                        Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, staffList.length)}</span> of <span className="font-medium text-gray-900">{staffList.length}</span> entries
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handlePrevPage}
                                            disabled={currentPage === 1}
                                            className="h-9 px-4 text-sm bg-white border border-gray-200 text-gray-600 rounded-[10px]"
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <Button
                                                    key={i}
                                                    variant={currentPage === i + 1 ? "default" : "outline"}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`h-9 w-9 p-0 rounded-[10px] ${currentPage === i + 1 ? 'bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                                                >
                                                    {i + 1}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className="h-9 px-4 text-sm bg-white border border-gray-200 text-gray-600 rounded-[10px]"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
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
                            {t("delete_warning_prefix")}{" "}
                            <span className="font-bold text-gray-900">{staffToDelete?.name}</span> ({t("id_colon")} {staffToDelete?.staff_id}) {t("from_the_database")}
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

            {/* Enable Confirmation Dialog */}
            <AlertDialog open={enableDialogOpen} onOpenChange={setEnableDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("enable_staff_member_question")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("are_you_sure_enable")}{" "}
                            <span className="font-bold text-gray-900">{staffToEnable?.name}</span>?
                            {t("they_will_regain_access")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStaffToEnable(null)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEnableConfirm}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {t("enable")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
