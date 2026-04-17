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
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import axios from "axios";

interface Role {
    name: string;
}

export default function CreateStaffPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
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
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadInitialData = async () => {
            setPageLoading(true);
            const user = await fetchCurrentUser();
            if (user && (user.permissions?.includes("human-resource.staff.add") || user.permissions?.includes("all"))) {
                await fetchRoles();
            } else if (user) {
                alert("Unauthorized. You do not have permission to create staff.");
                router.push("/dashboard/hr/staff-directory");
            }
            setPageLoading(false);
        };
        loadInitialData();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("http://127.0.0.1:8000/api/v1/profile", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
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
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("http://127.0.0.1:8000/api/v1/hr/staff-roles", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.status === "Success") {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
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
        const prefix = "STF";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const staffId = `${prefix}${timestamp}${random}`;
        setFormData(prev => ({ ...prev, staff_id: staffId }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.staff_id.trim()) newErrors.staff_id = "Staff ID is required";
        if (!formData.role) newErrors.role = "Role is required";
        if (!formData.first_name.trim()) newErrors.first_name = "First Name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

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
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("http://127.0.0.1:8000/api/v1/hr/staff-directory", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.status === "Success") {
                router.push("/dashboard/hr/staff-directory");
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert("Failed to create staff member. Please try again.");
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
                <p className="text-sm text-gray-400 font-medium">Verifying access...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-800">Add New Staff</h1>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/hr/staff-directory/import')}
                    className={`${gradientBtn} gap-2 h-10 px-6 text-sm font-semibold`}
                >
                    + Import Staff
                </Button>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                    Staff email is their login username. Password is generated automatically and sent to staff email. Superadmin can change staff password on their staff profile page.
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Basic Information Section */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Staff ID */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    Staff ID <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={formData.staff_id}
                                        onChange={(e) => handleInputChange("staff_id", e.target.value)}
                                        placeholder="Enter Staff ID"
                                        className={`h-11 border-gray-200 pr-12 ${errors.staff_id ? "border-red-500" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={generateStaffId}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-md transition-colors group"
                                        title="Generate Staff ID"
                                    >
                                        <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-purple-600 group-hover:rotate-180 transition-all duration-300" />
                                    </button>
                                </div>
                                {errors.staff_id && <p className="text-xs text-red-500">{errors.staff_id}</p>}
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    Role <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                                    <SelectTrigger className={`h-11 border-gray-200 ${errors.role ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder="Select" />
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
                                <Label className="text-xs font-bold text-gray-500 uppercase">Designation</Label>
                                <Input
                                    value={formData.designation}
                                    onChange={(e) => handleInputChange("designation", e.target.value)}
                                    placeholder="Enter Designation"
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Department */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Department</Label>
                                <Input
                                    value={formData.department}
                                    onChange={(e) => handleInputChange("department", e.target.value)}
                                    placeholder="Enter Department"
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* First Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.first_name}
                                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                                    placeholder="Enter First Name"
                                    className={`h-11 border-gray-200 ${errors.first_name ? "border-red-500" : ""}`}
                                />
                                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Last Name</Label>
                                <Input
                                    value={formData.last_name}
                                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                                    placeholder="Enter Last Name"
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Father Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Father Name</Label>
                                <Input
                                    value={formData.father_name}
                                    onChange={(e) => handleInputChange("father_name", e.target.value)}
                                    placeholder="Enter Father Name"
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Mother Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Mother Name</Label>
                                <Input
                                    value={formData.mother_name}
                                    onChange={(e) => handleInputChange("mother_name", e.target.value)}
                                    placeholder="Enter Mother Name"
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
                                    placeholder="Enter Email Address"
                                    className={`h-11 border-gray-200 ${errors.email ? "border-red-500" : ""}`}
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Gender</Label>
                                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Date of Joining */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Date of Joining</Label>
                                <Input
                                    type="date"
                                    value={formData.date_of_joining}
                                    onChange={(e) => handleInputChange("date_of_joining", e.target.value)}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    placeholder="Enter Phone Number"
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Emergency Contact */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Emergency Contact Number</Label>
                                <Input
                                    value={formData.emergency_contact}
                                    onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                                    placeholder="Enter Emergency Contact"
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            {/* Marital Status */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Marital Status</Label>
                                <Select value={formData.marital_status} onValueChange={(value) => handleInputChange("marital_status", value)}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single">Single</SelectItem>
                                        <SelectItem value="Married">Married</SelectItem>
                                        <SelectItem value="Divorced">Divorced</SelectItem>
                                        <SelectItem value="Widowed">Widowed</SelectItem>
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
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Address</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Address</Label>
                                <Textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder="Enter Current Address"
                                    className="border-gray-200 min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Permanent Address</Label>
                                <Textarea
                                    value={formData.permanent_address}
                                    onChange={(e) => handleInputChange("permanent_address", e.target.value)}
                                    placeholder="Enter Permanent Address"
                                    className="border-gray-200 min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Details Section */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Professional Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Qualification</Label>
                                <Input
                                    value={formData.qualification}
                                    onChange={(e) => handleInputChange("qualification", e.target.value)}
                                    placeholder="Enter Qualification"
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Work Experience</Label>
                                <Input
                                    value={formData.work_experience}
                                    onChange={(e) => handleInputChange("work_experience", e.target.value)}
                                    placeholder="Enter Work Experience"
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
                                    placeholder="Enter PAN / NID Number"
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Note</Label>
                                <Textarea
                                    value={formData.note}
                                    onChange={(e) => handleInputChange("note", e.target.value)}
                                    placeholder="Enter Additional Notes"
                                    className="border-gray-200 min-h-[80px]"
                                />
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
                                "+ Insert Staff"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
