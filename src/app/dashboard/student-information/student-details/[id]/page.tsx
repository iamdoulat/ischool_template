"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    User, Phone, Mail, Calendar, MapPin, BookOpen, GraduationCap,
    Heart, Banknote, Users, AlertCircle, ArrowLeft, Edit, Printer,
    BadgeCheck, BadgeX, Home, Globe, Hash, Droplets,
    Ruler, Weight, Shield, FileText, ChevronRight, Loader2,
    School, BookMarked, Award, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { getImageUrl } from "@/lib/image-url";

const formatDate = (d?: string | null) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-GB");
};

function InfoRow({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value?: string | null | number }) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-muted/20 last:border-0">
            {Icon && (
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
            )}
            <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 shrink-0">{label}</span>
                <span className="text-sm font-semibold text-right truncate">{value || "—"}</span>
            </div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <Card className="border-[0.5px] border-gray-200 shadow-sm bg-card/80 backdrop-blur-sm">
            <CardHeader className="px-5 py-3.5 flex flex-row items-center gap-2.5 space-y-0 border-b border-muted/20">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                    <Icon className="h-4 w-4" />
                </span>
                <CardTitle className="text-sm font-bold tracking-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-3">
                {children}
            </CardContent>
        </Card>
    );
}

export default function StudentProfilePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const tt = useTranslateToast();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [student, setStudent] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("personal");

    useEffect(() => {
        if (!id) return;
        fetchStudent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchStudent = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/students/${id}`);
            const data = res.data?.data || res.data;
            setStudent(data);
        } catch {
            tt.error("failed_to_load_student");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Loading student profile...</p>
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-xl font-bold text-muted-foreground">Student Not Found</p>
                <Button onClick={() => router.back()} variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    const fullName = [student.name, student.last_name].filter(Boolean).join(" ");
    const avatarFallback = (student.name?.[0] || "S") + (student.last_name?.[0] || "");
    const photo = student.avatar || student.student_photo || null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button onClick={() => router.push("/dashboard/student-information/student-details")} className="hover:text-primary transition-colors font-medium">
                    Student Information
                </button>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-semibold">Student Profile</span>
            </div>

            {/* Hero Profile Card */}
            <Card className="border-[0.5px] border-gray-200 shadow-lg overflow-hidden pt-0">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#FF9800] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fill-rule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fill-opacity%3D%220.05%22%3E%3Cpath d%3D%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
                    <GraduationCap className="absolute bottom-3 right-6 h-20 w-20 text-white/10" />
                </div>

                <CardContent className="px-8 pb-6">
                    {/* Avatar + Name Row */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-14 mb-6">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-primary/20 shrink-0">
                            <AvatarImage src={photo ? getImageUrl(photo) : undefined} alt={fullName} className="object-cover" />
                            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0 mt-2 sm:mt-0 pb-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl font-black tracking-tight text-foreground">{fullName}</h1>
                                <Badge variant={student.active ? "default" : "destructive"} className="text-[10px] font-black uppercase tracking-widest">
                                    {student.active ? (
                                        <><BadgeCheck className="h-3 w-3 mr-1" />Active</>
                                    ) : (
                                        <><BadgeX className="h-3 w-3 mr-1" />Inactive</>
                                    )}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5 text-primary" />
                                    <span className="font-bold text-primary">{student.admission_no}</span>
                                </span>
                                {student.school_class && (
                                    <span className="flex items-center gap-1.5">
                                        <School className="h-3.5 w-3.5" />
                                        <span className="font-semibold">{student.school_class?.name} {student.section ? `— ${student.section.name}` : ""}</span>
                                    </span>
                                )}
                                {student.roll_no && (
                                    <span className="flex items-center gap-1.5">
                                        <BookMarked className="h-3.5 w-3.5" />
                                        <span className="font-semibold">Roll #{student.roll_no}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 pb-1">
                            <Button
                                onClick={() => router.push(`/dashboard/student-information/student-details/${id}/edit`)}
                                className="gap-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-bold h-9 rounded-lg shadow-md hover:opacity-90 transition-opacity"
                                size="sm"
                            >
                                <Edit className="h-3.5 w-3.5" /> Edit Profile
                            </Button>
                            <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2 h-9 rounded-lg font-bold no-print">
                                <Printer className="h-3.5 w-3.5" /> Print
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Gender", value: student.gender || "—", icon: User },
                            { label: "Date of Birth", value: formatDate(student.dob), icon: Calendar },
                            { label: "Blood Group", value: student.blood_group || "—", icon: Droplets },
                            { label: "Admission Date", value: formatDate(student.admission_date), icon: BookOpen },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-xl bg-muted/30 border border-muted/30 p-3 space-y-1.5 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <stat.icon className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</span>
                                </div>
                                <p className="text-sm font-bold truncate">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tabbed Details */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full lg:w-fit gap-1 bg-muted/40 p-1 rounded-xl h-auto">
                    {[
                        { value: "personal", label: "Personal", icon: User },
                        { value: "guardian", label: "Guardian", icon: Users },
                        { value: "academic", label: "Academic", icon: GraduationCap },
                        { value: "medical", label: "Medical", icon: Heart },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Personal Tab */}
                <TabsContent value="personal" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionCard title="Basic Information" icon={User}>
                            <InfoRow icon={User} label="Full Name" value={fullName} />
                            <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(student.dob)} />
                            <InfoRow icon={User} label="Gender" value={student.gender} />
                            <InfoRow icon={Globe} label="Nationality" value={student.nationality} />
                            <InfoRow icon={Globe} label="Religion" value={student.religion} />
                            <InfoRow icon={Globe} label="Caste" value={student.caste} />
                            <InfoRow icon={Globe} label="Mother Tongue" value={student.mother_tongue} />
                            <InfoRow icon={MapPin} label="Birth Place" value={student.birth_place} />
                            <InfoRow icon={MapPin} label="State" value={student.state} />
                        </SectionCard>

                        <SectionCard title="Contact Details" icon={Phone}>
                            <InfoRow icon={Phone} label="Phone" value={student.phone} />
                            <InfoRow icon={Mail} label="Email" value={student.email} />
                            <InfoRow icon={Home} label="Current Address" value={student.current_address} />
                            <InfoRow icon={Home} label="Permanent Address" value={student.permanent_address} />
                            <InfoRow icon={MapPin} label="Postal Code" value={student.postal_code} />
                        </SectionCard>

                        <SectionCard title="Identification" icon={Shield}>
                            <InfoRow icon={Hash} label="Admission No" value={student.admission_no} />
                            <InfoRow icon={Hash} label="Roll No" value={student.roll_no} />
                            <InfoRow icon={Hash} label="National ID" value={student.national_identification_no} />
                            <InfoRow icon={FileText} label="Identification Marks" value={student.identification_marks} />
                            <InfoRow icon={Shield} label="RTE" value={student.rte} />
                        </SectionCard>

                        <SectionCard title="Bank Details" icon={Banknote}>
                            <InfoRow icon={Banknote} label="Bank Name" value={student.bank_name} />
                            <InfoRow icon={Hash} label="Account No" value={student.bank_account_no} />
                            <InfoRow icon={Hash} label="IFSC Code" value={student.ifsc_code} />
                        </SectionCard>
                    </div>
                </TabsContent>

                {/* Guardian Tab */}
                <TabsContent value="guardian" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionCard title="Father's Details" icon={User}>
                            <InfoRow icon={User} label="Name" value={student.father_name} />
                            <InfoRow icon={Phone} label="Phone" value={student.father_phone} />
                            <InfoRow icon={FileText} label="Occupation" value={student.father_occupation} />
                        </SectionCard>

                        <SectionCard title="Mother's Details" icon={User}>
                            <InfoRow icon={User} label="Name" value={student.mother_name} />
                            <InfoRow icon={Phone} label="Phone" value={student.mother_phone} />
                            <InfoRow icon={FileText} label="Occupation" value={student.mother_occupation} />
                        </SectionCard>

                        <SectionCard title="Guardian Details" icon={Users}>
                            <InfoRow icon={User} label="Guardian Name" value={student.guardian_name} />
                            <InfoRow icon={Users} label="Relation" value={student.guardian_relation} />
                            <InfoRow icon={Phone} label="Phone" value={student.guardian_phone} />
                            <InfoRow icon={Mail} label="Email" value={student.guardian_email} />
                            <InfoRow icon={FileText} label="Occupation" value={student.guardian_occupation} />
                            <InfoRow icon={Home} label="Address" value={student.guardian_address} />
                        </SectionCard>

                        {/* Siblings */}
                        {student.siblings && student.siblings.length > 0 && (
                            <SectionCard title={`Siblings (${student.siblings.length})`} icon={Users}>
                                {student.siblings.map((sib: Record<string, unknown>) => (
                                    <div key={sib.id} className="flex items-center gap-3 py-2.5 border-b border-muted/20 last:border-0">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white">
                                                {sib.name?.[0]}{sib.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{sib.name} {sib.last_name}</p>
                                            <p className="text-[11px] text-muted-foreground">{sib.school_class?.name} — {sib.section?.name}</p>
                                        </div>
                                        <Button
                                            onClick={() => router.push(`/dashboard/student-information/student-details/${sib.id}`)}
                                            size="sm" variant="ghost"
                                            className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                                        >
                                            View <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </SectionCard>
                        )}
                    </div>
                </TabsContent>

                {/* Academic Tab */}
                <TabsContent value="academic" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionCard title="Academic Details" icon={GraduationCap}>
                            <InfoRow icon={School} label="Class" value={student.school_class?.name} />
                            <InfoRow icon={BookOpen} label="Section" value={student.section?.name} />
                            <InfoRow icon={BookMarked} label="Roll No" value={student.roll_no} />
                            <InfoRow icon={Calendar} label="Admission Date" value={formatDate(student.admission_date)} />
                            <InfoRow icon={GraduationCap} label="Academic Session" value={student.academic_session?.session} />
                            <InfoRow icon={Award} label="Category" value={student.student_category?.name || student.category} />
                            <InfoRow icon={Shield} label="House" value={student.house} />
                        </SectionCard>

                        {/* Fees Groups */}
                        {student.fees_groups && student.fees_groups.length > 0 && (
                            <SectionCard title={`Fee Groups (${student.fees_groups.length})`} icon={Banknote}>
                                {student.fees_groups.map((fg: Record<string, unknown>) => (
                                    <div key={fg.id} className="flex items-center justify-between py-2.5 border-b border-muted/20 last:border-0">
                                        <span className="text-sm font-semibold">{fg.name}</span>
                                        <Badge variant="secondary" className="text-[10px] font-bold">{fg.description || "Active"}</Badge>
                                    </div>
                                ))}
                            </SectionCard>
                        )}

                        {/* Fee Discounts */}
                        {student.fees_discounts && student.fees_discounts.length > 0 && (
                            <SectionCard title={`Discounts (${student.fees_discounts.length})`} icon={Award}>
                                {student.fees_discounts.map((fd: Record<string, unknown>) => (
                                    <div key={fd.id} className="flex items-center justify-between py-2.5 border-b border-muted/20 last:border-0">
                                        <span className="text-sm font-semibold">{fd.name}</span>
                                        <Badge className="text-[10px] font-bold bg-green-100 text-green-700">
                                            {fd.discount_type === "percentage" ? `${fd.discount}%` : fd.discount}
                                        </Badge>
                                    </div>
                                ))}
                            </SectionCard>
                        )}

                        {/* Transport */}
                        {student.transport_assignment && (
                            <SectionCard title="Transport" icon={Activity}>
                                <InfoRow icon={MapPin} label="Route" value={student.transport_assignment?.route_pickup_point?.route?.name} />
                                <InfoRow icon={MapPin} label="Pickup Point" value={student.transport_assignment?.route_pickup_point?.name} />
                            </SectionCard>
                        )}
                    </div>
                </TabsContent>

                {/* Medical Tab */}
                <TabsContent value="medical" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionCard title="Physical Measurements" icon={Activity}>
                            <InfoRow icon={Droplets} label="Blood Group" value={student.blood_group} />
                            <InfoRow icon={Ruler} label="Height" value={student.height ? `${student.height} cm` : null} />
                            <InfoRow icon={Weight} label="Weight" value={student.weight ? `${student.weight} kg` : null} />
                            <InfoRow icon={Calendar} label="Measurement Date" value={formatDate(student.measurement_date)} />
                        </SectionCard>

                        <SectionCard title="Medical History" icon={Heart}>
                            <div className="py-3">
                                {student.medical_history ? (
                                    <p className="text-sm leading-relaxed text-muted-foreground">{student.medical_history}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground/50 italic">No medical history recorded.</p>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
