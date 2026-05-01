"use client";

import { Search, ChevronDown, Check, Loader2, Info, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Class {
    id: number;
    class: string;
}

interface Section {
    id: number;
    section: string;
}

interface Student {
    id: number;
    admission_no: string;
    name: string;
    father_name: string;
    balance: number;
    is_carried_forward: boolean;
    selected?: boolean;
}

export default function FeesCarryForwardPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchClasses();
        fetchSections();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get("/academics/classes");
            setClasses(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    };

    const fetchSections = async () => {
        try {
            const res = await api.get("/academics/sections");
            setSections(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch sections", error);
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            toast("error", "Please select Class and Section");
            return;
        }

        setLoading(true);
        setStudents([]);
        try {
            const res = await api.get("/fee-collection/carry-forward/search", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                }
            });
            const data = res.data.data || [];
            setStudents(data.map((s: Student) => ({ 
                ...s, 
                selected: s.balance > 0 && !s.is_carried_forward 
            })));
            
            if (data.length === 0) {
                toast("info", "No students found with pending balances in the previous session.");
            }
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        setStudents(prev => prev.map(s => ({
            ...s,
            selected: s.balance > 0 && !s.is_carried_forward ? checked : s.selected
        })));
    };

    const handleSelectStudent = (id: number, checked: boolean) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, selected: checked } : s));
    };

    const handleSave = async () => {
        const selectedStudents = students.filter(s => s.selected);
        if (selectedStudents.length === 0) {
            toast("error", "Please select at least one student");
            return;
        }

        setSaving(true);
        try {
            await api.post("/fee-collection/carry-forward/save", {
                students: selectedStudents.map(s => ({
                    student_id: s.id,
                    amount: s.balance,
                }))
            });
            toast("success", "Fees carried forward successfully");
            handleSearch(); // Refresh list
        } catch (error) {
            toast("error", "Failed to save carry forward");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Fees Carry Forward</h1>
                <p className="text-muted-foreground">Transfer student fee balances from the previous session to the current one.</p>
            </div>

            {/* Selection Card */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-muted/20 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Search className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Select Criteria</CardTitle>
                            <CardDescription>Filter students by class and section to identify pending balances.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        {/* Class */}
                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Class <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select 
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.class}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Section <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select 
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                >
                                    <option value="">Select Section</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>{s.section}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                className="h-11 px-10 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 group/btn"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />}
                                {loading ? 'Searching...' : 'Search Students'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            {students.length > 0 ? (
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="border-b border-muted/20 bg-muted/5">
                        <CardTitle className="text-xl">Students with Pending Balances</CardTitle>
                        <CardDescription>Select students to carry forward their balances to the current session.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-muted/20 bg-muted/10">
                                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[80px]">
                                            <Checkbox 
                                                checked={students.length > 0 && students.every(s => s.is_carried_forward || s.balance === 0 || s.selected)}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </th>
                                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Admission No</th>
                                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Name</th>
                                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Pending Balance</th>
                                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/10">
                                    {students.map((student) => (
                                        <tr key={student.id} className={cn(
                                            "hover:bg-muted/5 transition-colors group",
                                            student.is_carried_forward && "bg-muted/20 opacity-60"
                                        )}>
                                            <td className="px-8 py-6">
                                                <Checkbox 
                                                    checked={student.selected}
                                                    disabled={student.is_carried_forward || student.balance === 0}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                                    className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium">{student.admission_no}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{student.name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{student.father_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-right text-primary">
                                                ${student.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {student.is_carried_forward ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider">
                                                        <Check className="h-3 w-3" /> Done
                                                    </span>
                                                ) : student.balance === 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                                                        No Due
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-wider">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 border-t border-muted/20 bg-muted/5 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={saving || students.filter(s => s.selected).length === 0}
                                className="h-12 px-12 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                                {saving ? 'Processing...' : 'Carry Forward Selected'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                !loading && selectedClass && selectedSection && (
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
                        <CardContent className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <Info className="h-12 w-12 text-muted-foreground/30" />
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xl text-muted-foreground">No Students Found</h3>
                                    <p className="text-muted-foreground/70">Either no students exist in this class/section or everyone is clear.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </div>
    );
}

