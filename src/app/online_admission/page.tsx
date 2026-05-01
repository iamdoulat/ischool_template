"use client";

import React, { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    GraduationCap, User, Users, Home, Phone, Calendar, Info,
    CheckCircle2, ChevronRight, ChevronLeft, Camera, Upload,
    CreditCard, ShieldCheck, Sparkles, Loader2, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Types
interface OnlineAdmissionField {
    id: number;
    name: string;
    field_name: string;
    is_active: boolean;
}

interface OnlineAdmissionSetting {
    online_admission: boolean;
    instructions: string;
    terms_conditions: string;
}

interface AcademicClass {
    id: number;
    name: string;
    sections?: AcademicSection[];
}

interface AcademicSection {
    id: number;
    name: string;
    school_class_id: number;
}

const STEPS = [
    { id: "instructions", title: "Instructions", icon: Info },
    { id: "academic", title: "Academic", icon: GraduationCap },
    { id: "student", title: "Student", icon: User },
    { id: "parents", title: "Parents", icon: Users },
    { id: "upload", title: "Photo", icon: Camera },
    { id: "payment", title: "Payment", icon: CreditCard },
];

export default function OnlineAdmissionPage() {
    // State
    const [currentStep, setCurrentStep] = useState(0);
    const [settings, setSettings] = useState<OnlineAdmissionSetting | null>(null);
    const [fields, setFields] = useState<OnlineAdmissionField[]>([]);
    const [classes, setClasses] = useState<AcademicClass[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [errors, setErrors] = useState<any>({});
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Modal states for header functionalities
    const [showHelpCenter, setShowHelpCenter] = useState(false);
    const [showFeeStructure, setShowFeeStructure] = useState(false);
    const [showTrackId, setShowTrackId] = useState(false);
    const [trackIdInput, setTrackIdInput] = useState("");
    const [trackResult, setTrackResult] = useState<any>(null);
    const [tracking, setTracking] = useState(false);

    const [formData, setFormData] = useState<any>({
        first_name: "",
        middle_name: "",
        last_name: "",
        school_class_id: "",
        section_id: "",
        dob: "",
        gender: "",
        phone: "",
        father_name: "",
        father_phone: "",
        father_occupation: "",
        mother_name: "",
        mother_phone: "",
        mother_occupation: "",
        guardian_name: "",
        guardian_relation: "",
        guardian_phone: "",
        guardian_email: "",
        guardian_address: "",
        current_address: "",
        permanent_address: "",
        email: "",
        category: "",
        religion: "",
        caste: "",
        blood_group: "",
        academic_session_id: "",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, classesRes, categoriesRes, sessionsRes] = await Promise.all([
                    api.get("/system-setting/online-admission"),
                    api.get("/academics/classes?no_paginate=true"),
                    api.get("/student-categories"),
                    api.get("/system-setting/sessions"),
                ]);

                setSettings(settingsRes.data.data.settings);
                setFields(settingsRes.data.data.fields);
                setClasses(classesRes.data.data?.data || classesRes.data.data || []);
                setCategories(categoriesRes.data.data?.data || categoriesRes.data.data || []);
                setSessions(sessionsRes.data.data || []);
            } catch (error) {
                console.error("Failed to fetch admission data:", error);
                toast({
                    title: "Connection Error",
                    description: "Failed to load admission settings. Please try again later.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const isFieldActive = (fieldName: string) => {
        return fields.find((f) => f.field_name === fieldName)?.is_active ?? false;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev: any) => {
            const next = { ...prev, [name]: value };
            if (name === "school_class_id") {
                next.section_id = "";
            }
            return next;
        });
        
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please upload an image smaller than 2MB.",
                    variant: "destructive",
                });
                return;
            }
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => {
        // Simple validation before moving to next step
        if (currentStep === 1) { // Academic
            if (!formData.academic_session_id || !formData.school_class_id || !formData.section_id) {
                toast({ title: "Required", description: "Please select Session, Class, and Section", variant: "destructive" });
                return;
            }
        }
        if (currentStep === 2) { // Student
            if (!formData.first_name || !formData.dob || !formData.gender || !formData.phone) {
                toast({ title: "Required", description: "Please fill all mandatory student fields", variant: "destructive" });
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== "" && formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });
            if (photoFile) {
                data.append('student_photo', photoFile);
            }

            // Debug: log what's being sent
            console.log("=== FormData being submitted ===");
            for (const [key, value] of data.entries()) {
                console.log(`  ${key}:`, value);
            }

            const response = await api.post("/online-admissions/apply", data);
            
            setSuccessData(response.data.data);
            setCurrentStep(STEPS.length - 1); // Move to payment step
            toast({
                title: "Application Submitted!",
                description: "Your reference number is " + response.data.data.reference_no,
            });
        } catch (error: any) {
            if (error.response?.status === 422) {
                console.error("=== Full 422 Response ===", JSON.stringify(error.response.data));
                const validationErrors = error.response.data.errors || {};
                console.error("=== Validation Errors ===", validationErrors);
                setErrors(validationErrors);
                
                // Build a readable error summary
                const errorFields = Object.keys(validationErrors).join(", ");
                toast({
                    title: "Validation Error",
                    description: `Please fix: ${errorFields}`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Submission Failed",
                    description: error.response?.data?.message || error.message || "Something went wrong. Please try again.",
                    variant: "destructive",
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handlePayment = async () => {
        setPaymentProcessing(true);
        try {
            await api.post(`/online-admissions/${successData.id}/process-payment`, {
                amount: 500, // Mock amount
                transaction_id: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase()
            });
            
            setShowPaymentConfirm(false);
            setSuccessData({ ...successData, payment_status: "Paid" });
            toast({
                title: "Payment Successful",
                description: "Your admission fee has been received.",
            });
        } catch (error) {
            toast({
                title: "Payment Failed",
                description: "Transaction could not be processed.",
                variant: "destructive",
            });
        } finally {
            setPaymentProcessing(false);
        }
    };

    const handleTrackId = async () => {
        if (!trackIdInput.trim()) {
            toast({
                title: "Reference ID Required",
                description: "Please enter your application reference ID.",
                variant: "destructive",
            });
            return;
        }

        setTracking(true);
        try {
            // Mock tracking - in real app, this would call an API
            const response = await api.get(`/online-admissions/track/${trackIdInput}`);

            if (response.data.success) {
                setTrackResult(response.data.data);
            } else {
                setTrackResult(null);
                toast({
                    title: "Application Not Found",
                    description: "No application found with the provided reference ID.",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            setTrackResult(null);
            toast({
                title: "Tracking Failed",
                description: "Unable to track application. Please try again.",
                variant: "destructive",
            });
        } finally {
            setTracking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="mt-4 text-slate-500 font-medium animate-pulse">Initializing Admission Portal...</div>
                </div>
            </div>
        );
    }

    if (!settings?.online_admission) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
                <Card className="max-w-md w-full border-none shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] rounded-3xl overflow-hidden">
                    <div className="h-2 bg-amber-500" />
                    <CardHeader className="text-center pb-8 pt-10">
                        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                            <Info className="w-10 h-10" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight">Admission Closed</CardTitle>
                        <CardDescription className="text-base mt-2 px-4">The online admission window is currently closed for the 2026 session.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 pb-10 px-10">
                        <Button className="h-12 rounded-xl bg-slate-900 hover:bg-black" onClick={() => window.location.href = "/"}>Back to Home</Button>
                        <p className="text-xs text-center text-slate-400">Please contact our helpdesk at +1 234 567 890</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const selectedClass = classes.find(c => c.id === parseInt(formData.school_class_id));
    const availableSections = selectedClass?.sections || [];

    const renderStep = () => {
        switch (currentStep) {
            case 0: // Instructions
                return (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-3xl p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                                    <Info className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Important Instructions</h2>
                            </div>
                            <div 
                                className="prose prose-indigo max-w-none dark:prose-invert prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-li:text-slate-600 dark:prose-li:text-slate-400" 
                                dangerouslySetInnerHTML={{ __html: settings.instructions }} 
                            />
                        </div>
                        
                        <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-emerald-900 dark:text-emerald-400">Secure Application</p>
                                <p className="text-sm text-emerald-700/80 dark:text-emerald-400/60">Your data is encrypted and protected. All uploaded documents are stored securely.</p>
                            </div>
                        </div>
                    </motion.div>
                );

            case 1: // Academic
                return (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Session Year <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val) => handleSelectChange("academic_session_id", val)} value={formData.academic_session_id}>
                                <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500 text-lg font-medium bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Which session?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {sessions.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id.toString()} className="h-12 rounded-lg">{s.session}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Select Class <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val) => handleSelectChange("school_class_id", val)} value={formData.school_class_id}>
                                <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500 text-lg font-medium bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Which class are you applying for?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()} className="h-12 rounded-lg">{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Select Section <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val) => handleSelectChange("section_id", val)} value={formData.section_id} disabled={!formData.school_class_id}>
                                <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500 text-lg font-medium bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Choose a section" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {availableSections.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id.toString()} className="h-12 rounded-lg">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </motion.div>
                );

            case 2: // Student Details
                return (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">First Name *</Label>
                            <Input name="first_name" onChange={handleInputChange} value={formData.first_name} className="h-12 rounded-xl border-slate-200 dark:border-slate-800" placeholder="John" />
                            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Middle Name</Label>
                            <Input name="middle_name" onChange={handleInputChange} value={formData.middle_name} className="h-12 rounded-xl border-slate-200 dark:border-slate-800" placeholder="Optional" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Last Name</Label>
                            <Input name="last_name" onChange={handleInputChange} value={formData.last_name} className="h-12 rounded-xl border-slate-200 dark:border-slate-800" placeholder="Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Date of Birth *</Label>
                            <Input type="date" name="dob" onChange={handleInputChange} value={formData.dob} className="h-12 rounded-xl border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Gender *</Label>
                            <Select onValueChange={(val) => handleSelectChange("gender", val)} value={formData.gender}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Mobile Number *</Label>
                            <Input name="phone" onChange={handleInputChange} value={formData.phone} className="h-12 rounded-xl border-slate-200 dark:border-slate-800" placeholder="10-digit number" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Email Address</Label>
                            <Input name="email" type="email" onChange={handleInputChange} value={formData.email} className="h-12 rounded-xl border-slate-200 dark:border-slate-800" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Category</Label>
                            <Select onValueChange={(val) => handleSelectChange("category", val)} value={formData.category}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.category_name || category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase">Blood Group</Label>
                            <Select onValueChange={(val) => handleSelectChange("blood_group", val)} value={formData.blood_group}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </motion.div>
                );

            case 3: // Parents
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase">Father Name *</Label>
                                <Input name="father_name" onChange={handleInputChange} value={formData.father_name} className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase">Father Phone</Label>
                                <Input name="father_phone" onChange={handleInputChange} value={formData.father_phone} className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase">Father Occupation</Label>
                                <Input name="father_occupation" onChange={handleInputChange} value={formData.father_occupation} className="h-12 rounded-xl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase">Mother Name</Label>
                                <Input name="mother_name" onChange={handleInputChange} value={formData.mother_name} className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase">Mother Phone</Label>
                                <Input name="mother_phone" onChange={handleInputChange} value={formData.mother_phone} className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase">Mother Occupation</Label>
                                <Input name="mother_occupation" onChange={handleInputChange} value={formData.mother_occupation} className="h-12 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-widest text-indigo-600">Residential Address</Label>
                            <Textarea name="current_address" onChange={handleInputChange} value={formData.current_address} className="min-h-[100px] rounded-2xl resize-none" placeholder="Enter full address" />
                        </div>
                    </motion.div>
                );

            case 4: // Photo Upload
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center space-y-8 py-4">
                        <div className="relative group">
                            <div className={cn(
                                "w-64 h-64 rounded-3xl border-4 border-dashed flex items-center justify-center overflow-hidden transition-all duration-500",
                                photoPreview ? "border-indigo-500" : "border-slate-200 dark:border-slate-800 group-hover:border-indigo-400"
                            )}>
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-6">
                                        <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-sm text-slate-400 font-medium">Click to upload student photo</p>
                                    </div>
                                )}
                            </div>
                            
                            <Button 
                                variant="secondary" 
                                size="icon" 
                                className="absolute -bottom-4 -right-4 h-12 w-12 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-transform bg-indigo-600 text-white hover:bg-indigo-700"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-5 h-5" />
                            </Button>
                        </div>
                        
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        
                        <div className="text-center space-y-2 max-w-sm">
                            <p className="font-bold text-slate-700 dark:text-slate-300">Supported formats: JPG, PNG</p>
                            <p className="text-xs text-slate-400 leading-relaxed">Please ensure the photo is clear, front-facing, and has a neutral background. Max size: 2MB.</p>
                        </div>
                        
                        {photoPreview && (
                            <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}>
                                Remove and try another
                            </Button>
                        )}
                    </motion.div>
                );

            case 5: // Payment & Success
                if (!successData) {
                    return (
                        <div className="text-center py-20 space-y-6">
                            <Sparkles className="w-16 h-16 text-indigo-500 mx-auto animate-pulse" />
                            <h2 className="text-2xl font-black">Almost There!</h2>
                            <p className="text-slate-500">Please review your information before submitting the application.</p>
                            <Button 
                                size="lg" 
                                className="h-16 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xl font-bold shadow-2xl shadow-indigo-200 dark:shadow-none"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="mr-2 animate-spin" /> : "Confirm & Submit"}
                            </Button>
                        </div>
                    );
                }

                return (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                            <div className={cn("h-3", successData.payment_status === "Paid" ? "bg-emerald-500" : "bg-indigo-600")} />
                            <CardContent className="pt-12 pb-12 text-center space-y-8">
                                <div className={cn(
                                    "w-24 h-24 rounded-full flex items-center justify-center mx-auto scale-110 shadow-lg",
                                    successData.payment_status === "Paid" ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                                )}>
                                    {successData.payment_status === "Paid" ? <CheckCircle2 className="w-14 h-14" /> : <ShieldCheck className="w-14 h-14" />}
                                </div>
                                
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-black tracking-tight">
                                        {successData.payment_status === "Paid" ? "Application Completed!" : "Application Submitted!"}
                                    </h1>
                                    <p className="text-slate-500 text-lg">Your reference number is securely generated.</p>
                                </div>

                                <div className="max-w-md mx-auto p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Registration ID</p>
                                    <p className="text-5xl font-mono font-black text-indigo-600 tracking-tighter">{successData.reference_no}</p>
                                </div>

                                {successData.payment_status !== "Paid" ? (
                                    <div className="space-y-6 pt-4">
                                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-6 rounded-2xl flex items-center gap-4 text-left max-w-xl mx-auto">
                                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-amber-500"><CreditCard className="w-6 h-6" /></div>
                                            <div>
                                                <p className="font-bold text-amber-900 dark:text-amber-400 text-lg">Admission Fee Required</p>
                                                <p className="text-sm text-amber-800/70 dark:text-amber-400/60 font-medium">To complete the enrollment process, a processing fee of $500.00 needs to be paid.</p>
                                            </div>
                                        </div>
                                        <Button 
                                            size="lg" 
                                            className="h-16 px-12 rounded-2xl bg-slate-900 hover:bg-black text-white text-xl font-bold shadow-2xl transition-transform hover:scale-105"
                                            onClick={() => setShowPaymentConfirm(true)}
                                        >
                                            Proceed to Payment
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button size="lg" className="rounded-xl h-14 px-10 bg-indigo-600" onClick={() => window.location.reload()}>Submit New Application</Button>
                                        <Button variant="outline" size="lg" className="rounded-xl h-14 px-10" onClick={() => window.location.href = "/"}>Back to Homepage</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Nav Header */}
            <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-900 px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight leading-none">iSchool</h1>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Admission Portal 2026</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
                    <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => setShowHelpCenter(true)}>Help Center</span>
                    <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => setShowFeeStructure(true)}>Fee Structure</span>
                    <Button variant="outline" className="rounded-full h-10 px-6 font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setShowTrackId(true)}>Track ID</Button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Sidebar Navigation */}
                    <aside className="lg:col-span-3 space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Application Progress</h2>
                            <nav className="space-y-2">
                                {STEPS.map((step, idx) => (
                                    <div 
                                        key={step.id} 
                                        className={cn(
                                            "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                                            currentStep === idx 
                                                ? "bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none text-indigo-600 scale-105" 
                                                : idx < currentStep 
                                                    ? "text-emerald-500 opacity-60" 
                                                    : "text-slate-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                            currentStep === idx 
                                                ? "bg-indigo-600 text-white rotate-6" 
                                                : idx < currentStep 
                                                    ? "bg-emerald-100 text-emerald-600" 
                                                    : "bg-slate-100 dark:bg-slate-800 group-hover:scale-110"
                                        )}>
                                            {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                        </div>
                                        <span className="font-bold tracking-tight">{step.title}</span>
                                    </div>
                                ))}
                            </nav>
                        </div>

                        <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/40 transition-all duration-700" />
                            <h3 className="font-bold mb-2 relative z-10">Need Assistance?</h3>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed relative z-10">Our admission team is here to help you with any queries regarding the process.</p>
                            <Button size="sm" variant="secondary" className="w-full rounded-xl bg-white/10 hover:bg-white/20 border-white/10 text-white relative z-10">Chat with us</Button>
                        </div>
                    </aside>

                    {/* Form Area */}
                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-10"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-indigo-600 font-bold uppercase tracking-widest text-xs">
                                        <span className="px-2 py-0.5 bg-indigo-100 rounded-md">Step {currentStep + 1} of {STEPS.length}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>{STEPS[currentStep].title}</span>
                                    </div>
                                    <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                        {STEPS[currentStep].title === "Instructions" ? "Getting Started" : 
                                         STEPS[currentStep].title === "Payment" ? "Secure Checkout" : 
                                         STEPS[currentStep].title + " Details"}
                                    </h1>
                                </div>

                                <div className="min-h-[400px]">
                                    {renderStep()}
                                </div>

                                {/* Navigation Buttons */}
                                {!successData && (
                                    <div className="pt-12 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center">
                                        <Button 
                                            variant="ghost" 
                                            size="lg" 
                                            className="h-14 px-8 rounded-2xl font-bold text-slate-400 hover:text-slate-900 transition-colors"
                                            onClick={prevStep}
                                            disabled={currentStep === 0 || submitting}
                                        >
                                            <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                        </Button>
                                        
                                        {currentStep < STEPS.length - 2 ? (
                                            <Button 
                                                size="lg" 
                                                className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-xs"
                                                onClick={nextStep}
                                            >
                                                Next Step <ChevronRight className="ml-2 w-5 h-5" />
                                            </Button>
                                        ) : currentStep === STEPS.length - 2 ? (
                                            <Button 
                                                size="lg" 
                                                className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-xs"
                                                onClick={handleSubmit}
                                                disabled={submitting}
                                            >
                                                {submitting ? "Processing..." : "Complete Application"} <CheckCircle2 className="ml-2 w-5 h-5" />
                                            </Button>
                                        ) : null}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Payment Confirmation Dialog */}
            <Dialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="h-2 bg-indigo-600" />
                    <div className="p-10 space-y-6">
                        <DialogHeader>
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                                <CreditCard className="w-8 h-8" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Confirm Payment</DialogTitle>
                            <DialogDescription className="text-base font-medium">
                                You are about to pay <span className="text-indigo-600 font-black">$500.00</span> for the admission processing fee.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between text-sm py-3 border-b border-slate-100">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Reference</span>
                                <span className="font-bold text-slate-900">{successData?.reference_no}</span>
                            </div>
                            <div className="flex justify-between text-sm py-3 border-b border-slate-100">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Fee Type</span>
                                <span className="font-bold text-slate-900">Application Fee</span>
                            </div>
                            <div className="flex justify-between text-lg py-4">
                                <span className="font-black text-slate-900">Total Payable</span>
                                <span className="font-black text-indigo-600">$500.00</span>
                            </div>
                        </div>
                        <DialogFooter className="gap-3 sm:flex-col pt-4">
                            <Button 
                                className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg shadow-xl shadow-indigo-100 w-full"
                                onClick={handlePayment}
                                disabled={paymentProcessing}
                            >
                                {paymentProcessing ? <Loader2 className="animate-spin mr-2" /> : "Pay Now"}
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="h-12 rounded-2xl font-bold text-slate-400 w-full"
                                onClick={() => setShowPaymentConfirm(false)}
                                disabled={paymentProcessing}
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Help Center Modal */}
            <Dialog open={showHelpCenter} onOpenChange={setShowHelpCenter}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Info className="w-5 h-5 text-indigo-600" />
                            </div>
                            Help Center
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Find answers to frequently asked questions and get help with your admission process.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Admission Process</h3>
                                <div className="space-y-3">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">How to apply?</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Fill out all required fields in the application form and upload your photo. Pay the application fee to complete submission.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">What documents do I need?</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Recent passport-size photo and basic student information. Additional documents may be required during enrollment.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">How long does processing take?</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Applications are typically processed within 3-5 business days. You&apos;ll receive email updates on your application status.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Technical Support</h3>
                                <div className="space-y-3">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Having trouble uploading photo?</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Ensure your photo is under 2MB and in JPG/PNG format. Clear your browser cache if issues persist.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Form not submitting?</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Check all required fields are filled. Ensure you have a stable internet connection.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Payment issues?</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Contact our support team at +1 234 567 890 or email admissions@ischool.com for payment assistance.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
                            <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-400 mb-3">Still need help?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-indigo-600" />
                                    <span className="text-slate-700 dark:text-slate-300">+1 234 567 890</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                    <span className="text-slate-700 dark:text-slate-300">admissions@ischool.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-indigo-600" />
                                    <span className="text-slate-700 dark:text-slate-300">Mon-Fri 9AM-6PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Fee Structure Modal */}
            <Dialog open={showFeeStructure} onOpenChange={setShowFeeStructure}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-green-600" />
                            </div>
                            Fee Structure
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Complete breakdown of admission and tuition fees for the 2026 academic year.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Application Fee</h3>
                                    <span className="text-2xl font-black text-green-600">$500.00</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">One-time non-refundable fee for processing your admission application.</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span>Secure online payment</span>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Annual Tuition Fee</h3>
                                    <span className="text-2xl font-black text-indigo-600">$2,500.00</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Yearly tuition fee payable at the beginning of each academic year.</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span>Due on enrollment</span>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Development Fee</h3>
                                    <span className="text-2xl font-black text-blue-600">$300.00</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Annual fee for school development and maintenance activities.</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span>Included in tuition</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
                            <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-400 mb-3">Payment Information</h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-slate-700 dark:text-slate-300"><strong>Payment Methods:</strong> Credit Card, Debit Card, Net Banking, UPI</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong>Refund Policy:</strong> Application fee is non-refundable. Tuition fees are refundable per school policy.</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong>Due Dates:</strong> Application fee due immediately. Tuition fee due within 30 days of enrollment.</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Track ID Modal */}
            <Dialog open={showTrackId} onOpenChange={setShowTrackId}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-black">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Search className="w-5 h-5 text-amber-600" />
                            </div>
                            Track Application
                        </DialogTitle>
                        <DialogDescription>
                            Enter your application reference ID to check the status of your admission application.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Reference ID</Label>
                            <Input
                                placeholder="Enter your reference ID (e.g., ADM2026001)"
                                value={trackIdInput}
                                onChange={(e) => setTrackIdInput(e.target.value)}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <Button
                            onClick={handleTrackId}
                            disabled={tracking || !trackIdInput.trim()}
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                        >
                            {tracking ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Tracking...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Track Application
                                </>
                            )}
                        </Button>

                        {trackResult && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <h3 className="font-bold text-green-900 dark:text-green-400">Application Found</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Reference ID:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{trackResult.reference_no}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Status:</span>
                                        <span className={cn(
                                            "font-semibold px-2 py-0.5 rounded-full text-xs",
                                            trackResult.form_status === "Submitted" ? "bg-blue-100 text-blue-700" :
                                            trackResult.form_status === "Enrolled" ? "bg-green-100 text-green-700" :
                                            "bg-yellow-100 text-yellow-700"
                                        )}>
                                            {trackResult.form_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">Payment:</span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-semibold px-2 py-0.5 rounded-full text-xs",
                                                trackResult.payment_status === "Paid" ? "bg-green-100 text-green-700" :
                                                "bg-red-100 text-red-700"
                                            )}>
                                                {trackResult.payment_status}
                                            </span>
                                            {trackResult.payment_status !== "Paid" && (
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                                                    onClick={() => {
                                                        setSuccessData(trackResult);
                                                        setShowTrackId(false);
                                                        setShowPaymentConfirm(true);
                                                    }}
                                                >
                                                    <CreditCard className="w-3 h-3 mr-1" />
                                                    Pay Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <footer className="bg-white dark:bg-slate-950 py-16 border-t border-slate-100 dark:border-slate-900 text-center">
                <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-6">
                    <div className="font-black text-indigo-600/30 uppercase tracking-[0.5em] text-xs">iSchool Enterprise 2026</div>
                    <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                        &copy; {new Date().getFullYear()} iSchool Management System. All rights reserved. 
                        Admission processes are subject to school policies and local regulations.
                    </p>
                    <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors">Terms of Service</span>
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors">Contact Support</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
