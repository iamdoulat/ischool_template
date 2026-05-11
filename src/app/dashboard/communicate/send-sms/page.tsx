"use client";

import { useState, useEffect } from "react";
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
import { MessageSquare, Users, User, GraduationCap, Cake, Send, Clock, Layout, Calendar } from "lucide-react";
import { format } from "date-fns";

interface SmsTemplate {
    id: number;
    title: string;
    message: string;
}

export default function SendSMSPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Group");
    const [templates, setTemplates] = useState<SmsTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        send_through: ["sms"] as string[],
        recipients: [] as string[],
        send_type: "now" as "now" | "schedule",
        scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        sms_template_id: ""
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/communicate/sms-templates');
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
                sms_template_id: id,
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

    const toggleSendThrough = (method: string) => {
        setFormData(prev => ({
            ...prev,
            send_through: prev.send_through.includes(method)
                ? prev.send_through.filter(m => m !== method)
                : [...prev.send_through, method]
        }));
    };

    const handleTriggerSubmit = () => {
        if (!formData.title || !formData.message || formData.recipients.length === 0) {
            toast({ title: "Validation Error", description: "Please fill all required fields and select recipients", variant: "destructive" });
            return;
        }
        setConfirmOpen(true);
    };

    const executeSubmit = async () => {
        setConfirmOpen(false);
        setSubmitting(true);
        try {
            await api.post('/communicate/send-sms', formData);
            toast({ title: "Success", description: formData.send_type === 'now' ? "SMS sent successfully" : "SMS scheduled successfully" });
            resetForm();
        } catch (error) {
            toast({ title: "Error", description: "Failed to send SMS", variant: "destructive" });
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
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Send SMS</h1>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Broadcast SMS to the entire school community</p>
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
                 {/* Left Section: SMS Composition */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Send className="h-48 w-48 text-indigo-500 rotate-12" />
                        </div>

                        {/* SMS Template */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layout className="h-3 w-3" /> SMS Template
                                </Label>
                                <Select value={formData.sms_template_id} onValueChange={handleTemplateChange}>
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

                        {/* Send Through & Template ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Send Through <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => toggleSendThrough('sms')}>
                                        <Checkbox 
                                            id="sms" 
                                            checked={formData.send_through.includes('sms')}
                                            onCheckedChange={() => toggleSendThrough('sms')}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5 rounded-md" 
                                        />
                                        <Label htmlFor="sms" className="text-[11px] text-gray-600 font-bold uppercase tracking-tight cursor-pointer group-hover:text-indigo-600 transition-colors">SMS Gateway</Label>
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

                        {/* Message */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Message Content <span className="text-red-500">*</span>
                                </Label>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    formData.message.length > 160 ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                                )}>
                                    {formData.message.length} Characters ({Math.ceil(formData.message.length / 160)} SMS)
                                </span>
                            </div>
                            <Textarea
                                className="w-full min-h-[200px] p-4 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 resize-none transition-all shadow-none group-hover:border-indigo-200 leading-relaxed"
                                placeholder="Type your SMS message here..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
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
                                <span>Selected</span>
                                <span className="text-indigo-600">{formData.recipients.length} Groups</span>
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

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Confirm SMS Dispatch</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            You are about to {formData.send_type === 'now' ? 'send' : 'schedule'} an SMS to <span className="font-bold text-indigo-600">{formData.recipients.length} group(s)</span>. 
                            This action will consume SMS credits and cannot be undone. Are you sure you want to proceed?
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
