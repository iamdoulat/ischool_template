"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
import {
    CloudUpload,
    Bold,
    Italic,
    Underline,
    Link,
    Image as ImageIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Maximize2,
    Mail,
    Users,
    User,
    GraduationCap,
    Cake,
    Send,
    Clock,
    Paperclip,
    FileText,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EmailTemplate {
    id: number;
    title: string;
    message: string;
}

export default function SendEmailPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("Group");
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        recipients: [] as string[],
        send_type: "now" as "now" | "schedule",
        scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        email_template_id: ""
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/communicate/email-templates');
            setTemplates(response.data.data || response.data);
        } catch (error) {
            console.error("Failed to fetch templates");
        }
    };

    const handleTemplateChange = (id: string) => {
        const template = templates.find(t => String(t.id) === id);
        if (template) {
            setFormData(prev => ({
                ...prev,
                email_template_id: id,
                title: template.title,
                message: template.message
            }));
        }
    };

    const toggleRecipient = (role: string) => {
        setFormData(prev => ({
            ...prev,
            recipients: prev.recipients.includes(role)
                ? prev.recipients.filter(r => r !== role)
                : [...prev.recipients, role]
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleTriggerSubmit = () => {
        if (!formData.title || !formData.message || formData.recipients.length === 0) {
            toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }
        setConfirmOpen(true);
    };

    const executeSubmit = async () => {
        setConfirmOpen(false);
        setSubmitting(true);
        const data = new FormData();
        data.append('title', formData.title);
        data.append('message', formData.message);
        data.append('send_type', formData.send_type);
        data.append('scheduled_at', formData.scheduled_at);
        formData.recipients.forEach(r => data.append('recipients[]', r));
        if (selectedFile) data.append('attachment', selectedFile);

        try {
            await api.post('/communicate/send-email', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Success", description: "Email queued for delivery" });
            resetForm();
        } catch (error) {
            toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            message: "",
            recipients: [],
            send_type: "now",
            scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            email_template_id: ""
        });
        setSelectedFile(null);
    };

    const roles = [
        "Students", "Guardians", "Admin", "Teacher",
        "Accountant", "Librarian", "Receptionist"
    ];

    const tabs = [
        { id: "Group", label: "Group", Icon: Users },
        { id: "Individual", label: "Individual", Icon: User },
        { id: "Class", label: "Class", Icon: GraduationCap },
        { id: "Today's Birthday", label: "Birthday", Icon: Cake }
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-lg shadow-sm shadow-indigo-50/50">
                        <Mail className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Send Email</h1>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Reach your community with professional emails</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
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
                 {/* Left Section: Composition */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                            <Send className="h-64 w-64 text-indigo-500 -rotate-12" />
                        </div>

                        {/* Email Template & Title */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-3 w-3" /> Email Template
                                </Label>
                                <Select value={formData.email_template_id} onValueChange={handleTemplateChange}>
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
                                    Subject <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Email subject line..."
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm focus-visible:ring-indigo-500 rounded-lg shadow-none" 
                                />
                            </div>
                        </div>

                        {/* Attachment */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Paperclip className="h-3.5 w-3.5" /> Attachment
                            </Label>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden" 
                            />
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden",
                                    selectedFile ? "border-indigo-200 bg-indigo-50/30" : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50"
                                )}
                            >
                                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-tight text-gray-500 group-hover:text-indigo-500 transition-colors">
                                    <CloudUpload className={cn("h-5 w-5 transition-transform", selectedFile ? "text-indigo-500 scale-110" : "group-hover:scale-110")} />
                                    <span>{selectedFile ? selectedFile.name : "Drag and drop a file or click to browse"}</span>
                                </div>
                                {selectedFile && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                        className="h-6 px-2 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 mt-2 rounded-full"
                                    >
                                        Remove File
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Message with Rich Text Editor Mockup */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Message Body <span className="text-red-500">*</span>
                            </Label>
                            <div className="border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                {/* Toolbar */}
                                <div className="bg-gray-50/50 border-b border-gray-100 p-2 flex flex-wrap gap-1">
                                    {[Bold, Italic, Underline, Link, ImageIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight].map((Icon, i) => (
                                        <Button key={i} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-indigo-500 hover:bg-white rounded-lg transition-all">
                                            <Icon className="h-4 w-4" />
                                        </Button>
                                    ))}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto text-gray-400 hover:text-indigo-500 transition-all">
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {/* Text Area */}
                                <textarea
                                    className="w-full min-h-[250px] p-6 text-sm focus:outline-none resize-none bg-white leading-relaxed text-gray-700 placeholder:text-gray-300"
                                    placeholder="Compose your email message..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                 {/* Right Section: Recipients */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[400px] flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" /> Recipients <span className="text-red-500">*</span>
                            </h2>
                            <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase">{activeTab}</span>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {roles.map((role) => (
                                <div 
                                    key={role} 
                                    onClick={() => toggleRecipient(role.toLowerCase())}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border border-transparent",
                                        formData.recipients.includes(role.toLowerCase())
                                            ? "bg-indigo-50/50 border-indigo-100"
                                            : "hover:bg-gray-50/50 hover:border-gray-100"
                                    )}
                                >
                                    <Checkbox 
                                        id={role} 
                                        checked={formData.recipients.includes(role.toLowerCase())}
                                        onCheckedChange={() => toggleRecipient(role.toLowerCase())}
                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5 rounded-md" 
                                    />
                                    <Label htmlFor={role} className="text-xs text-gray-600 cursor-pointer font-bold uppercase tracking-tight transition-colors">
                                        {role}
                                    </Label>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-indigo-50/30 rounded-lg border border-indigo-50/50">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                                <span>Targeting</span>
                                <span className="text-indigo-600">{formData.recipients.length} Roles</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
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
                        )}>Schedule Broadcast</Label>
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
                        {submitting ? "Queuing..." : formData.send_type === 'now' ? "Confirm & Send" : "Schedule Email"}
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Confirm Email Dispatch</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            You are about to {formData.send_type === 'now' ? 'send' : 'schedule'} an email broadcast to <span className="font-bold text-indigo-600">{formData.recipients.length} group(s)</span>. 
                            Are you sure you want to proceed?
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
