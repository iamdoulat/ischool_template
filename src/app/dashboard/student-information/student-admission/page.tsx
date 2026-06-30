"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useImageUrl } from "@/lib/image-url";
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
    Loader2,
    Percent,
    Check,
    X,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { downloadAdmissionFormPdf, type AdmissionFormConfig } from "@/lib/pdf-utils";

export default function StudentAdmissionPage() {
    const getImageUrl = useImageUrl();
    const tt = useTranslateToast();
    const { t } = useTranslation();
    const { symbol } = useCurrencyFormatter();
    const [loading, setLoading] = useState(false);
    const [fetchingPrereqs, setFetchingPrereqs] = useState(true);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [houses, setHouses] = useState<any[]>([]);
    const [showSiblingModal, setShowSiblingModal] = useState(false);
    const [siblingClassId, setSiblingClassId] = useState("");
    const [siblingSectionId, setSiblingSectionId] = useState("");
    const [siblingStudentId, setSiblingStudentId] = useState("");
    const [siblingStudents, setSiblingStudents] = useState<any[]>([]);
    const [loadingSiblings, setLoadingSiblings] = useState(false);
    const [siblingSections, setSiblingSections] = useState<{ id: number; name: string }[]>([]);
    const [selectedSiblings, setSelectedSiblings] = useState<any[]>([]);
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    const [formData, setFormData] = useState<{ [key: string]: any }>({
        admission_no: "",
        roll_no: "",
        username: "",
        parent_username: "",
        school_class_id: "",
        section_id: "",
        name: "", // First Name
        last_name: "",
        full_name: "",
        gender: "",
        dob: "",
        birth_place: "",
        state: "",
        nationality: "",
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
        postal_code: "",
        mother_tongue: "",
        identification_marks: "",
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
        avatar: null as File | null,
        father_photo: null as File | null,
        mother_photo: null as File | null,
        guardian_photo: null as File | null,
        fees_groups: [] as number[],
        fees_discounts: [] as number[],
        national_identification_no: "",
        local_identification_no: "",
        bank_account_no: "",
        bank_name: "",
        ifsc_code: "",
        previous_school_details: "",
        previous_academic_record: [
            { school_name: "", class: "", year: "", percentage: "" },
            { school_name: "", class: "", year: "", percentage: "" }
        ] as { school_name: string, class: string, year: string, percentage: string }[],
        note: "",
        current_address: "",
        permanent_address: "",
        rte: "No",
        appraisal_achievements: "",
        general_behaviour: "",
        second_language: "",
    });

    const [autoAdmissionEnabled, setAutoAdmissionEnabled] = useState(false);
    const [autoRollEnabled, setAutoRollEnabled] = useState(false);
    const [autoUsernameEnabled, setAutoUsernameEnabled] = useState(false);
    const [parentAutoUsernameEnabled, setParentAutoUsernameEnabled] = useState(false);
    const [generatingParentUsername, setGeneratingParentUsername] = useState(false);

    useEffect(() => {
        fetchPrerequisites();
        fetchAdmissionNo();
        fetchUsername();
    }, []);

    const fetchAdmissionNo = async () => {
        try {
            const response = await api.get("/students/generate-admission-no");
            if (response.data.data?.auto_enabled) {
                setAutoAdmissionEnabled(true);
                setFormData(prev => ({ ...prev, admission_no: response.data.data.admission_no }));
            }
        } catch (error) {
            console.error("Error fetching admission no:", error);
        }
    };

    const fetchRollNo = async (classId: string, sectionId: string) => {
        if (!classId || !sectionId) return;
        try {
            const response = await api.get(`/students/generate-roll-no?school_class_id=${classId}&section_id=${sectionId}`);
            if (response.data.data?.auto_enabled) {
                setAutoRollEnabled(true);
                setFormData(prev => ({ ...prev, roll_no: response.data.data.roll_no }));
            } else {
                setAutoRollEnabled(false);
            }
        } catch (error) {
            console.error("Error fetching roll no:", error);
        }
    };

    const fetchUsername = async () => {
        try {
            const response = await api.get("/students/generate-username");
            if (response.data.data?.auto_enabled) {
                setAutoUsernameEnabled(true);
                setParentAutoUsernameEnabled(true);
                setFormData(prev => ({ ...prev, username: response.data.data.username, parent_username: response.data.data.parent_username }));
            } else {
                setAutoUsernameEnabled(false);
            }
        } catch (error) {
            console.error("Error fetching username:", error);
        }
    };

    const fetchParentUsername = async () => {
        setGeneratingParentUsername(true);
        try {
            const response = await api.get("/system-setting/users/generate-parent-username");
            if (response.data.data?.auto_enabled) {
                setParentAutoUsernameEnabled(true);
                setFormData(prev => ({ ...prev, parent_username: response.data.data.username }));
            } else {
                setParentAutoUsernameEnabled(false);
            }
        } catch (error) {
            console.error("Error fetching parent username:", error);
        } finally {
            setGeneratingParentUsername(false);
        }
    };

    const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [hostels, setHostels] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [feeGroups, setFeeGroups] = useState<any[]>([]);
    const [feeDiscounts, setFeeDiscounts] = useState<any[]>([]);
    const [admissionFormConfig, setAdmissionFormConfig] = useState<AdmissionFormConfig | undefined>(undefined);
    const filteredFeeGroups = useMemo(() => {
        if (!formData.school_class_id) return feeGroups;
        return feeGroups.filter(g => !g.school_class_id || g.school_class_id.toString() === formData.school_class_id);
    }, [feeGroups, formData.school_class_id]);

    const fetchPrerequisites = async () => {
        setFetchingPrereqs(true);
        try {
            const [classesRes, categoriesRes, housesRes, routesRes, pickupsRes, hostelsRes, roomsRes, feeGroupsRes, feeDiscountsRes, admissionFormRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/student-categories"),
                api.get("/student-houses"),
                api.get("/transport/routes"),
                api.get("/transport/pickup-points"),
                api.get("/hostels"),
                api.get("/rooms"),
                api.get("/fees-groups"),
                api.get("/fee-discounts"),
                api.get("/system-setting/admission-form")
            ]);
            setClasses(classesRes.data.data?.data || classesRes.data.data || []);
            setCategories(categoriesRes.data.data?.data || categoriesRes.data.data || []);
            setHouses(housesRes.data.data?.data || housesRes.data.data || []);
            setTransportRoutes(routesRes.data.data?.data || routesRes.data.data || []);
            setPickupPoints(pickupsRes.data.data?.data || pickupsRes.data.data || []);
            setHostels(hostelsRes.data.data?.data || hostelsRes.data.data || []);
            setRooms(roomsRes.data.data?.data || roomsRes.data.data || []);
            setFeeGroups(feeGroupsRes.data.data?.data || feeGroupsRes.data.data || []);
            setFeeDiscounts(feeDiscountsRes.data.data?.data || feeDiscountsRes.data.data || []);

            // Parse admission form settings
            if (admissionFormRes.data.success && admissionFormRes.data.data) {
                const { settings, documents } = admissionFormRes.data.data;
                setAdmissionFormConfig({
                    documents: documents || [],
                    fee_policy: settings?.fee_policy || "",
                    office_use_only: settings?.office_use_only || "",
                    terms_conditions: settings?.terms_conditions || "",
                    declaration: settings?.declaration || "",
                });
            }
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
            tt.error("failed_to_load_admission_prerequisites");
        } finally {
            setFetchingPrereqs(false);
        }
    };

    const fetchSections = async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            setSections(response.data.data?.data || response.data.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchSiblingSections = async (classId: string) => {
        if (!classId) {
            setSiblingSections([]);
            return;
        }
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            setSiblingSections(response.data.data?.data || response.data.data || []);
        } catch (error) {
            console.error("Error fetching sibling sections:", error);
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

            const photoUrl = student.student_photo || student.avatar
                ? getImageUrl(student.student_photo || student.avatar)
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
            tt.success("sibling_added_and_details_applied");
        } catch (error) {
            console.error("Error adding sibling:", error);
            tt.error("failed_to_add_sibling_details");
        }
    };

    const handleChange = (field: string, value: any) => {
        if (field === "school_class_id") {
            setFormData(prev => ({ ...prev, school_class_id: value, section_id: "" }));
            fetchSections(value);
            return;
        }

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

            if (field === "school_class_id" || field === "section_id") {
                const cId = field === "school_class_id" ? value : newData.school_class_id;
                const sId = field === "section_id" ? value : newData.section_id;
                if (cId && sId) {
                    fetchRollNo(cId, sId);
                }
            }

            if (field === "name" || field === "last_name") {
                newData.full_name = `${newData.name} ${newData.last_name}`.trim();
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Manual validation check for guardian fields (required in backend)
        if (!formData.guardian_name || !formData.guardian_relation || !formData.guardian_phone) {
            tt.error("guardian_name_relation_and_phone_are_required");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (key === 'previous_academic_record') {
                    const records = value as Record<string, string>[];
                    records.forEach((record, idx) => {
                        Object.keys(record).forEach(field => {
                            data.append(`previous_academic_record[${idx}][${field}]`, record[field] || '');
                        });
                    });
                    return;
                } else if (Array.isArray(value)) {
                    value.forEach(v => data.append(`${key}[]`, v));
                } else if (value !== null && value !== undefined && value !== "") {
                    if (key === 'active') {
                        data.append(key, value ? '1' : '0');
                    } else {
                        data.append(key, value);
                    }
                }
            });

            await api.post("/students", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Resolve class & section names for PDF
            const clsName = classes.find(c => c.id.toString() === formData.school_class_id?.toString())?.name || "";
            const secName = sections.find(s => s.id.toString() === formData.section_id?.toString())?.name || "";
            const fullName = formData.full_name || `${formData.name || ""} ${formData.last_name || ""}`.trim();

            // Read avatar as data URL for the PDF (if a file was selected)
            let photoUrl: string | undefined;
            if (formData.avatar instanceof File) {
                photoUrl = await new Promise<string | undefined>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => resolve(undefined);
                    reader.readAsDataURL(formData.avatar);
                });
            }

            // Download admission form PDF with photo and dynamic settings
            await downloadAdmissionFormPdf(
                { ...formData, full_name: fullName },
                clsName,
                secName,
                `admission-form-${formData.admission_no || "new"}.pdf`,
                photoUrl,
                undefined,
                undefined,
                admissionFormConfig,
            );

            tt.success("student_admitted_successfully");
            window.location.reload(); // Quick reset
        } catch (error) {
            console.error("Error submitting admission:", error);
            const err = error as { response?: { data?: { message?: string; errors?: Record<string, unknown> } } };
            const message = err.response?.data?.message;
            if (message) {
                tt.toast("error", message);
            } else {
                tt.error("failed_to_admit_student");
            }
            if (err.response?.data?.errors) {
                // Log specific validation errors for easier debugging
                console.log("Validation Errors:", err.response.data.errors);
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
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("student_admission")}</h1>
                        <p className="text-sm text-muted-foreground">{t("fill_in_the_details_to_admit_a_new_student")}</p>
                    </div>
                </div>
                <Link href="/dashboard/student-information/import-student">
                    <Button variant="gradient" className="h-10 px-6">
                        <Upload className="h-4 w-4" />
                        {t("import_student")}
                    </Button>
                </Link>
            </div>

            {/* Individual Sections */}
            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Student Admission Card */}
                <SectionCard title={t("student_admission")} icon={GraduationCap}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputField label={t("admission_no")} required value={formData.admission_no} onChange={(val) => handleChange("admission_no", val)} readOnly={autoAdmissionEnabled} helperText={autoAdmissionEnabled ? t("auto_generated") : ""} />
                        <InputField label={t("roll_number")} value={formData.roll_no} onChange={(val) => handleChange("roll_no", val)} readOnly={autoRollEnabled} helperText={autoRollEnabled ? t("auto_generated") : ""} />
                        <div className="relative">
                            <InputField label={t("username")} value={formData.username || ""} onChange={(val) => handleChange("username", val)} readOnly={autoUsernameEnabled} helperText={autoUsernameEnabled ? t("auto_generated") : ""} />
                            <button
                                type="button"
                                onClick={fetchUsername}
                                className="absolute right-1 top-6 h-6 w-6 flex items-center justify-center rounded hover:bg-indigo-50 text-indigo-500 transition-colors"
                                title={t("generate_username")}
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <SelectField
                            label={t("class")}
                            required
                            value={formData.school_class_id}
                            onChange={(val) => handleChange("school_class_id", val)}
                            options={classes.map(c => ({ label: c.name, value: c.id.toString() }))}
                        />
                        <SelectField
                            label={t("section")}
                            required
                            value={formData.section_id}
                            onChange={(val) => handleChange("section_id", val)}
                            options={sections.map(s => ({ label: s.name, value: s.id.toString() }))}
                        />

                        <InputField label={t("first_name")} required value={formData.name} onChange={(val) => handleChange("name", val)} />
                        <InputField label={t("last_name")} value={formData.last_name} onChange={(val) => handleChange("last_name", val)} />
                        <InputField label={t("student_full_name")} value={formData.full_name || ""} onChange={(val) => handleChange("full_name", val)} readOnly />
                        <SelectField
                            label={t("gender")}
                            required
                            value={formData.gender}
                            onChange={(val) => handleChange("gender", val)}
                            options={[
                                { label: t("male"), value: "Male" },
                                { label: t("female"), value: "Female" },
                                { label: t("other"), value: "Other" }
                            ]}
                        />
                        <DateField label={t("date_of_birth")} required value={formData.dob} onChange={(val) => handleChange("dob", val)} />
                        <InputField label="ID/Birth Cert" value={formData.national_identification_no} onChange={(val) => handleChange("national_identification_no", val)} />
                        <InputField label="Place of Birth" value={formData.birth_place} onChange={(val) => handleChange("birth_place", val)} />
                        <InputField label="State" value={formData.state} onChange={(val) => handleChange("state", val)} />
                        <InputField label={t("nationality")} value={formData.nationality} onChange={(val) => handleChange("nationality", val)} />

                        <SelectField
                            label={t("category")}
                            value={formData.category}
                            onChange={(val) => handleChange("category", val)}
                            options={categories.map(c => ({ label: c.category_name || c.category || c.name, value: c.id.toString() }))}
                        />
                        <InputField label={t("religion")} value={formData.religion} onChange={(val) => handleChange("religion", val)} />
                        <InputField label={t("caste")} value={formData.caste} onChange={(val) => handleChange("caste", val)} />
                        <InputField label={t("mobile_number")} value={formData.phone} onChange={(val) => handleChange("phone", val)} />
                        <SelectField
                            label={t("status")}
                            required
                            value={formData.active ? "1" : "0"}
                            onChange={(val) => handleChange("active", val === "1")}
                            options={[
                                { label: t("active"), value: "1" },
                                { label: t("disabled"), value: "0" }
                            ]}
                        />
                        <InputField label={t("email")} type="email" value={formData.email} onChange={(val) => handleChange("email", val)} />
                        <DateField label={t("admission_date")} value={formData.admission_date} onChange={(val) => handleChange("admission_date", val)} />
                        <div className="lg:col-span-2">
                            <FileUploadField
                                label={t("student_photo_100px_x_100px")}
                                required
                                value={formData.avatar}
                                onChange={(field) => handleChange("avatar", field)}
                                placeholder={t("drag_and_drop_a_file_here_or_click")}
                            />
                        </div>

                        <SelectField
                            label={t("blood_group")}
                            value={formData.blood_group}
                            onChange={(val) => handleChange("blood_group", val)}
                            options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(v => ({ label: v, value: v }))}
                        />
                        <SelectField
                            label={t("house")}
                            value={formData.house}
                            onChange={(val) => handleChange("house", val)}
                            options={houses.map(h => ({ label: h.name || h.house_name, value: h.id.toString() }))}
                        />
                        <InputField label={t("height")} value={formData.height} onChange={(val) => handleChange("height", val)} />
                        <InputField label={t("weight")} value={formData.weight} onChange={(val) => handleChange("weight", val)} />

                        <DateField label={t("measurement_date")} value={formData.measurement_date} onChange={(val) => handleChange("measurement_date", val)} />
                        <InputField label="Postal / Zip Code" value={formData.postal_code} onChange={(val) => handleChange("postal_code", val)} />
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label={t("mother_tongue")} value={formData.mother_tongue} onChange={(val) => handleChange("mother_tongue", val)} />
                            <div>
                                <label className="text-[12px] font-semibold text-gray-700 block mb-2">GENERAL BEHAVIOUR:</label>
                                <div className="flex items-center gap-5">
                                    {["Mild", "Normal", "Hyperactive"].map(b => (
                                        <label key={b} className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="general_behaviour"
                                                    className="peer sr-only"
                                                    checked={formData.general_behaviour === b}
                                                    onChange={() => handleChange("general_behaviour", b)}
                                                />
                                                <div className="h-4 w-4 rounded border-2 border-muted-foreground/30 peer-checked:border-primary transition-all"></div>
                                                <div className="absolute h-2 w-2 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-all"></div>
                                            </div>
                                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">{b}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-gray-700 block mb-2">SECOND LANGUAGE:</label>
                                <div className="flex items-center gap-5">
                                    {["English", "Arabic", "Others"].map(l => (
                                        <label key={l} className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="second_language"
                                                    className="peer sr-only"
                                                    checked={formData.second_language === l}
                                                    onChange={() => handleChange("second_language", l)}
                                                />
                                                <div className="h-4 w-4 rounded border-2 border-muted-foreground/30 peer-checked:border-primary transition-all"></div>
                                                <div className="absolute h-2 w-2 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-all"></div>
                                            </div>
                                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">{l}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <TextAreaField label={t("current_address")} rows={2} value={formData.current_address} onChange={(val) => handleChange("current_address", val)} />
                        </div>
                        <div className="lg:col-span-2">
                            <TextAreaField label={t("permanent_address")} rows={2} value={formData.permanent_address} onChange={(val) => handleChange("permanent_address", val)} />
                        </div>
                        <div className="lg:col-span-4 space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("previous_academic_record", "Previous Academic Record")}</label>
                            <div className="border rounded-xl overflow-hidden overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-3 py-2 font-bold border-r text-[11px]">{t("name_of_previous_school", "Name of the previous school & location")}</th>
                                            <th className="px-3 py-2 font-bold border-r text-[11px]">{t("class")}</th>
                                            <th className="px-3 py-2 font-bold border-r text-[11px]">{t("year_of_study", "Year of Study")}</th>
                                            <th className="px-3 py-2 font-bold text-[11px]">{t("percentage_grade", "Percentage/Grade")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {formData.previous_academic_record.map((record, index) => (
                                            <tr key={index}>
                                                <td className="p-0 border-r">
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-transparent outline-none text-xs"
                                                        value={record.school_name}
                                                        onChange={(e) => {
                                                            const newRecords = [...formData.previous_academic_record];
                                                            newRecords[index].school_name = e.target.value;
                                                            handleChange("previous_academic_record", newRecords);
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-0 border-r">
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-transparent outline-none text-xs"
                                                        value={record.class}
                                                        onChange={(e) => {
                                                            const newRecords = [...formData.previous_academic_record];
                                                            newRecords[index].class = e.target.value;
                                                            handleChange("previous_academic_record", newRecords);
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-0 border-r">
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-transparent outline-none text-xs"
                                                        value={record.year}
                                                        onChange={(e) => {
                                                            const newRecords = [...formData.previous_academic_record];
                                                            newRecords[index].year = e.target.value;
                                                            handleChange("previous_academic_record", newRecords);
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-0">
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-transparent outline-none text-xs"
                                                        value={record.percentage}
                                                        onChange={(e) => {
                                                            const newRecords = [...formData.previous_academic_record];
                                                            newRecords[index].percentage = e.target.value;
                                                            handleChange("previous_academic_record", newRecords);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange("previous_academic_record", [...formData.previous_academic_record, { school_name: "", class: "", year: "", percentage: "" }])}
                                className="text-[11px] font-semibold text-primary hover:underline mt-1"
                            >
                                + Add Row
                            </button>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextAreaField label="Identification Marks" rows={2} value={formData.identification_marks} onChange={(val) => handleChange("identification_marks", val)} />
                            <TextAreaField label={t("medical_history")} rows={2} value={formData.medical_history} onChange={(val) => handleChange("medical_history", val)} />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="text-[12px] font-semibold text-gray-700 block mb-1.5">APPRAISAL & BEHAVIOUR</label>
                            <textarea
                                className="w-full min-h-[68px] text-[12px] border border-gray-200 rounded-md p-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y bg-white"
                                value={formData.appraisal_achievements}
                                onChange={(e) => handleChange("appraisal_achievements", e.target.value)}
                                placeholder={t("enter_achievements") || "Appraisal of your child..."}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <TextAreaField label={t("note")} rows={2} value={formData.note} onChange={(val) => handleChange("note", val)} />
                        </div>

                        {/* Sibling Section Matching Screenshot */}
                        <div className="lg:col-span-4 mt-6">
                            <div className="bg-[#f8f9fa] border-b border-muted/50 px-4 py-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{t("sibling")}</span>
                                {selectedSiblings.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSiblings([])}
                                        className="bg-primary text-white text-[10px] px-3 py-1 rounded shadow-sm hover:bg-primary/90 transition-colors"
                                    >
                                        {t("remove_sibling")}
                                    </button>
                                )}
                            </div>
                            <div className="p-4 bg-white border border-t-0 flex flex-wrap gap-4 min-h-[100px]">
                                {selectedSiblings.map((sibling) => (
                                    <div key={sibling.id} className="flex gap-4 p-3 border rounded-md bg-white min-w-[300px] shadow-sm relative group">
                                        <div className="h-20 w-20 rounded-lg bg-[#e9ecef] overflow-hidden border flex items-center justify-center shrink-0">
                                            {sibling.photo ? (
                                                <img
                                                    src={sibling.photo.startsWith('http') ? sibling.photo : getImageUrl(sibling.photo)}
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
                                                <span className="font-bold">{t("admission_no")}:</span>
                                                <span className="text-muted-foreground">{sibling.admission_no}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <span className="font-bold">{t("class")}:</span>
                                                <span className="text-muted-foreground">{sibling.class_name}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <span className="font-bold">{t("section")}:</span>
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
                                    <span>{t("add_sibling")}</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </SectionCard>

                {/* Fees Details Card */}
                <SectionCard title={t("fees_details")} icon={Wallet}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFeeGroups.map((group) => (
                            <label key={group.id} className="flex flex-col border border-muted/50 p-4 rounded-lg cursor-pointer hover:bg-muted/20 transition-colors group/fee">
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
                        {filteredFeeGroups.length === 0 && (
                            <div className="col-span-full py-6 text-center text-muted-foreground text-sm">
                                {t("no_fee_groups_available")}
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Fees Discount Details Card */}
                <SectionCard title={t("fees_discount_details")} icon={Percent}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {feeDiscounts.map((discount) => (
                            <label key={discount.id} className="flex flex-col border border-muted/50 p-4 rounded-lg cursor-pointer hover:bg-muted/20 transition-colors group/discount">
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
                                                {discount.type === 'percentage' ? `${discount.percentage}%` : `${symbol}${discount.amount}`}
                                            </span>
                                        </div>
                                        {discount.code && <span className="text-xs text-muted-foreground mt-0.5">{t("code")}: {discount.code}</span>}
                                    </div>
                                </div>
                            </label>
                        ))}
                        {feeDiscounts.length === 0 && (
                            <div className="col-span-full py-6 text-center text-muted-foreground text-sm">
                                {t("no_fee_discounts_available")}
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Parent Guardian Detail Card */}
                <SectionCard title={t("parent_guardian_detail")} icon={Users}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputField label={t("father_name")} value={formData.father_name} onChange={(val) => handleChange("father_name", val)} />
                        <InputField label={t("father_phone")} value={formData.father_phone} onChange={(val) => handleChange("father_phone", val)} />
                        <InputField label={t("father_occupation")} value={formData.father_occupation} onChange={(val) => handleChange("father_occupation", val)} />
                        <FileUploadField
                            label={t("father_photo_100px_x_100px")}
                            value={formData.father_photo}
                            onChange={(file) => handleChange("father_photo", file)}
                            placeholder={t("drag_and_drop_a_file_here_or_click")}
                        />

                        <InputField label={t("mother_name")} value={formData.mother_name} onChange={(val) => handleChange("mother_name", val)} />
                        <InputField label={t("mother_phone")} value={formData.mother_phone} onChange={(val) => handleChange("mother_phone", val)} />
                        <InputField label={t("mother_occupation")} value={formData.mother_occupation} onChange={(val) => handleChange("mother_occupation", val)} />
                        <FileUploadField
                            label={t("mother_photo_100px_x_100px")}
                            value={formData.mother_photo}
                            onChange={(file) => handleChange("mother_photo", file)}
                            placeholder={t("drag_and_drop_a_file_here_or_click")}
                        />

                        <div className="lg:col-span-4 py-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                                {t("if_guardian_is")} <span className="text-destructive">*</span>
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
                                        <span className="text-sm font-semibold group-hover:text-primary transition-colors">{t(role.toLowerCase())}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <InputField label={t("guardian_name")} required value={formData.guardian_name} onChange={(val) => handleChange("guardian_name", val)} />
                        {formData.guardian_type === "Other" && (
                            <InputField label={t("guardian_relation")} required value={formData.guardian_relation} onChange={(val) => handleChange("guardian_relation", val)} />
                        )}
                        <InputField label={t("guardian_email")} value={formData.guardian_email} onChange={(val) => handleChange("guardian_email", val)} />
                        <div className="relative">
                            <InputField label={t("parent_username")} value={formData.parent_username || ""} onChange={(val) => handleChange("parent_username", val)} readOnly={parentAutoUsernameEnabled} helperText={parentAutoUsernameEnabled ? t("auto_generated") : ""} />
                            <button
                                type="button"
                                onClick={fetchParentUsername}
                                disabled={generatingParentUsername}
                                className="absolute right-1 top-6 h-6 w-6 flex items-center justify-center rounded hover:bg-indigo-50 text-indigo-500 transition-colors"
                                title={t("generate_parent_username")}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${generatingParentUsername ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <InputField label={t("guardian_phone")} required value={formData.guardian_phone} onChange={(val) => handleChange("guardian_phone", val)} />
                        <InputField label={t("guardian_occupation")} value={formData.guardian_occupation} onChange={(val) => handleChange("guardian_occupation", val)} />
                        <FileUploadField
                            label={t("guardian_photo_100px_x_100px")}
                            value={formData.guardian_photo}
                            onChange={(file) => handleChange("guardian_photo", file)}
                            placeholder={t("drag_and_drop_a_file_here_or_click")}
                        />
                        <TextAreaField label={t("guardian_address")} rows={2} value={formData.guardian_address} onChange={(val) => handleChange("guardian_address", val)} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-muted/30">
                        <button
                            type="button"
                            onClick={() => setShowMoreDetails(!showMoreDetails)}
                            className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors py-2 px-1"
                        >
                            <span className="font-bold text-sm">{showMoreDetails ? t("hide_more_details") : t("add_more_details")}</span>
                            <Plus className={cn("h-5 w-5 bg-muted rounded-full p-1 transition-transform", showMoreDetails && "rotate-45")} />
                        </button>
                    </div>

                    {showMoreDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-muted/30 animate-in slide-in-from-top-4 duration-300">
                            <div className="lg:col-span-4 mb-2">
                                <h3 className="text-lg font-bold">{t("others_information")}</h3>
                            </div>

                            <InputField label={t("bank_account_number")} value={formData.bank_account_no} onChange={(val) => handleChange("bank_account_no", val)} />
                            <InputField label={t("bank_name")} value={formData.bank_name} onChange={(val) => handleChange("bank_name", val)} />
                            <InputField label={t("ifsc_code")} value={formData.ifsc_code} onChange={(val) => handleChange("ifsc_code", val)} />

                            <div className="py-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                                    {t("rte")}
                                </label>
                                <div className="flex gap-6">
                                    {["Yes", "No"].map((opt) => (
                                        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="rte"
                                                    className="peer sr-only"
                                                    checked={formData.rte === opt}
                                                    onChange={() => handleChange("rte", opt)}
                                                />
                                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 peer-checked:border-primary transition-all"></div>
                                                <div className="absolute h-2.5 w-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-all"></div>
                                            </div>
                                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">{t(opt.toLowerCase())}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-4 mt-4 border-t pt-4">
                                <h4 className="text-sm font-bold text-gray-800 mb-4">{t("general_behaviour_and_language") || "General Behaviour & Language"}</h4>
                                <div className="space-y-6">
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* Transport & Hostel Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <SectionCard title={t("transport_details")} icon={MapPin}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField
                                label={t("route_list")}
                                options={transportRoutes.map(r => ({ label: r.title || r.name, value: r.id }))}
                                value={formData.transport_route_id || ""}
                                onChange={(val) => handleChange("transport_route_id", val)}
                            />
                            <SelectField
                                label={t("pickup_point")}
                                options={pickupPoints.map(p => ({ label: p.point_name || p.name, value: p.id }))}
                                value={formData.transport_pickup_point_id || ""}
                                onChange={(val) => handleChange("transport_pickup_point_id", val)}
                            />
                        </div>
                    </SectionCard>
                    <SectionCard title={t("hostel_details")} icon={House}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField
                                label={t("hostel")}
                                options={hostels.map(h => ({ label: h.hostel_name || h.name, value: h.id }))}
                                value={formData.hostel_id || ""}
                                onChange={(val) => handleChange("hostel_id", val)}
                            />
                            <SelectField
                                label={t("room_no")}
                                options={rooms.map(r => ({ label: r.room_number || r.room_no || r.name, value: r.id }))}
                                value={formData.room_id || ""}
                                onChange={(val) => handleChange("room_id", val)}
                            />
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
                        {t("save")}
                    </Button>
                </div>
            </form>

            <Dialog open={showSiblingModal} onOpenChange={setShowSiblingModal}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-xl font-bold">{t("add_sibling")}</DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <label className="text-sm font-bold text-muted-foreground text-right">{t("class")}</label>
                            <SelectField
                                label=""
                                value={siblingClassId}
                                onChange={(val) => {
                                    setSiblingClassId(val);
                                    setSiblingSectionId("");
                                    setSiblingStudents([]);
                                    fetchSiblingSections(val);
                                }}
                                options={classes.map(c => ({ label: c.name, value: c.id.toString() }))}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <label className="text-sm font-bold text-muted-foreground text-right">{t("section")}</label>
                            <SelectField
                                label=""
                                value={siblingSectionId}
                                onChange={(val) => {
                                    setSiblingSectionId(val);
                                    if (siblingClassId) fetchSiblingStudents(siblingClassId, val);
                                }}
                                options={siblingSections.map(s => ({ label: s.name, value: s.id.toString() }))}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <label className="text-sm font-bold text-muted-foreground text-right">{t("student")}</label>
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
                            className="bg-primary hover:bg-primary/90 text-white px-6 rounded-lg flex items-center gap-2"
                        >
                            {loadingSiblings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                            {t("add")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper Components
function SectionCard({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) {
    return (
        <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
            <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                </span>
                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                {children}
            </CardContent>
        </Card>
    );
}

function DateField({ label, required, value = "", onChange }: { label: string, required?: boolean, value?: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <DatePicker
                value={value}
                onChange={onChange}
            />
        </div>
    );
}

function InputField({ label, required, type = "text", value = "", onChange, placeholder = "", readOnly = false, helperText = "" }: { label: string, required?: boolean, type?: string, value?: string, onChange: (val: string) => void, placeholder?: string, readOnly?: boolean, helperText?: string }) {
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
                className={cn(
                    "h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/50",
                    readOnly && "bg-muted/60 cursor-not-allowed text-muted-foreground"
                )}
                required={required}
                readOnly={readOnly}
            />
            {helperText && (
                <p className="text-[10px] font-semibold text-primary ml-1">{helperText}</p>
            )}
        </div>
    );
}

function SelectField({ label, required, options, value, onChange }: { label: string, required?: boolean, options: { label: string, value: string }[] | string[], value: string, onChange: (val: string) => void }) {
    const { t } = useTranslation();
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
                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                >
                    <option value="">{t("select")}</option>
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
                className="flex w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all resize-none placeholder:text-muted-foreground/50"
            />
        </div>
    );
}

function FileUploadField({ label, required, value, onChange, placeholder }: { label: string, required?: boolean, value?: File | null, onChange?: (file: File | null) => void, placeholder?: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <div className="relative h-11 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group/upload overflow-hidden">
                <div className="flex items-center gap-2 px-4 pointer-events-none w-full">
                    <Upload className="h-4 w-4 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-muted-foreground group-hover/upload:text-foreground truncate">
                        {value ? value.name : placeholder || "Drag and drop a file here or click"}
                    </span>
                </div>
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => onChange?.(e.target.files?.[0] || null)}
                    accept="image/*"
                    required={required}
                />
            </div>
        </div>
    );
}
