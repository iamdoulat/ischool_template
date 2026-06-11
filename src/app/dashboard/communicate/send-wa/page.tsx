"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils";
import {
    MessageSquare, Users, User, GraduationCap, Cake, Send, Clock, Layout, Calendar, Search, Loader2
} from "lucide-react";
import { format } from "date-fns";
import VariablePicker from "@/components/ui/variable-picker";

interface WaTemplate {
    id: number;
    title: string;
    message: string;
}

interface UserItem {
    id: number;
    name: string;
    last_name?: string;
    email: string;
    phone?: string;
    roll_no?: string;
    admission_no?: string;
    role?: string;
    dob?: string;
}

interface ClassItem {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

export default function SendWaPage() {
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeTab, setActiveTab] = useState("Group");
    const [templates, setTemplates] = useState<WaTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Group tab
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    // Individual tab
    const [allUsers, setAllUsers] = useState<UserItem[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [userRoleFilter, setUserRoleFilter] = useState("Student");
    const [usersLoading, setUsersLoading] = useState(false);

    // Class tab
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [classStudents, setClassStudents] = useState<UserItem[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
    const [classLoading, setClassLoading] = useState(false);

    // Birthday tab
    const [birthdayUsers, setBirthdayUsers] = useState<UserItem[]>([]);
    const [birthdayLoading, setBirthdayLoading] = useState(false);
    const [birthdayClassId, setBirthdayClassId] = useState("all");

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        send_through: ["whatsapp"] as string[],
        recipients: [] as string[],
        send_type: "now" as "now" | "schedule",
        scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        wa_template_id: ""
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (activeTab === "Individual") {
            fetchUsersByRole(userRoleFilter);
        } else if (activeTab === "Class" || activeTab === "Today's Birthday") {
            fetchClasses();
        } else if (activeTab === "Today's Birthday") {
            fetchBirthdayUsers();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "Today's Birthday") {
            fetchBirthdayUsers();
        }
    }, [birthdayClassId, activeTab]);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/communicate/wa-templates');
            setTemplates(response.data.data || response.data);
        } catch (error) {
            console.error("Failed to fetch templates");
        }
    };

    const handleVariableSelect = (variable: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newMessage = formData.message.slice(0, start) + variable + formData.message.slice(end);
            setFormData({ ...formData, message: newMessage });
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + variable.length;
                textarea.focus();
            }, 0);
        } else {
            setFormData({ ...formData, message: formData.message + variable });
        }
    };

    const fetchUsersByRole = async (role: string) => {
        setUsersLoading(true);
        try {
            const response = await api.get(`/communicate/users-by-role/${role}`);
            setAllUsers(response.data?.data || response.data || []);
        } catch {
            setAllUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('/communicate/classes');
            setClasses(response.data?.data || response.data || []);
        } catch { }
    };

    const fetchStudentsByClass = async (classId: string) => {
        setClassLoading(true);
        try {
            const response = await api.get(`/communicate/students-by-class/${classId}`);
            setClassStudents(response.data?.data || response.data || []);
        } catch {
            setClassStudents([]);
        } finally {
            setClassLoading(false);
        }
    };

    const fetchBirthdayUsers = async () => {
        setBirthdayLoading(true);
        try {
            const params = birthdayClassId && birthdayClassId !== 'all' ? `?class_id=${birthdayClassId}` : '';
            const response = await api.get('/communicate/birthday-users' + params);
            setBirthdayUsers(response.data?.data || response.data || []);
        } catch {
            setBirthdayUsers([]);
        } finally {
            setBirthdayLoading(false);
        }
    };

    const handleTemplateChange = (id: string) => {
        const template = templates.find(t => String(t.id) === id);
        if (template) {
            setFormData(prev => ({
                ...prev,
                wa_template_id: id,
                title: template.title,
                message: template.message
            }));
        }
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const toggleUser = (id: number) => {
        setSelectedUsers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleStudent = (id: number) => {
        setSelectedStudents(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSendThrough = (method: string) => {
        setFormData(prev => ({
            ...prev,
            send_through: prev.send_through.includes(method)
                ? prev.send_through.filter(m => m !== method)
                : [...prev.send_through, method]
        }));
    };

    const getRecipientsArray = (): string[] => {
        switch (activeTab) {
            case "Group":
                return selectedRoles.map(r => `role:${r}`);
            case "Individual":
                return Array.from(selectedUsers).map(id => `user:${id}`);
            case "Class":
                return Array.from(selectedStudents).map(id => `user:${id}`);
            case "Today's Birthday":
                return birthdayUsers.map(u => `user:${u.id}`);
            default:
                return [];
        }
    };

    const getRecipientCount = (): number => {
        switch (activeTab) {
            case "Group": return selectedRoles.length;
            case "Individual": return selectedUsers.size;
            case "Class": return selectedStudents.size;
            case "Today's Birthday": return birthdayUsers.length;
            default: return 0;
        }
    };

    const handleTriggerSubmit = () => {
        const recipients = getRecipientsArray();
        if (!formData.title || !formData.message || recipients.length === 0) {
            toast({ title: "Validation Error", description: "Please fill all required fields and select recipients", variant: "destructive" });
            return;
        }
        setConfirmOpen(true);
    };

    const executeSubmit = async () => {
        setConfirmOpen(false);
        setSubmitting(true);
        const payload = {
            ...formData,
            recipients: getRecipientsArray()
        };
        try {
            const res = await api.post('/communicate/send-wa', payload);
            toast({ title: "Success", description: res.data?.message || (formData.send_type === 'now' ? "WhatsApp message sent successfully" : "WhatsApp message scheduled successfully") });
            resetForm();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to Send WhatsApp", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            message: "",
            send_through: ["whatsapp"],
            recipients: [],
            send_type: "now",
            scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            wa_template_id: ""
        });
        setSelectedRoles([]);
        setSelectedUsers(new Set());
        setSelectedStudents(new Set());
    };

    const roles = [
        { id: "Student", label: "Students" },
        { id: "Parent", label: "Guardians" },
        { id: "Admin", label: "Admin" },
        { id: "Teacher", label: "Teacher" },
        { id: "Accountant", label: "Accountant" },
        { id: "Librarian", label: "Librarian" },
        { id: "Receptionist", label: "Receptionist" },
    ];

    const tabs = [
        { id: "Group", label: "Group", Icon: Users },
        { id: "Individual", label: "Individual", Icon: User },
        { id: "Class", label: "Class", Icon: GraduationCap },
        { id: "Today's Birthday", label: "Birthday", Icon: Cake }
    ];

    const filteredUsers = allUsers.filter(u => {
        if (!userSearch) return true;
        const q = userSearch.toLowerCase();
        return (u.name + ' ' + (u.last_name || '')).toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q) ||
            (u.admission_no || '').toLowerCase().includes(q);
    });

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-lg shadow-sm shadow-indigo-50/50">
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Send WhatsApp</h1>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Broadcast WhatsApp to the entire school community</p>
                    </div>
                </div>

                <div className="flex bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-1 shadow-sm overflow-hidden">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 uppercase tracking-tight",
                                activeTab === tab.id
                                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-100"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
                            )}
                        >
                            <tab.Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Send className="h-48 w-48 text-indigo-500 rotate-12" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layout className="h-3 w-3" /> WA Template
                                </Label>
                                <Select value={formData.wa_template_id} onValueChange={handleTemplateChange}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-sm focus:ring-indigo-500 rounded-lg shadow-none">
                                        <SelectValue placeholder="Quick Templates" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Notice title..."
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Send Through <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => toggleSendThrough('whatsapp')}>
                                        <Checkbox
                                            id="whatsapp"
                                            checked={formData.send_through.includes('whatsapp')}
                                            onCheckedChange={() => toggleSendThrough('whatsapp')}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5 rounded-md"
                                        />
                                        <Label htmlFor="whatsapp" className="text-[11px] text-gray-600 font-bold uppercase tracking-tight cursor-pointer group-hover:text-indigo-600 transition-colors">WhatsApp Gateway</Label>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => toggleSendThrough('mobile_app')}>
                                        <Checkbox
                                            id="mobile-app"
                                            checked={formData.send_through.includes('mobile_app')}
                                            onCheckedChange={() => toggleSendThrough('mobile_app')}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5 rounded-md"
                                        />
                                        <Label htmlFor="mobile-app" className="text-[11px] text-gray-600 font-bold uppercase tracking-tight cursor-pointer group-hover:text-indigo-600 transition-colors">Mobile App</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    DLT Template ID <span className="text-[9px] lowercase font-medium text-gray-300 normal-case">(India Only)</span>
                                </Label>
                                <Input className="h-11 border-gray-100 bg-gray-50/30 text-sm focus-visible:ring-indigo-500 rounded-lg shadow-none placeholder:text-gray-200" placeholder="120716..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Message Content <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <VariablePicker onSelect={handleVariableSelect} />
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        "bg-indigo-50 text-indigo-600"
                                    )}>
                                        {formData.message.length} Characters
                                    </span>
                                </div>
                            </div>
                            <Textarea
                                ref={textareaRef}
                                className="w-full min-h-[200px] p-4 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 resize-none transition-all shadow-none group-hover:border-indigo-200 leading-relaxed"
                                placeholder="Type your WhatsApp message here..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[400px] flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" /> Recipients <span className="text-red-500">*</span>
                            </h2>
                            <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase">{activeTab === "Today's Birthday" ? "Birthday" : activeTab}</span>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Group Tab */}
                            {activeTab === "Group" && (
                                <div className="space-y-1">
                                    {roles.map((role) => (
                                        <div
                                            key={role.id}
                                            onClick={() => toggleRole(role.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border border-transparent",
                                                selectedRoles.includes(role.id)
                                                    ? "bg-indigo-50/50 border-indigo-100"
                                                    : "hover:bg-gray-50/50 hover:border-gray-100"
                                            )}
                                        >
                                            <Checkbox
                                                checked={selectedRoles.includes(role.id)}
                                                onCheckedChange={() => toggleRole(role.id)}
                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5 rounded-md"
                                            />
                                            <Label className="text-xs text-gray-600 cursor-pointer font-bold uppercase tracking-tight">
                                                {role.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Individual Tab */}
                            {activeTab === "Individual" && (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <Select value={userRoleFilter} onValueChange={(v) => { setUserRoleFilter(v); fetchUsersByRole(v); }}>
                                            <SelectTrigger className="h-9 text-[11px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none flex-1">
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(r => (
                                                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <Input
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder="Search by name or phone..."
                                            className="h-9 pl-9 text-[11px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none"
                                        />
                                    </div>
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                        {usersLoading ? (
                                            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>
                                        ) : filteredUsers.length === 0 ? (
                                            <p className="text-[11px] text-gray-400 text-center py-8">No users found</p>
                                        ) : (
                                            filteredUsers.map(u => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => toggleUser(u.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer border border-transparent",
                                                        selectedUsers.has(u.id) ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-gray-50/50 hover:border-gray-100"
                                                    )}
                                                >
                                                    <Checkbox
                                                        checked={selectedUsers.has(u.id)}
                                                        onCheckedChange={() => toggleUser(u.id)}
                                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-700 truncate">{u.name} {u.last_name || ''}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{u.phone || 'No phone'}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Class Tab */}
                            {activeTab === "Class" && (
                                <div className="space-y-3">
                                    <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedStudents(new Set()); fetchStudentsByClass(v); }}>
                                        <SelectTrigger className="h-9 text-[11px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none">
                                            <SelectValue placeholder="Select a class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedClass && (
                                        <div className="space-y-1 max-h-[320px] overflow-y-auto">
                                            {classLoading ? (
                                                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>
                                            ) : classStudents.length === 0 ? (
                                                <p className="text-[11px] text-gray-400 text-center py-8">No students in this class</p>
                                            ) : (
                                                classStudents.map(s => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => toggleStudent(s.id)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer border border-transparent",
                                                            selectedStudents.has(s.id) ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-gray-50/50 hover:border-gray-100"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            checked={selectedStudents.has(s.id)}
                                                            onCheckedChange={() => toggleStudent(s.id)}
                                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-700 truncate">{s.name} {s.last_name || ''} {s.roll_no && <span className="text-gray-400 font-normal">(Roll: {s.roll_no})</span>}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{s.phone || 'No phone'}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Birthday Tab */}
                            {activeTab === "Today's Birthday" && (
                                <div className="space-y-3">
                                    <Select value={birthdayClassId} onValueChange={setBirthdayClassId}>
                                        <SelectTrigger className="h-9 text-[11px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none">
                                            <SelectValue placeholder="All Classes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classes</SelectItem>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="space-y-1">
                                        {birthdayLoading ? (
                                            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>
                                        ) : birthdayUsers.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Cake className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">No birthdays today</p>
                                            </div>
                                        ) : (
                                            birthdayUsers.map(u => (
                                                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                                                    <Cake className="h-4 w-4 text-orange-500 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-700 truncate">{u.name} {u.last_name || ''}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{u.phone || 'No phone'} · {u.role}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-4 bg-indigo-50/30 rounded-lg border border-indigo-50/50">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                                <span>Targeting</span>
                                <span className="text-indigo-600">{getRecipientCount()} Recipient(s)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur-md border border-gray-100 rounded-lg p-6 shadow-xl shadow-indigo-100/20 mt-4 sticky bottom-4 z-10">
                <RadioGroup
                    value={formData.send_type}
                    onValueChange={(val: "now" | "schedule") => setFormData({ ...formData, send_type: val })}
                    className="flex items-center gap-10"
                >
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setFormData({ ...formData, send_type: 'now' })}>
                        <div className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            formData.send_type === 'now' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                        )}>
                            <Send className="h-4 w-4" />
                        </div>
                        <RadioGroupItem value="now" id="now" className="hidden" />
                        <Label htmlFor="now" className={cn(
                            "text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors",
                            formData.send_type === 'now' ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                        )}>Send Now</Label>
                    </div>
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setFormData({ ...formData, send_type: 'schedule' })}>
                        <div className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            formData.send_type === 'schedule' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                        )}>
                            <Clock className="h-4 w-4" />
                        </div>
                        <RadioGroupItem value="schedule" id="schedule" className="hidden" />
                        <Label htmlFor="schedule" className={cn(
                            "text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors",
                            formData.send_type === 'schedule' ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                        )}>Schedule Dispatch</Label>
                    </div>
                </RadioGroup>

                <div className="flex items-center gap-6">
                    {formData.send_type === 'schedule' && (
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                            <Input
                                type="datetime-local"
                                value={formData.scheduled_at}
                                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                className="h-7 border-none bg-transparent p-0 text-[11px] font-bold text-gray-600 focus-visible:ring-0 w-36 shadow-none"
                            />
                        </div>
                    )}
                    <Button
                        onClick={handleTriggerSubmit}
                        disabled={submitting}
                        className="btn-gradient px-12 h-11 text-[11px] font-bold uppercase transition-all rounded-full shadow-2xl shadow-indigo-200 min-w-[200px]"
                    >
                        {submitting ? "Processing..." : formData.send_type === 'now' ? "Confirm & Send" : "Schedule Message"}
                    </Button>
                </div>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Confirm WhatsApp Dispatch</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            You are about to {formData.send_type === 'now' ? 'send' : 'schedule'} a WhatsApp message to <span className="font-bold text-indigo-600">{getRecipientsArray().length} recipient(s)</span>.
                            This action will consume WhatsApp credits and cannot be undone. Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeSubmit} className="btn-gradient h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {formData.send_type === 'now' ? 'Yes, Send Now' : 'Yes, Schedule'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
