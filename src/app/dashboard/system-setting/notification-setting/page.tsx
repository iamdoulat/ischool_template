"use client";

import { useEffect, useState } from "react";
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
import {
    Pencil,
    MessageSquare,
    Loader2,
    X,
    Info,
    Bell,
    Variable,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

interface NotificationEvent {
    id: number;
    event_name: string;
    destinations: string[];
    recipients: string[];
    sms_template_id?: string;
    whatsapp_template_id?: string;
    sample_message: string;
    is_active: boolean;
}

const destinationOptions = ["Email", "SMS", "Mobile App", "WhatsApp"];
const recipientOptions = ["Student", "Guardian", "Staff"];

const eventVariables: Record<string, string[]> = {
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

    // ── Online Examination ───────────────────────────────────────────
    "Online Examination Publish Exam": [
        "exam_title", "duration", "total_marks", "exam_from", "exam_to",
    ],
    "Online Examination Publish Result": [
        "exam_title",
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

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({
    item,
    onClose,
    onSaved,
}: {
    item: NotificationEvent;
    onClose: () => void;
    onSaved: (updated: NotificationEvent) => void;
}) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [form, setForm] = useState({
        sms_template_id: item.sms_template_id ?? "",
        whatsapp_template_id: item.whatsapp_template_id ?? "",
        sample_message: item.sample_message ?? "",
    });
    const [saving, setSaving] = useState(false);

    const availableVars = eventVariables[item.event_name] || [];

    const insertVariable = (varName: string) => {
        setForm((prev) => ({
            ...prev,
            sample_message: prev.sample_message + ` {{${varName}}}`,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { settings: [{ id: item.id, ...form }] };
            const res = await api.post('/system-setting/notification-settings/bulk-update', payload);
            if (res.data.status === "success") {
                toast({ title: t("success_title"), description: t("template_updated_successfully") });
                onSaved({ ...item, ...form });
                onClose();
            }
        } catch {
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_update_template") });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <h2 className="text-gray-800 font-semibold text-sm tracking-tight">{t("template")}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                    <p className="font-semibold text-gray-700 text-[11px]">{item.event_name}</p>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            {t("sms_template_id")} <span className="ml-1 text-gray-400 font-normal normal-case">({t("required_only_for_indian_sms_gateway")})</span>
                        </label>
                        <input
                            type="text"
                            value={form.sms_template_id}
                            onChange={(e) => setForm({ ...form, sms_template_id: e.target.value })}
                            placeholder={t("enter_sms_template_id")}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{t("whatsapp_template_id")}</label>
                        <input
                            type="text"
                            value={form.whatsapp_template_id}
                            onChange={(e) => setForm({ ...form, whatsapp_template_id: e.target.value })}
                            placeholder={t("enter_whatsapp_template_id")}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            {t("template")} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            value={form.sample_message}
                            onChange={(e) => setForm({ ...form, sample_message: e.target.value })}
                            placeholder={t("enter_template_message")}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"
                        />
                    </div>

                    {availableVars.length > 0 && (
                        <div className="bg-indigo-50 rounded-lg px-3 py-2.5 space-y-2">
                            <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                                <Variable className="h-3 w-3" />
                                {t("available_variables")}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {availableVars.map((v) => (
                                    <VariableChip key={v} name={v} onClick={insertVariable} />
                                ))}
                            </div>
                            <p className="text-[9px] text-indigo-400 mt-1">{t("click_variable_to_insert")}</p>
                        </div>
                    )}

                    {availableVars.length === 0 && item.sample_message && (
                        <div className="bg-amber-50 rounded-lg px-3 py-2 space-y-1">
                            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">{t("variables_in_use")}</p>
                            <p className="text-[10px] text-amber-500 leading-relaxed font-mono">
                                {Array.from(item.sample_message.matchAll(/\{\{(\w+)\}\}/g))
                                    .map((m) => `{{${m[1]}}}`)
                                    .join("  ") || t("none")}
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white h-9 px-7 text-[11px] font-bold rounded-full shadow-md disabled:opacity-50 transition-opacity"
                    >
                        {saving ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />{t("loading")}</> : t("save")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── View Modal ─────────────────────────────────────────────────────────────────
function ViewModal({ item, onClose }: { item: NotificationEvent; onClose: () => void }) {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <h2 className="text-gray-800 font-semibold text-sm tracking-tight">{t("sample_message")}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-5 space-y-3 text-xs">
                    <p className="font-semibold text-gray-700 text-[11px]">{item.event_name}</p>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">{item.sample_message}</p>
                    </div>
                    {item.sms_template_id && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t("sms_template_id")}</p>
                            <p className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{item.sms_template_id}</p>
                        </div>
                    )}
                    {item.whatsapp_template_id && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t("whatsapp_template_id")}</p>
                            <p className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded break-all">{item.whatsapp_template_id}</p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
                    <Button onClick={onClose} variant="outline" className="h-8 px-6 text-[11px] font-semibold rounded-lg border-gray-200">
                        {t("close")}
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
    const { t } = useTranslation();
    const [events, setEvents] = useState<NotificationEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editItem, setEditItem] = useState<NotificationEvent | null>(null);
    const [viewItem, setViewItem] = useState<NotificationEvent | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/system-setting/notification-settings');
            if (res.data.status === "success") setEvents(res.data.data);
        } catch {
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_notification_settings") });
        } finally {
            setLoading(false);
        }
    };

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
                toast({ title: t("success_title"), description: t("notification_settings_saved_successfully") });
            }
        } catch {
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_save_notification_settings") });
        } finally {
            setSaving(false);
        }
    };

    const handleEditSaved = (updated: NotificationEvent) => {
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    };

    return (
        <>
            {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSaved={handleEditSaved} />}
            {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}

            <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans text-xs">
                <Card className="pt-0 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Bell className="h-5 w-5" />
                            </span>
                            <div>
                                <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("notification_setting")}</h1>
                                <p className="text-[11px] text-gray-500 mt-1">{t("configure_event_notifications_and_message_templates")}</p>
                            </div>
                        </div>
                        {!loading && (
                            <Button
                                onClick={handleBulkSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-8 text-[11px] font-bold uppercase rounded-full shadow-md border-none transition-all"
                            >
                                {saving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                                {saving ? t("loading") : t("save_changes")}
                            </Button>
                        )}
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1500px]">
                                <TableHeader className="bg-gray-100 border-b border-gray-200">
                                    <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500">
                                        <TableHead className="py-3 px-4 w-[200px]">{t("event")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[80px]">{t("active")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[180px]">
                                            <div className="flex items-center gap-1">
                                                {t("destination")}
                                                <div className="group/tooltip relative">
                                                    <Info className="h-3 w-3 text-muted-foreground hover:text-indigo-500 cursor-pointer" />
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/tooltip:block w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg normal-case font-medium z-50 text-center">
                                                        "Mobile App" triggers in-app notifications (Bell icon).
                                                    </div>
                                                </div>
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4 w-[150px]">{t("recipient")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[180px]">{t("sms_template_id")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[220px]">{t("whatsapp_template_id")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("sample_message")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton />
                                    ) : events.length > 0 ? (
                                        events.map((item, idx) => {
                                            const vars = eventVariables[item.event_name] || [];
                                            return (
                                                <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors align-top">
                                                    <TableCell className="py-4 px-4 font-medium text-gray-700 leading-relaxed">{item.event_name}</TableCell>

                                                    <TableCell className="py-4 px-4">
                                                        <div className="flex items-center justify-center">
                                                            <Checkbox
                                                                id={`${idx}-active`}
                                                                checked={item.is_active}
                                                                onCheckedChange={(c) => handleActiveToggle(idx, !!c)}
                                                                className="h-4 w-4 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 rounded-sm"
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
                                                                        className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm"
                                                                    />
                                                                    <label htmlFor={`${idx}-dest-${opt}`} className="text-[10px] text-gray-500 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                                        {opt}
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
                                                                        className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm"
                                                                    />
                                                                    <label htmlFor={`${idx}-rec-${opt}`} className="text-[10px] text-gray-500 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                                        {opt}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4 text-gray-400 font-mono text-[10px] truncate max-w-[150px]">
                                                        {item.sms_template_id || "-"}
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4 text-gray-400 font-mono text-[10px] truncate max-w-[200px]">
                                                        {item.whatsapp_template_id || "-"}
                                                    </TableCell>

                                                    <TableCell className="py-4 px-4">
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] text-gray-500 leading-normal line-clamp-3 italic opacity-80">
                                                                {item.sample_message}
                                                            </p>
                                                            {vars.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {vars.slice(0, 4).map((v) => (
                                                                        <span key={v} className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-mono rounded border border-indigo-100">
                                                                            {`{{${v}}}`}
                                                                        </span>
                                                                    ))}
                                                                    {vars.length > 4 && (
                                                                        <span className="text-[8px] text-gray-400">+{vars.length - 4}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-1.5 pt-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title={t("edit_template")}
                                                                    onClick={() => setEditItem(item)}
                                                                    className="h-6 w-6 border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title={t("view_sample_message")}
                                                                    onClick={() => setViewItem(item)}
                                                                    className="h-6 w-6 border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm"
                                                                >
                                                                    <MessageSquare className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-gray-400">
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
