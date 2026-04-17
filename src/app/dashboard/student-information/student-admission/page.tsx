"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Upload,
    Save,
    Plus,
    ChevronDown,
    UserPlus,
    Users,
    House,
    MapPin,
    GraduationCap,
    Wallet,
    Calendar,
    Phone,
    Mail,
    Stethoscope,
    Scale,
    Weight,
    Dna,
    Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function StudentAdmissionPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingPrereqs, setFetchingPrereqs] = useState(true);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number; category: string }[]>([]);
    const [houses, setHouses] = useState<{ id: number; house_name: string }[]>([]);

    const [formData, setFormData] = useState<{ [key: string]: any }>({
        admission_no: "",
        roll_no: "",
        school_class_id: "",
        section_id: "",
        name: "", // First Name
        last_name: "",
        gender: "",
        dob: "",
        category: "",
        religion: "",
        caste: "",
        phone: "",
        email: "",
        admission_date: new Date().toISOString().split('T')[0],
        blood_group: "",
        house: "",
        height: "",
        weight: "",
        measurement_date: new Date().toISOString().split('T')[0],
        medical_history: "",
        father_name: "",
        father_phone: "",
        father_occupation: "",
        mother_name: "",
        mother_phone: "",
        mother_occupation: "",
        guardian_type: "Father",
        guardian_name: "",
        guardian_relation: "",
        guardian_phone: "",
        guardian_email: "",
        guardian_occupation: "",
        guardian_address: "",
        avatar: null as File | null,
        father_photo: null as File | null,
        mother_photo: null as File | null,
        guardian_photo: null as File | null,
    });

    useEffect(() => {
        fetchPrerequisites();
    }, []);

    const fetchPrerequisites = async () => {
        try {
            const [classesRes, sectionsRes, categoriesRes, housesRes] = await Promise.all([
                api.get("/academics/classes"),
                api.get("/academics/sections"),
                api.get("/student-information/categories"),
                api.get("/student-information/houses")
            ]);
            setClasses(classesRes.data.data);
            setSections(sectionsRes.data.data);
            setCategories(categoriesRes.data.data);
            setHouses(housesRes.data.data);
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
            toast("error", "Failed to load admission prerequisites");
        } finally {
            setFetchingPrereqs(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (field === "guardian_type") {
                if (value === "Father") {
                    newData.guardian_name = prev.father_name;
                    newData.guardian_phone = prev.father_phone;
                    newData.guardian_relation = "Father";
                } else if (value === "Mother") {
                    newData.guardian_name = prev.mother_name;
                    newData.guardian_phone = prev.mother_phone;
                    newData.guardian_relation = "Mother";
                }
            }

            // If updating parent info, and guardian is that parent, sync it
            if (newData.guardian_type === "Father" && (field === "father_name" || field === "father_phone")) {
                newData.guardian_name = newData.father_name;
                newData.guardian_phone = newData.father_phone;
            }
            if (newData.guardian_type === "Mother" && (field === "mother_name" || field === "mother_phone")) {
                newData.guardian_name = newData.mother_name;
                newData.guardian_phone = newData.mother_phone;
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Manual validation check for guardian fields (required in backend)
        if (!formData.guardian_name || !formData.guardian_relation || !formData.guardian_phone) {
            toast("error", "Guardian Name, Relation and Phone are required");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (value !== null && value !== undefined && value !== "") {
                    data.append(key, value);
                }
            });

            await api.post("/student-information/students", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast("success", "Student admitted successfully");
            window.location.reload(); // Quick reset
        } catch (error: any) {
            console.error("Error submitting admission:", error);
            const message = error.response?.data?.message || "Failed to admit student";
            toast("error", message);
            if (error.response?.data?.errors) {
                // Log specific validation errors for easier debugging
                console.log("Validation Errors:", error.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Student Admission</h1>
                        <p className="text-sm text-muted-foreground">Fill in the details to admit a new student</p>
                    </div>
                </div>
                <Link href="/dashboard/student-information/import-student">
                    <Button variant="gradient" className="h-10 px-6">
                        <Upload className="h-4 w-4" />
                        Import Student
                    </Button>
                </Link>
            </div>

            {/* Individual Sections */}
            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Student Admission Card */}
                <SectionCard title="Student Admission" icon={GraduationCap}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputField label="Admission No" required value={formData.admission_no} onChange={(val) => handleChange("admission_no", val)} />
                        <InputField label="Roll Number" value={formData.roll_no} onChange={(val) => handleChange("roll_no", val)} />
                        <SelectField
                            label="Class"
                            required
                            value={formData.school_class_id}
                            onChange={(val) => handleChange("school_class_id", val)}
                            options={classes.map(c => ({ label: c.name, value: c.id.toString() }))}
                        />
                        <SelectField
                            label="Section"
                            required
                            value={formData.section_id}
                            onChange={(val) => handleChange("section_id", val)}
                            options={sections.map(s => ({ label: s.name, value: s.id.toString() }))}
                        />

                        <InputField label="First Name" required value={formData.name} onChange={(val) => handleChange("name", val)} />
                        <InputField label="Last Name" value={formData.last_name} onChange={(val) => handleChange("last_name", val)} />
                        <SelectField
                            label="Gender"
                            required
                            value={formData.gender}
                            onChange={(val) => handleChange("gender", val)}
                            options={[
                                { label: "Male", value: "Male" },
                                { label: "Female", value: "Female" },
                                { label: "Other", value: "Other" }
                            ]}
                        />
                        <InputField label="Date Of Birth" type="date" required value={formData.dob} onChange={(val) => handleChange("dob", val)} />

                        <SelectField
                            label="Category"
                            value={formData.category}
                            onChange={(val) => handleChange("category", val)}
                            options={categories.map(c => ({ label: c.category, value: c.id.toString() }))}
                        />
                        <InputField label="Religion" value={formData.religion} onChange={(val) => handleChange("religion", val)} />
                        <InputField label="Caste" value={formData.caste} onChange={(val) => handleChange("caste", val)} />
                        <InputField label="Mobile Number" value={formData.phone} onChange={(val) => handleChange("phone", val)} />

                        <InputField label="Email" type="email" value={formData.email} onChange={(val) => handleChange("email", val)} />
                        <InputField label="Admission Date" type="date" value={formData.admission_date} onChange={(val) => handleChange("admission_date", val)} />
                        <div className="lg:col-span-2">
                            <FileUploadField
                                label="Student Photo (100px X 100px)"
                                value={formData.avatar}
                                onChange={(field) => handleChange("avatar", field)}
                            />
                        </div>

                        <SelectField
                            label="Blood Group"
                            value={formData.blood_group}
                            onChange={(val) => handleChange("blood_group", val)}
                            options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(v => ({ label: v, value: v }))}
                        />
                        <SelectField
                            label="House"
                            value={formData.house}
                            onChange={(val) => handleChange("house", val)}
                            options={houses.map(h => ({ label: h.house_name, value: h.id.toString() }))}
                        />
                        <InputField label="Height" value={formData.height} onChange={(val) => handleChange("height", val)} />
                        <InputField label="Weight" value={formData.weight} onChange={(val) => handleChange("weight", val)} />

                        <InputField label="Measurement Date" type="date" value={formData.measurement_date} onChange={(val) => handleChange("measurement_date", val)} />
                        <div className="lg:col-span-1 pt-8 flex items-center">
                            <button type="button" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                                <Plus className="h-4 w-4" /> Add Sibling
                            </button>
                        </div>
                        <div className="lg:col-span-4">
                            <TextAreaField label="Medical History" rows={2} value={formData.medical_history} onChange={(val) => handleChange("medical_history", val)} />
                        </div>
                    </div>
                </SectionCard>

                {/* Parent Guardian Detail Card */}
                <SectionCard title="Parent Guardian Detail" icon={Users}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputField label="Father Name" value={formData.father_name} onChange={(val) => handleChange("father_name", val)} />
                        <InputField label="Father Phone" value={formData.father_phone} onChange={(val) => handleChange("father_phone", val)} />
                        <InputField label="Father Occupation" value={formData.father_occupation} onChange={(val) => handleChange("father_occupation", val)} />
                        <FileUploadField
                            label="Father Photo (100px X 100px)"
                            value={formData.father_photo}
                            onChange={(file) => handleChange("father_photo", file)}
                        />

                        <InputField label="Mother Name" value={formData.mother_name} onChange={(val) => handleChange("mother_name", val)} />
                        <InputField label="Mother Phone" value={formData.mother_phone} onChange={(val) => handleChange("mother_phone", val)} />
                        <InputField label="Mother Occupation" value={formData.mother_occupation} onChange={(val) => handleChange("mother_occupation", val)} />
                        <FileUploadField
                            label="Mother Photo (100px X 100px)"
                            value={formData.mother_photo}
                            onChange={(file) => handleChange("mother_photo", file)}
                        />

                        <div className="lg:col-span-4 py-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                                If Guardian Is <span className="text-destructive">*</span>
                            </label>
                            <div className="flex gap-6">
                                {["Father", "Mother", "Other"].map((role) => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="radio"
                                                name="guardian_type"
                                                className="peer sr-only"
                                                checked={formData.guardian_type === role}
                                                onChange={() => handleChange("guardian_type", role)}
                                            />
                                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 peer-checked:border-primary transition-all"></div>
                                            <div className="absolute h-2.5 w-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-all"></div>
                                        </div>
                                        <span className="text-sm font-semibold group-hover:text-primary transition-colors">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <InputField label="Guardian Name" required value={formData.guardian_name} onChange={(val) => handleChange("guardian_name", val)} />
                        <InputField label="Guardian Relation" required value={formData.guardian_relation} onChange={(val) => handleChange("guardian_relation", val)} />
                        <InputField label="Guardian Email" value={formData.guardian_email} onChange={(val) => handleChange("guardian_email", val)} />
                        <FileUploadField
                            label="Guardian Photo (100px X 100px)"
                            value={formData.guardian_photo}
                            onChange={(file) => handleChange("guardian_photo", file)}
                        />

                        <InputField label="Guardian Phone" required value={formData.guardian_phone} onChange={(val) => handleChange("guardian_phone", val)} />
                        <InputField label="Guardian Occupation" value={formData.guardian_occupation} onChange={(val) => handleChange("guardian_occupation", val)} />
                        <div className="lg:col-span-2">
                            <TextAreaField label="Guardian Address" rows={2} value={formData.guardian_address} onChange={(val) => handleChange("guardian_address", val)} />
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-muted/30">
                        <button type="button" className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors py-2 px-1">
                            <span className="font-bold text-sm">Add More Details</span>
                            <Plus className="h-5 w-5 bg-muted rounded-full p-1" />
                        </button>
                    </div>
                </SectionCard>

                {/* Transport & Hostel Details (Simplified for now as they typically require separate models) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-50 pointer-events-none">
                    <SectionCard title="Transport Details" icon={MapPin}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField label="Route List" options={[]} value="" onChange={() => { }} />
                            <SelectField label="Pickup Point" options={[]} value="" onChange={() => { }} />
                            <SelectField label="Fees Month" options={[]} value="" onChange={() => { }} />
                        </div>
                    </SectionCard>
                    <SectionCard title="Hostel Details" icon={House}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField label="Hostel" options={[]} value="" onChange={() => { }} />
                            <SelectField label="Room No." options={[]} value="" onChange={() => { }} />
                        </div>
                    </SectionCard>
                </div>

                <div className="flex justify-end pt-6">
                    <Button
                        variant="gradient"
                        type="submit"
                        className="h-12 px-12 text-lg"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        Save
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Helper Components
function SectionCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3 bg-muted/20">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-bold text-lg tracking-tight">{title}</h2>
            </div>
            <CardContent className="p-8">
                {children}
            </CardContent>
        </Card>
    );
}

function InputField({ label, required, type = "text", value = "", onChange, placeholder = "" }: { label: string, required?: boolean, type?: string, value?: string, onChange: (val: string) => void, placeholder?: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                required={required}
            />
        </div>
    );
}

function SelectField({ label, required, options, value, onChange }: { label: string, required?: boolean, options: { label: string, value: string }[] | string[], value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                >
                    <option value="">Select</option>
                    {options.map(opt => {
                        const label = typeof opt === "string" ? opt : opt.label;
                        const value = typeof opt === "string" ? opt : opt.value;
                        return <option key={value} value={value}>{label}</option>
                    })}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
            </div>
        </div>
    );
}

function TextAreaField({ label, required, rows = 3, value, onChange }: { label: string, required?: boolean, rows?: number, value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-2 group h-full">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <textarea
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all resize-none placeholder:text-muted-foreground/50"
            />
        </div>
    );
}

function FileUploadField({ label, value, onChange }: { label: string, value?: File | null, onChange?: (file: File | null) => void }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label}
            </label>
            <div className="relative h-11 border border-dashed border-muted-foreground/30 rounded-xl bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group/upload overflow-hidden">
                <div className="flex items-center gap-2 px-4 pointer-events-none w-full">
                    <Upload className="h-4 w-4 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-muted-foreground group-hover/upload:text-foreground truncate">
                        {value ? value.name : "Drag and drop a file here or click"}
                    </span>
                </div>
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => onChange?.(e.target.files?.[0] || null)}
                    accept="image/*"
                />
            </div>
        </div>
    );
}
