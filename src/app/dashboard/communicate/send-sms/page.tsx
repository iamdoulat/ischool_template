"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    MessageSquare, Users, User, GraduationCap, Cake, Send, Clock, Layout, Calendar, Search
} from "lucide-react";
import { format } from "date-fns";
import VariablePicker from "@/components/ui/variable-picker";

function RecipientSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                    <div className="h-4 w-4 rounded bg-muted/60 animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded-md bg-muted/60 animate-pulse" />
                        <div className="h-2 w-1/2 rounded-md bg-muted/40 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface SmsTemplate {
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

export default function SendSMSPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const ttRef = useRef(tt);
    ttRef.current = tt;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeTab, setActiveTab] = useState("Group");
    const [templates, setTemplates] = useState<SmsTemplate[]>([]);
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
        send_through: ["sms"] as string[],
        recipients: [] as string[],
        send_type: "now" as "now" | "schedule",
        scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        sms_template_id: ""
    });

    const fetchTemplates = useCallback(async () => {
        try {
            const response = await api.get('/communicate/sms-templates');
            setTemplates(response.data.data || response.data);
        } catch {
            ttRef.current.toast("error", "failed_to_load_sms_templates");
        }
    }, []);

    const fetchUsersByRole = useCallback(async (role: string) => {
        setUsersLoading(true);
        try {
            const response = await api.get(`/communicate/users-by-role/${role}`);
            setAllUsers(response.data?.data || response.data || []);
        } catch {
            ttRef.current.toast("error", "failed_to_load_users");
            setAllUsers([]);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            const response = await api.get('/communicate/classes');
            setClasses(response.data?.data || response.data || []);
        } catch {
            ttRef.current.toast("error", "failed_to_load_classes");
        }
    }, []);

    const fetchStudentsByClass = useCallback(async (classId: string) => {
        setClassLoading(true);
        try {
            const response = await api.get(`/communicate/students-by-class/${classId}`);
            setClassStudents(response.data?.data || response.data || []);
        } catch {
            ttRef.current.toast("error", "failed_to_load_students");
            setClassStudents([]);
        } finally {
            setClassLoading(false);
        }
    }, []);

    const fetchBirthdayUsers = useCallback(async () => {
        setBirthdayLoading(true);
        try {
            const params = birthdayClassId && birthdayClassId !== 'all' ? `?class_id=${birthdayClassId}` : '';
            const response = await api.get('/communicate/birthday-users' + params);
            setBirthdayUsers(response.data?.data || response.data || []);
        } catch {
            ttRef.current.toast("error", "failed_to_load_birthday_users");
            setBirthdayUsers([]);
        } finally {
            setBirthdayLoading(false);
        }
    }, [birthdayClassId]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        if (activeTab === "Individual") {
            fetchUsersByRole(userRoleFilter);
        } else if (activeTab === "Class") {
            fetchClasses();
        } else if (activeTab === "Today's Birthday") {
            fetchClasses();
            fetchBirthdayUsers();
        }
    }, [activeTab, userRoleFilter, fetchUsersByRole, fetchClasses, fetchBirthdayUsers]);

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

    const handleTemplateChange = (id: string) => {
        const template = templates.find(t => String(t.id) === id);
        if (template) {
            setFormData(prev => ({
                ...prev,
                sms_template_id: id,
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
            tt.toast("error", "please_fill_all_required_fields");
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
            await api.post('/communicate/send-sms', payload);
            tt.success(formData.send_type === 'now' ? "sms_sent_successfully" : "sms_scheduled_successfully");
            resetForm();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            tt.toast("error", err.response?.data?.message || "failed_to_send_sms");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            message: "",
            send_through: ["sms"],
            recipients: [],
            send_type: "now",
            scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            sms_template_id: ""
        });
        setSelectedRoles([]);
        setSelectedUsers(new Set());
        setSelectedStudents(new Set());
    };

    const roles = [
        { id: "Student", label: t("students") },
        { id: "Parent", label: t("guardians") },
        { id: "Admin", label: t("admin") },
        { id: "Teacher", label: t("teacher") },
        { id: "Accountant", label: t("accountant") },
        { id: "Librarian", label: t("librarian") },
        { id: "Receptionist", label: t("receptionist") },
    ];

    const tabs = [
        { id: "Group", label: t("group"), Icon: Users },
        { id: "Individual", label: t("individual"), Icon: User },
        { id: "Class", label: t("class"), Icon: GraduationCap },
        { id: "Today's Birthday", label: t("birthday"), Icon: Cake }
    ];

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => {
            if (!userSearch) return true;
            const q = userSearch.toLowerCase();
            return (u.name + ' ' + (u.last_name || '')).toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q) ||
                (u.admission_no || '').toLowerCase().includes(q);
        });
    }, [allUsers, userSearch]);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-lg shadow-sm shadow-indigo-50/50">
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">{t("send_sms")}</h1>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">{t("send_sms_subtitle")}</p>
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
                                    : "text-gray-400 hover:text-gray-600 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer"
                            )}
                        >
                            <tab.Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Compose SMS Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <MessageSquare className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("compose_sms")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("compose_sms_description")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                <Send className="h-48 w-48 text-indigo-500 rotate-12" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Layout className="h-3 w-3" /> {t("sms_template")}
                                    </Label>
                                    <Select value={formData.sms_template_id} onValueChange={handleTemplateChange}>
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-sm focus:ring-indigo-500 rounded-lg shadow-none">
                                            <SelectValue placeholder={t("quick_templates")} />
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
                                        {t("title")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={t("notice_title_placeholder")}
                                        className="h-11 border-gray-100 bg-gray-50/30 text-sm focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        {t("send_through")} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => toggleSendThrough('sms')}>
                                            <Checkbox
                                                id="sms"
                                                checked={formData.send_through.includes('sms')}
                                                onCheckedChange={() => toggleSendThrough('sms')}
                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5 rounded-md"
                                            />
                                            <Label htmlFor="sms" className="text-[11px] text-gray-600 font-bold uppercase tracking-tight cursor-pointer group-hover:text-indigo-600 transition-colors">{t("sms_gateway")}</Label>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => toggleSendThrough('mobile_app')}>
                                            <Checkbox
                                                id="mobile-app"
                                                checked={formData.send_through.includes('mobile_app')}
                                                onCheckedChange={() => toggleSendThrough('mobile_app')}
                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5 rounded-md"
                                            />
                                            <Label htmlFor="mobile-app" className="text-[11px] text-gray-600 font-bold uppercase tracking-tight cursor-pointer group-hover:text-indigo-600 transition-colors">{t("mobile_app")}</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        {t("dlt_template_id")} <span className="text-[9px] lowercase font-medium text-gray-300 normal-case">(India Only)</span>
                                    </Label>
                                    <Input className="h-11 border-gray-100 bg-gray-50/30 text-sm focus-visible:ring-indigo-500 rounded-lg shadow-none placeholder:text-gray-200" placeholder="120716..." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        {t("message_content")} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <VariablePicker onSelect={handleVariableSelect} />
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                            formData.message.length > 160 ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                                        )}>
                                            {formData.message.length} {t("characters")} ({Math.ceil(formData.message.length / 160)} {t("sms")})
                                        </span>
                                    </div>
                                </div>
                                <Textarea
                                    ref={textareaRef}
                                    className="w-full min-h-[200px] p-4 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 resize-none transition-all shadow-none leading-relaxed"
                                    placeholder={t("type_sms_message_here")}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Recipients Panel */}
                <div className="space-y-6">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Users className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("recipients")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("select_target_audience")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 min-h-[400px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase">
                                    {t(activeTab === "Today's Birthday" ? "birthday" : activeTab.toLowerCase())}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600">{getRecipientCount()} selected</span>
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
                                                        : "hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer hover:border-gray-100"
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
                                            <Select value={userRoleFilter} onValueChange={(v) => { setUserRoleFilter(v); }}>
                                                <SelectTrigger className="h-9 text-[11px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none flex-1">
                                                    <SelectValue placeholder={t("select_role")} />
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
                                                placeholder={t("search_by_name_or_phone")}
                                                className="h-9 pl-9 text-[11px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none"
                                            />
                                        </div>
                                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                            {usersLoading ? (
                                                <RecipientSkeleton rows={4} />
                                            ) : filteredUsers.length === 0 ? (
                                                <p className="text-[11px] text-gray-400 text-center py-8">{t("no_users_found")}</p>
                                            ) : (
                                                filteredUsers.map(u => (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => toggleUser(u.id)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer border border-transparent",
                                                            selectedUsers.has(u.id) ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer hover:border-gray-100"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            checked={selectedUsers.has(u.id)}
                                                            onCheckedChange={() => toggleUser(u.id)}
                                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-700 truncate">{u.name} {u.last_name || ''}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{u.phone || t("no_phone")}</p>
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
                                                <SelectValue placeholder={t("select_class")} />
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
                                                    <RecipientSkeleton rows={4} />
                                                ) : classStudents.length === 0 ? (
                                                    <p className="text-[11px] text-gray-400 text-center py-8">{t("no_students_in_this_class")}</p>
                                                ) : (
                                                    classStudents.map(s => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => toggleStudent(s.id)}
                                                            className={cn(
                                                                "flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer border border-transparent",
                                                                selectedStudents.has(s.id) ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer hover:border-gray-100"
                                                            )}
                                                        >
                                                            <Checkbox
                                                                checked={selectedStudents.has(s.id)}
                                                                onCheckedChange={() => toggleStudent(s.id)}
                                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 rounded"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-gray-700 truncate">{s.name} {s.last_name || ''} {s.roll_no && <span className="text-gray-400 font-normal"> ({t("roll")}: {s.roll_no})</span>}</p>
                                                                <p className="text-[10px] text-gray-400 truncate">{s.phone || t("no_phone")}</p>
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
                                                <SelectValue placeholder={t("all_classes")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t("all_classes")}</SelectItem>
                                                {classes.map(c => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="space-y-1">
                                            {birthdayLoading ? (
                                                <RecipientSkeleton rows={4} />
                                            ) : birthdayUsers.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Cake className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">{t("no_birthdays_today")}</p>
                                                </div>
                                            ) : (
                                                birthdayUsers.map(u => (
                                                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                                                        <Cake className="h-4 w-4 text-orange-500 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-700 truncate">{u.name} {u.last_name || ''}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{u.phone || t("no_phone")} · {u.role}</p>
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
                                    <span>{t("targeting")}</span>
                                    <span className="text-indigo-600">{getRecipientCount()} {t("recipients").toLowerCase()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Sticky Bottom Action Bar */}
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
                        )}>{t("send_now")}</Label>
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
                        )}>{t("schedule_dispatch")}</Label>
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
                        {submitting ? t("processing") : formData.send_type === 'now' ? t("confirm_and_send") : t("schedule_message")}
                    </Button>
                </div>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("confirm_sms_dispatch")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t(formData.send_type === 'now' ? "confirm_sms_send_description" : "confirm_sms_schedule_description", { count: getRecipientsArray().length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeSubmit} className="btn-gradient h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {formData.send_type === 'now' ? t("yes_send_now") : t("yes_schedule")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
