"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
import { cn } from "@/lib/utils";

interface StaffMember {
    id: number;
    name: string;
    email: string;
    dob: string;
    phone: string;
    staff_id: string;
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
    const { toast } = useToast();
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
            toast({ title: "Error", description: "Failed to fetch staff records", variant: "destructive" });
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
            toast({ title: "Error", description: "Library Member ID is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await api.post('/library/members', {
                user_id: selectedStaff?.id,
                member_type: 'staff',
                ...memberFormData
            });
            toast({ title: "Success", description: "Library membership assigned successfully" });
            setIsDialogOpen(false);
            fetchStaff();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to assign membership";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const updateMembership = async () => {
        if (!memberFormData.member_id) {
            toast({ title: "Error", description: "Library Member ID is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await api.put(`/library/members/${selectedStaff?.id}`, memberFormData);
            toast({ title: "Success", description: "Library membership updated successfully" });
            setIsDialogOpen(false);
            fetchStaff();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update membership";
            toast({ title: "Error", description: message, variant: "destructive" });
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
            toast({ title: "Success", description: "Membership revoked successfully" });
            setIsDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchStaff();
        } catch {
            toast({ title: "Error", description: "Failed to revoke membership", variant: "destructive" });
        }
    };

    const handleCopy = () => {
        const text = staffList.map(s => `${s.name}\t${s.email}\t${s.library_member ? 'Member' : 'Not Member'}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
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
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <UserCog className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Staff Member List</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? staffList.length} staff record{(pagination?.total ?? staffList.length) === 1 ? "" : "s"}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search by name, email, staff ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                <Search className="h-4 w-4" /> Search
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
                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Member ID <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600">Library Card No.</TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Staff Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Email <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Phone <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : staffList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            No staff found
                                        </TableCell>
                                    </TableRow>
                                ) : staffList.map((staff) => (
                                    <TableRow
                                        key={staff.id}
                                        className={cn(
                                            "text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap",
                                            staff.library_member && "bg-[#e8f5e9]/60 hover:bg-[#c8e6c9]/60"
                                        )}
                                    >
                                        <TableCell className="py-3 text-gray-500">{staff.library_member?.member_id || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{staff.library_member?.library_card_no || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-700 font-medium">{staff.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{staff.email}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{staff.dob ? formatDate(staff.dob) : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{staff.phone || "-"}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="text-xs">
                                                    {staff.library_member ? (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleEditMembership(staff)}>
                                                                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleRevokeClick(staff)} className="text-red-500">
                                                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Revoke
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleAddMembership(staff)}>
                                                            <Plus className="h-3.5 w-3.5 mr-2" /> Add
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>
                            Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800">{isEditing ? "Edit Library Member" : "Add Library Member"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Staff Name</Label>
                            <Input value={selectedStaff?.name || ""} disabled className="h-9 bg-gray-50 border-gray-200 text-xs shadow-none" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Library Card No.</Label>
                                <Input
                                    value={memberFormData.library_card_no}
                                    onChange={(e) => setMemberFormData({ ...memberFormData, library_card_no: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                    Member ID <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={memberFormData.member_id}
                                    onChange={(e) => setMemberFormData({ ...memberFormData, member_id: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                    placeholder="Required"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full" disabled={saving}>Cancel</Button>
                        <Button onClick={isEditing ? updateMembership : saveMembership} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] uppercase font-bold shadow-lg active:scale-95 transition-all" disabled={saving}>
                            {saving ? "Saving..." : isEditing ? "Update Member" : "Add Member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Membership</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke library membership for <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRevoke} className="bg-red-500 hover:bg-red-600 text-white">Revoke</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
