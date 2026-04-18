"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    Search,
    ArrowUpDown,
    Loader2,
    Key
} from "lucide-react";
import api from "@/lib/api";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Student");
    const [limit, setLimit] = useState("50");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/users", {
                params: {
                    role: activeTab,
                    search: searchTerm,
                    limit: limit
                }
            });
            setUsers(response.data.data.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchTerm, limit]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchUsers]);

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await api.patch(`/users/${id}`, { active: !currentStatus });
            fetchUsers();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const handleAdminResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            alert("Password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setIsResetting(true);
        try {
            await api.post(`/system-setting/users/${selectedUser.id}/reset-password`, {
                new_password: newPassword,
                new_password_confirmation: confirmPassword
            });
            alert(`Password for ${selectedUser.name} reset successfully`);
            setResetDialogOpen(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to reset password");
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
                {/* Header with Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center px-4 py-2 border-b border-gray-100">
                    <h1 className="text-[16px] font-medium text-gray-700">Users</h1>

                    <Tabs value={activeTab} className="w-full md:w-auto" onValueChange={setActiveTab}>
                        <TabsList className="bg-transparent border-b-0 h-10 p-0 space-x-6">
                            {['Student', 'Parent', 'Staff'].map((role) => (
                                <TabsTrigger
                                    key={role}
                                    value={role}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-2 pb-2 h-full shadow-none bg-transparent capitalize"
                                >
                                    {role}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder={`Search ${activeTab.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 text-[11px] pl-3 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 font-medium">Rows:</span>
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Copy className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileText className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Printer className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No {activeTab.toLowerCase()} found.</div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/40 sticky top-0 z-10">
                                <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                    {activeTab === 'Student' ? (
                                        <>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Admission No</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Student Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Username</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Class</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Father Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Mobile Number</TableHead>
                                        </>
                                    ) : activeTab === 'Parent' ? (
                                        <>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Guardian Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Guardian Phone</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Username</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Staff ID</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Email</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Role</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Designation</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Department</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Phone</TableHead>
                                        </>
                                    )}
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 text-right w-20">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-10 group">
                                        {activeTab === 'Student' ? (
                                            <>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.admission_no || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] font-medium text-indigo-500 hover:underline cursor-pointer">{user.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.username || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.class || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.father_name || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.phone || "N/A"}</TableCell>
                                            </>
                                        ) : activeTab === 'Parent' ? (
                                            <>
                                                <TableCell className="py-2 px-4 text-[11px] font-medium text-indigo-500 hover:underline cursor-pointer">{user.guardian_name || user.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.guardian_phone || user.phone || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.username || "N/A"}</TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.staff_id || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] font-medium text-indigo-500 hover:underline cursor-pointer">{user.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.email}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.designation || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.department || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">{user.phone || "N/A"}</TableCell>
                                            </>
                                        )}
                                        <TableCell className="py-2 px-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setResetDialogOpen(true);
                                                    }}
                                                    title="Reset Password"
                                                >
                                                    <Key className="h-3.5 w-3.5" />
                                                </Button>
                                                <Switch
                                                    className="data-[state=checked]:bg-[#6366f1] scale-75"
                                                    checked={user.active ?? true}
                                                    onCheckedChange={() => toggleStatus(user.id, user.active ?? true)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Reset Password Dialog */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-amber-500" />
                            Reset Password
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Resetting password for:</p>
                            <p className="text-sm font-bold text-gray-900">{selectedUser?.name} ({selectedUser?.email || selectedUser?.username})</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter at least 8 characters"
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat the new password"
                                className="h-10"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={isResetting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAdminResetPassword}
                            disabled={isResetting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
