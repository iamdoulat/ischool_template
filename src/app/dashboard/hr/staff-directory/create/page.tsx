"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, UserPlus } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import api from "@/lib/api";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

interface Role {
    name: string;
}

interface CommonData {
    id: number;
    name: string;
}

export default function CreateStaffPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [designations, setDesignations] = useState<CommonData[]>([]);
    const [departments, setDepartments] = useState<CommonData[]>([]);
    
    const [formData, setFormData] = useState({
        staff_id: "",
        role: "",
        designation: "",
        department: "",
        first_name: "",
        last_name: "",
        father_name: "",
        mother_name: "",
        email: "",
        gender: "",
        date_of_birth: "",
        date_of_joining: "",
        phone: "",
        emergency_contact: "",
        marital_status: "",
        avatar: "",
        address: "",
        permanent_address: "",
        qualification: "",
        work_experience: "",
        note: "",
        pan_number: "",
        basic_salary: "",
        house_rent: "",
        medical_allowance: "",
        conveyance_allowance: "",
        food_allowance: "",
    });
    const [isAutoStaffId, setIsAutoStaffId] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [grossSalaryInput, setGrossSalaryInput] = useState("");

    const handleFillBreakdown = () => {
        const gross = Number(grossSalaryInput) || 0;
        if (gross > 0) {
            setFormData(prev => ({
                ...prev,
                basic_salary: (gross * 0.634).toFixed(2),
                house_rent: (gross * 0.317).toFixed(2),
                medical_allowance: (gross * 0.015).toFixed(2),
                conveyance_allowance: (gross * 0.009).toFixed(2),
                food_allowance: (gross * 0.025).toFixed(2),
            }));
        }
    };

    useEffect(() => {
        const sum = (Number(formData.basic_salary) || 0) +
            (Number(formData.house_rent) || 0) +
            (Number(formData.medical_allowance) || 0) +
            (Number(formData.conveyance_allowance) || 0) +
            (Number(formData.food_allowance) || 0);

        if (sum > 0) {
            setGrossSalaryInput(sum.toFixed(2));
        }
    }, [formData.basic_salary, formData.house_rent, formData.medical_allowance, formData.conveyance_allowance, formData.food_allowance]);

    useEffect(() => {
        const loadInitialData = async () => {
            setPageLoading(true);
            const user = await fetchCurrentUser();
            if (user && (user.permissions?.includes("human-resource.staff.add") || user.permissions?.includes("all"))) {
                await Promise.all([
                    fetchRoles(),
                    fetchDesignations(),
                    fetchDepartments(),
                    fetchNextStaffId()
                ]);
            } else if (user) {
                toast({
                    title: t("unauthorized"),
                    description: t("no_permission_create_staff"),
                    variant: "destructive",
                });
                router.push("/dashboard/hr/staff-directory");
            }
            setPageLoading(false);
        };
        loadInitialData();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get("/profile");
            if (response.data.status === "Success") {
                return response.data.data;
            }
        } catch (error) {
            console.error("Error fetching current user:", error);
            router.push("/login");
        }
        return null;
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get("/hr/staff-roles");
            if (response.data.status === "Success") {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const fetchDesignations = async () => {
        try {
            const response = await api.get("/hr/designation");
            if (response.data.success) {
                setDesignations(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching designations:", error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/hr/department");
            if (response.data.success) {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    const fetchNextStaffId = async () => {
        try {
            const response = await api.get("/hr/next-staff-id");
            if (response.data.status === "Success") {
                if (response.data.data.staff_id) {
                    setFormData(prev => ({ ...prev, staff_id: response.data.data.staff_id }));
                }
                setIsAutoStaffId(!!response.data.data.auto_staff_id);
            }
        } catch (error) {
            console.error("Error fetching next staff ID:", error);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const generateStaffId = () => {
        fetchNextStaffId();
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.staff_id.trim()) newErrors.staff_id = t("staff_id_required");
        if (!formData.role) newErrors.role = t("role_required");
        if (!formData.first_name.trim()) newErrors.first_name = t("first_name_required");
        if (!formData.email.trim()) {
            newErrors.email = t("email_required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t("invalid_email_format");
        }
        if (!formData.phone.trim()) newErrors.phone = t("phone_required");

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/hr/staff-directory", formData);

            if (response.data.status === "Success") {
                toast({
                    title: t("success"),
                    description: t("staff_created_successfully"),
                });
                router.push("/dashboard/hr/staff-directory");
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast({
                    title: t("error"),
                    description: error.response?.data?.message || t("failed_to_create_staff"),
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const gradientBtn = "bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 transition-all duration-300 border-none rounded-full";

    if (pageLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-gray-50/10">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-400 font-medium">{t("verifying_access")}</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="h-9 w-9 p-0 hover:bg-white/60 rounded-lg shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <UserPlus className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("add_new_staff")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("create_new_staff_record")}</p>
                    </div>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/hr/staff-directory/import')}
                    className={`${gradientBtn} gap-2 h-10 px-6 text-sm font-semibold`}
                >
                    + {t("import_staff")}
                </Button>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                    {t("staff_email_login_info")}
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Basic Information Section */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">{t("basic_information")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Staff ID */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    {t("staff_id")} <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={formData.staff_id}
                                        onChange={(e) => handleInputChange("staff_id", e.target.value)}
                                        placeholder={t("enter_staff_id")}
                                        disabled={isAutoStaffId}
                                        className={`h-11 border-gray-200 pr-12 ${errors.staff_id ? "border-red-500" : ""} ${isAutoStaffId ? "bg-gray-50 cursor-not-allowed" : ""}`}
                                    />
                                    {!isAutoStaffId && (
                                        <button
                                            type="button"
                                            onClick={generateStaffId}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-md transition-colors group"
                                            title="Generate Staff ID"
                                        >
                                            <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-purple-600 group-hover:rotate-180 transition-all duration-300" />
                                        </button>
                                    )}
                                </div>
                                {errors.staff_id && <p className="text-xs text-red-500">{errors.staff_id}</p>}
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    {t("role")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                                    <SelectTrigger className={`h-11 border-gray-200 ${errors.role ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                            </div>

                            {/* Designation */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("designation")}</Label>
                                <Select value={formData.designation} onValueChange={(value) => handleInputChange("designation", value)}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder={t("select_designation")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {designations.map((d) => (
                                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Department */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("department")}</Label>
                                <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder={t("select_department")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* First Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    {t("first_name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.first_name}
                                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                                    placeholder={t("enter_first_name")}
                                    className={`h-11 border-gray-200 ${errors.first_name ? "border-red-500" : ""}`}
                                />
                                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("last_name")}</Label>
                                <Input
                                    value={formData.last_name}
                                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                                    placeholder={t("enter_last_name")}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Father Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Father Name</Label>
                                <Input
                                    value={formData.father_name}
                                    onChange={(e) => handleInputChange("father_name", e.target.value)}
                                    placeholder={t("enter_father_name")}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Mother Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Mother Name</Label>
                                <Input
                                    value={formData.mother_name}
                                    onChange={(e) => handleInputChange("mother_name", e.target.value)}
                                    placeholder={t("enter_mother_name")}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    Email (Login Username) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    placeholder={t("enter_email_address")}
                                    className={`h-11 border-gray-200 ${errors.email ? "border-red-500" : ""}`}
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Gender</Label>
                                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">{t("male")}</SelectItem>
                                        <SelectItem value="Female">{t("female")}</SelectItem>
                                        <SelectItem value="Other">{t("other")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</Label>
                                <DatePicker
                                    value={formData.date_of_birth}
                                    onChange={(val) => handleInputChange("date_of_birth", val)}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Date of Joining */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Date of Joining</Label>
                                <DatePicker
                                    value={formData.date_of_joining}
                                    onChange={(val) => handleInputChange("date_of_joining", val)}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    Phone <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    placeholder={t("enter_phone_number")}
                                    className={`h-11 border-gray-200 ${errors.phone ? "border-red-500" : ""}`}
                                />
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                            </div>

                            {/* Emergency Contact */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Emergency Contact Number</Label>
                                <Input
                                    value={formData.emergency_contact}
                                    onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                                    placeholder={t("enter_emergency_contact")}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Marital Status */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Marital Status</Label>
                                <Select value={formData.marital_status} onValueChange={(value) => handleInputChange("marital_status", value)}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single">{t("single")}</SelectItem>
                                        <SelectItem value="Married">{t("married")}</SelectItem>
                                        <SelectItem value="Divorced">{t("divorced")}</SelectItem>
                                        <SelectItem value="Widowed">{t("widowed")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Photo - Full Width */}
                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Photo</Label>
                                <FileUpload
                                    type="avatar"
                                    accept="image/*"
                                    maxSizeMB={5}
                                    onUploadComplete={(url, path) => {
                                        setFormData(prev => ({ ...prev, avatar: url }));
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">{t("address")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Address</Label>
                                <Textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder={t("enter_current_address")}
                                    className="border-gray-200 min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Permanent Address</Label>
                                <Textarea
                                    value={formData.permanent_address}
                                    onChange={(e) => handleInputChange("permanent_address", e.target.value)}
                                    placeholder={t("enter_permanent_address")}
                                    className="border-gray-200 min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Details Section */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">{t("professional_details")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Qualification</Label>
                                <Input
                                    value={formData.qualification}
                                    onChange={(e) => handleInputChange("qualification", e.target.value)}
                                    placeholder={t("enter_qualification")}
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Work Experience</Label>
                                <Input
                                    value={formData.work_experience}
                                    onChange={(e) => handleInputChange("work_experience", e.target.value)}
                                    placeholder={t("enter_work_experience")}
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    PAN / NID Number
                                </Label>
                                <Input
                                    value={formData.pan_number}
                                    onChange={(e) => handleInputChange("pan_number", e.target.value)}
                                    placeholder={t("enter_pan_nid_number")}
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Note</Label>
                                <Textarea
                                    value={formData.note}
                                    onChange={(e) => handleInputChange("note", e.target.value)}
                                    placeholder={t("enter_additional_notes")}
                                    className="border-gray-200 min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Salary Details Section */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Salary Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Basic Salary</Label>
                                <Input
                                    type="number"
                                    value={formData.basic_salary}
                                    onChange={(e) => handleInputChange("basic_salary", e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">House Rent</Label>
                                <Input
                                    type="number"
                                    value={formData.house_rent}
                                    onChange={(e) => handleInputChange("house_rent", e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Medical Allowance</Label>
                                <Input
                                    type="number"
                                    value={formData.medical_allowance}
                                    onChange={(e) => handleInputChange("medical_allowance", e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Conveyance Allowance</Label>
                                <Input
                                    type="number"
                                    value={formData.conveyance_allowance}
                                    onChange={(e) => handleInputChange("conveyance_allowance", e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Food Allowance</Label>
                                <Input
                                    type="number"
                                    value={formData.food_allowance}
                                    onChange={(e) => handleInputChange("food_allowance", e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase text-indigo-600">Gross Salary (Auto-fill)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={grossSalaryInput}
                                        onChange={(e) => setGrossSalaryInput(e.target.value)}
                                        placeholder="0.00"
                                        className="h-11 border-indigo-200 bg-indigo-50/50 font-bold text-indigo-700 flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleFillBreakdown}
                                        className="h-11 bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shrink-0 px-6"
                                    >
                                        $ Fill Breakdown
                                    </Button>
                                </div>
                                <p className="text-[10px] text-gray-400">Enter amount and click Fill to auto-calculate breakdown</p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="px-8 h-11 rounded-lg border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`${gradientBtn} px-8 h-11 text-sm font-semibold`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating Staff...
                                </>
                            ) : (
                                <>+ {t("insert_staff")}</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
