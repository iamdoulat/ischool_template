"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useImageUrl } from "@/lib/image-url";
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Users,
    MapPin,
    GraduationCap,
    Info,
    ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";

export default function EditAdmissionPage() {
    const getImageUrl = useImageUrl();
    const { id } = useParams();
    const router = useRouter();
    const tt = useTranslateToast();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [admission, setAdmission] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch classes and categories first
            const [classesRes, categoriesRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/student-categories")
            ]);
            
            if (classesRes.data.success) {
                setClasses(classesRes.data.data?.data || classesRes.data.data || []);
            }
            if (categoriesRes.data.success) {
                setCategories(categoriesRes.data.data?.data || categoriesRes.data.data || []);
            }

            // Fetch admission details
            const admissionRes = await api.get(`/online-admissions/${id}`);
            if (admissionRes.data.success) {
                const data = admissionRes.data.data;
                
                // Format date for input field (YYYY-MM-DD)
                if (data.dob) {
                    data.dob = data.dob.split('T')[0];
                }
                if (data.measurement_date) {
                    data.measurement_date = data.measurement_date.split('T')[0];
                }

                setAdmission(data);

                // Fetch sections for this class
                if (data.school_class_id) {
                    const sectionsRes = await api.get(`/academics/sections?school_class_id=${data.school_class_id}&no_paginate=true`);
                    if (sectionsRes.data.success) {
                        setSections(sectionsRes.data.data?.data || sectionsRes.data.data || []);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            tt.error("failed_to_load_admission_details");
        } finally {
            setLoading(false);
        }
    }, [id, tt]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClassChange = async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            if (response.data.success) {
                setSections(response.data.data?.data || response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            
            await api.post(`/online-admissions/${id}`, formData);

            tt.success("admission_record_updated_successfully");
            router.push("/dashboard/student-information/online-admission");
        } catch (error: any) {
            console.error("Update error:", error);
            const message = error.response?.data?.message || "failed_to_save_x";
            tt.toast("error", message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!admission) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <p className="text-xl font-bold text-muted-foreground">{t("admission_not_found")}</p>
                <Button onClick={() => router.back()}>{t("go_back")}</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="space-y-2">
                <Button
                    variant="ghost"
                    className="-ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_list")}
                </Button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("edit_admission_application")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("reference")}: {admission.reference_no}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={() => router.back()} className="flex-1 md:flex-none">
                            {t("cancel")}
                        </Button>
                        <Button
                            form="edit-form"
                            type="submit"
                            variant="gradient"
                            disabled={submitting}
                            className="flex-1 md:flex-none min-w-[120px]"
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {t("save_changes")}
                        </Button>
                    </div>
                </div>
            </div>

            <form id="edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Student Info Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{t("student_information")}</CardTitle>
                                    <CardDescription>{t("update_applicants_personal_academic_details")}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("first_name")} <span className="text-destructive">*</span></label>
                                    <Input name="first_name" defaultValue={admission.first_name} required className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("middle_name")}</label>
                                    <Input name="middle_name" defaultValue={admission.middle_name} className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("last_name")}</label>
                                    <Input name="last_name" defaultValue={admission.last_name} className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("class")} <span className="text-destructive">*</span></label>
                                    <div className="relative">
                                        <select 
                                            name="school_class_id" 
                                            value={admission.school_class_id || ""}
                                            onChange={(e) => {
                                                setAdmission({...admission, school_class_id: e.target.value});
                                                handleClassChange(e.target.value);
                                            }}
                                            required 
                                            className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">{t("select_class")}</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("section")} <span className="text-destructive">*</span></label>
                                    <div className="relative">
                                        <select 
                                            name="section_id" 
                                            value={admission.section_id || ""}
                                            onChange={(e) => setAdmission({...admission, section_id: e.target.value})}
                                            required 
                                            className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">{t("select_section")}</option>
                                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("date_of_birth")} <span className="text-destructive">*</span></label>
                                    <Input 
                                        name="dob" 
                                        type="date" 
                                        defaultValue={admission.dob} 
                                        required 
                                        className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("category")}</label>
                                    <div className="relative">
                                        <select name="category" defaultValue={admission.category || ""} className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                            <option value="">{t("select_category")}</option>
                                            {categories.map((cat: any) => (
                                                <option key={cat.id} value={cat.id.toString()}>{cat.category_name || cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("gender")} <span className="text-destructive">*</span></label>
                                    <div className="relative">
                                        <select name="gender" defaultValue={admission.gender} required className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                            <option value="Male">{t("male")}</option>
                                            <option value="Female">{t("female")}</option>
                                            <option value="Other">{t("other")}</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("mobile_number")} <span className="text-destructive">*</span></label>
                                    <Input name="phone" defaultValue={admission.phone} required className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("email")}</label>
                                    <Input name="email" type="email" defaultValue={admission.email} className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-muted/30">
                                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("student_photo")}</label>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-lg bg-muted/20 border-2 border-dashed border-muted flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                            {admission.student_photo ? (
                                                <img 
                                                    src={getImageUrl(admission.student_photo)} 
                                                    alt="Student" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-12 h-12 text-muted-foreground/30" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Input 
                                            name="student_photo" 
                                            type="file" 
                                            accept="image/*"
                                            className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-primary/90" 
                                        />
                                        <p className="text-[10px] text-muted-foreground font-medium">
                                            {t("max_size_leave_empty_photo")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parent Info Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{t("parent_guardian_detail")}</CardTitle>
                                    <CardDescription>{t("update_details_parents_guardians")}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("father_name")} <span className="text-destructive">*</span></label>
                                    <Input name="father_name" defaultValue={admission.father_name} required className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("father_phone")}</label>
                                    <Input name="father_phone" defaultValue={admission.father_phone} className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("mother_name")}</label>
                                    <Input name="mother_name" defaultValue={admission.mother_name} className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">{t("mother_phone")}</label>
                                    <Input name="mother_phone" defaultValue={admission.mother_phone} className="rounded-lg bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{t("address_information")}</CardTitle>
                                    <CardDescription>{t("update_current_permanent_addresses")}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">{t("current_address")}</label>
                                <textarea 
                                    name="current_address" 
                                    defaultValue={admission.current_address}
                                    className="w-full min-h-[100px] rounded-lg bg-muted/20 border border-muted/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">{t("permanent_address")}</label>
                                <textarea 
                                    name="permanent_address" 
                                    defaultValue={admission.permanent_address}
                                    className="w-full min-h-[100px] rounded-lg bg-muted/20 border border-muted/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Status & Meta */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Form Status Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                {t("application_status")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("form_status")}</label>
                                <div className="relative">
                                    <select name="form_status" defaultValue={admission.form_status} className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        <option value="Submitted">{t("submitted")}</option>
                                        <option value="Paid">{t("paid")}</option>
                                        <option value="Enrolled">{t("enrolled")}</option>
                                        <option value="Rejected">{t("rejected")}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("payment_status")}</label>
                                <div className="relative">
                                    <select name="payment_status" defaultValue={admission.payment_status} className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        <option value="Unpaid">{t("unpaid")}</option>
                                        <option value="Paid">{t("paid")}</option>
                                        <option value="Partial">{t("partial")}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-primary/5 border border-primary/10">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{t("reference_no")}</span>
                                <span className="font-bold">{admission.reference_no}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{t("created_at")}</span>
                                <span className="font-medium">{new Date(admission.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{t("session")}</span>
                                <span className="font-medium text-primary">{admission.academic_session?.session || "N/A"}</span>
                            </div>
                            <div className="pt-4 border-t border-primary/10">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{t("quick_note")}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("updating_academic_info_enrollment_note")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}

// Re-using Th/Td from main page if they were available, but defining them here for self-containment if needed or just use standard tags.
function ChevronDownIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
