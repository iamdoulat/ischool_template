"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Pencil, Trash2, Eye, Upload, Image as ImageIcon, Search,
    Copy, FileSpreadsheet, FileText, Printer, Columns,
    ChevronLeft, ChevronRight, Settings2, Contact,
    FileSignature, IdCard, Loader2
} from "lucide-react";
import { getImageUrl } from "@/lib/image-url";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AdmitCardTemplateLayout } from "@/components/examination/AdmitCardTemplateLayout";
import { X } from "lucide-react";

interface TemplateFormData {
    name: string;
    heading: string;
    title: string;
    exam_name: string;
    school_name: string;
    exam_center: string;
    footer_text: string;
    header_image: string;
    left_logo: string;
    right_logo: string;
    left_sign: string;
    middle_sign: string;
    right_sign: string;
    background_image: string;
    show_name: boolean;
    show_father_name: boolean;
    show_mother_name: boolean;
    show_dob: boolean;
    show_admission_no: boolean;
    show_roll_no: boolean;
    show_address: boolean;
    show_gender: boolean;
    show_photo: boolean;
    show_class: boolean;
    show_section: boolean;
    show_exam_number: boolean;
    is_active: boolean;
    [key: string]: string | boolean;
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface AdmitCard extends TemplateFormData {
    id: string;
}

export default function DesignAdmitCardPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<AdmitCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<AdmitCard | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const itemsPerPage = parseInt(rowsPerPage);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState<TemplateFormData>({
        name: "",
        heading: "",
        title: "",
        exam_name: "",
        school_name: "",
        exam_center: "",
        footer_text: "",
        header_image: "",
        left_logo: "",
        right_logo: "",
        left_sign: "",
        middle_sign: "",
        right_sign: "",
        background_image: "",
        show_name: true,
        show_father_name: true,
        show_mother_name: true,
        show_dob: true,
        show_admission_no: true,
        show_roll_no: true,
        show_address: true,
        show_gender: true,
        show_photo: true,
        show_class: true,
        show_section: true,
        show_exam_number: true,
        is_active: true
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [currentPage, itemsPerPage, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/admit-card-templates', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setTemplates(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            tt.error("failed_to_fetch_templates");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            tt.error("template_name_is_required");
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/admit-card-templates/${selectedId}`, formData);
                tt.success("template_updated_successfully");
            } else {
                await api.post('/examination/admit-card-templates', formData);
                tt.success("template_created_successfully");
            }
            resetForm();
            fetchTemplates();
        } catch (error) {
            tt.error("failed_to_save_template");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (template: TemplateFormData & { id: string }) => {
        setEditMode(true);
        setSelectedId(template.id);
        setFormData({ ...template });
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/admit-card-templates/${deleteId}`);
            tt.success("template_deleted_successfully");
            fetchTemplates();
        } catch (error) {
            tt.error("failed_to_delete_template");
        } finally {
            setDeleteId(null);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(fieldName);
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('type', 'general');

        try {
            const response = await api.post('/file-upload/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.status === "Success" || response.data.data) {
                const uploadedPath = response.data.data.path;
                setFormData(prev => ({ ...prev, [fieldName]: uploadedPath }));
                tt.success("file_uploaded_successfully");
            }
        } catch (error) {
            tt.error("failed_to_upload_file");
        } finally {
            setUploadingField(null);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const handleImageRemove = (fieldName: string) => {
        setFormData(prev => ({ ...prev, [fieldName]: "" }));
    };

    const resolveImageUrl = (path: string) => {
        return getImageUrl(path);
    };

    const getMockAdmitCardData = (template: AdmitCard) => {
        return {
            student: {
                name: "John Doe",
                father_name: "Richard Doe",
                mother_name: "Jane Doe",
                admission_no: "ADM-2026-001",
                roll_no: "101",
                dob: "2010-05-15",
                gender: "Male",
                class: "Class 10",
                section: "A",
                photo: undefined,
                address: "123 Main St, New York, USA",
            },
            exam: {
                name: template.exam_name || "Final Examination",
                session: "2025-2026",
                group: "Science",
            },
            template: template,
            schedules: [
                {
                    subject_name: "Mathematics",
                    subject_code: "MTH101",
                    date: "2026-05-15",
                    start_time: "09:00 AM",
                    duration: 180,
                    room_no: "Room 101",
                    max_marks: 100,
                    min_marks: 33,
                },
                {
                    subject_name: "Science",
                    subject_code: "SCI101",
                    date: "2026-05-17",
                    start_time: "09:00 AM",
                    duration: 180,
                    room_no: "Room 102",
                    max_marks: 100,
                    min_marks: 33,
                },
                {
                    subject_name: "English",
                    subject_code: "ENG101",
                    date: "2026-05-19",
                    start_time: "09:00 AM",
                    duration: 180,
                    room_no: "Room 103",
                    max_marks: 100,
                    min_marks: 33,
                }
            ],
            print_setting: {
                header_image: null,
                footer_content: null,
            }
        };
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            name: "",
            heading: "",
            title: "",
            exam_name: "",
            school_name: "",
            exam_center: "",
            footer_text: "",
            header_image: "",
            left_logo: "",
            right_logo: "",
            left_sign: "",
            middle_sign: "",
            right_sign: "",
            background_image: "",
            show_name: true,
            show_father_name: true,
            show_mother_name: true,
            show_dob: true,
            show_admission_no: true,
            show_roll_no: true,
            show_address: true,
            show_gender: true,
            show_photo: true,
            show_class: true,
            show_section: true,
            show_exam_number: true,
            is_active: true
        });
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Add Admit Card Form */}
                <div className="lg:col-span-1">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 pb-0 sticky top-6 flex flex-col h-[calc(100vh-120px)]">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <IdCard className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editMode ? t("edit_admit_card") : t("add_admit_card")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("design_admit_card")}</p>
                            </div>
                        </CardHeader>

                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    {t("template_name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. CBSE Admit Card"
                                    className="h-10 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("heading")}</Label>
                                <Input
                                    value={formData.heading}
                                    onChange={(e) => setFormData({...formData, heading: e.target.value})}
                                    className="h-10 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("title")}</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="h-10 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                />
                            </div>

                            {/* Toggles Section */}
                            <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
                                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">{t("display_fields")}</h3>
                                {[
                                    { key: "show_name", label: t("student_name") },
                                    { key: "show_father_name", label: t("father_name") },
                                    { key: "show_dob", label: t("date_of_birth") },
                                    { key: "show_roll_no", label: t("roll_number") },
                                    { key: "show_address", label: t("address") },
                                    { key: "show_photo", label: t("student_photo") }
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between group">
                                        <Label className="text-[11px] font-bold text-gray-600 cursor-pointer group-hover:text-indigo-600 transition-colors">{item.label}</Label>
                                        <Switch
                                            checked={Boolean(formData[item.key])}
                                            onCheckedChange={(val) => setFormData({...formData, [item.key]: val})}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* File Uploads */}
                            <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
                                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">{t("assets_and_media")}</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { key: 'header_image', label: t('header_image') },
                                        { key: 'background_image', label: t('background_image') },
                                        { key: 'left_logo', label: t('left_logo') },
                                        { key: 'right_logo', label: t('right_logo') },
                                        { key: 'left_sign', label: t('left_sign') },
                                        { key: 'middle_sign', label: t('middle_sign') },
                                        { key: 'right_sign', label: t('right_sign') }
                                    ].map((field) => (
                                        <div key={field.key} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-bold text-gray-500 uppercase">{field.label}</Label>
                                                {Boolean(formData[field.key]) && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => handleImageRemove(field.key)}
                                                        className="h-6 text-[9px] text-red-500 hover:text-red-600 hover:bg-red-50 px-2 uppercase"
                                                    >
                                                        {t("remove")}
                                                    </Button>
                                                )}
                                            </div>
                                            {Boolean(formData[field.key]) ? (
                                                <div className="border border-gray-200 rounded-lg p-2 bg-white relative overflow-hidden flex items-center justify-center min-h-[100px]">
                                                    <img 
                                                        src={resolveImageUrl(formData[field.key] as string)} 
                                                        alt={field.label} 
                                                        className="max-h-[120px] max-w-full object-contain" 
                                                    />
                                                </div>
                                            ) : (
                                                <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 transition-all bg-gray-50/20 group relative">
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, field.key)}
                                                        disabled={uploadingField === field.key}
                                                    />
                                                    {uploadingField === field.key ? (
                                                        <Loader2 className="h-6 w-6 text-indigo-500 mb-2 animate-spin" />
                                                    ) : (
                                                        <Upload className="h-6 w-6 text-gray-300 mb-2 group-hover:text-indigo-400 transition-colors" />
                                                    )}
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                        {uploadingField === field.key ? t("uploading") : t("upload_asset")}
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl flex gap-2 justify-end">
                            {editMode && (
                                <Button onClick={resetForm} variant="outline" className="h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-gray-200 px-5">
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={submitting}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white h-9 text-[10px] font-bold uppercase tracking-wider rounded-full px-6 transition-all active:scale-95"
                            >
                                {submitting ? t("saving") : editMode ? t("update_design") : t("save_design")}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Admit Card List */}
                <div className="lg:col-span-3">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 pb-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Contact className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("admit_card_templates")}</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">{totalEntries} {t("templates_configured")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[65px] h-8 text-xs border-gray-200 rounded-lg bg-white">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                        <Columns className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t("search_designs")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="!bg-[#f3f4f6] text-[11px] uppercase font-bold text-gray-600">
                                        <TableRow className="hover:bg-transparent border-gray-50">
                                            <TableHead className="py-4 px-6">{t("certificate_name")}</TableHead>
                                            <TableHead className="py-4 px-6">{t("status")}</TableHead>
                                            <TableHead className="py-4 px-6">{t("assets")}</TableHead>
                                            <TableHead className="py-4 px-6 text-right">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={4} />
                                        ) : templates.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    {t("no_data_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            templates.map((item) => (
                                                <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer group border-b last:border-0 border-gray-50 transition-colors">
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-indigo-600 uppercase tracking-tight">{item.name}</span>
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{t("id")}: #{item.id}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        {item.is_active ? (
                                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-[9px] border border-emerald-100 flex items-center gap-1.5 w-fit">
                                                                <Settings2 className="h-3 w-3" /> {t("active")}
                                                            </span>
                                                        ) : (
                                                            <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full font-bold text-[9px] border border-gray-100 flex items-center gap-1.5 w-fit">
                                                                <Settings2 className="h-3 w-3" /> {t("inactive")}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex gap-2">
                                                            <div className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${item.background_image ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100 opacity-30'}`}>
                                                                <ImageIcon className={`h-4 w-4 ${item.background_image ? 'text-indigo-500' : 'text-gray-400'}`} />
                                                            </div>
                                                            <div className="h-8 w-8 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-center">
                                                                <FileSignature className="h-4 w-4 text-indigo-500" />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button size="icon" variant="ghost" onClick={() => setPreviewTemplate(item)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                onClick={() => setDeleteId(item.id)} 
                                                                disabled={Boolean(item.name && (item.name.toLowerCase().includes('design 1') || item.name.toLowerCase().includes('design 2')))}
                                                                className={`h-8 w-8 rounded-lg shadow-md ${item.name && (item.name.toLowerCase().includes('design 1') || item.name.toLowerCase().includes('design 2')) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-4 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z", { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, totalEntries), total: totalEntries })}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        variant="outline" size="sm" className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] hover:bg-indigo-50 hover:text-indigo-600"
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-md">
                                        {currentPage}
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        variant="outline" size="sm" className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] hover:bg-indigo-50 hover:text-indigo-600"
                                        disabled={templates.length < itemsPerPage}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_admit_card_design")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_admit_card_design_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {t("yes_delete_design")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Preview Modal */}
            <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
                <DialogContent className="w-[95vw] sm:w-[95vw] max-w-[95vw] sm:max-w-[1800px] max-h-[95vh] overflow-auto border-0 p-0 bg-transparent shadow-none" showCloseButton={false}>
                    <div className="bg-white rounded-xl overflow-hidden shadow-2xl relative">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-50">
                            <DialogTitle className="text-lg font-bold text-gray-800 tracking-tight">{t("preview_design")} - <span className="text-indigo-600">{previewTemplate?.name}</span></DialogTitle>
                            <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)} className="h-8 w-8 rounded-full hover:bg-gray-200">
                                <X className="h-4 w-4 text-gray-500" />
                            </Button>
                        </div>
                        <div className="p-4 md:p-8 bg-gray-100 min-h-[500px] overflow-x-auto">
                            {previewTemplate && (
                                <div className="mx-auto w-max">
                                    <div className="bg-white shadow-xl" style={{ width: previewTemplate?.name?.toLowerCase().includes('design 2') ? '1588px' : '794px' }}>
                                        <AdmitCardTemplateLayout data={getMockAdmitCardData(previewTemplate)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
