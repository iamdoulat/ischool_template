"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    MoreVertical,
    Pencil,
    Trash2,
    UserCog,
    BadgeCheck,
    CreditCard,
    User,
    Mail,
    Calendar,
    Phone,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

interface StaffMember {
    id: number;
    name: string;
    email: string;
    dob: string;
    phone: string;
    staff_id: string;
    avatar?: string;
    photo?: string;
    image?: string;
    user?: {
        avatar?: string;
        photo?: string;
        image?: string;
    };
    library_member?: {
        id: number;
        member_id: string;
        library_card_no: string;
        active: boolean;
    };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TABLE_COLS = 7;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div
                                className="h-3 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function AddStaffLibraryPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const getImageUrl = useImageUrl();
    const [searchTerm, setSearchTerm] = useState("");
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState("50");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [memberFormData, setMemberFormData] = useState({
        library_card_no: "",
        member_id: ""
    });
    const [saving, setSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

    const fetchStaff = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/library/members?type=staff&page=${page}&search=${searchTerm}&limit=${limit}`);
            setStaffList(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching staff:", error);
            tt.error("failed_to_fetch_staff_records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStaff(1);
    };

    const handleAddMembership = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setIsEditing(false);
        setMemberFormData({
            library_card_no: "",
            member_id: staff.staff_id || ""
        });
        setIsDialogOpen(true);
    };

    const handleEditMembership = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setIsEditing(true);
        setMemberFormData({
            library_card_no: staff.library_member?.library_card_no || "",
            member_id: staff.library_member?.member_id || ""
        });
        setIsDialogOpen(true);
    };

    const saveMembership = async () => {
        if (!memberFormData.member_id) {
            tt.error("library_member_id_required");
            return;
        }

        setSaving(true);
        try {
            await api.post('/library/members', {
                user_id: selectedStaff?.id,
                member_type: 'staff',
                ...memberFormData
            });
            tt.success("library_membership_assigned_successfully");
            setIsDialogOpen(false);
            fetchStaff();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            tt.error(message || "failed_to_assign_membership");
        } finally {
            setSaving(false);
        }
    };

    const updateMembership = async () => {
        if (!memberFormData.member_id) {
            tt.error("library_member_id_required");
            return;
        }

        setSaving(true);
        try {
            await api.put(`/library/members/${selectedStaff?.id}`, memberFormData);
            tt.success("library_membership_updated_successfully");
            setIsDialogOpen(false);
            fetchStaff();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            tt.error(message || "failed_to_update_membership");
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeClick = (staff: StaffMember) => {
        setDeleteTarget(staff);
        setIsDeleteDialogOpen(true);
    };

    const confirmRevoke = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/library/members/${deleteTarget.id}`);
            tt.success("membership_revoked_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchStaff();
        } catch {
            tt.error("failed_to_revoke_membership");
        }
    };

    const handleCopy = () => {
        const text = staffList.map(s => `${s.name}\t${s.email}\t${s.library_member ? 'Member' : 'Not Member'}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = ["Name", "Email", "Member ID", "Card No", "Status"];
        const rows = staffList.map(s => [s.name, s.email, s.library_member?.member_id || "-", s.library_member?.library_card_no || "-", s.library_member ? 'Active' : 'Inactive']);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "library_staff.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            {/* Staff Member List Section */}
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                <div className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <UserCog className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("staff_member_list")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("staff_records_count", { count: pagination?.total ?? staffList.length })}</p>
                    </div>
                </div>
                <CardContent className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search_by_name_email_staff_id")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                <Search className="h-4 w-4" /> {t("search")}
                            </Button>
                        </form>

                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="w-[70px] h-9 text-xs">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    >
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* List Table */}
                    <div className="rounded-xl border border-gray-200/80 overflow-x-auto custom-scrollbar shadow-xs bg-white">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-gradient-to-r from-gray-50/90 via-slate-50/80 to-indigo-50/30 text-[11px] uppercase tracking-wider border-b border-gray-200/80">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-4"><div className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-indigo-500" /> {t("member_id")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-slate-500" /> {t("library_card_no")}</div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-indigo-500" /> {t("staff_name")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {t("email")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> {t("date_of_birth")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-emerald-600" /> {t("phone")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-4 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : staffList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLS} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <UserCog className="h-8 w-8 text-gray-300 stroke-1" />
                                                <span>{t("no_staff_found")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : staffList.map((staff) => {
                                    const staffName = staff.name || "Staff Member";
                                    const initials = staffName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                                    const isMember = !!staff.library_member;

                                    return (
                                        <TableRow
                                            key={staff.id}
                                            className={cn(
                                                "text-xs border-b border-gray-100 hover:shadow-xs relative transition-all duration-200 whitespace-nowrap group",
                                                isMember ? "bg-emerald-50/30 hover:bg-emerald-50/60" : "hover:bg-indigo-50/40"
                                            )}
                                        >
                                            {/* Member ID */}
                                            <TableCell className="py-3 px-4">
                                                {isMember ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] border border-indigo-200/70">
                                                        {staff.library_member?.member_id}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-gray-400 font-mono text-[10px] bg-gray-100">
                                                        Not Member
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Card No */}
                                            <TableCell className="py-3 px-3">
                                                {staff.library_member?.library_card_no ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200/60 font-medium">
                                                        <CreditCard className="h-3 w-3 text-slate-500" />
                                                        {staff.library_member.library_card_no}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 font-sans">—</span>
                                                )}
                                            </TableCell>

                                            {/* Staff Name with Avatar */}
                                            <TableCell className="py-3 px-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="h-8 w-8 rounded-full border border-gray-200 shadow-2xs shrink-0 overflow-hidden">
                                                        <AvatarImage
                                                            src={getImageUrl(staff.avatar || staff.photo || staff.image || staff.user?.avatar || staff.user?.photo || staff.user?.image)}
                                                            alt={staffName}
                                                            className="object-cover h-full w-full"
                                                        />
                                                        <AvatarFallback className={cn(
                                                            "text-white font-bold text-[11px] flex items-center justify-center h-full w-full",
                                                            isMember
                                                                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                                                : "bg-gradient-to-br from-purple-500 to-indigo-600"
                                                        )}>
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                                            {staffName}
                                                        </p>
                                                        {staff.email && (
                                                            <p className="text-[10px] text-gray-400 truncate max-w-[180px]">
                                                                {staff.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Email */}
                                            <TableCell className="py-3 px-3 text-gray-600 font-medium">
                                                {staff.email ? (
                                                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        {staff.email}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </TableCell>

                                            {/* DOB */}
                                            <TableCell className="py-3 px-3 text-gray-500 text-[11px]">
                                                {staff.dob ? formatDate(staff.dob) : <span className="text-gray-300">—</span>}
                                            </TableCell>

                                            {/* Phone */}
                                            <TableCell className="py-3 px-3 text-gray-600 font-medium">
                                                {staff.phone ? (
                                                    <span className="inline-flex items-center gap-1 text-gray-700">
                                                        <Phone className="h-3 w-3 text-emerald-500" />
                                                        {staff.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </TableCell>

                                            {/* Action */}
                                            <TableCell className="py-3 px-4 text-right">
                                                {isMember ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEditMembership(staff)}
                                                            className="h-7 w-7 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200/70 rounded-md p-0 shadow-2xs active:scale-95 transition-all cursor-pointer"
                                                            title={t("edit")}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleRevokeClick(staff)}
                                                            className="h-7 w-7 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200/70 rounded-md p-0 shadow-2xs active:scale-95 transition-all cursor-pointer"
                                                            title={t("revoke")}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAddMembership(staff)}
                                                        className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200/80 rounded-md text-[10px] font-bold gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        <span>{t("add")}</span>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>
                            {t("showing_x_to_y_of_z", { from: pagination?.from || 0, to: pagination?.to || 0, total: pagination?.total || 0 })}
                        </div>
                        <div className="flex gap-1 items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === 1}
                                onClick={() => fetchStaff(pagination!.current_page - 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button
                                    key={i + 1}
                                    size="sm"
                                    onClick={() => fetchStaff(i + 1)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all",
                                        pagination?.current_page === i + 1
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md"
                                            : "bg-white text-gray-600 border border-gray-200"
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === pagination.last_page}
                                onClick={() => fetchStaff(pagination!.current_page + 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add / Edit Membership Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] p-0 flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 rounded-t-lg">
                        <DialogTitle className="text-lg font-bold text-gray-800">{isEditing ? t("edit_library_member") : t("add_library_member")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 p-6 overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("staff_name")}</Label>
                            <Input value={selectedStaff?.name || ""} disabled className="h-9 bg-gray-50 border-gray-200 text-xs shadow-none" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("library_card_no")}</Label>
                                <Input
                                    value={memberFormData.library_card_no}
                                    onChange={(e) => setMemberFormData({ ...memberFormData, library_card_no: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                    placeholder={t("optional")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                    {t("member_id")} <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={memberFormData.member_id}
                                    onChange={(e) => setMemberFormData({ ...memberFormData, member_id: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                    placeholder={t("required")}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-lg">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full" disabled={saving}>{t("cancel")}</Button>
                        <Button onClick={isEditing ? updateMembership : saveMembership} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] uppercase font-bold shadow-lg active:scale-95 transition-all" disabled={saving}>
                            {saving ? t("saving") : isEditing ? t("update_member") : t("add_member")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("revoke_membership")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("revoke_membership_confirmation", { name: deleteTarget?.name || "" })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRevoke} className="bg-red-500 hover:bg-red-600 text-white">{t("revoke")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
