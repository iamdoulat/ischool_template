"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Save, Lock, ShieldCheck, UserCog } from "lucide-react";
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

export default function EditStaffPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { t } = useTranslation();
    const id = params.id;
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        active: true,
        basic_salary: "",
        house_rent: "",
        medical_allowance: "",
        conveyance_allowance: "",
        food_allowance: "",
    });
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
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
        const loadData = async () => {
            setLoading(true);
            const user = await fetchCurrentUser();
            if (user && (user.permissions?.includes("human-resource.staff.edit") || user.permissions?.includes("all") || user.staff_id === id)) {
                setCurrentUser(user);
                await Promise.all([
                    fetchRoles(),
                    fetchDesignations(),
                    fetchDepartments(),
                    fetchStaffDetails()
                ]);
            } else if (user) {
                toast({
                    title: t("unauthorized"),
                    description: t("no_permission_edit_staff"),
                    variant: "destructive",
                });
                router.push("/dashboard/hr/staff-directory");
            }
            setLoading(false);
        };
        loadData();
    }, [id]);

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

    const fetchStaffDetails = async () => {
        try {
            const response = await api.get(`/hr/staff-directory/${id}`);
            if (response.data.status === "Success") {
                const staff = response.data.data;
                const nameParts = staff.name ? staff.name.split(" ") : ["", ""];
                const firstName = staff.first_name || nameParts[0] || "";
                const lastName = staff.last_name || nameParts.slice(1).join(" ") || "";

                setFormData({
                    staff_id: staff.staff_id || "",
                    role: staff.role || "",
                    designation: staff.designation || "",
                    department: staff.department || "",
                    first_name: firstName,
                    last_name: lastName,
                    father_name: staff.father_name || "",
                    mother_name: staff.mother_name || "",
                    email: staff.email || "",
                    gender: staff.gender || "",
                    date_of_birth: staff.date_of_birth ? staff.date_of_birth.split("T")[0] : "",
                    date_of_joining: staff.date_of_joining ? staff.date_of_joining.split("T")[0] : "",
                    phone: staff.phone || "",
                    emergency_contact: staff.emergency_contact || "",
                    marital_status: staff.marital_status || "",
                    avatar: staff.avatar || "",
                    address: staff.address || "",
                    permanent_address: staff.permanent_address || "",
                    qualification: staff.qualification || "",
                    work_experience: staff.work_experience || "",
                    note: staff.note || "",
                    pan_number: staff.pan_number || "",
                    active: staff.active !== undefined ? !!staff.active : true,
                    basic_salary: staff.basic_salary || "",
                    house_rent: staff.house_rent || "",
                    medical_allowance: staff.medical_allowance || "",
                    conveyance_allowance: staff.conveyance_allowance || "",
                    food_allowance: staff.food_allowance || "",
                });

                const g = (Number(staff.basic_salary) || 0) + 
                          (Number(staff.house_rent) || 0) + 
                          (Number(staff.medical_allowance) || 0) + 
                          (Number(staff.conveyance_allowance) || 0) + 
                          (Number(staff.food_allowance) || 0);
                if (g > 0) setGrossSalaryInput(String(g));
            }
        } catch (error: any) {
            console.error("Error fetching staff details:", error);
            if (error.response?.status === 404) {
                toast({
                    title: t("not_found"),
                    description: t("staff_not_found"),
                    variant: "destructive",
                });
                router.push("/dashboard/hr/staff-directory");
            } else {
                toast({
                    title: t("error"),
                    description: t("failed_to_load_staff_details"),
                    variant: "destructive",
                });
            }
        }
    };

    const handleInputChange = (field: string, value: any) => {
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
        const prefix = "STF";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const staffId = `${prefix}${timestamp}${random}`;
        setFormData(prev => ({ ...prev, staff_id: staffId }));
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

        setIsSubmitting(true);
        try {
            const response = await api.put(`/hr/staff-directory/${id}`, formData);

            if (response.data.status === "Success") {
                toast({
                    title: t("success"),
                    description: t("staff_updated_successfully"),
                });
                router.push("/dashboard/hr/staff-directory");
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast({
                    title: t("error"),
                    description: error.response?.data?.message || t("failed_to_update_staff"),
                    variant: "destructive",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});

        if (!passwordData.current_password) {
            setPasswordErrors(prev => ({ ...prev, current_password: t("current_password_required") }));
            return;
        }
        if (passwordData.new_password.length < 8) {
            setPasswordErrors(prev => ({ ...prev, new_password: t("password_min_8_chars") }));
            return;
        }
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            setPasswordErrors(prev => ({ ...prev, new_password_confirmation: t("passwords_do_not_match") }));
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await api.post(`/change-password`, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                new_password_confirmation: passwordData.new_password_confirmation
            });

            if (response.data.status === "Success") {
                toast({
                    title: t("success"),
                    description: t("password_updated_successfully"),
                });
                setPasswordData({
                    current_password: "",
                    new_password: "",
                    new_password_confirmation: "",
                });
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setPasswordErrors(error.response.data.errors);
            } else {
                toast({
                    title: t("error"),
                    description: error.response?.data?.message || t("failed_to_update_password"),
                    variant: "destructive",
                });
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const gradientBtn = "bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 transition-all duration-300 border-none rounded-full";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-gray-50/10">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-400 font-medium">{t("loading_staff_details")}</p>
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
                        <UserCog className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("edit_staff")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("update_staff_details")}</p>
                    </div>
                </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                    {t("staff_update_info")}
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
                                        readOnly={!!formData.staff_id}
                                        className={`h-11 border-gray-200 pr-12 ${errors.staff_id ? "border-red-500" : ""} ${formData.staff_id ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                                    />
                                    {!formData.staff_id && (
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

                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    {t("status")}
                                </Label>
                                <Select 
                                    value={formData.active ? "true" : "false"} 
                                    onValueChange={(value) => handleInputChange("active", value === "true")}
                                >
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder={t("select_status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">{t("active")}</SelectItem>
                                        <SelectItem value="false">{t("disabled")}</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("father_name")}</Label>
                                <Input
                                    value={formData.father_name}
                                    onChange={(e) => handleInputChange("father_name", e.target.value)}
                                    placeholder={t("enter_father_name")}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Mother Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("mother_name")}</Label>
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
                                    {t("email_login_username")} <span className="text-red-500">*</span>
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("gender")}</Label>
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("date_of_birth")}</Label>
                                <DatePicker
                                    value={formData.date_of_birth}
                                    onChange={(val) => handleInputChange("date_of_birth", val)}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Date of Joining */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("date_of_joining")}</Label>
                                <DatePicker
                                    value={formData.date_of_joining}
                                    onChange={(val) => handleInputChange("date_of_joining", val)}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    {t("phone")} <span className="text-red-500">*</span>
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("emergency_contact_number")}</Label>
                                <Input
                                    value={formData.emergency_contact}
                                    onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                                    placeholder={t("enter_emergency_contact")}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Marital Status */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("marital_status")}</Label>
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("photo")}</Label>
                                <FileUpload
                                    type="avatar"
                                    accept="image/*"
                                    maxSizeMB={5}
                                    initialValue={formData.avatar} // Pass existing avatar URL
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("address")}</Label>
                                <Textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder={t("enter_current_address")}
                                    className="border-gray-200 min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("permanent_address")}</Label>
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("qualification")}</Label>
                                <Input
                                    value={formData.qualification}
                                    onChange={(e) => handleInputChange("qualification", e.target.value)}
                                    placeholder={t("enter_qualification")}
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("work_experience")}</Label>
                                <Input
                                    value={formData.work_experience}
                                    onChange={(e) => handleInputChange("work_experience", e.target.value)}
                                    placeholder={t("enter_work_experience")}
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    {t("pan_nid_number")}
                                </Label>
                                <Input
                                    value={formData.pan_number}
                                    onChange={(e) => handleInputChange("pan_number", e.target.value)}
                                    placeholder={t("enter_pan_nid_number")}
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">{t("note")}</Label>
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
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setGrossSalaryInput(val);
                                            const gross = Number(val) || 0;
                                            setFormData(prev => ({
                                                ...prev,
                                                basic_salary: gross > 0 ? (gross * 0.634).toFixed(2) : "",
                                                house_rent: gross > 0 ? (gross * 0.317).toFixed(2) : "",
                                                medical_allowance: gross > 0 ? (gross * 0.015).toFixed(2) : "",
                                                conveyance_allowance: gross > 0 ? (gross * 0.009).toFixed(2) : "",
                                                food_allowance: gross > 0 ? (gross * 0.025).toFixed(2) : "",
                                            }));
                                        }}
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

                    {/* Security Section (Change Password) - Only for own profile */}
                    {currentUser?.staff_id === id && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                                <Lock className="h-5 w-5 text-amber-500" />
                                {t("security_and_password")}
                            </h2>
                            <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("current_password")}</Label>
                                        <Input
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                                            placeholder="••••••••"
                                            className={`h-11 border-gray-200 ${passwordErrors.current_password ? "border-red-500" : ""}`}
                                        />
                                        {passwordErrors.current_password && <p className="text-xs text-red-500">{passwordErrors.current_password}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("new_password")}</Label>
                                        <Input
                                            type="password"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                                            placeholder="••••••••"
                                            className={`h-11 border-gray-200 ${passwordErrors.new_password ? "border-red-500" : ""}`}
                                        />
                                        {passwordErrors.new_password && <p className="text-xs text-red-500">{passwordErrors.new_password}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("confirm_new_password")}</Label>
                                        <Input
                                            type="password"
                                            value={passwordData.new_password_confirmation}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                                            placeholder="••••••••"
                                            className={`h-11 border-gray-200 ${passwordErrors.new_password_confirmation ? "border-red-500" : ""}`}
                                        />
                                        {passwordErrors.new_password_confirmation && <p className="text-xs text-red-500">{passwordErrors.new_password_confirmation}</p>}
                                    </div>
                                    <div className="md:col-span-3 flex justify-end mt-2">
                                        <Button
                                            type="button"
                                            onClick={handlePasswordSubmit}
                                            disabled={isChangingPassword}
                                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-11 px-6 shadow-sm shadow-amber-200"
                                        >
                                            {isChangingPassword ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t("updating")}
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                    {t("update_password")}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="px-8 h-11 rounded-lg border-gray-300 hover:bg-gray-50"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${gradientBtn} px-8 h-11 text-sm font-semibold`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("updating_staff")}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t("update_staff_button")}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
