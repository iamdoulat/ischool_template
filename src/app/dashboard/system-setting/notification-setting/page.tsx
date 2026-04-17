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
    Pencil,
    MessageSquare,
    Loader2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useToast } from "@/components/ui/toast";

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
const API_BASE = "http://localhost:8000/api/v1/system-setting/notification-settings";

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
    const { toast } = useToast();
    const [form, setForm] = useState({
        sms_template_id: item.sms_template_id ?? "",
        whatsapp_template_id: item.whatsapp_template_id ?? "",
        sample_message: item.sample_message ?? "",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                settings: [{ id: item.id, ...form }],
            };
            const res = await axios.post(`${API_BASE}/bulk-update`, payload);
            if (res.data.status === "success") {
                toast("success", "Template updated successfully");
                onSaved({ ...item, ...form });
                onClose();
            }
        } catch {
            toast("error", "Failed to update template");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Modal card */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-indigo-600">
                    <h2 className="text-white font-semibold text-sm tracking-tight">Template</h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-4 text-xs">
                    <p className="font-semibold text-gray-700 text-[11px]">{item.event_name}</p>

                    {/* SMS Template ID */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            SMS Template ID
                            <span className="ml-1 text-gray-400 font-normal normal-case">(Required only for Indian SMS Gateway)</span>
                        </label>
                        <input
                            type="text"
                            value={form.sms_template_id}
                            onChange={(e) => setForm({ ...form, sms_template_id: e.target.value })}
                            placeholder="Enter SMS Template ID"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                        />
                    </div>

                    {/* WhatsApp Template ID */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            WhatsApp Template ID
                        </label>
                        <input
                            type="text"
                            value={form.whatsapp_template_id}
                            onChange={(e) => setForm({ ...form, whatsapp_template_id: e.target.value })}
                            placeholder="Enter WhatsApp Template ID"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                        />
                    </div>

                    {/* Sample Message / Template */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            Template <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            value={form.sample_message}
                            onChange={(e) => setForm({ ...form, sample_message: e.target.value })}
                            placeholder="Enter template message..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"
                        />
                    </div>

                    {/* Variables hint */}
                    <div className="bg-indigo-50 rounded-lg px-3 py-2 space-y-1">
                        <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">You Can Use Variables</p>
                        <p className="text-[10px] text-indigo-500 leading-relaxed font-mono">
                            {/* Extract placeholders from the existing message */}
                            {Array.from(item.sample_message.matchAll(/\{\{(\w+)\}\}/g))
                                .map((m) => `{{${m[1]}}}`)
                                .join("  ")}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-pink-500 via-rose-400 to-indigo-500 hover:opacity-90 text-white h-9 px-7 text-[11px] font-bold rounded-full shadow-md disabled:opacity-50 transition-opacity"
                    >
                        {saving ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Saving...</> : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── View Modal ─────────────────────────────────────────────────────────────────
function ViewModal({
    item,
    onClose,
}: {
    item: NotificationEvent;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-indigo-600">
                    <h2 className="text-white font-semibold text-sm tracking-tight">Sample Message</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-3 text-xs">
                    <p className="font-semibold text-gray-700 text-[11px]">{item.event_name}</p>

                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {item.sample_message}
                        </p>
                    </div>

                    {item.sms_template_id && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">SMS Template ID</p>
                                <p className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{item.sms_template_id}</p>
                            </div>
                        </div>
                    )}
                    {item.whatsapp_template_id && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">WhatsApp Template ID</p>
                            <p className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded break-all">{item.whatsapp_template_id}</p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="h-8 px-6 text-[11px] font-semibold rounded-lg border-gray-200"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function NotificationSettingPage() {
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
            const res = await axios.get(API_BASE);
            if (res.data.status === "success") setEvents(res.data.data);
        } catch {
            toast("error", "Failed to load notification settings");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (
        idx: number,
        field: "destinations" | "recipients",
        value: string,
        checked: boolean
    ) => {
        const newEvents = [...events];
        const event = { ...newEvents[idx] };
        event[field] = checked
            ? [...(event[field] || []), value]
            : (event[field] || []).filter((i) => i !== value);
        newEvents[idx] = event;
        setEvents(newEvents);
    };

    const handleBulkSave = async () => {
        setSaving(true);
        try {
            const res = await axios.post(`${API_BASE}/bulk-update`, { settings: events });
            if (res.data.status === "success") toast("success", "Notification settings saved");
        } catch {
            toast("error", "Failed to save notification settings");
        } finally {
            setSaving(false);
        }
    };

    const handleEditSaved = (updated: NotificationEvent) => {
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <>
            {/* Modals */}
            {editItem && (
                <EditModal
                    item={editItem}
                    onClose={() => setEditItem(null)}
                    onSaved={handleEditSaved}
                />
            )}
            {viewItem && (
                <ViewModal item={viewItem} onClose={() => setViewItem(null)} />
            )}

            <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">
                    Notification Setting
                </h1>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative pb-20">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1500px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/30">
                                    <TableHead className="py-3 px-4 w-[200px]">Event</TableHead>
                                    <TableHead className="py-3 px-4 w-[180px]">Destination</TableHead>
                                    <TableHead className="py-3 px-4 w-[150px]">Recipient</TableHead>
                                    <TableHead className="py-3 px-4 w-[180px]">SMS Template ID</TableHead>
                                    <TableHead className="py-3 px-4 w-[220px]">WhatsApp Template Id</TableHead>
                                    <TableHead className="py-3 px-4">Sample Message</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((item, idx) => (
                                    <TableRow
                                        key={item.id}
                                        className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors align-top"
                                    >
                                        {/* Event name */}
                                        <TableCell className="py-4 px-4 font-medium text-gray-700 leading-relaxed">
                                            {item.event_name}
                                        </TableCell>

                                        {/* Destinations */}
                                        <TableCell className="py-4 px-4">
                                            <div className="space-y-2">
                                                {destinationOptions.map((opt) => (
                                                    <div key={opt} className="flex items-center gap-2 group">
                                                        <Checkbox
                                                            id={`${idx}-dest-${opt}`}
                                                            checked={item.destinations.includes(opt)}
                                                            onCheckedChange={(c) =>
                                                                handleCheckboxChange(idx, "destinations", opt, !!c)
                                                            }
                                                            className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm"
                                                        />
                                                        <label
                                                            htmlFor={`${idx}-dest-${opt}`}
                                                            className="text-[10px] text-gray-500 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors"
                                                        >
                                                            {opt}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>

                                        {/* Recipients */}
                                        <TableCell className="py-4 px-4">
                                            <div className="space-y-2">
                                                {recipientOptions.map((opt) => {
                                                    const active = item.recipients.includes(opt);
                                                    return (
                                                        <div key={opt} className="flex items-center gap-2 group">
                                                            <Checkbox
                                                                id={`${idx}-rec-${opt}`}
                                                                checked={active}
                                                                onCheckedChange={(c) =>
                                                                    handleCheckboxChange(idx, "recipients", opt, !!c)
                                                                }
                                                                className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm"
                                                            />
                                                            <label
                                                                htmlFor={`${idx}-rec-${opt}`}
                                                                className="text-[10px] text-gray-500 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors"
                                                            >
                                                                {opt}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TableCell>

                                        {/* SMS Template ID */}
                                        <TableCell className="py-4 px-4 text-gray-400 font-mono text-[10px] truncate max-w-[150px]">
                                            {item.sms_template_id || "-"}
                                        </TableCell>

                                        {/* WhatsApp Template ID */}
                                        <TableCell className="py-4 px-4 text-gray-400 font-mono text-[10px] truncate max-w-[200px]">
                                            {item.whatsapp_template_id || "-"}
                                        </TableCell>

                                        {/* Sample Message + Actions */}
                                        <TableCell className="py-4 px-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-gray-500 leading-normal line-clamp-3 italic opacity-80">
                                                    {item.sample_message}
                                                </p>
                                                <div className="flex gap-1.5 pt-1">
                                                    {/* Edit */}
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        title="Edit template"
                                                        onClick={() => setEditItem(item)}
                                                        className="h-6 w-6 border-transparent bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    {/* View */}
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        title="View sample message"
                                                        onClick={() => setViewItem(item)}
                                                        className="h-6 w-6 border-transparent bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
                                                    >
                                                        <MessageSquare className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Floating bulk Save */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100 flex justify-end z-10 shadow-inner">
                        <Button
                            onClick={handleBulkSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-pink-500 via-rose-400 to-indigo-500 hover:opacity-90 text-white px-8 h-9 text-[11px] font-bold uppercase rounded-full shadow-md disabled:opacity-50 transition-opacity"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
