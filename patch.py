import re

with open('src/app/dashboard/system-setting/notification-setting/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = re.sub(
    r'import \{\s*Pencil,\s*MessageSquare,\s*Loader2,\s*X,\s*Info,\s*Bell,\s*Variable,\s*\} from \'lucide-react\';|import \{\s*Pencil,\s*MessageSquare,\s*Loader2,\s*X,\s*Info,\s*Bell,\s*Variable,\s*\} from \"lucide-react\";',
    'import { Pencil, MessageSquare, Loader2, X, Info, Bell, Variable, Mail, Smartphone, MessageCircle } from \"lucide-react\";\nimport dynamic from \"next/dynamic\";\nimport \"react-quill-new/dist/quill.snow.css\";\n\nconst ReactQuill = dynamic(() => import(\"react-quill-new\"), { ssr: false });',
    content
)

# 2. Interface
content = content.replace(
    'sample_message: string;\n    is_active: boolean;',
    'sample_message: string;\n    email_subject?: string;\n    email_template?: string;\n    sms_template?: string;\n    whatsapp_template?: string;\n    mobile_app_template?: string;\n    is_active: boolean;'
)

# 3. Add TemplateType
content = content.replace(
    'const destinationOptions = [\"Email\", \"SMS\", \"Mobile App\", \"WhatsApp\"];',
    'type TemplateType = \"email\" | \"sms\" | \"whatsapp\" | \"mobile_app\";\n\nconst destinationOptions = [\"Email\", \"SMS\", \"Mobile App\", \"WhatsApp\"];'
)

# 4. Modals
modal_str = '''
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
    const { t } = useTranslation();
    const { toast } = useToast();
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
                toast({ title: t("success_title"), description: t("template_updated_successfully", "Template updated successfully") });
                onSaved({ ...item, ...form });
                onClose();
            }
        } catch {
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_update_template", "Failed to update template") });
        } finally {
            setSaving(false);
        }
    };

    const getTitle = () => {
        if (type === "email") return "Email Template";
        if (type === "sms") return "SMS Template";
        if (type === "whatsapp") return "WhatsApp Template";
        if (type === "mobile_app") return "Mobile App Template";
        return "Template";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] shrink-0">
                    <h2 className="text-gray-800 font-semibold text-sm tracking-tight">{getTitle()} - {item.event_name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-5 space-y-4 text-xs overflow-y-auto flex-1 custom-scrollbar">
                    {type === "sms" && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                                SMS Template ID <span className="ml-1 text-gray-400 font-normal normal-case">({t("required_only_for_indian_sms_gateway")})</span>
                            </label>
                            <input
                                type="text"
                                value={form.sms_template_id}
                                onChange={(e) => setForm({ ...form, sms_template_id: e.target.value })}
                                placeholder="Enter SMS Template ID"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                            />
                        </div>
                    )}

                    {type === "whatsapp" && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">WhatsApp Template ID</label>
                            <input
                                type="text"
                                value={form.whatsapp_template_id}
                                onChange={(e) => setForm({ ...form, whatsapp_template_id: e.target.value })}
                                placeholder="Enter WhatsApp Template ID"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                            />
                        </div>
                    )}

                    {type === "email" && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Email Subject</label>
                            <input
                                type="text"
                                value={form.email_subject}
                                onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
                                placeholder="Subject..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            Message Body <span className="text-red-500">*</span>
                        </label>
                        {type === "email" ? (
                            <div className="bg-white [&_.ql-container]:min-h-[200px] [&_.ql-editor]:min-h-[200px]">
                                <ReactQuill 
                                    theme="snow" 
                                    value={form.email_template} 
                                    onChange={(val: any) => setForm({ ...form, email_template: val })} 
                                />
                            </div>
                        ) : (
                            <textarea
                                rows={8}
                                value={type === "sms" ? form.sms_template : type === "whatsapp" ? form.whatsapp_template : form.mobile_app_template}
                                onChange={(e) => {
                                    if (type === "sms") setForm({ ...form, sms_template: e.target.value });
                                    else if (type === "whatsapp") setForm({ ...form, whatsapp_template: e.target.value });
                                    else setForm({ ...form, mobile_app_template: e.target.value });
                                }}
                                placeholder="Type your message here..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"
                            />
                        )}
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
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50 shrink-0">
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
'''

content = re.sub(
    r'// ─── Edit Modal ────────────────────────────────────────────────────────────────.*?// ─── Table Skeleton ─────────────────────────────────────────────────────────────',
    modal_str + '\n// ─── Table Skeleton ─────────────────────────────────────────────────────────────',
    content,
    flags=re.DOTALL
)

# 5. state variables
content = content.replace(
    'const [editItem, setEditItem] = useState<NotificationEvent | null>(null);\n    const [viewItem, setViewItem] = useState<NotificationEvent | null>(null);',
    'const [editModal, setEditModal] = useState<{ item: NotificationEvent; type: TemplateType } | null>(null);'
)

# 6. rendering modals
content = content.replace(
    '{editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSaved={handleEditSaved} />}\n            {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}',
    '{editModal && <TemplateEditorModal item={editModal.item} type={editModal.type} onClose={() => setEditModal(null)} onSaved={handleEditSaved} />}'
)

# 7. Action Buttons
action_buttons = '''<div className="flex gap-1.5 pt-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title="Email Template"
                                                                    onClick={() => setEditModal({ item, type: "email" })}
                                                                    className="h-6 w-6 border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm"
                                                                >
                                                                    <Mail className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title="SMS Template"
                                                                    onClick={() => setEditModal({ item, type: "sms" })}
                                                                    className="h-6 w-6 border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm"
                                                                >
                                                                    <MessageSquare className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title="Mobile App Template"
                                                                    onClick={() => setEditModal({ item, type: "mobile_app" })}
                                                                    className="h-6 w-6 border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm"
                                                                >
                                                                    <Smartphone className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title="WhatsApp Template"
                                                                    onClick={() => setEditModal({ item, type: "whatsapp" })}
                                                                    className="h-6 w-6 border-transparent bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm"
                                                                >
                                                                    <MessageCircle className="h-3 w-3" />
                                                                </Button>
                                                            </div>'''
content = re.sub(
    r'<div className=\"flex gap-1\.5 pt-1\">.*?</div>\s*</div>\s*</TableCell>',
    action_buttons + '\n</div>\n</TableCell>',
    content,
    flags=re.DOTALL
)

# 8. Table Head
content = content.replace(
    '<TableHead className="py-3 px-4">{t("sample_message")}</TableHead>',
    '<TableHead className="py-3 px-4">{t("templates", "Templates")}</TableHead>'
)

# save back
with open('src/app/dashboard/system-setting/notification-setting/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Python rewrite script finished.")
