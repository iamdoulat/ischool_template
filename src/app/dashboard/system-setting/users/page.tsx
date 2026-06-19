"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
    ChevronLeft,
    ChevronRight,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    Search,
    ArrowUpDown,
    Loader2,
    Key,
    RefreshCw,
    PlusCircle,
    Upload
} from "lucide-react";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Student");
    const [limit, setLimit] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [parentFormData, setParentFormData] = useState({
        name: '',
        email: '',
        phone: '',
        guardian_name: '',
        guardian_phone: '',
        username: '',
        password: 'parent123',
    });
    const [parentAutoUsernameEnabled, setParentAutoUsernameEnabled] = useState(false);
    const [generatingParentUsername, setGeneratingParentUsername] = useState(false);
    const [savingParent, setSavingParent] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const getImageUrl = useImageUrl();
    const activeGradient = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 border-0";

    const fetchClasses = async () => {
        try {
            const res = await api.get("/academics/classes?no_paginate=true");
            setClasses(res.data.data?.data || res.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchSections = async (classId: string) => {
        if (!classId) { setSections([]); return; }
        try {
            const res = await api.get(`/academics/sections?no_paginate=true&school_class_id=${classId}`);
            setSections(res.data.data?.data || res.data.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchStudents = async (classId?: string, sectionId?: string) => {
        setLoadingStudents(true);
        try {
            let url = "/students?no_paginate=true&limit=1000";
            const cid = classId || selectedClassId;
            const sid = sectionId || selectedSectionId;
            if (cid) url += `&school_class_id=${cid}`;
            if (sid) url += `&section_id=${sid}`;
            const response = await api.get(url);
            const result = response.data?.data;
            setStudents(result?.data || result || []);
        } catch (error) {
            console.error("Error fetching students:", error);
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        setSelectedSectionId("");
        setSelectedStudentId("");
        setStudents([]);
        fetchSections(classId);
    };

    const handleSectionChange = (sectionId: string) => {
        setSelectedSectionId(sectionId);
        setSelectedStudentId("");
        if (selectedClassId && sectionId) {
            fetchStudents(selectedClassId, sectionId);
        }
    };

    const handleStudentSelect = async (studentId: string) => {
        setSelectedStudentId(studentId);
        if (!studentId) return;
        try {
            const response = await api.get(`/students/${studentId}/matching-parent-username`);
            if (response.data.data?.parent_username) {
                setParentAutoUsernameEnabled(true);
                setParentFormData(prev => ({ ...prev, username: response.data.data.parent_username }));
            }
        } catch (error) {
            console.error("Error fetching matching parent username:", error);
        }
    };

    const fetchParentUsername = async () => {
        setGeneratingParentUsername(true);
        try {
            const response = await api.get("/system-setting/users/generate-parent-username");
            if (response.data.data?.auto_enabled) {
                setParentAutoUsernameEnabled(true);
                setParentFormData(prev => ({ ...prev, username: response.data.data.username }));
            } else {
                setParentAutoUsernameEnabled(false);
            }
        } catch (error) {
            console.error("Error fetching parent username:", error);
        } finally {
            setGeneratingParentUsername(false);
        }
    };

    const handleAddParentSave = async () => {
        setSavingParent(true);
        try {
            const data = new FormData();
            data.append('name', parentFormData.name);
            data.append('email', parentFormData.email);
            data.append('phone', parentFormData.phone || '');
            data.append('guardian_name', parentFormData.guardian_name || '');
            data.append('guardian_phone', parentFormData.guardian_phone || '');
            data.append('username', parentFormData.username || '');
            data.append('password', parentFormData.password);
            data.append('role', 'Parent');
            data.append('active', '1');
            if (selectedStudentId) data.append('linked_student_id', selectedStudentId);
            if (avatarFile) data.append('avatar', avatarFile);

            await api.post("/system-setting/users", data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAddDialogOpen(false);
            resetParentForm();
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to create parent user");
        } finally {
            setSavingParent(false);
        }
    };

    const resetParentForm = () => {
        setParentFormData({
            name: '',
            email: '',
            phone: '',
            guardian_name: '',
            guardian_phone: '',
            username: '',
            password: 'parent123',
        });
        setParentAutoUsernameEnabled(false);
        setSelectedStudentId("");
        setSelectedClassId("");
        setSelectedSectionId("");
        setStudents([]);
        setSections([]);
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    // Edit Parent state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        guardian_name: '',
        guardian_phone: '',
        username: '',
    });
    const [editSelectedStudentId, setEditSelectedStudentId] = useState("");
    const [editSelectedClassId, setEditSelectedClassId] = useState("");
    const [editSelectedSectionId, setEditSelectedSectionId] = useState("");
    const [editClasses, setEditClasses] = useState<{ id: number; name: string }[]>([]);
    const [editSections, setEditSections] = useState<{ id: number; name: string }[]>([]);
    const [editStudents, setEditStudents] = useState<any[]>([]);
    const [editLoadingStudents, setEditLoadingStudents] = useState(false);
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const fetchEditClasses = async () => {
        try {
            const res = await api.get("/academics/classes?no_paginate=true");
            setEditClasses(res.data.data?.data || res.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchEditSections = async (classId: string) => {
        if (!classId) { setEditSections([]); return; }
        try {
            const res = await api.get(`/academics/sections?no_paginate=true&school_class_id=${classId}`);
            setEditSections(res.data.data?.data || res.data.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchEditStudents = async (classId?: string, sectionId?: string) => {
        setEditLoadingStudents(true);
        try {
            let url = "/students?no_paginate=true&limit=1000";
            const cid = classId || editSelectedClassId;
            const sid = sectionId || editSelectedSectionId;
            if (cid) url += `&school_class_id=${cid}`;
            if (sid) url += `&section_id=${sid}`;
            const response = await api.get(url);
            const result = response.data?.data;
            setEditStudents(result?.data || result || []);
        } catch (error) {
            console.error("Error fetching students:", error);
            setEditStudents([]);
        } finally {
            setEditLoadingStudents(false);
        }
    };

    const handleEditClassChange = (classId: string) => {
        setEditSelectedClassId(classId);
        setEditSelectedSectionId("");
        setEditSelectedStudentId("");
        setEditStudents([]);
        fetchEditSections(classId);
    };

    const handleEditSectionChange = (sectionId: string) => {
        setEditSelectedSectionId(sectionId);
        setEditSelectedStudentId("");
        if (editSelectedClassId && sectionId) {
            fetchEditStudents(editSelectedClassId, sectionId);
        }
    };

    const openEditDialog = async (user: any) => {
        setEditingUserId(user.id);
        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            guardian_name: user.guardian_name || '',
            guardian_phone: user.guardian_phone || '',
            username: user.username || '',
        });
        setEditAvatarFile(null);
        setEditAvatarPreview(null);
        await fetchEditClasses();
        setEditDialogOpen(true);

        // Auto-populate class/section/student from linked student
        const linked = user.linked_student;
        if (linked) {
            const classId = linked.school_class_id ? String(linked.school_class_id) : linked.schoolClass?.id ? String(linked.schoolClass.id) : "";
            const sectionId = linked.section_id ? String(linked.section_id) : linked.section?.id ? String(linked.section.id) : "";
            const studentId = String(linked.id);

            if (classId) {
                setEditSelectedClassId(classId);
                await fetchEditSections(classId);
                if (sectionId) {
                    setEditSelectedSectionId(sectionId);
                    await fetchEditStudents(classId, sectionId);
                    setEditSelectedStudentId(studentId);
                }
            }
        }
    };

    const handleEditParentSave = async () => {
        if (!editingUserId) return;
        setSavingEdit(true);
        try {
            const data = new FormData();
            data.append('name', editFormData.name);
            data.append('email', editFormData.email);
            data.append('phone', editFormData.phone || '');
            data.append('guardian_name', editFormData.guardian_name || '');
            data.append('guardian_phone', editFormData.guardian_phone || '');
            data.append('username', editFormData.username || '');
            data.append('_method', 'PUT');
            if (editSelectedStudentId) data.append('linked_student_id', editSelectedStudentId);
            if (editAvatarFile) data.append('avatar', editAvatarFile);

            await api.post(`/system-setting/users/${editingUserId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setEditDialogOpen(false);
            setEditingUserId(null);
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to update parent");
        } finally {
            setSavingEdit(false);
        }
    };

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get("/system-setting/users", {
                params: {
                    role: activeTab,
                    search: searchTerm,
                    limit: limit,
                    page
                }
            });
            const data = response.data.data;
            setUsers(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
            setFrom(data.from || 0);
            setTo(data.to || 0);
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
            await api.patch(`/system-setting/users/${id}`, { active: !currentStatus });
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
                    {activeTab === 'Parent' && (
                        <Button
                            onClick={() => {
                                resetParentForm();
                                fetchClasses();
                                setTimeout(fetchParentUsername, 100);
                                setAddDialogOpen(true);
                            }}
                            className="h-8 text-[12px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-3 gap-1.5"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Parent
                        </Button>
                    )}
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder={`Search ${activeTab.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 text-[12px] pl-3 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-gray-500 font-medium">Rows:</span>
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-7 w-16 text-[12px] border-gray-200 shadow-none rounded">
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
                                <TableRow className="border-b border-gray-100 hover:bg-transparent text-[12px]">
                                    {activeTab === 'Student' ? (
                                        <>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 w-10">Profile</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Student Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Admission No.</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Class</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Section</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Email</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Username</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Mobile Number</TableHead>
                                        </>
                                    ) : activeTab === 'Parent' ? (
                                        <>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 w-10">Profile</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Guardian Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Student Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Guardian Phone</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Guardian Email</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Username</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 w-10">Profile</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Name</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Username</TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600">Role</TableHead>
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
                                                <TableCell className="py-2 px-4">
                                                    <Avatar className="h-8 w-8 border border-muted-foreground/20 shadow-sm">
                                                        <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                                                            {user.name?.substring(0, 2).toUpperCase() || "NA"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] font-medium">
                                                    <Link href={`/dashboard/student-information/student-details/${user.id}/edit`} className="text-indigo-500 hover:underline">
                                                        {user.full_name || `${user.name} ${user.last_name || ""}`.trim() || "N/A"}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.admission_no || user.admission_number || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.school_class?.name || user.class || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.section?.name || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.email || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.username || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.phone || "N/A"}</TableCell>
                                            </>
                                        ) : activeTab === 'Parent' ? (
                                            <>
                                                <TableCell className="py-2 px-4">
                                                    <Avatar className="h-8 w-8 border border-muted-foreground/20 shadow-sm">
                                                        <AvatarImage src={getImageUrl(user.avatar)} alt={user.guardian_name || user.name} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                                                            {(user.guardian_name || user.name || "NA").substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] font-medium text-indigo-500 hover:underline cursor-pointer">{user.guardian_name || user.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.linked_student?.full_name || (user.linked_student?.name && user.linked_student?.last_name ? `${user.linked_student.name} ${user.linked_student.last_name}` : user.linked_student?.name) || user.full_name || user.name || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.guardian_phone || user.phone || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.guardian_email || user.email || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.username || "N/A"}</TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell className="py-2 px-4">
                                                    <Avatar className="h-8 w-8 border border-muted-foreground/20 shadow-sm">
                                                        <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                                                            {user.name?.substring(0, 2).toUpperCase() || "NA"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] font-medium text-indigo-500 hover:underline cursor-pointer">{user.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">{user.username || "N/A"}</TableCell>
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-500">
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell className="py-2 px-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {activeTab === 'Parent' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
                                                        onClick={() => openEditDialog(user)}
                                                        title="Edit Parent"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Button>
                                                )}
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
                    {!loading && users.length > 0 && (
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2 px-4 pb-4">
                            <div>
                                Showing {from} to {to} of {total} entries
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 border-gray-200"
                                    disabled={currentPage === 1}
                                    onClick={() => fetchUsers(currentPage - 1)}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        className={`h-7 w-7 p-0 border-gray-200 ${currentPage === page ? activeGradient : "hover:bg-indigo-50 hover:text-indigo-600"}`}
                                        onClick={() => fetchUsers(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 border-gray-200"
                                    disabled={currentPage === lastPage}
                                    onClick={() => fetchUsers(currentPage + 1)}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
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

            {/* Add Parent Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    resetParentForm();
                }
                setAddDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-indigo-500" />
                            Add Parent
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="relative group shrink-0">
                                <div className="h-16 w-16 rounded-lg border-2 border-muted-foreground/20 overflow-hidden bg-muted/10">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <Avatar className="h-full w-full rounded-lg">
                                            <AvatarFallback className="bg-primary/5 text-primary text-sm font-black">
                                                {parentFormData.name?.substring(0, 2).toUpperCase() || "PH"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                                <label className="absolute bottom-[-6px] right-[-6px] h-6 w-6 bg-primary text-white rounded flex items-center justify-center cursor-pointer shadow hover:scale-110 transition-all">
                                    <Upload className="h-3 w-3" />
                                    <input type="file" className="sr-only" onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setAvatarFile(file);
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setAvatarPreview(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }} accept="image/*" />
                                </label>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                <p className="font-bold">Profile Photo</p>
                                <p>100px x 100px (optional)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={parentFormData.name}
                                    onChange={(e) => setParentFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Parent name"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email <span className="text-red-500">*</span></Label>
                                <Input
                                    value={parentFormData.email}
                                    onChange={(e) => setParentFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={parentFormData.phone}
                                    onChange={(e) => setParentFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Phone number"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <div className="flex gap-1.5">
                                    <Input
                                        value={parentFormData.username}
                                        onChange={(e) => setParentFormData(prev => ({ ...prev, username: e.target.value }))}
                                        placeholder={parentAutoUsernameEnabled ? "Auto-generating..." : "Username"}
                                        className="h-9 text-[12px]"
                                        readOnly={parentAutoUsernameEnabled}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={fetchParentUsername}
                                        disabled={generatingParentUsername}
                                        title="Generate username"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${generatingParentUsername ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Guardian Name</Label>
                                <Input
                                    value={parentFormData.guardian_name}
                                    onChange={(e) => setParentFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                                    placeholder="Guardian name"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Guardian Phone</Label>
                                <Input
                                    value={parentFormData.guardian_phone}
                                    onChange={(e) => setParentFormData(prev => ({ ...prev, guardian_phone: e.target.value }))}
                                    placeholder="Guardian phone"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    className="flex h-9 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-1.5 text-[12px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-card transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Section</Label>
                                <select
                                    value={selectedSectionId}
                                    onChange={(e) => handleSectionChange(e.target.value)}
                                    className="flex h-9 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-1.5 text-[12px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-card transition-all appearance-none cursor-pointer"
                                    disabled={!selectedClassId}
                                >
                                    <option value="">Select section</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id.toString()}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Link to Student</Label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => handleStudentSelect(e.target.value)}
                                className="flex h-9 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-1.5 text-[12px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-card transition-all appearance-none cursor-pointer"
                                disabled={!selectedSectionId || loadingStudents}
                            >
                                <option value="">{loadingStudents ? "Loading..." : "Select student"}</option>
                                {students.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.last_name || ""} ({s.admission_no || s.username || s.id})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={savingParent}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddParentSave}
                            disabled={savingParent || !parentFormData.name || !parentFormData.email}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {savingParent ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Parent"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Parent Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setEditingUserId(null);
                }
                setEditDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Parent
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="relative group shrink-0">
                                <div className="h-16 w-16 rounded-lg border-2 border-muted-foreground/20 overflow-hidden bg-muted/10">
                                    {editAvatarPreview ? (
                                        <img src={editAvatarPreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <Avatar className="h-full w-full rounded-lg">
                                            <AvatarFallback className="bg-primary/5 text-primary text-sm font-black">
                                                {editFormData.name?.substring(0, 2).toUpperCase() || "PH"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                                <label className="absolute bottom-[-6px] right-[-6px] h-6 w-6 bg-primary text-white rounded flex items-center justify-center cursor-pointer shadow hover:scale-110 transition-all">
                                    <Upload className="h-3 w-3" />
                                    <input type="file" className="sr-only" onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setEditAvatarFile(file);
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setEditAvatarPreview(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }} accept="image/*" />
                                </label>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                <p className="font-bold">Profile Photo</p>
                                <p>100px x 100px (optional)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Parent name"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email <span className="text-red-500">*</span></Label>
                                <Input
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Phone number"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    value={editFormData.username}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="Username"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Guardian Name</Label>
                                <Input
                                    value={editFormData.guardian_name}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                                    placeholder="Guardian name"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Guardian Phone</Label>
                                <Input
                                    value={editFormData.guardian_phone}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, guardian_phone: e.target.value }))}
                                    placeholder="Guardian phone"
                                    className="h-9 text-[12px]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <select
                                    value={editSelectedClassId}
                                    onChange={(e) => handleEditClassChange(e.target.value)}
                                    className="flex h-9 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-1.5 text-[12px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-card transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select class</option>
                                    {editClasses.map((c) => (
                                        <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Section</Label>
                                <select
                                    value={editSelectedSectionId}
                                    onChange={(e) => handleEditSectionChange(e.target.value)}
                                    className="flex h-9 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-1.5 text-[12px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-card transition-all appearance-none cursor-pointer"
                                    disabled={!editSelectedClassId}
                                >
                                    <option value="">Select section</option>
                                    {editSections.map((s) => (
                                        <option key={s.id} value={s.id.toString()}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Link to Student</Label>
                            <select
                                value={editSelectedStudentId}
                                onChange={(e) => setEditSelectedStudentId(e.target.value)}
                                className="flex h-9 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-1.5 text-[12px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-card transition-all appearance-none cursor-pointer"
                                disabled={!editSelectedSectionId || editLoadingStudents}
                            >
                                <option value="">{editLoadingStudents ? "Loading..." : "Select student"}</option>
                                {editStudents.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.last_name || ""} ({s.admission_no || s.username || s.id})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditParentSave}
                            disabled={savingEdit || !editFormData.name || !editFormData.email}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {savingEdit ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Parent"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
