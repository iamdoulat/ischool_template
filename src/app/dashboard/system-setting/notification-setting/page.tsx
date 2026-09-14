"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Loader2, X, Info, Bell, Variable, Mail, Smartphone, MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";
import { QueueMonitorCard } from "@/components/queue/queue-monitor-card";
import { translateNotificationEvent, toLocaleNumber } from "@/lib/utils";

interface NotificationEvent {
    id: number;
    event_name: string;
    destinations: string[];
    recipients: string[];
    sms_template_id?: string;
    whatsapp_template_id?: string;
    sample_message: string;
    email_subject?: string;
    email_template?: string;
    sms_template?: string;
    whatsapp_template?: string;
    mobile_app_template?: string;
    is_active: boolean;
}

type TemplateType = "email" | "sms" | "whatsapp" | "mobile_app";

const destinationOptions = ["Email", "SMS", "Mobile App", "WhatsApp"];
const recipientOptions = ["Student", "Guardian", "Staff"];

const eventVariables: Record<string, string[]> = {
    // ── HR / Payroll ─────────────────────────────────────────────────
    "Salary Generated": [
        "name", "net_salary", "month_name", "year", "basic_salary", "allowances", "deductions",
    ],
    "Salary Paid": [
        "name", "net_salary", "month_name", "year", "paid_on",
    ],

    // ── Online Admission ─────────────────────────────────────────────
    "Online Admission Fees Submission": [
        "firstname", "lastname", "paid_amount", "date", "reference_no",
    ],
    "Online Admission Fees Processing": [
        "firstname", "lastname", "paid_amount", "date", "reference_no", "transaction_id",
    ],
    "Online Admission Form Submission": [
        "firstname", "lastname", "date", "reference_no", "class", "section",
    ],
    "Student Admission": [
        "firstname", "lastname", "admission_no", "roll_no", "class", "section",
        "username", "password",
    ],

    // ── Behaviour ────────────────────────────────────────────────────
    "Behaviour Incident Assigned": [
        "incident_title", "incident_point", "student_name", "class", "section",
        "admission_no", "mobileno", "email", "guardian_name", "guardian_phone", "guardian_email",
    ],

    // ── CBSE / Exam ──────────────────────────────────────────────────
    "CBSE Exam Result": [
        "student_name", "roll_no", "exam",
    ],
    "CBSE Exam Marksheet Pdf": [
        "student_name", "admission_no", "class", "section", "roll_no",
    ],
    "Email PDF Exam Marksheet": [
        "student_name", "admission_no", "class", "section", "exam", "roll_no",
    ],
    "Exam Result Published": [
        "student_name", "roll_no", "exam", "class", "section",
    ],

    // ── Online Course ────────────────────────────────────────────────
    "Online Course Guest User Sign Up": [
        "guest_user_name", "email", "url",
    ],
    "Online Course Purchase For Guest User": [
        "title", "discount", "price", "purchase_date",
    ],
    "Online Course Purchase": [
        "title", "price", "purchase_date", "class", "section", "assign_teacher",
    ],
    "Online Course Publish": [
        "title", "category", "price", "instructor_name",
    ],

    // ── Student Leave ────────────────────────────────────────────────
    "Student Apply Leave": [
        "student_name", "class", "section", "apply_date", "from_date", "to_date", "message",
    ],
    "Student Leave Approved": [
        "student_name", "class", "section", "from_date", "to_date", "reason",
    ],
    "Student Leave Rejected": [
        "student_name", "class", "section", "from_date", "to_date", "reason",
    ],

    // ── Fee ──────────────────────────────────────────────────────────
    "Fee Processing": [
        "fee_amount", "student_name", "class", "section", "email", "contact_no",
        "transaction_id",
    ],
    "Fee Submission": [
        "fee_amount", "student_name", "admission_no", "due_date", "paid_date", "fee_type",
    ],
    "Fees Reminder": [
        "fee_amount", "student_name", "admission_no", "due_date",
    ],

    // ── Login Credentials ────────────────────────────────────────────
    "Staff Login Credential": [
        "first_name", "last_name", "url", "username", "password", "employee_id",
    ],
    "Student Login Credential": [
        "display_name", "url", "username", "password", "admission_no",
    ],
    "Forgot Password": [
        "name", "username",
    ],

    // ── Attendance ───────────────────────────────────────────────────
    "Student Present Attendance": [
        "student_name", "admission_no", "class", "section", "attendance_date", "entry_time",
    ],
    "Student Absent Attendance": [
        "student_name", "admission_no", "class", "section", "attendance_date", "reason",
    ],
    "Staff Present Attendance": [
        "staff_name", "employee_id", "attendance_date", "entry_time",
    ],
    "Staff Absent Attendance": [
        "staff_name", "employee_id", "attendance_date", "reason",
    ],

    // ── Homework ─────────────────────────────────────────────────────
    "Homework Created": [
        "subject", "class", "section", "homework_date", "submission_date", "description",
    ],
    "Homework Evaluation": [
        "subject", "evaluation_date",
    ],

    // ── Gmeet ────────────────────────────────────────────────────────
    "Gmeet Live Meeting": [
        "meeting_title", "meeting_date_time", "created_by",
    ],
    "Gmeet Live Meeting Start": [
        "meeting_title",
    ],
    "Gmeet Live Classes": [
        "class_title", "class_date_time", "class", "section", "teacher_name",
    ],
    "Gmeet Live Classes Start": [
        "class_title",
    ],

    // ── Zoom Live Classes & Meetings ────────────────────────────────
    "Zoom Live Meeting": [
        "meeting_title", "meeting_date_time", "created_by",
    ],
    "Zoom Live Meeting Start": [
        "meeting_title",
    ],
    "Zoom Live Classes": [
        "class_title", "class_date_time", "class", "section", "teacher_name",
    ],
    "Zoom Live Classes Start": [
        "class_title",
    ],

    // ── Online Examination ───────────────────────────────────────────
    "Online Examination Publish Exam": [
        "exam_title", "duration", "total_marks", "exam_from", "exam_to",
    ],
    "Online Examination Publish Result": [
        "exam_title",
    ],

    // ── Library ──────────────────────────────────────────────────────
    "Book Issued": [
        "student_name", "admission_no", "book_title", "book_number", "author", "issue_date", "due_date",
    ],
    "Book Returned": [
        "student_name", "admission_no", "book_title", "book_number", "author", "return_date",
    ],
};

function VariableChip({ name, onClick }: { name: string; onClick: (v: string) => void }) {
    return (
        <button
            type="button"
            onClick={() => onClick(name)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-medium hover:bg-indigo-200 transition-colors cursor-pointer border border-indigo-200"
        >
            <Variable className="h-2.5 w-2.5" />
            {`{{${name}}}`}
        </button>
    );
}

// ─── Template Editor Modal ─────────────────────────────────────────────────────────────
function TemplateEditorModal({
    item,
    type,
    onClose,
    onSaved,
}: {
    item: NotificationEvent;
    type: TemplateType;
    onClose: () => void;
    onSaved: (updated: NotificationEvent) => void;
}) {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const { settings } = useSettings();
    const getImageUrl = useImageUrl();
    const [form, setForm] = useState({
        email_subject: item.email_subject || "",
        email_template: item.email_template || "",
        sms_template: item.sms_template || "",
        whatsapp_template: item.whatsapp_template || "",
        mobile_app_template: item.mobile_app_template || "",
        sms_template_id: item.sms_template_id || "",
        whatsapp_template_id: item.whatsapp_template_id || "",
    });
    const [saving, setSaving] = useState(false);

    const availableVars = eventVariables[item.event_name] || [];

    const insertVariable = (varName: string) => {
        const insertText = ` {{${varName}}} `;
        setForm(prev => {
            if (type === "email") return { ...prev, email_template: prev.email_template + insertText };
            if (type === "sms") return { ...prev, sms_template: prev.sms_template + insertText };
            if (type === "whatsapp") return { ...prev, whatsapp_template: prev.whatsapp_template + insertText };
            if (type === "mobile_app") return { ...prev, mobile_app_template: prev.mobile_app_template + insertText };
            return prev;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { settings: [{ id: item.id, ...form }] };
            const res = await api.post('/system-setting/notification-settings/bulk-update', payload);
            if (res.data.status === "success") {
                tt.success("template_updated_successfully");
                onSaved({ ...item, ...form });
                onClose();
            }
        } catch {
            tt.error("failed_to_update_template");
        } finally {
            setSaving(false);
        }
    };

    const getTitle = () => {
        if (type === "email") return t("email_template");
        if (type === "sms") return t("sms_template");
        if (type === "whatsapp") return t("whatsapp_template");
        if (type === "mobile_app") return t("mobile_app_template");
        return t("template");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh] overflow-hidden border border-border/80">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] shrink-0 border-b border-gray-200/70">
                    <h2 className="text-slate-800 font-bold text-sm tracking-tight leading-none">
                        {getTitle()} — {translateNotificationEvent(item.event_name, language?.short_code)}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-5 space-y-4 text-xs overflow-y-auto flex-1 custom-scrollbar">
                    {type === "sms" && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                {t("sms_template_id")} <span className="ml-1 text-gray-400 font-normal normal-case">({t("required_only_for_indian_sms_gateway")})</span>
                            </label>
                            <input
                                type="text"
                                value={form.sms_template_id}
                                onChange={(e) => setForm({ ...form, sms_template_id: e.target.value })}
                                placeholder={t("enter_sms_template_id")}
                                className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            />
                        </div>
                    )}

                    {type === "whatsapp" && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("whatsapp_template_id")}</label>
                            <input
                                type="text"
                                value={form.whatsapp_template_id}
                                onChange={(e) => setForm({ ...form, whatsapp_template_id: e.target.value })}
                                placeholder={t("enter_whatsapp_template_id")}
                                className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            />
                        </div>
                    )}

                    {type === "email" && (
                        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col bg-white dark:bg-card mb-4 shadow-sm">
                            {/* Email Header Wrapper */}
                            <div className="bg-[#1f2937] p-4 flex justify-between items-center text-white relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 100% 50%, transparent 20%, #ffffff 21%, #ffffff 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, #ffffff 21%, #ffffff 34%, transparent 35%, transparent)', backgroundSize: '40px 40px' }}></div>
                                
                                <div className="relative z-10 space-y-2">
                                    {settings?.admin_logo || settings?.app_logo || settings?.print_logo ? (
                                        <div className="bg-white/10 p-2 rounded-lg w-max backdrop-blur-sm border border-white/20">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={getImageUrl(settings.admin_logo || settings.app_logo || settings.print_logo)} 
                                                alt={settings.school_name || "School Logo"} 
                                                className="h-8 object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-[#8bc34a] px-3 py-1.5 rounded w-max border-2 border-white shadow-sm">
                                            <div className="bg-[#ff9800] p-1 rounded-sm">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.19 5.52-3.54 9-3.54V8c-3.48 0-6.64 1.35-9 3.55zM12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"/></svg>
                                            </div>
                                            <span className="font-black text-white text-sm tracking-wide drop-shadow-md">{settings?.school_name || "iSCHOOL"}</span>
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold border-b border-gray-400 pb-1">{settings?.school_name || "Your School Name Here"}</h3>
                                </div>
                                <div className="relative z-10 text-right text-[11px] space-y-0.5 font-medium opacity-90">
                                    <p>{t("address")}: {settings?.address || "N/A"}</p>
                                    <p>{t("phone")}: {settings?.phone || "N/A"}</p>
                                    <p>{t("email")}: {settings?.email || "N/A"}</p>
                                    <p>{t("website")}: {(settings as { frontend_url?: string } | null)?.frontend_url || (typeof window !== "undefined" ? window.location.origin : "") || (settings as { website?: string } | null)?.website || "N/A"}</p>
                                </div>
                            </div>

                            {/* Email Subject & Body */}
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-2.5 rounded-xl">
                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">{t("subject")}:</span>
                                    <input
                                        type="text"
                                        value={form.email_subject}
                                        onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
                                        placeholder={`${t("subject")}...`}
                                        className="w-full text-xs font-semibold text-gray-800 dark:text-gray-200 bg-transparent focus:outline-none placeholder:font-normal"
                                    />
                                </div>

                                <div className="bg-white dark:bg-muted/20 [&_.ql-container]:min-h-[150px] [&_.ql-editor]:min-h-[150px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={form.email_template} 
                                        onChange={(val: string) => setForm({ ...form, email_template: val })} 
                                    />
                                </div>
                            </div>

                            {/* Email Footer */}
                            <div className="bg-[#f8f9fa] dark:bg-muted/40 border-t-4 border-t-[#2196f3] border-b-4 border-b-[#ff9800] p-4 text-center mt-2">
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                                    {t("email_do_not_reply_note")}
                                </p>
                            </div>
                        </div>
                    )}
                    {type !== "email" && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                {t("message_body")} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={8}
                                value={type === "sms" ? form.sms_template : type === "whatsapp" ? form.whatsapp_template : form.mobile_app_template}
                                onChange={(e) => {
                                    if (type === "sms") setForm({ ...form, sms_template: e.target.value });
                                    else if (type === "whatsapp") setForm({ ...form, whatsapp_template: e.target.value });
                                    else setForm({ ...form, mobile_app_template: e.target.value });
                                }}
                                placeholder={t("type_your_message_here")}
                                className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition"
                            />
                        </div>
                    )}

                    {availableVars.length > 0 && (
                        <div className="bg-indigo-50/80 dark:bg-indigo-950/30 rounded-xl px-3.5 py-3 space-y-2 border border-indigo-100 dark:border-indigo-900/50">
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                                <Variable className="h-3 w-3" />
                                {t("available_variables")}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {availableVars.map((v) => (
                                    <VariableChip key={v} name={v} onClick={insertVariable} />
                                ))}
                            </div>
                            <p className="text-[10px] text-indigo-500/80 mt-1 font-medium">{t("click_variable_to_insert")}</p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3.5 border-t border-gray-200/70 flex justify-end bg-gray-50/50 dark:bg-muted/20 shrink-0">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-9 px-7 text-xs font-bold rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all cursor-pointer border-none"
                    >
                        {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t("loading")}</> : t("save")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Table Skeleton ─────────────────────────────────────────────────────────────
function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j} className="py-4 px-4">
                            <Skeleton className="h-4 rounded" style={{ width: `${60 + ((i * 3 + j * 7) % 30)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function NotificationSettingPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const [events, setEvents] = useState<NotificationEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editModal, setEditModal] = useState<{ item: NotificationEvent; type: TemplateType } | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/system-setting/notification-settings');
            if (res.data.status === "success") setEvents(res.data.data);
        } catch {
            tt.error("failed_to_load_notification_settings");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleActiveToggle = (idx: number, checked: boolean) => {
        setEvents(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], is_active: checked };
            return updated;
        });
    };

    const handleCheckboxChange = (idx: number, field: "destinations" | "recipients", value: string, checked: boolean) => {
        setEvents(prev => {
            const updated = [...prev];
            const event = { ...updated[idx] };
            event[field] = checked
                ? [...(event[field] || []), value]
                : (event[field] || []).filter((i) => i !== value);
            updated[idx] = event;
            return updated;
        });
    };

    const handleBulkSave = async () => {
        setSaving(true);
        try {
            const res = await api.post('/system-setting/notification-settings/bulk-update', { settings: events });
            if (res.data.status === "success") {
                tt.success("notification_settings_saved_successfully");
            }
        } catch {
            tt.error("failed_to_save_notification_settings");
        } finally {
            setSaving(false);
        }
    };

    const handleEditSaved = (updated: NotificationEvent) => {
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    };

    const getDestinationLabel = (opt: string) => {
        switch (opt) {
            case "Email": return t("destination_email");
            case "SMS": return t("destination_sms");
            case "Mobile App": return t("destination_mobile_app");
            case "WhatsApp": return t("destination_whatsapp");
            default: return opt;
        }
    };

    const getRecipientLabel = (opt: string) => {
        switch (opt) {
            case "Student": return t("recipient_student");
            case "Guardian": return t("recipient_guardian");
            case "Staff": return t("recipient_staff");
            default: return opt;
        }
    };

    return (
        <>
            {editModal && <TemplateEditorModal item={editModal.item} type={editModal.type} onClose={() => setEditModal(null)} onSaved={handleEditSaved} />}

            <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20 font-sans text-xs">
                {/* Live Notification Queue Monitor & Emergency Cancellation */}
                <QueueMonitorCard channelFilter="all" title={t("system_notification_queue_and_emergency_stop")} />

                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                            </span>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight leading-none">{t("notification_setting")}</h1>
                                <p className="text-xs text-slate-600 mt-1 font-medium">{t("configure_event_notifications_and_message_templates")}</p>
                            </div>
                        </div>
                        {!loading && (
                            <Button
                                onClick={handleBulkSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-6 h-9 text-xs font-bold rounded-xl shadow-md active:scale-95 border-none transition-all cursor-pointer"
                            >
                                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                <span>{saving ? t("loading") : t("save_changes")}</span>
                            </Button>
                        )}
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1500px]">
                                <TableHeader className="bg-muted/40 border-b border-border/70">
                                    <TableRow className="hover:bg-transparent text-xs font-bold uppercase tracking-wider text-foreground">
                                        <TableHead className="py-3.5 px-4 w-[220px]">{t("event")}</TableHead>
                                        <TableHead className="py-3.5 px-4 w-[80px] text-center">{t("active")}</TableHead>
                                        <TableHead className="py-3.5 px-4 w-[180px]">
                                            <div className="flex items-center gap-1.5">
                                                <span>{t("destination")}</span>
                                                <div className="group/tooltip relative">
                                                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-indigo-500 cursor-pointer" />
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:block w-56 p-2.5 bg-gray-900 text-white text-[11px] rounded-xl shadow-xl normal-case font-medium z-50 text-center leading-relaxed">
                                                        {t("mobile_app_notification_tooltip")}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3.5 px-4 w-[160px]">{t("recipient")}</TableHead>
                                        <TableHead className="py-3.5 px-4 min-w-[340px]">{t("templates")}</TableHead>
                                        <TableHead className="py-3.5 px-4 w-[180px]">{t("sms_template_id")}</TableHead>
                                        <TableHead className="py-3.5 px-4 w-[220px]">{t("whatsapp_template_id")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton />
                                    ) : events.length > 0 ? (
                                        events.map((item, idx) => {
                                            const vars = eventVariables[item.event_name] || [];
                                            return (
                                                <TableRow key={item.id} className="text-xs border-b border-border/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all duration-200 align-top">
                                                    <TableCell className="py-4 px-4 font-bold text-foreground leading-relaxed">
                                                        {translateNotificationEvent(item.event_name, language?.short_code)}
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <Checkbox
                                                                id={`${idx}-active`}
                                                                checked={item.is_active}
                                                                onCheckedChange={(c) => handleActiveToggle(idx, !!c)}
                                                                className="h-4 w-4 border-gray-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-sm"
                                                            />
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4">
                                                        <div className="space-y-2">
                                                            {destinationOptions.map((opt) => (
                                                                <div key={opt} className="flex items-center gap-2 group">
                                                                    <Checkbox
                                                                        id={`${idx}-dest-${opt}`}
                                                                        checked={item.destinations.includes(opt)}
                                                                        onCheckedChange={(c) => handleCheckboxChange(idx, "destinations", opt, !!c)}
                                                                        className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-sm"
                                                                    />
                                                                    <label htmlFor={`${idx}-dest-${opt}`} className="text-xs text-muted-foreground font-semibold cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                                        {getDestinationLabel(opt)}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4">
                                                        <div className="space-y-2">
                                                            {recipientOptions.map((opt) => (
                                                                <div key={opt} className="flex items-center gap-2 group">
                                                                    <Checkbox
                                                                        id={`${idx}-rec-${opt}`}
                                                                        checked={item.recipients.includes(opt)}
                                                                        onCheckedChange={(c) => handleCheckboxChange(idx, "recipients", opt, !!c)}
                                                                        className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-sm"
                                                                    />
                                                                    <label htmlFor={`${idx}-rec-${opt}`} className="text-xs text-muted-foreground font-semibold cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                                        {getRecipientLabel(opt)}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4">
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] text-muted-foreground leading-normal line-clamp-3 italic opacity-90">
                                                                {item.sample_message}
                                                            </p>
                                                            {vars.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {vars.slice(0, 4).map((v) => (
                                                                        <span key={v} className="inline-block px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-mono rounded border border-indigo-100 dark:border-indigo-900/40">
                                                                            {`{{${v}}}`}
                                                                        </span>
                                                                    ))}
                                                                    {vars.length > 4 && (
                                                                        <span className="text-[9px] text-muted-foreground font-bold">
                                                                            +{toLocaleNumber(vars.length - 4, language?.short_code)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-1.5 pt-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title={t("email_template")}
                                                                    onClick={() => setEditModal({ item, type: "email" })}
                                                                    className="h-7 w-7 rounded-lg border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm cursor-pointer"
                                                                >
                                                                    <Mail className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title={t("sms_template")}
                                                                    onClick={() => setEditModal({ item, type: "sms" })}
                                                                    className="h-7 w-7 rounded-lg border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm cursor-pointer"
                                                                >
                                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title={t("mobile_app_template")}
                                                                    onClick={() => setEditModal({ item, type: "mobile_app" })}
                                                                    className="h-7 w-7 rounded-lg border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm cursor-pointer"
                                                                >
                                                                    <Smartphone className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title={t("whatsapp_template")}
                                                                    onClick={() => setEditModal({ item, type: "whatsapp" })}
                                                                    className="h-7 w-7 rounded-lg border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm cursor-pointer"
                                                                >
                                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4 text-muted-foreground font-mono text-[11px] truncate max-w-[150px]">
                                                        {item.sms_template_id || "-"}
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4 text-muted-foreground font-mono text-[11px] truncate max-w-[200px]">
                                                        {item.whatsapp_template_id || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-semibold">
                                                {t("no_notification_events_found")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

