"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    MoreVertical,
    Loader2,
    Edit,
    Trash2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

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

export default function DisabledStaffPage() {
    const router = useRouter();
    const { toast } = useToast();
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
    const [currentUser, setCurrentUser] = useState<any>(null);

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
                    title: "Staff Member Enabled",
                    description: `${staffToEnable.name} has been successfully enabled and restored to active status.`,
                });
                fetchStaff(keyword, selectedRole);
                setEnableDialogOpen(false);
                setStaffToEnable(null);
            }
        } catch (error: any) {
            console.error("Error enabling staff:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to enable staff. Please try again.",
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
                    title: "Success",
                    description: "Staff deleted successfully!",
                });
                fetchStaff(keyword, selectedRole);
                setDeleteDialogOpen(false);
                setStaffToDelete(null);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete staff. Please try again.",
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
                <h1 className="text-xl font-medium text-gray-800">Disabled Staff</h1>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                <h2 className="text-sm font-semibold text-gray-800">Select Criteria</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Role
                            </Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 transition-all rounded-lg">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">All Roles</SelectItem>
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
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Search By Keyword
                            </Label>
                            <Input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search By Staff ID, Name, Role etc..."
                                className="h-11 border-gray-200 text-sm focus-visible:ring-indigo-500 rounded-lg"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSearch} className={`${gradientBtn} gap-2 h-10 px-8 text-sm font-semibold`}>
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff View Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "card" | "list")} className="w-full">
                    <div className="px-6 border-b border-gray-100 bg-white flex justify-between items-center">
                        <TabsList className="bg-transparent h-14 gap-8 p-0">
                            <TabsTrigger
                                value="card"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-14 text-xs font-bold text-gray-400 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2 transition-all"
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" /> Card View
                            </TabsTrigger>
                            <TabsTrigger
                                value="list"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-14 text-xs font-bold text-gray-400 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2 transition-all"
                            >
                                <ListIcon className="h-4 w-4 mr-2" /> List View
                            </TabsTrigger>
                        </TabsList>
                        
                        {/* Pagination Controls Top */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="mr-2 text-xs font-medium">Page {currentPage} of {totalPages}</span>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full border-gray-200" 
                                    onClick={handlePrevPage} 
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full border-gray-200" 
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
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                                <p className="text-sm text-gray-400 font-medium">Loading disabled staff...</p>
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
                                                    {person.staff_id || "N/A"} • Disabled
                                                </div>
                                            </div>

                                            <div className="space-y-1 mt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    <span>{person.phone || "No phone"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                                                    <MapPin className="h-3 w-3 text-gray-400" />
                                                    <span className="truncate">{person.department || "General"}</span>
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
                                                            Enable Staff
                                                        </DropdownMenuItem>
                                                    )}
                                                    {hasPerm("human-resource.staff.edit") && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(person.staff_id || person.id)}
                                                            className="cursor-pointer"
                                                        >
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
                                <p className="text-sm text-gray-500 font-medium">No disabled staff members found.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="list" className="p-0 m-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                                <p className="text-sm text-gray-400 font-medium">Loading disabled staff...</p>
                            </div>
                        ) : currentData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {currentData.map((person) => (
                                            <tr key={person.id} className="hover:bg-gray-50 transition-colors group opacity-80 hover:opacity-100">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-red-500">{person.staff_id || "N/A"}</div>
                                                    <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Disabled</span>
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
                                                                        Enable Staff
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {hasPerm("human-resource.staff.edit") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleEdit(person.staff_id || person.id)}
                                                                        className="cursor-pointer"
                                                                    >
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <User className="h-12 w-12 text-gray-300 mx-auto mb-4 opacity-50" />
                                <p className="text-sm text-gray-500 font-medium">No disabled staff members found.</p>
                            </div>
                        )}
                        
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
                                        className="h-9 px-4 text-sm"
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <Button
                                                key={i}
                                                variant={currentPage === i + 1 ? "default" : "outline"}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`h-9 w-9 p-0 ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : ''}`}
                                            >
                                                {i + 1}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="h-9 px-4 text-sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the staff member{" "}
                            <span className="font-bold text-gray-900">{staffToDelete?.name}</span> (ID: {staffToDelete?.staff_id}) from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Enable Confirmation Dialog */}
            <AlertDialog open={enableDialogOpen} onOpenChange={setEnableDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Enable Staff Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to enable{" "}
                            <span className="font-bold text-gray-900">{staffToEnable?.name}</span>?
                            They will regain access to the system and appear in the active staff directory.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStaffToEnable(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEnableConfirm}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Enable
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
