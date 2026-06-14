"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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



export default function AddStaffLibraryPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
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
            setStaffList(response.data.data);
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
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to assign membership",
                variant: "destructive",
            });
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
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update membership",
                variant: "destructive",
            });
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
        } catch (error) {
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
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Staff Member List Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <h2 className="text-sm font-medium text-gray-800">Staff Member List</h2>

                 {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-fit">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                            />
                        </div>
                        <Button type="submit" className="btn-gradient h-9 px-6 text-[11px] font-bold flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </form>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2 flex gap-1 items-center justify-between">
                                    <SelectValue />
                                    <ChevronLeft className="h-2 w-2 text-gray-400 rotate-90" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {toolbarActions.map((action, i) => (
                                <Button 
                                    key={i} 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={action.onClick}
                                    title={action.title}
                                    className="h-7 w-7 hover:bg-gray-100 rounded"
                                >
                                    <action.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Member ID <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Library Card No.</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Staff Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Email <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Phone <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {staffList.map((staff) => (
                                <TableRow
                                    key={staff.id}
                                    className={cn(
                                        "text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap",
                                        staff.library_member && "bg-[#e8f5e9]/60 hover:bg-[#c8e6c9]/60" // Light green for members
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

                 {/* Footer / Pagination */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                    <div>
                        Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === 1}
                            onClick={() => fetchStaff(pagination!.current_page - 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {[...Array(pagination?.last_page || 0)].map((_, i) => (
                            <Button 
                                key={i + 1}
                                onClick={() => fetchStaff(i + 1)}
                                className={cn(
                                    "h-7 w-7 p-0 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300",
                                    pagination?.current_page === i + 1 
                                        ? "btn-gradient" 
                                        : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                                )}
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === pagination?.last_page}
                            onClick={() => fetchStaff(pagination!.current_page + 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Add / Edit Membership Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-gray-800">{isEditing ? "Edit Library Member" : "Add Library Member"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Staff Name</Label>
                                <Input value={selectedStaff?.name || ""} disabled className="h-9 bg-gray-50 border-gray-200 text-xs shadow-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase">Library Card No.</Label>
                                    <Input 
                                        value={memberFormData.library_card_no}
                                        onChange={(e) => setMemberFormData({ ...memberFormData, library_card_no: e.target.value })}
                                        className="h-9 border-gray-200 text-xs shadow-none"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
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
                            <Button onClick={isEditing ? updateMembership : saveMembership} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full" disabled={saving}>
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
        </div>
    );
}
