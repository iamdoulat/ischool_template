"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function EditAdmissionPage() {
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();

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
            toast("error", "Failed to load admission details.");
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

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
            
            // Log for debugging data collection
            console.log("Submitting Section ID:", formData.get("section_id"));
            console.log("Submitting DOB:", formData.get("dob"));

            await api.post(`/online-admissions/${id}`, formData);
            
            toast("success", "Admission record updated successfully.");
            router.push("/dashboard/student-information/online-admission");
        } catch (error: any) {
            console.error("Update error:", error);
            toast("error", error.response?.data?.message || "Failed to update record.");
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
                <p className="text-xl font-bold text-muted-foreground">Admission not found.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Button 
                        variant="ghost" 
                        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Edit Admission Application
                    </h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        Reference: <Badge variant="outline" className="font-bold border-primary/20 text-primary">{admission.reference_no}</Badge>
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => router.back()} className="flex-1 md:flex-none">
                        Cancel
                    </Button>
                    <Button 
                        form="edit-form"
                        type="submit" 
                        variant="gradient" 
                        disabled={submitting}
                        className="flex-1 md:flex-none min-w-[120px]"
                    >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
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
                                    <CardTitle className="text-lg">Student Information</CardTitle>
                                    <CardDescription>Update applicant's personal and academic details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">First Name <span className="text-destructive">*</span></label>
                                    <Input name="first_name" defaultValue={admission.first_name} required className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Middle Name</label>
                                    <Input name="middle_name" defaultValue={admission.middle_name} className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Last Name</label>
                                    <Input name="last_name" defaultValue={admission.last_name} className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Class <span className="text-destructive">*</span></label>
                                    <div className="relative">
                                        <select 
                                            name="school_class_id" 
                                            value={admission.school_class_id || ""}
                                            onChange={(e) => {
                                                setAdmission({...admission, school_class_id: e.target.value});
                                                handleClassChange(e.target.value);
                                            }}
                                            required 
                                            className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Section <span className="text-destructive">*</span></label>
                                    <div className="relative">
                                        <select 
                                            name="section_id" 
                                            value={admission.section_id || ""}
                                            onChange={(e) => setAdmission({...admission, section_id: e.target.value})}
                                            required 
                                            className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Section</option>
                                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Date of Birth <span className="text-destructive">*</span></label>
                                    <Input 
                                        name="dob" 
                                        type="date" 
                                        defaultValue={admission.dob} 
                                        required 
                                        className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Category</label>
                                    <div className="relative">
                                        <select name="category" defaultValue={admission.category || ""} className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                            <option value="">Select Category</option>
                                            {categories.map((cat: any) => (
                                                <option key={cat.id} value={cat.id.toString()}>{cat.category_name || cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Gender <span className="text-destructive">*</span></label>
                                    <div className="relative">
                                        <select name="gender" defaultValue={admission.gender} required className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Mobile Number <span className="text-destructive">*</span></label>
                                    <Input name="phone" defaultValue={admission.phone} required className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Email</label>
                                    <Input name="email" type="email" defaultValue={admission.email} className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-muted/30">
                                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Student Photo</label>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-2xl bg-muted/20 border-2 border-dashed border-muted flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                            {admission.student_photo ? (
                                                <img 
                                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${admission.student_photo}`} 
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
                                            className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-primary/90" 
                                        />
                                        <p className="text-[10px] text-muted-foreground font-medium">
                                            Max size: 2MB. Format: JPG, PNG. Leave empty to keep the current photo.
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
                                    <CardTitle className="text-lg">Parent / Guardian Information</CardTitle>
                                    <CardDescription>Update details of the student's parents or guardians</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Father Name <span className="text-destructive">*</span></label>
                                    <Input name="father_name" defaultValue={admission.father_name} required className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Father Phone</label>
                                    <Input name="father_phone" defaultValue={admission.father_phone} className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Mother Name</label>
                                    <Input name="mother_name" defaultValue={admission.mother_name} className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Mother Phone</label>
                                    <Input name="mother_phone" defaultValue={admission.mother_phone} className="rounded-xl bg-muted/20 border-muted/50 focus:bg-background transition-all" />
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
                                    <CardTitle className="text-lg">Address Information</CardTitle>
                                    <CardDescription>Update current and permanent addresses</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Current Address</label>
                                <textarea 
                                    name="current_address" 
                                    defaultValue={admission.current_address}
                                    className="w-full min-h-[100px] rounded-xl bg-muted/20 border border-muted/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Permanent Address</label>
                                <textarea 
                                    name="permanent_address" 
                                    defaultValue={admission.permanent_address}
                                    className="w-full min-h-[100px] rounded-xl bg-muted/20 border border-muted/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
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
                                Application Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Form Status</label>
                                <div className="relative">
                                    <select name="form_status" defaultValue={admission.form_status} className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        <option value="Submitted">Submitted</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Enrolled">Enrolled</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Payment Status</label>
                                <div className="relative">
                                    <select name="payment_status" defaultValue={admission.payment_status} className="w-full h-11 px-4 py-2 bg-muted/20 border border-muted/50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Partial">Partial</option>
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
                                <span className="text-muted-foreground">Reference No</span>
                                <span className="font-bold">{admission.reference_no}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Created At</span>
                                <span className="font-medium">{new Date(admission.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Session</span>
                                <span className="font-medium text-primary">{admission.academic_session?.session || "N/A"}</span>
                            </div>
                            <div className="pt-4 border-t border-primary/10">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Quick Note</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Updating academic information (Class/Section) will affect the enrollment process. Ensure the correct class and section are selected before enrolling.
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
