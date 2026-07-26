"use client";

import { useState, useEffect } from "react";
import { Send, Bell, User, Users, RefreshCw, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";

interface Template {
    id: number;
    title: string;
    message: string;
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

export default function SendNotificationPage() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<"roles" | "class">("roles");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    // Target roles
    const [selectedRoles, setSelectedRoles] = useState<string[]>(["Student", "Parent", "Teacher", "Staff"]);

    // Templates
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    // Classes & Sections
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");

    useEffect(() => {
        fetchTemplates();
        fetchClasses();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get("/communicate/notification-templates", { skipGlobalErrorHandler: true });
            setTemplates(res.data?.data || []);
        } catch {
            // Silently fallback if empty or route not found
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get("/communicate/classes");
            setClasses(res.data?.data || []);
        } catch {
            // Silently fallback if empty
        }
    };

    const handleSelectTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const tmpl = templates.find((t) => t.id.toString() === templateId);
        if (tmpl) {
            setTitle(tmpl.title);
            setMessage(tmpl.message);
        }
    };

    const toggleRole = (role: string) => {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast({
                title: t("validation_error") || "Validation Error",
                description: "Title and message are required.",
                variant: "destructive",
            });
            return;
        }

        if (activeTab === "roles" && selectedRoles.length === 0) {
            toast({
                title: t("validation_error") || "Validation Error",
                description: "Please select at least one recipient role.",
                variant: "destructive",
            });
            return;
        }

        setSending(true);
        try {
            const payload: any = {
                title,
                message,
            };

            if (activeTab === "roles") {
                payload.recipients = selectedRoles;
            } else {
                payload.class_id = selectedClassId ? Number(selectedClassId) : null;
                payload.section_id = selectedSectionId ? Number(selectedSectionId) : null;
            }

            const res = await api.post("/communicate/send-notification", payload);

            toast({
                title: t("success") || "Success",
                description: res.data?.message || "Notification sent successfully!",
            });

            // Reset form
            setTitle("");
            setMessage("");
            setSelectedTemplateId("");
        } catch (err: any) {
            toast({
                title: t("error") || "Error",
                description: err.response?.data?.message || "Failed to send notification.",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    const availableRoles = [
        { key: "Student", label: "Students" },
        { key: "Parent", label: "Parents / Guardians" },
        { key: "Teacher", label: "Teachers" },
        { key: "Accountant", label: "Accountants" },
        { key: "Librarian", label: "Librarians" },
        { key: "Receptionist", label: "Receptionists" },
        { key: "Staff", label: "All Staff" },
    ];

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 animate-in fade-in duration-300">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Bell className="h-6 w-6 text-primary" />
                        {t("send_notification") || "Send Notification"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Compose and dispatch in-app notifications directly to students, parents, and staff.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Notification Composer (Left 2 Columns) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border shadow-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FEF4E7] to-[#EFF0FC] dark:from-[#29221a] dark:to-[#1a1b2d] border-b">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Bell className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-foreground leading-none">
                                    {t("compose_notification") || "Compose Notification"}
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-1">
                                    Select template or enter your custom message
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 p-5">
                            {/* Template Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="template" className="text-xs font-semibold uppercase text-muted-foreground">
                                    Notification Template (Optional)
                                </Label>
                                <select
                                    id="template"
                                    value={selectedTemplateId}
                                    onChange={(e) => handleSelectTemplate(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">-- Select Template --</option>
                                    {templates.map((tmpl) => (
                                        <option key={tmpl.id} value={tmpl.id.toString()}>
                                            {tmpl.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Title / Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-semibold uppercase text-muted-foreground">
                                    Notification Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Upcoming Parent-Teacher Meeting"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Message Body */}
                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-xs font-semibold uppercase text-muted-foreground">
                                    Notification Message <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="message"
                                    rows={5}
                                    placeholder="Write your notification message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        type="submit"
                        disabled={sending}
                        className="w-full sm:w-auto px-8 h-11 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                        {sending ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Sending Notification...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Send Notification Now
                            </>
                        )}
                    </Button>
                </div>

                {/* Target Recipients Panel (Right Column) */}
                <div className="space-y-6">
                    <Card className="border shadow-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FEF4E7] to-[#EFF0FC] dark:from-[#29221a] dark:to-[#1a1b2d] border-b">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Users className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-foreground leading-none">
                                    Target Audience
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                                <TabsList className="grid grid-cols-2 w-full mb-4">
                                    <TabsTrigger value="roles">By Role</TabsTrigger>
                                    <TabsTrigger value="class">By Class</TabsTrigger>
                                </TabsList>

                                <TabsContent value="roles" className="space-y-3 mt-0">
                                    <p className="text-xs text-muted-foreground">
                                        Select the roles that will receive this in-app notification:
                                    </p>
                                    <div className="space-y-2.5 pt-1">
                                        {availableRoles.map((role) => {
                                            const checked = selectedRoles.includes(role.key);
                                            return (
                                                <div
                                                    key={role.key}
                                                    onClick={() => toggleRole(role.key)}
                                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                                        checked
                                                            ? "border-primary bg-primary/5 dark:bg-primary/10 text-foreground font-semibold"
                                                            : "border-border hover:bg-accent/50 text-muted-foreground"
                                                    }`}
                                                >
                                                    <span className="text-sm">{role.label}</span>
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={() => toggleRole(role.key)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>

                                <TabsContent value="class" className="space-y-4 mt-0">
                                    <p className="text-xs text-muted-foreground">
                                        Target students in a specific class and section:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Class</Label>
                                            <select
                                                value={selectedClassId}
                                                onChange={(e) => {
                                                    setSelectedClassId(e.target.value);
                                                    setSelectedSectionId("");
                                                }}
                                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">All Classes</option>
                                                {classes.map((cls) => (
                                                    <option key={cls.id} value={cls.id.toString()}>
                                                        {cls.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedClassId && (
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Section</Label>
                                                <select
                                                    value={selectedSectionId}
                                                    onChange={(e) => setSelectedSectionId(e.target.value)}
                                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                >
                                                    <option value="">All Sections</option>
                                                    {classes
                                                        .find((c) => c.id.toString() === selectedClassId)
                                                        ?.sections?.map((sec) => (
                                                            <option key={sec.id} value={sec.id.toString()}>
                                                                {sec.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
