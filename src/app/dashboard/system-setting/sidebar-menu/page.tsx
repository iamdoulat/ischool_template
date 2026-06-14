"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    GripVertical,
    Plus,
    Minus,
    Loader2,
    ChevronRight,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DroppableProvided,
    DraggableProvided
} from "@hello-pangea/dnd";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const moduleSubmenus: Record<string, { name: string; label: string }[]> = {
    dashboard: [],
    front_office: [
        { name: "admission_enquiry", label: "Admission Enquiry" },
        { name: "visitor_book", label: "Visitor Book" },
        { name: "phone_call_log", label: "Phone Call Log" },
        { name: "postal_dispatch", label: "Postal Dispatch" },
        { name: "postal_receive", label: "Postal Receive" },
        { name: "complain", label: "Complain" },
        { name: "setup_front_office", label: "Setup Front Office" },
    ],
    student_information: [
        { name: "student_details", label: "Student Details" },
        { name: "student_admission", label: "Student Admission" },
        { name: "online_admission", label: "Online Admission" },
        { name: "disabled_students", label: "Disabled Students" },
        { name: "multi_class_student", label: "Multi Class Student" },
        { name: "bulk_delete", label: "Bulk Delete" },
        { name: "student_categories", label: "Student Categories" },
        { name: "student_house", label: "Student House" },
        { name: "disable_reason", label: "Disable Reason" },
    ],
    fees_collection: [
        { name: "collect_fees", label: "Collect Fees" },
        { name: "offline_bank_payments", label: "Offline Bank Payments" },
        { name: "search_fees_payment", label: "Search Fees Payment" },
        { name: "search_due_fees", label: "Search Due Fees" },
        { name: "fees_master", label: "Fees Master" },
        { name: "quick_fees", label: "Quick Fees" },
        { name: "fees_group", label: "Fees Group" },
        { name: "fees_type", label: "Fees Type" },
        { name: "fees_discount", label: "Fees Discount" },
        { name: "fees_carry_forward", label: "Fees Carry Forward" },
        { name: "fees_reminder", label: "Fees Reminder" },
    ],
    income: [
        { name: "add_income", label: "Add Income" },
        { name: "search_income", label: "Search Income" },
        { name: "income_head", label: "Income Head" },
    ],
    expenses: [
        { name: "add_expense", label: "Add Expense" },
        { name: "search_expense", label: "Search Expense" },
        { name: "expense_head", label: "Expense Head" },
    ],
    attendance: [
        { name: "student_attendance", label: "Student Attendance" },
        { name: "approve_leave", label: "Approve Leave" },
        { name: "attendance_by_date", label: "Attendance By Date" },
        { name: "leave_type", label: "Leave Type" },
    ],
    examinations: [
        { name: "exam_group", label: "Exam Group" },
        { name: "exam_schedule", label: "Exam Schedule" },
        { name: "exam_result", label: "Exam Result" },
        { name: "design_admit_card", label: "Design Admit Card" },
        { name: "print_admit_card", label: "Print Admit Card" },
        { name: "design_marksheet", label: "Design Marksheet" },
        { name: "print_marksheet", label: "Print Marksheet" },
        { name: "marks_grade", label: "Marks Grade" },
        { name: "marks_division", label: "Marks Division" },
    ],
    cbse_examination: [
        { name: "exam", label: "Exam" },
        { name: "exam_schedule", label: "Exam Schedule" },
        { name: "print_marksheet", label: "Print Marksheet" },
        { name: "template", label: "Template" },
        { name: "assign_observation", label: "Assign Observation" },
        { name: "reports", label: "Reports" },
        { name: "setting", label: "Setting" },
    ],
    online_examinations: [
        { name: "online_exam", label: "Online Exam" },
        { name: "question_bank", label: "Question Bank" },
    ],
    academics: [
        { name: "class_timetable", label: "Class Timetable" },
        { name: "teachers_timetable", label: "Teachers Timetable" },
        { name: "assign_class_teacher", label: "Assign Class Teacher" },
        { name: "promote_students", label: "Promote Students" },
        { name: "subject_group", label: "Subject Group" },
        { name: "subjects", label: "Subjects" },
        { name: "class", label: "Class" },
        { name: "sections", label: "Sections" },
    ],
    human_resource: [
        { name: "staff_directory", label: "Staff Directory" },
        { name: "staff_attendance", label: "Staff Attendance" },
        { name: "payroll", label: "Payroll" },
        { name: "approve_leave_request", label: "Approve Leave Request" },
        { name: "apply_leave", label: "Apply Leave" },
        { name: "leave_type", label: "Leave Type" },
        { name: "teachers_rating", label: "Teachers Rating" },
        { name: "department", label: "Department" },
        { name: "designation", label: "Designation" },
        { name: "disabled_staff", label: "Disabled Staff" },
    ],
    communicate: [
        { name: "notice_board", label: "Notice Board" },
        { name: "send_email", label: "Send Email" },
        { name: "send_sms", label: "Send SMS" },
        { name: "send_wa", label: "Send WA" },
        { name: "email_sms_log", label: "Email SMS Log" },
        { name: "schedule_email_sms_log", label: "Schedule Email SMS Log" },
        { name: "login_credentials_send", label: "Login Credentials Send" },
        { name: "email_template", label: "Email Template" },
        { name: "sms_template", label: "SMS Template" },
        { name: "wa_template", label: "WA Template" },
    ],
    download_center: [
        { name: "upload_share_content", label: "Upload Share Content" },
        { name: "content_share_list", label: "Content Share List" },
        { name: "video_tutorial", label: "Video Tutorial" },
        { name: "content_type", label: "Content Type" },
    ],
    homework: [
        { name: "add_homework", label: "Add Homework" },
        { name: "daily_assignment", label: "Daily Assignment" },
    ],
    online_course: [
        { name: "online_course", label: "Online Course" },
        { name: "question_bank", label: "Question Bank" },
        { name: "offline_payment", label: "Offline Payment" },
        { name: "online_course_report", label: "Online Course Report" },
        { name: "setting", label: "Setting" },
    ],
    library: [
        { name: "book_list", label: "Book List" },
        { name: "issue_return", label: "Issue & Return" },
        { name: "add_student", label: "Add Student" },
        { name: "add_staff_member", label: "Add Staff Member" },
    ],
    inventory: [
        { name: "issue_item", label: "Issue Item" },
        { name: "add_item_stock", label: "Add Item Stock" },
        { name: "add_item", label: "Add Item" },
        { name: "item_category", label: "Item Category" },
        { name: "item_store", label: "Item Store" },
        { name: "item_supplier", label: "Item Supplier" },
    ],
    transport: [
        { name: "fees_master", label: "Fees Master" },
        { name: "pickup_point", label: "Pickup Point" },
        { name: "routes", label: "Routes" },
        { name: "vehicles", label: "Vehicles" },
        { name: "assign_vehicle", label: "Assign Vehicle" },
        { name: "route_pickup_point", label: "Route Pickup Point" },
        { name: "student_transport_fees", label: "Student Transport Fees" },
    ],
    hostel: [
        { name: "hostel_room", label: "Hostel Room" },
        { name: "room_type", label: "Room Type" },
        { name: "hostel", label: "Hostel" },
    ],
    certificate: [
        { name: "transfer_certificate", label: "Transfer Certificate" },
        { name: "student_certificate", label: "Student Certificate" },
        { name: "generate_certificate", label: "Generate Certificate" },
        { name: "student_id_card", label: "Student ID Card" },
        { name: "generate_id_card", label: "Generate ID Card" },
        { name: "staff_id_card", label: "Staff ID Card" },
        { name: "generate_staff_id_card", label: "Generate Staff ID Card" },
    ],
    multi_branch: [
        { name: "overview", label: "Overview" },
        { name: "report", label: "Report" },
        { name: "setting", label: "Setting" },
    ],
    behaviour_records: [
        { name: "assign_incident", label: "Assign Incident" },
        { name: "incidents", label: "Incidents" },
        { name: "reports", label: "Reports" },
        { name: "setting", label: "Setting" },
    ],
    reports: [
        { name: "student_information", label: "Student Information" },
        { name: "finance", label: "Finance" },
        { name: "attendance", label: "Attendance" },
        { name: "examinations", label: "Examinations" },
        { name: "online_examinations", label: "Online Examinations" },
        { name: "lesson_plan", label: "Lesson Plan" },
        { name: "human_resource", label: "Human Resource" },
        { name: "homework", label: "Homework" },
        { name: "library", label: "Library" },
        { name: "inventory", label: "Inventory" },
        { name: "transport", label: "Transport" },
        { name: "hostel", label: "Hostel" },
        { name: "alumni", label: "Alumni" },
        { name: "user_log", label: "User Log" },
        { name: "audit_trail_report", label: "Audit Trail Report" },
    ],
    gmeet_live_classes: [
        { name: "live_classes", label: "Live Classes" },
        { name: "live_meeting", label: "Live Meeting" },
        { name: "live_classes_report", label: "Live Classes Report" },
        { name: "live_meeting_report", label: "Live Meeting Report" },
        { name: "setting", label: "Setting" },
    ],
    zoom_live_classes: [
        { name: "live_meeting", label: "Live Meeting" },
        { name: "live_classes", label: "Live Classes" },
        { name: "live_classes_report", label: "Live Classes Report" },
        { name: "live_meeting_report", label: "Live Meeting Report" },
        { name: "setting", label: "Setting" },
    ],
    lesson_plan: [
        { name: "copy_old_lessons", label: "Copy Old Lessons" },
        { name: "manage_lesson_plan", label: "Manage Lesson Plan" },
        { name: "manage_syllabus_status", label: "Manage Syllabus Status" },
        { name: "lesson", label: "Lesson" },
        { name: "topic", label: "Topic" },
    ],
    student_cv: [
        { name: "build_cv", label: "Build CV" },
        { name: "download_cv", label: "Download CV" },
    ],
    alumni: [
        { name: "manage_alumni", label: "Manage Alumni" },
        { name: "events", label: "Events" },
    ],
    annual_calendar: [
        { name: "annual_calendar", label: "Annual Calendar" },
        { name: "holiday_type", label: "Holiday Type" },
    ],
    front_cms: [
        { name: "event", label: "Event" },
        { name: "gallery", label: "Gallery" },
        { name: "news", label: "News" },
        { name: "media_manager", label: "Media Manager" },
        { name: "pages", label: "Pages" },
        { name: "menus", label: "Menus" },
        { name: "banner_images", label: "Banner Images" },
    ],
    qr_code_attendance: [
        { name: "attendance", label: "Attendance" },
        { name: "terminal", label: "Terminal" },
        { name: "face_registration", label: "Face Registration" },
        { name: "qr_code_generation", label: "QR Code Generation" },
        { name: "nfc_assignment", label: "NFC Assignment" },
        { name: "setting", label: "Setting" },
        { name: "smart_attendance_settings", label: "Smart Attendance Settings" },
    ],
    system_setting: [
        { name: "general_setting", label: "General Setting" },
        { name: "session_setting", label: "Session Setting" },
        { name: "notification_setting", label: "Notification Setting" },
        { name: "whatsapp_messaging", label: "WhatsApp Messaging" },
        { name: "sms_setting", label: "SMS Setting" },
        { name: "email_setting", label: "Email Setting" },
        { name: "payment_methods", label: "Payment Methods" },
        { name: "print_header_footer", label: "Print Header Footer" },
        { name: "thermal_print", label: "Thermal Print" },
        { name: "front_cms_setting", label: "Front CMS Setting" },
        { name: "backup_restore", label: "Backup & Restore" },
        { name: "currency", label: "Currency" },
        { name: "users", label: "Users" },
        { name: "roles_permissions", label: "Roles & Permissions" },
        { name: "languages", label: "Languages" },
        { name: "addons", label: "Addons" },
        { name: "modules", label: "Modules" },
        { name: "custom_fields", label: "Custom Fields" },
        { name: "captcha_setting", label: "Captcha Setting" },
        { name: "system_fields", label: "System Fields" },
        { name: "student_profile_setting", label: "Student Profile Setting" },
        { name: "online_admission", label: "Online Admission" },
        { name: "file_types", label: "File Types" },
        { name: "sidebar_menu", label: "Sidebar Menu" },
        { name: "system_update", label: "System Update" },
    ],
};

const leftGray = { border: "border-gray-400", light: "bg-gray-50/50", text: "text-gray-700", dot: "bg-gray-400" };

interface SubmenuItem {
    name: string;
    label: string;
}

interface MenuItem {
    id: number;
    name: string;
    label: string;
    submenus: SubmenuItem[];
}

export default function SidebarMenuPage() {
    const { toast } = useToast();
    const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedAvailable, setExpandedAvailable] = useState<Set<string>>(new Set());
    const [expandedSelected, setExpandedSelected] = useState<Set<string>>(new Set());

    const toggleExpand = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, name: string) => {
        setter(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/sidebar-menu");
            if (response.data.success) {
                const raw: { id: number; name: string; label: string; is_visible: boolean; submenu_order: string[] | null }[] = response.data.data;
                const filtered = raw.filter((m) => m.name in moduleSubmenus);
                const toMenuItem = (m: { id: number; name: string; label: string; submenu_order: string[] | null }) => {
                    let subs = moduleSubmenus[m.name] || [];
                    if (m.submenu_order && m.submenu_order.length > 0) {
                        const orderMap = new Map(subs.map(s => [s.name, s]));
                        const ordered: { name: string; label: string }[] = [];
                        const seen = new Set<string>();
                        for (const name of m.submenu_order) {
                            if (orderMap.has(name)) {
                                ordered.push(orderMap.get(name)!);
                                seen.add(name);
                            }
                        }
                        for (const s of subs) {
                            if (!seen.has(s.name)) ordered.push(s);
                        }
                        subs = ordered;
                    }
                    return { id: m.id, name: m.name, label: m.label, submenus: subs };
                };
                setAvailableItems(filtered.filter((m) => !m.is_visible).map(toMenuItem));
                setSelectedItems(filtered.filter((m) => m.is_visible).map(toMenuItem));
            }
        } catch (error) {
            console.error("Error fetching sidebar menus:", error);
            toast("error", "Failed to load sidebar menus.");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const menusToUpdate = [
                ...selectedItems.map((item, index) => ({
                    id: item.id,
                    is_visible: true,
                    sort_order: index,
                    submenu_order: item.submenus.map(s => s.name)
                })),
                ...availableItems.map((item, index) => ({
                    id: item.id,
                    is_visible: false,
                    sort_order: selectedItems.length + index,
                    submenu_order: item.submenus.map(s => s.name)
                }))
            ];

            const response = await api.post("/system-setting/sidebar-menu/update", {
                menus: menusToUpdate
            });

            if (response.data.success) {
                toast("success", "Sidebar menu updated successfully.");
            }
        } catch (error) {
            console.error("Error updating sidebar menus:", error);
            toast("error", "Failed to update sidebar menu.");
        } finally {
            setSaving(false);
        }
    };

    const moveToSelected = (item: MenuItem) => {
        setAvailableItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedItems(prev => [...prev, item]);
    };

    const moveToAvailable = (item: MenuItem) => {
        setSelectedItems(prev => prev.filter(i => i.id !== item.id));
        setAvailableItems(prev => [...prev, item]);
    };

    const onModuleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        if (result.source.droppableId === 'selected' && result.destination.droppableId === 'selected') {
            const items = Array.from(selectedItems);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setSelectedItems(items);
        }
    };

    const moveSubUp = (moduleId: number, subIndex: number) => {
        if (subIndex === 0) return;
        setSelectedItems(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            const subs = [...m.submenus];
            [subs[subIndex - 1], subs[subIndex]] = [subs[subIndex], subs[subIndex - 1]];
            return { ...m, submenus: subs };
        }));
        setAvailableItems(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            const subs = [...m.submenus];
            [subs[subIndex - 1], subs[subIndex]] = [subs[subIndex], subs[subIndex - 1]];
            return { ...m, submenus: subs };
        }));
    };

    const moveSubDown = (moduleId: number, subIndex: number, subLength: number) => {
        if (subIndex === subLength - 1) return;
        setSelectedItems(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            const subs = [...m.submenus];
            [subs[subIndex], subs[subIndex + 1]] = [subs[subIndex + 1], subs[subIndex]];
            return { ...m, submenus: subs };
        }));
        setAvailableItems(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            const subs = [...m.submenus];
            [subs[subIndex], subs[subIndex + 1]] = [subs[subIndex + 1], subs[subIndex]];
            return { ...m, submenus: subs };
        }));
    };

    const onSubmenuDragEnd = (moduleId: number, result: DropResult) => {
        if (!result.destination) return;
        if (result.source.index === result.destination.index) return;

        const reorderSubs = (subs: SubmenuItem[]) => {
            const items = Array.from(subs);
            const [moved] = items.splice(result.source.index, 1);
            items.splice(result.destination!.index, 0, moved);
            return items;
        };

        setSelectedItems(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            return { ...m, submenus: reorderSubs(m.submenus) };
        }));
        setAvailableItems(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            return { ...m, submenus: reorderSubs(m.submenus) };
        }));
    };

    const renderSubmenuItem = (sub: SubmenuItem, subIndex: number, subLength: number, moduleId: number, palette: { dot: string }) => {
        const dotText = palette.dot.replace('bg-', 'text-');
        return (
        <div
            key={sub.name}
            className="flex items-center justify-between px-3 py-2 pl-10 text-[12px] text-gray-500 border-b border-gray-100 last:border-b-0 hover:bg-white/60 transition-all duration-200 group/sub"
            >
                <div className="flex items-center gap-2">
                    <GripVertical className={`h-3 w-3 ${dotText} opacity-40 cursor-grab active:cursor-grabbing`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${palette.dot} shrink-0`} />
                    <span className="group-hover/sub:translate-x-0.5 transition-transform duration-200">{sub.label}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-all duration-200">
                    <button
                        onClick={() => moveSubUp(moduleId, subIndex)}
                        disabled={subIndex === 0}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                        onClick={() => moveSubDown(moduleId, subIndex, subLength)}
                        disabled={subIndex === subLength - 1}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronDown className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    };

    const renderAvailableItem = (item: MenuItem) => {
        const expanded = expandedAvailable.has(item.name);
        const hasSubmenus = item.submenus.length > 0;

        return (
            <div
                className="rounded-md overflow-hidden border-l-4 border-gray-300 border-t border-r border-b border-gray-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group/mod"
            >
                <div
                    className="flex items-center justify-between p-3 cursor-pointer bg-gray-50/30 hover:bg-white/60 transition-all duration-300"
                    onClick={() => hasSubmenus && toggleExpand(setExpandedAvailable, item.name)}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {hasSubmenus && (
                            <span className="text-gray-500 shrink-0 transition-transform duration-300">
                                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 -rotate-90" />}
                            </span>
                        )}
                        {!hasSubmenus && <span className="w-4 shrink-0" />}
                        <span className="text-[13px] font-semibold text-gray-700 truncate">{item.label}</span>
                    </div>
                    <div
                        className="h-7 w-7 flex items-center justify-center rounded-full transition-all duration-200 shrink-0 text-gray-500 hover:bg-white hover:shadow-md hover:scale-110 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); moveToSelected(item); }}
                    >
                        <Plus className="h-4 w-4 transition-transform duration-300 group-hover/mod:rotate-90" />
                    </div>
                </div>
                {hasSubmenus && expanded && (
                    <div className="border-t border-gray-200 bg-gray-50/30">
                        {item.submenus.map((sub, subIndex) =>
                            renderSubmenuItem(sub, subIndex, item.submenus.length, item.id, leftGray)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 bg-gray-50/10 font-sans space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                    <h1 className="text-[16px] font-medium text-gray-700">Sidebar Menu</h1>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                        {/* Left Column: Menu List (Available) */}
                        <div className="flex flex-col h-full border border-gray-200 rounded-md bg-white">
                            <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                                <h2 className="text-[13px] font-semibold text-gray-600">Menu List</h2>
                            </div>
                            <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[700px]">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <>
                                        {availableItems.map((item) => (
                                            <div key={item.id}>
                                                {renderAvailableItem(item)}
                                            </div>
                                        ))}
                                        {availableItems.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-[12px]">
                                                No items available
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Selected Sidebar Menus */}
                        <DragDropContext onDragEnd={onModuleDragEnd}>
                            <Droppable droppableId="selected">
                                {(provided: DroppableProvided) => (
                                    <div
                                        className="flex flex-col h-full border border-gray-200 rounded-md bg-white"
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                                            <h2 className="text-[13px] font-semibold text-gray-600">Selected Sidebar Menus</h2>
                                        </div>
                                        <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[700px]">
                                            {loading ? (
                                                <div className="flex justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                </div>
                                            ) : (
                                                <>
                                                    {selectedItems.map((item, index) => (
                                                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                            {(providedSnapshot: DraggableProvided) => (
                                                                <div
                                                                    ref={providedSnapshot.innerRef}
                                                                    {...providedSnapshot.draggableProps}
                                                                    className="rounded-md overflow-hidden border-l-4 border-emerald-400 border-t border-r border-b border-gray-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group/mod"
                                                                >
                                                                    <div
                                                                        className="flex items-center justify-between p-3 cursor-pointer bg-emerald-50/50 hover:bg-white/60 transition-all duration-300"
                                                                        onClick={() => item.submenus.length > 0 && toggleExpand(setExpandedSelected, item.name)}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <div
                                                                                {...providedSnapshot.dragHandleProps}
                                                                                className="cursor-grab active:cursor-grabbing p-1"
                                                                            >
                                                                                <GripVertical className="h-4 w-4 text-emerald-600 opacity-40 hover:opacity-100 transition-opacity duration-200" />
                                                                            </div>
                                                                            {item.submenus.length > 0 && (
                                                                                <span className="text-emerald-600 shrink-0 transition-transform duration-300">
                                                                                    {expandedSelected.has(item.name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                                </span>
                                                                            )}
                                                                            {item.submenus.length === 0 && <span className="w-4 shrink-0" />}
                                                                            <span className="text-[13px] font-semibold text-emerald-700 truncate">{item.label}</span>
                                                                        </div>
                                                                        <div
                                                                            className="h-7 w-7 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-md hover:scale-110 cursor-pointer"
                                                                            onClick={(e) => { e.stopPropagation(); moveToAvailable(item); }}
                                                                        >
                                                                            <Minus className="h-4 w-4 transition-transform duration-300 group-hover/mod:rotate-90" />
                                                                        </div>
                                                                    </div>
                                                                    {item.submenus.length > 0 && expandedSelected.has(item.name) && (
                                                                        <DragDropContext onDragEnd={(result) => onSubmenuDragEnd(item.id, result)}>
                                                                            <Droppable droppableId={`submenu-${item.id}`}>
                                                                                {(subProvided: DroppableProvided) => (
                                                                                    <div
                                                                                        ref={subProvided.innerRef}
                                                                                        {...subProvided.droppableProps}
                                                                                        className="border-t border-emerald-200 bg-emerald-50/50"
                                                                                    >
                                                                                        {item.submenus.map((sub, subIndex) => (
                                                                                            <Draggable
                                                                                                key={`${item.id}-${sub.name}`}
                                                                                                draggableId={`${item.id}-${sub.name}`}
                                                                                                index={subIndex}
                                                                                            >
                                                                                                {(subProvidedSnapshot: DraggableProvided) => (
                                                                                                    <div
                                                                                                        ref={subProvidedSnapshot.innerRef}
                                                                                                        {...subProvidedSnapshot.draggableProps}
                                                                                                    >
                                                                                                        <div className="flex items-center justify-between px-3 py-2 pl-10 text-[12px] text-gray-500 border-b border-gray-100 last:border-b-0 hover:bg-white/60 transition-all duration-200 group/sub">
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <div
                                                                                                                    {...subProvidedSnapshot.dragHandleProps}
                                                                                                                    className="cursor-grab active:cursor-grabbing"
                                                                                                                >
                                                                                                                    <GripVertical className="h-3 w-3 text-emerald-400 opacity-40" />
                                                                                                                </div>
                                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                                                                                                <span className="group-hover/sub:translate-x-0.5 transition-transform duration-200">{sub.label}</span>
                                                                                                            </div>
                                                                                                            <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-all duration-200">
                                                                                                                <button
                                                                                                                    onClick={() => moveSubUp(item.id, subIndex)}
                                                                                                                    disabled={subIndex === 0}
                                                                                                                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                                                >
                                                                                                                    <ChevronUp className="h-3 w-3" />
                                                                                                                </button>
                                                                                                                <button
                                                                                                                    onClick={() => moveSubDown(item.id, subIndex, item.submenus.length)}
                                                                                                                    disabled={subIndex === item.submenus.length - 1}
                                                                                                                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                                                >
                                                                                                                    <ChevronDown className="h-3 w-3" />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </Draggable>
                                                                                        ))}
                                                                                        {subProvided.placeholder}
                                                                                    </div>
                                                                                )}
                                                                            </Droppable>
                                                                        </DragDropContext>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                    {selectedItems.length === 0 && (
                                                        <div className="text-center py-8 text-gray-400 text-[12px]">
                                                            No items selected
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    <div className="flex justify-end pt-6 mt-4 border-t border-gray-50">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:opacity-90 text-white px-8 h-9 text-[12px] font-bold uppercase transition-all rounded-full shadow-lg border-none min-w-[120px]"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
