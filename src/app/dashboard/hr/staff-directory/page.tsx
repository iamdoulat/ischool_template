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
    Plus,
    LayoutGrid,
    List as ListIcon,
    Phone,
    MapPin,
    User,
    MoreVertical,
    Loader2,
    Edit,
    Trash2,
    KeyRound
} from "lucide-react";
import Image from "next/image";
import axios from "axios";

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

export default function StaffDirectoryPage() {
    const router = useRouter();
    const [view, setView] = useState("card");
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [selectedRole, setSelectedRole] = useState("Select");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchStaff = async (searchKeyword = "", roleFilter = "Select") => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchKeyword) params.append("keyword", searchKeyword);
            if (roleFilter !== "Select") params.append("role", roleFilter);

            const token = localStorage.getItem("auth_token");
            const response = await axios.get(`http://127.0.0.1:8000/api/v1/hr/staff-directory?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
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
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("http://127.0.0.1:8000/api/v1/hr/staff-roles", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.status === "Success") {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("http://127.0.0.1:8000/api/v1/profile", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
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

    const isAdmin = currentUser && (currentUser.role === "Admin" || currentUser.role === "Super Admin");

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

    const handleDeleteClick = (staff: Staff) => {
        setStaffToDelete(staff);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!staffToDelete) return;

        try {
            const token = localStorage.getItem("auth_token");
            // Use staff_id if available, otherwise id. Backend supports both now.
            const idToDelete = staffToDelete.staff_id || staffToDelete.id;
            const response = await axios.delete(`http://127.0.0.1:8000/api/v1/hr/staff-directory/${idToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.status === "Success") {
                // Show success message
                alert("Staff deleted successfully!");

                // Refresh staff list
                fetchStaff(keyword, selectedRole);

                // Close dialog
                setDeleteDialogOpen(false);
                setStaffToDelete(null);
            }
        } catch (error: any) {
            console.error("Error deleting staff:", error);
            alert(error.response?.data?.message || "Failed to delete staff. Please try again.");
        }
    };

    const handleResetPassword = async (staffId: string | number) => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post(`http://127.0.0.1:8000/api/v1/hr/staff-directory/${staffId}/reset-password`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.status === "Success") {
                alert("Password reset link has been sent to the staff member's email.");
            }
        } catch (error: any) {
            console.error("Error sending reset link:", error);
            alert(error.response?.data?.message || "Failed to send reset link. Please try again.");
        }
    };

    // Premium gradient button style - Orange to Purple
    const gradientBtn = "bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 transition-all duration-300 border-none rounded-full";

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Staff Directory</h1>
                {hasPerm("human-resource.staff.add") && (
                    <Button
                        onClick={() => router.push('/dashboard/hr/staff-directory/create')}
                        className={`${gradientBtn} gap-2 h-10 px-6 text-sm font-semibold`}
                    >
                        <Plus className="h-4 w-4" /> Add Staff
                    </Button>
                )}
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <h2 className="text-sm font-semibold text-gray-800">Select Criteria</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Role <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 transition-all rounded-lg">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">Select</SelectItem>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Tabs defaultValue="card" className="w-full" onValueChange={setView}>
                    <div className="px-6 border-b border-gray-100 bg-white">
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
                    </div>

                    <TabsContent value="card" className="p-6 m-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                                <p className="text-sm text-gray-400 font-medium">Loading staff records...</p>
                            </div>
                        ) : staffList.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {staffList.map((person) => (
                                    <div key={person.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden flex gap-4">
                                        <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                                            {person.avatar && (person.avatar.startsWith('http') || person.avatar.startsWith('/')) ? (
                                                <img
                                                    src={person.avatar.startsWith('http://127.0.0.1:8000http') ? person.avatar.replace('http://127.0.0.1:8000http', 'http') : person.avatar}
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
                                                    {person.staff_id || "N/A"}
                                                </div>
                                            </div>

                                            <div className="space-y-1 mt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                                    <Phone className="h-3 w-3 text-indigo-400/70" />
                                                    <span>{person.phone || "No phone"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                                    <MapPin className="h-3 w-3 text-indigo-400/70" />
                                                    <span className="truncate">{person.department || "General"}, {person.designation || person.role}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-3">
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-md uppercase tracking-tight">
                                                    {person.role}
                                                </span>
                                                {person.designation && (
                                                    <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-bold rounded-md uppercase tracking-tight">
                                                        {person.designation}
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
                                                            onClick={() => handleEdit(person.staff_id || person.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {hasPerm("human-resource.staff.edit") && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleResetPassword(person.staff_id || person.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <KeyRound className="h-4 w-4 mr-2" />
                                                            Reset Password
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
                                <User className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-sm text-gray-400 font-medium">No staff members found.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="list" className="p-0 m-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                                <p className="text-sm text-gray-400 font-medium">Loading staff records...</p>
                            </div>
                        ) : staffList.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {staffList.map((person) => (
                                            <tr key={person.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-purple-600">{person.staff_id || "N/A"}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                                            {person.avatar && (person.avatar.startsWith('http') || person.avatar.startsWith('/')) ? (
                                                                <img
                                                                    src={person.avatar.startsWith('http://127.0.0.1:8000http') ? person.avatar.replace('http://127.0.0.1:8000http', 'http') : person.avatar}
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
                                                        <span>{person.phone || "N/A"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{person.department || "—"}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{person.designation || "—"}</div>
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
                                                                        onClick={() => handleEdit(person.staff_id || person.id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {hasPerm("human-resource.staff.edit") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleResetPassword(person.staff_id || person.id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <KeyRound className="h-4 w-4 mr-2" />
                                                                        Reset Password
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
                                <User className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-sm text-gray-400 font-medium">No staff members found.</p>
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
        </div>
    );
}
