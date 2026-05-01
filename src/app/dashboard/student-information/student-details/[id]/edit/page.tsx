"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Upload,
    Save,
    ChevronDown,
    UserPlus,
    Users,
    House,
    MapPin,
    GraduationCap,
    Calendar,
    Loader2,
    ArrowLeft,
    UserCircle,
    Wallet,
    Percent,
    Check,
    Plus,
    X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function StudentEditPage() {
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number; category: string }[]>([]);
    const [houses, setHouses] = useState<{ id: number; house_name: string }[]>([]);
    const [disableReasons, setDisableReasons] = useState<{ id: number; reason: string }[]>([]);
    const [feeGroups, setFeeGroups] = useState<any[]>([]);
    const [feeDiscounts, setFeeDiscounts] = useState<any[]>([]);
    const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [hostels, setHostels] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [showSiblingModal, setShowSiblingModal] = useState(false);
    const [siblingClassId, setSiblingClassId] = useState("");
    const [siblingSectionId, setSiblingSectionId] = useState("");
    const [siblingStudentId, setSiblingStudentId] = useState("");
    const [siblingStudents, setSiblingStudents] = useState<any[]>([]);
    const [loadingSiblings, setLoadingSiblings] = useState(false);
    const [selectedSiblings, setSelectedSiblings] = useState<any[]>([]);

    const [formData, setFormData] = useState<{ [key: string]: any }>({
        admission_no: "",
        roll_no: "",
        school_class_id: "",
        section_id: "",
        name: "", 
        last_name: "",
        gender: "",
        dob: "",
        category: "",
        religion: "",
        caste: "",
        phone: "",
        email: "",
        admission_date: "",
        blood_group: "",
        house: "",
        height: "",
        weight: "",
        measurement_date: "",
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
        active: true,
        disable_reason: "",
        disable_date: "",
        avatar: null as File | null,
        father_photo: null as File | null,
        mother_photo: null as File | null,
        guardian_photo: null as File | null,
        fees_groups: [] as number[],
        fees_discounts: [] as number[],
        transport_route_id: "",
        transport_pickup_point_id: "",
        hostel_id: "",
        room_id: "",
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                await Promise.all([
                    fetchPrerequisites(),
                    fetchStudentData()
                ]);
            } finally {
                setFetching(false);
            }
        };
        fetchAll();
    }, [id]);

    const fetchPrerequisites = async () => {
        try {
            const [classesRes, sectionsRes, categoriesRes, housesRes, disableReasonsRes, feeGroupsRes, feeDiscountsRes, routesRes, pickupsRes, hostelsRes, roomsRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?no_paginate=true"),
                api.get("/student-categories"),
                api.get("/student-houses"),
                api.get("/disable-reasons"),
                api.get("/fees-groups"),
                api.get("/fee-discounts"),
                api.get("/transport/routes"),
                api.get("/transport/pickup-points"),
                api.get("/hostels"),
                api.get("/rooms")
            ]);
            setClasses(classesRes.data.data?.data || classesRes.data.data || []);
            setSections(sectionsRes.data.data?.data || sectionsRes.data.data || []);
            setCategories(categoriesRes.data.data?.data || categoriesRes.data.data || []);
            setHouses(housesRes.data.data?.data || housesRes.data.data || []);
            setDisableReasons(disableReasonsRes.data.data?.data || disableReasonsRes.data.data || []);
            setFeeGroups(feeGroupsRes.data.data?.data || feeGroupsRes.data.data || []);
            setFeeDiscounts(feeDiscountsRes.data.data?.data || feeDiscountsRes.data.data || []);
            setTransportRoutes(routesRes.data.data?.data || routesRes.data.data || []);
            setPickupPoints(pickupsRes.data.data?.data || pickupsRes.data.data || []);
            setHostels(hostelsRes.data.data?.data || hostelsRes.data.data || []);
            setRooms(roomsRes.data.data?.data || roomsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
        }
    };

    const fetchStudentData = async () => {
        try {
            const response = await api.get(`/students/${id}`);
            const student = response.data.data;
            
            setFormData({
                admission_no: student.admission_no || "",
                roll_no: student.roll_no || "",
                school_class_id: student.school_class_id?.toString() || "",
                section_id: student.section_id?.toString() || "",
                name: student.name || "",
                last_name: student.last_name || "",
                gender: student.gender || "",
                dob: student.dob ? student.dob.split('T')[0] : "",
                category: student.category || "",
                religion: student.religion || "",
                caste: student.caste || "",
                phone: student.phone || "",
                email: student.email || "",
                admission_date: student.admission_date || "",
                blood_group: student.blood_group || "",
                house: student.house || "",
                height: student.height || "",
                weight: student.weight || "",
                measurement_date: student.measurement_date || "",
                medical_history: student.medical_history || "",
                father_name: student.father_name || "",
                father_phone: student.father_phone || "",
                father_occupation: student.father_occupation || "",
                mother_name: student.mother_name || "",
                mother_phone: student.mother_phone || "",
                mother_occupation: student.mother_occupation || "",
                guardian_type: student.guardian_type || "Father",
                guardian_name: student.guardian_name || "",
                guardian_relation: student.guardian_relation || "",
                guardian_phone: student.guardian_phone || "",
                guardian_email: student.guardian_email || "",
                guardian_occupation: student.guardian_occupation || "",
                guardian_address: student.guardian_address || "",
                active: student.active ?? true,
                disable_reason: student.disable_reason || "",
                disable_date: student.disable_date || "",
                avatar: null,
                fees_groups: student.fees_groups?.map((g: any) => g.id) || [],
                fees_discounts: student.fees_discounts?.map((d: any) => d.id) || [],
                transport_route_id: student.transport_assignment?.route_id || student.transport_route_id || "",
                transport_pickup_point_id: student.transport_assignment?.pickup_point_id || student.transport_pickup_point_id || "",
                hostel_id: student.hostel_room?.hostel_id || student.hostel_id || "",
                room_id: student.hostel_room?.room_id || student.room_id || "",
            });

            if (student.avatar) {
                setAvatarPreview(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${student.avatar}`);
            }

            if (student.siblings) {
                const siblings = student.siblings.map((s: any) => ({
                    id: s.id,
                    name: `${s.name} ${s.last_name || ""}`,
                    admission_no: s.admission_no,
                    photo: s.avatar || s.student_photo 
                        ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${s.avatar || s.student_photo}`
                        : null,
                    class_name: s.school_class?.name || s.class || "N/A",
                    section_name: s.section?.name || "N/A"
                }));
                setSelectedSiblings(siblings);
            }
        } catch (error) {
            console.error("Error fetching student data:", error);
            toast("error", "Failed to load student data");
            router.push("/dashboard/student-information/student-details");
        }
    };

    const fetchSiblingStudents = async (classId: string, sectionId: string) => {
        if (!classId || !sectionId) return;
        setLoadingSiblings(true);
        try {
            const response = await api.get(`/students?school_class_id=${classId}&section_id=${sectionId}&no_paginate=true`);
            setSiblingStudents(response.data.data?.data || response.data.data || []);
        } catch (error) {
            console.error("Error fetching siblings:", error);
        } finally {
            setLoadingSiblings(false);
        }
    };

    const handleAddSibling = async () => {
        if (!siblingStudentId) return;
        try {
            const response = await api.get(`/students/${siblingStudentId}`);
            const student = response.data.data;
            
            // Sync parent/guardian details
            setFormData(prev => ({
                ...prev,
                father_name: student.father_name || "",
                father_phone: student.father_phone || "",
                father_occupation: student.father_occupation || "",
                mother_name: student.mother_name || "",
                mother_phone: student.mother_phone || "",
                mother_occupation: student.mother_occupation || "",
                guardian_type: student.guardian_type || "Father",
                guardian_name: student.guardian_name || "",
                guardian_relation: student.guardian_relation || "",
                guardian_phone: student.guardian_phone || "",
                guardian_email: student.guardian_email || "",
                guardian_occupation: student.guardian_occupation || "",
                guardian_address: student.guardian_address || "",
            }));

            const photoUrl = student.avatar || student.student_photo
                ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${student.avatar || student.student_photo}`
                : null;

            const newSibling = {
                id: student.id,
                name: `${student.name} ${student.last_name || ""}`,
                admission_no: student.admission_no,
                photo: photoUrl,
                class_name: student.school_class?.name || student.class || "N/A",
                section_name: student.section?.name || "N/A"
            };

            setSelectedSiblings(prev => {
                if (prev.some(s => s.id === newSibling.id)) return prev;
                return [...prev, newSibling];
            });
            
            setShowSiblingModal(false);
            toast("success", "Sibling added and details applied");
        } catch (error) {
            console.error("Error adding sibling:", error);
            toast("error", "Failed to add sibling details");
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            
            // Clear disable reason if student becomes active
            if (field === "active" && value === true) {
                newData.disable_reason = "";
                newData.disable_date = "";
            }

            // Auto-set today's date if student becomes disabled
            if (field === "active" && value === false) {
                if (!newData.disable_date) {
                    newData.disable_date = new Date().toISOString().split('T')[0];
                }
            }

            // Auto-sync guardian if type is Father/Mother
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

            if (field === "avatar" && value instanceof File) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatarPreview(reader.result as string);
                };
                reader.readAsDataURL(value);
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('_method', 'PUT'); // Required for multipart/form-data with Laravel PUT

            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (Array.isArray(value)) {
                    value.forEach(v => data.append(`${key}[]`, v));
                } else if (value !== null && value !== undefined && value !== "") {
                    if (key === 'active') {
                        data.append(key, value ? '1' : '0');
                    } else {
                        data.append(key, value);
                    }
                }
            });

            // Ensure transport IDs are sent even if they are null (to clear them)
            if (!formData.transport_route_id) data.append('transport_route_id', '');
            if (!formData.transport_pickup_point_id) data.append('transport_pickup_point_id', '');

            await api.post(`/students/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            toast("success", "Student updated successfully");
            router.push("/dashboard/student-information/student-details");
        } catch (error: any) {
            console.error("Error updating student:", error);
            const message = error.response?.data?.message || "Failed to update student";
            toast("error", message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/student-information/student-details">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
                        <p className="text-sm text-muted-foreground">Modify details for {formData.name} {formData.last_name}</p>
                    </div>
                </div>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
                <SectionCard title="Basic Information" icon={GraduationCap}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 flex flex-col items-center justify-center border-r border-muted/50 pr-6">
                            <div className="relative group">
                                <div className="h-32 w-32 rounded-3xl border-4 border-muted/20 overflow-hidden bg-muted/10">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserCircle className="h-full w-full text-muted-foreground/20 p-2" />
                                    )}
                                </div>
                                <label className="absolute bottom-[-10px] right-[-10px] h-10 w-10 bg-primary text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all">
                                    <Upload className="h-4 w-4" />
                                    <input type="file" className="sr-only" onChange={(e) => handleChange("avatar", e.target.files?.[0] || null)} accept="image/*" />
                                </label>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-6">Student Photo</p>
                        </div>

                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        </div>

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
                            options={categories.map(c => ({ label: c.category_name || c.category || c.name, value: c.id.toString() }))}
                        />
                        <InputField label="Religion" value={formData.religion} onChange={(val) => handleChange("religion", val)} />
                        <InputField label="Caste" value={formData.caste} onChange={(val) => handleChange("caste", val)} />
                        <InputField label="Mobile Number" value={formData.phone} onChange={(val) => handleChange("phone", val)} />
                        <SelectField
                            label="Status"
                            required
                            value={formData.active ? "1" : "0"}
                            onChange={(val) => handleChange("active", val === "1")}
                            options={[
                                { label: "Active", value: "1" },
                                { label: "Disabled", value: "0" }
                            ]}
                        />
                        {!formData.active && (
                            <>
                                <SelectField
                                    label="Disable Reason"
                                    required
                                    value={formData.disable_reason}
                                    onChange={(val) => handleChange("disable_reason", val)}
                                    options={disableReasons.map(r => ({ label: r.reason, value: r.id.toString() }))}
                                />
                                <InputField
                                    label="Disable Date"
                                    type="date"
                                    value={formData.disable_date}
                                    onChange={(val) => handleChange("disable_date", val)}
                                />
                            </>
                        )}
                        <InputField label="Email" type="email" value={formData.email} onChange={(val) => handleChange("email", val)} />
                        <InputField label="Admission Date" type="date" value={formData.admission_date} onChange={(val) => handleChange("admission_date", val)} />

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
                            options={houses.map(h => ({ label: h.house_name || h.name, value: h.id.toString() }))}
                        />
                        <InputField label="Height" value={formData.height} onChange={(val) => handleChange("height", val)} />
                        <InputField label="Weight" value={formData.weight} onChange={(val) => handleChange("weight", val)} />

                        <InputField label="Measurement Date" type="date" value={formData.measurement_date} onChange={(val) => handleChange("measurement_date", val)} />
                        
                        {/* Sibling Section Matching Screenshot */}
                        <div className="lg:col-span-4 mt-6">
                            <div className="bg-[#f8f9fa] border-b border-muted/50 px-4 py-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Sibling</span>
                                {selectedSiblings.length > 0 && (
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedSiblings([])}
                                        className="bg-primary text-white text-[10px] px-3 py-1 rounded shadow-sm hover:bg-primary/90 transition-colors"
                                    >
                                        Remove Sibling
                                    </button>
                                )}
                            </div>
                            <div className="p-4 bg-white border border-t-0 flex flex-wrap gap-4 min-h-[100px]">
                                {selectedSiblings.map((sibling) => (
                                    <div key={sibling.id} className="flex gap-4 p-3 border rounded-md bg-white min-w-[300px] shadow-sm relative group">
                                        <div className="h-20 w-20 rounded-lg bg-[#e9ecef] overflow-hidden border flex items-center justify-center shrink-0">
                                            {sibling.photo ? (
                                                <img 
                                                    src={sibling.photo.startsWith('http') ? sibling.photo : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${sibling.photo}`} 
                                                    alt={sibling.name} 
                                                    className="h-full w-full object-cover" 
                                                />
                                            ) : (
                                                <Users className="h-10 w-10 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <div className="flex flex-col text-[11px] space-y-0.5">
                                            <span className="text-primary font-bold text-sm mb-1">{sibling.name}</span>
                                            <div className="flex gap-1">
                                                <span className="font-bold">Admission No:</span>
                                                <span className="text-muted-foreground">{sibling.admission_no}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <span className="font-bold">Class:</span>
                                                <span className="text-muted-foreground">{sibling.class_name}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <span className="font-bold">Section:</span>
                                                <span className="text-muted-foreground">{sibling.section_name}</span>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedSiblings(prev => prev.filter(s => s.id !== sibling.id))}
                                            className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => setShowSiblingModal(true)}
                                    className="h-[106px] w-[300px] border-2 border-dashed border-primary/20 rounded-md text-primary font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/40 transition-all group"
                                >
                                    <Plus className="h-6 w-6 transition-transform group-hover:scale-110" /> 
                                    <span>Add Sibling</span>
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <TextAreaField label="Medical History" rows={2} value={formData.medical_history} onChange={(val) => handleChange("medical_history", val)} />
                        </div>
                    </div>
                </SectionCard>

                {/* Fees Details Card */}
                <SectionCard title="Fees Details" icon={Wallet}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {feeGroups.map((group) => (
                            <label key={group.id} className="flex flex-col border border-muted/50 p-4 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors group/fee">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={formData.fees_groups.includes(group.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleChange("fees_groups", [...formData.fees_groups, group.id]);
                                                } else {
                                                    handleChange("fees_groups", formData.fees_groups.filter((id: number) => id !== group.id));
                                                }
                                            }}
                                        />
                                        <div className="h-5 w-5 rounded border-2 border-muted-foreground/30 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm group-hover/fee:text-primary transition-colors">{group.name}</span>
                                        {group.description && <span className="text-xs text-muted-foreground">{group.description}</span>}
                                    </div>
                                </div>
                            </label>
                        ))}
                        {feeGroups.length === 0 && (
                            <div className="col-span-full py-6 text-center text-muted-foreground text-sm">
                                No fee groups available.
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Fees Discount Details Card */}
                <SectionCard title="Fees Discount Details" icon={Percent}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {feeDiscounts.map((discount) => (
                            <label key={discount.id} className="flex flex-col border border-muted/50 p-4 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors group/discount">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={formData.fees_discounts.includes(discount.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleChange("fees_discounts", [...formData.fees_discounts, discount.id]);
                                                } else {
                                                    handleChange("fees_discounts", formData.fees_discounts.filter((id: number) => id !== discount.id));
                                                }
                                            }}
                                        />
                                        <div className="h-5 w-5 rounded border-2 border-muted-foreground/30 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-semibold text-sm group-hover/discount:text-primary transition-colors">{discount.name}</span>
                                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                {discount.type === 'percentage' ? `${discount.percentage}%` : `₹${discount.amount}`}
                                            </span>
                                        </div>
                                        {discount.code && <span className="text-xs text-muted-foreground mt-0.5">Code: {discount.code}</span>}
                                    </div>
                                </div>
                            </label>
                        ))}
                        {feeDiscounts.length === 0 && (
                            <div className="col-span-full py-6 text-center text-muted-foreground text-sm">
                                No fee discounts available.
                            </div>
                        )}
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

                {/* Transport & Hostel Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <SectionCard title="Transport Details" icon={MapPin}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField
                                label="Route List"
                                options={transportRoutes.map(r => ({ label: r.title || r.name, value: r.id.toString() }))}
                                value={formData.transport_route_id || ""}
                                onChange={(val) => handleChange("transport_route_id", val)}
                            />
                            <SelectField
                                label="Pickup Point"
                                options={pickupPoints.map(p => ({ label: p.point_name || p.name, value: p.id.toString() }))}
                                value={formData.transport_pickup_point_id || ""}
                                onChange={(val) => handleChange("transport_pickup_point_id", val)}
                            />
                        </div>
                    </SectionCard>
                    <SectionCard title="Hostel Details" icon={House}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField
                                label="Hostel"
                                options={hostels.map(h => ({ label: h.hostel_name || h.name, value: h.id.toString() }))}
                                value={formData.hostel_id || ""}
                                onChange={(val) => handleChange("hostel_id", val)}
                            />
                            <SelectField
                                label="Room No."
                                options={rooms.map(r => ({ label: r.room_number || r.room_no || r.name, value: r.id.toString() }))}
                                value={formData.room_id || ""}
                                onChange={(val) => handleChange("room_id", val)}
                            />
                        </div>
                    </SectionCard>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                    <Link href="/dashboard/student-information/student-details">
                        <Button variant="outline" type="button" className="h-12 px-8 rounded-xl font-bold">Cancel</Button>
                    </Link>
                    <Button
                        variant="gradient"
                        type="submit"
                        className="h-12 px-12 text-lg rounded-xl shadow-lg shadow-primary/20"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        Update Student
                    </Button>
                </div>
            </form>

            <Dialog open={showSiblingModal} onOpenChange={setShowSiblingModal}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-xl font-bold">Add Sibling</DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <label className="text-sm font-bold text-muted-foreground text-right">Class</label>
                            <SelectField
                                label=""
                                value={siblingClassId}
                                onChange={(val) => {
                                    setSiblingClassId(val);
                                    if (siblingSectionId) fetchSiblingStudents(val, siblingSectionId);
                                }}
                                options={classes.map(c => ({ label: c.name, value: c.id.toString() }))}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <label className="text-sm font-bold text-muted-foreground text-right">Section</label>
                            <SelectField
                                label=""
                                value={siblingSectionId}
                                onChange={(val) => {
                                    setSiblingSectionId(val);
                                    if (siblingClassId) fetchSiblingStudents(siblingClassId, val);
                                }}
                                options={sections.map(s => ({ label: s.name, value: s.id.toString() }))}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <label className="text-sm font-bold text-muted-foreground text-right">Student</label>
                            <SelectField
                                label=""
                                value={siblingStudentId}
                                onChange={setSiblingStudentId}
                                options={siblingStudents.map(s => ({ 
                                    label: `${s.name} ${s.last_name || ""} (${s.admission_no})`, 
                                    value: s.id.toString() 
                                }))}
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t flex justify-end">
                        <Button 
                            onClick={handleAddSibling}
                            disabled={!siblingStudentId || loadingSiblings}
                            className="bg-primary hover:bg-primary/90 text-white px-6 rounded-xl flex items-center gap-2"
                        >
                            {loadingSiblings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                            Add
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Reuse components from Admission Page
function SectionCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden rounded-3xl">
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

function InputField({ label, required, type = "text", value = "", onChange, readOnly = false }: { label: string, required?: boolean, type?: string, value?: string, onChange: (val: string) => void, readOnly?: boolean }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all",
                    readOnly && "bg-muted/60 cursor-not-allowed text-muted-foreground"
                )}
                required={required}
                readOnly={readOnly}
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

function TextAreaField({ label, required, value = "", onChange, rows = 3 }: { label: string, required?: boolean, value?: string, onChange: (val: string) => void, rows?: number }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                rows={rows}
                className="flex w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all resize-y min-h-[80px]"
            />
        </div>
    );
}

function FileUploadField({ label, required, value, onChange }: { label: string, required?: boolean, value: any, onChange: (val: File | null) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <div className="flex items-center gap-3 w-full h-11 rounded-xl border border-muted/50 bg-muted/30 px-3 relative focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-card focus-within:border-primary transition-all overflow-hidden group">
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => onChange(e.target.files?.[0] || null)}
                />
                <div className="h-8 w-8 rounded-md bg-background shadow-sm border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm text-muted-foreground truncate">
                    {value instanceof File ? value.name : (value ? "File Selected" : "Choose file...")}
                </span>
            </div>
        </div>
    );
}
